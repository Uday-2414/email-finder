const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// ===== EMAIL VALIDATION =====
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const INVALID_EMAIL_PATTERNS = [
  /^noreply@/i,
  /^donotreply@/i,
  /^example@/i,
  /^test@/i,
  /^admin@example/i,
  /^info@example/i,
  /placeholder/i,
  /fake/i,
];

const PRIORITY_EMAILS = ['info', 'contact', 'sales', 'hello', 'support'];
const COOKIES_FILE = path.join(__dirname, '../cookies.json');

// ===== BROWSER POOL MANAGER =====
class BrowserPool {
  constructor(maxBrowsers = 5) {
    this.maxBrowsers = maxBrowsers;
    this.browsers = [];
    this.pageQueue = [];
    this.activeTasks = 0;
  }

  /**
   * Initialize browser pool with reusable browsers
   */
  async initialize() {
    console.log(`[POOL] Initializing ${this.maxBrowsers} browsers...`);
    try {
      for (let i = 0; i < this.maxBrowsers; i++) {
        const browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-extensions',
            '--disable-sync',
            '--disable-images', // Don't load images (faster)
            '--disable-web-resources',
          ],
        });
        this.browsers.push(browser);
      }
      console.log(`[POOL] Initialized ${this.browsers.length} browsers`);
    } catch (error) {
      console.error('[POOL] Initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Get available browser from pool
   */
  async getBrowser() {
    if (this.browsers.length === 0) {
      throw new Error('No browsers available in pool');
    }
    return this.browsers[0];
  }

  /**
   * Close all browsers
   */
  async closeAll() {
    console.log('[POOL] Closing all browsers...');
    for (const browser of this.browsers) {
      try {
        await browser.close();
      } catch (error) {
        console.error('[POOL] Error closing browser:', error.message);
      }
    }
    this.browsers = [];
  }
}

// Global browser pool instance
let browserPool = null;

// ===== UTILITY FUNCTIONS =====

/**
 * Normalize URL - add https:// if protocol is missing
 */
function normalizeUrl(url) {
  if (!url) return null;
  url = url.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url;
}

/**
 * Decode HTML entities in email (&#64; -> @, etc.)
 */
function decodeHtmlEntities(text) {
  if (!text) return text;
  const entities = {
    '&#64;': '@',
    '&#x40;': '@',
    '&commat;': '@',
    '&#46;': '.',
    '&#x2E;': '.',
    '&period;': '.',
    '&#91;': '[',
    '&#93;': ']',
  };

  let decoded = text;
  for (const [entity, replacement] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), replacement);
  }

  // Also decode numeric entities
  decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(parseInt(dec, 10));
  });
  decoded = decoded.replace(/&#x([a-fA-F0-9]+);/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  return decoded;
}

/**
 * Validate email address
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;

  // Check against invalid patterns
  if (INVALID_EMAIL_PATTERNS.some((pattern) => pattern.test(email))) {
    return false;
  }

  const rfcRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return rfcRegex.test(email);
}

/**
 * Extract and deduplicate emails from text
 */
function extractEmails(text) {
  if (!text) return [];

  // First, try to find obfuscated emails and decode them
  const decodedText = decodeHtmlEntities(text);
  const emailMatches = decodedText.match(EMAIL_REGEX) || [];

  const emails = [];
  const seen = new Set();

  emailMatches.forEach((email) => {
    const normalized = email.toLowerCase().trim();
    if (!seen.has(normalized) && isValidEmail(normalized)) {
      seen.add(normalized);
      emails.push({
        email: normalized,
        confidence: 100,
      });
    }
  });

  return emails;
}

/**
 * Find contact page URL in HTML
 */
function findContactPageUrl($, baseUrl) {
  const contactPatterns = [
    /contact/i,
    /reach[\s-]?us/i,
    /get[\s-]?in[\s-]?touch/i,
    /inquiry/i,
    /email/i,
  ];

  const links = [];

  $('a[href]').each((i, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().toLowerCase();

    // Check if link text matches contact patterns
    for (const pattern of contactPatterns) {
      if (pattern.test(text)) {
        links.push({
          url: href,
          priority: 1,
        });
        return;
      }
    }

    // Check if URL matches contact patterns
    for (const pattern of contactPatterns) {
      if (pattern.test(href)) {
        links.push({
          url: href,
          priority: 2,
        });
      }
    }
  });

  if (links.length === 0) return null;

  // Sort by priority and return first
  links.sort((a, b) => a.priority - b.priority);
  let contactUrl = links[0].url;

  // Make absolute URL if relative
  if (!contactUrl.startsWith('http')) {
    try {
      const base = new URL(baseUrl);
      if (contactUrl.startsWith('/')) {
        contactUrl = base.origin + contactUrl;
      } else {
        contactUrl = base.origin + '/' + contactUrl;
      }
    } catch (e) {
      return null;
    }
  }

  return contactUrl;
}

/**
 * Calculate confidence score for email
 */
function calculateConfidenceScore(lead) {
  let score = 50; // Base score

  // Email from main page (+30)
  if (lead.source === 'website_main') {
    score += 30;
  }

  // Email from contact page (+20)
  if (lead.source === 'website_contact') {
    score += 20;
  }

  // Email from Facebook (+10)
  if (lead.source === 'facebook') {
    score += 10;
  }

  // Domain match (+20)
  if (lead.contact_email && lead.website_url) {
    try {
      const domainFromEmail = lead.contact_email.split('@')[1];
      const domainFromUrl = new URL(lead.website_url).hostname;
      if (
        domainFromEmail &&
        domainFromUrl &&
        domainFromUrl.includes(domainFromEmail.replace('www.', ''))
      ) {
        score += 20;
      }
    } catch (e) {
      // Invalid URL
    }
  }

  return Math.min(score, 100);
}

/**
 * Load Facebook cookies from file
 */
function loadFacebookCookies() {
  try {
    if (fs.existsSync(COOKIES_FILE)) {
      const cookies = JSON.parse(fs.readFileSync(COOKIES_FILE, 'utf8'));
      console.log('[FB] Loaded saved cookies');
      return cookies;
    }
  } catch (error) {
    console.error('[FB] Error loading cookies:', error.message);
  }
  return null;
}

/**
 * Save Facebook cookies to file
 */
function saveFacebookCookies(cookies) {
  try {
    fs.writeFileSync(COOKIES_FILE, JSON.stringify(cookies, null, 2));
    console.log('[FB] Saved cookies for future use');
  } catch (error) {
    console.error('[FB] Error saving cookies:', error.message);
  }
}

/**
 * Login to Facebook and get authenticated session
 */
async function loginToFacebook(email, password, page) {
  try {
    console.log('[FB] Logging in...');

    // Check for saved cookies first
    const savedCookies = loadFacebookCookies();
    if (savedCookies && savedCookies.length > 0) {
      console.log('[FB] Using saved cookies');
      await page.setCookie(...savedCookies);
      await page.goto('https://www.facebook.com', {
        waitUntil: 'networkidle2',
        timeout: 15000,
      });

      // Check if still logged in
      const isLoggedIn = await page.evaluate(() => {
        return !!document.querySelector('[data-testid="profile_menu_trigger"]');
      });

      if (isLoggedIn) {
        console.log('[FB] Session restored from cookies');
        return true;
      }
    }

    // Manual login
    await page.goto('https://www.facebook.com/login/', {
      waitUntil: 'networkidle2',
      timeout: 15000,
    });

    // Fill email
    await page.type('input[name="email"]', email, { delay: 50 });
    await page.type('input[name="pass"]', password, { delay: 50 });

    // Click login
    await page.click('button[type="submit"]', { delay: 100 });

    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });

    // Check if login successful
    const isLoggedIn = await page.evaluate(() => {
      return !document.querySelector('input[name="email"]');
    });

    if (isLoggedIn) {
      console.log('[FB] Successfully logged in');

      // Save cookies for future use
      const cookies = await page.cookies();
      saveFacebookCookies(cookies);
      return true;
    } else {
      console.error('[FB] Login failed');
      return false;
    }
  } catch (error) {
    console.error('[FB] Login error:', error.message);
    return false;
  }
}

/**
 * Scrape website using Puppeteer (captures JavaScript-rendered content)
 */
async function scrapeWebsiteWithPuppeteer(url, facebookEmail, facebookPassword) {
  const contacts = [];

  if (!browserPool) {
    throw new Error('Browser pool not initialized');
  }

  const browser = await browserPool.getBrowser();
  let page = null;

  try {
    url = normalizeUrl(url);
    if (!url) {
      return {
        status: 'error',
        error: 'Invalid URL format',
        results: [],
      };
    }

    console.log(`[PUPPETEER] Scraping: ${url}`);

    // Create new page
    page = await browser.newPage();

    // Disable image/stylesheet loading for faster performance
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    );

    // Step 1: Fetch and parse main page
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 15000,
    });

    const mainContent = await page.content();
    const cheerio = require('cheerio');
    const $ = cheerio.load(mainContent);

    // Extract emails from main page
    const bodyText = $('body').text();
    const mainEmails = extractEmails(bodyText);

    mainEmails.forEach((item) => {
      contacts.push({
        website_url: url,
        contact_email: item.email,
        source: 'website_main',
        source_page_url: url,
        confidence_score: 0,
        extracted_at: new Date().toISOString(),
      });
    });

    console.log(`[PUPPETEER] Found ${mainEmails.length} emails on main page`);

    // Step 2: Try contact page if no emails found
    if (mainEmails.length === 0) {
      const contactPageUrl = findContactPageUrl($, url);

      if (contactPageUrl) {
        console.log(`[PUPPETEER] Trying contact page: ${contactPageUrl}`);
        try {
          await page.goto(contactPageUrl, {
            waitUntil: 'networkidle2',
            timeout: 15000,
          });

          const contactContent = await page.content();
          const $contact = cheerio.load(contactContent);
          const contactText = $contact('body').text();
          const contactEmails = extractEmails(contactText);

          contactEmails.forEach((item) => {
            contacts.push({
              website_url: url,
              contact_email: item.email,
              source: 'website_contact',
              source_page_url: contactPageUrl,
              confidence_score: 0,
              extracted_at: new Date().toISOString(),
            });
          });

          console.log(
            `[PUPPETEER] Found ${contactEmails.length} emails on contact page`
          );
        } catch (error) {
          console.error('[PUPPETEER] Error scraping contact page:', error.message);
        }
      }
    }

    // Step 3: Try Facebook if still no emails and credentials provided
    if (
      contacts.length === 0 &&
      facebookEmail &&
      facebookPassword
    ) {
      const facebookUrlMatch = bodyText.match(
        /https?:\/\/(www\.)?facebook\.com\/[\w\-\.]+/i
      );

      if (facebookUrlMatch) {
        const facebookUrl = facebookUrlMatch[0];
        console.log(`[PUPPETEER] Trying Facebook: ${facebookUrl}`);

        try {
          // Close current page and create new one for Facebook
          await page.close();
          page = await browser.newPage();

          // Login to Facebook
          const loginSuccess = await loginToFacebook(
            facebookEmail,
            facebookPassword,
            page
          );

          if (loginSuccess) {
            // Navigate to Facebook page
            await page.goto(facebookUrl, {
              waitUntil: 'networkidle2',
              timeout: 15000,
            });

            const fbContent = await page.content();
            const fbEmails = extractEmails(fbContent);

            fbEmails.forEach((item) => {
              contacts.push({
                website_url: url,
                contact_email: item.email,
                source: 'facebook',
                source_page_url: facebookUrl,
                confidence_score: 0,
                extracted_at: new Date().toISOString(),
              });
            });

            console.log(`[PUPPETEER] Found ${fbEmails.length} emails on Facebook`);
          }
        } catch (error) {
          console.error('[PUPPETEER] Error scraping Facebook:', error.message);
        }
      }
    }

    // Calculate confidence scores
    contacts.forEach((contact) => {
      contact.confidence_score = calculateConfidenceScore(contact);
    });

    // Remove duplicates
    const uniqueContacts = [];
    const seen = new Set();

    contacts
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .forEach((contact) => {
        const key = contact.contact_email?.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          uniqueContacts.push(contact);
        }
      });

    return {
      status: uniqueContacts.length > 0 ? 'success' : 'no_contacts',
      results: uniqueContacts,
    };
  } catch (error) {
    console.error('[PUPPETEER] Error:', error.message);
    return {
      status: 'error',
      error: error.message,
      results: [],
    };
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (e) {
        // Ignore close errors
      }
    }
  }
}

/**
 * Initialize browser pool (call once at server startup)
 */
async function initializeBrowserPool(maxBrowsers = 5) {
  if (browserPool) {
    return browserPool;
  }

  browserPool = new BrowserPool(maxBrowsers);
  await browserPool.initialize();
  return browserPool;
}

/**
 * Close browser pool (call on server shutdown)
 */
async function closeBrowserPool() {
  if (browserPool) {
    await browserPool.closeAll();
    browserPool = null;
  }
}

/**
 * Scrape multiple websites concurrently
 */
async function scrapeMultipleWebsitesWithPuppeteer(
  urls,
  facebookEmail = null,
  facebookPassword = null,
  concurrency = 5
) {
  const allResults = [];
  const allEmails = new Set();
  const websiteResults = [];
  let successCount = 0;
  let errorCount = 0;
  let noContactCount = 0;

  // Process URLs in batches of 'concurrency'
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchPromises = batch.map((url) =>
      scrapeWebsiteWithPuppeteer(url, facebookEmail, facebookPassword)
        .then((result) => ({ url, result }))
        .catch((error) => ({
          url,
          result: {
            status: 'error',
            error: error.message,
            results: [],
          },
        }))
    );

    const batchResults = await Promise.all(batchPromises);

    for (const { url, result } of batchResults) {
      if (result.status === 'success' && result.results.length > 0) {
        successCount++;
        allResults.push(...result.results);

        websiteResults.push({
          website_url: url,
          status: 'success',
          emails_found: result.results.length,
          contacts: result.results,
        });

        result.results.forEach((lead) => {
          if (lead.contact_email) {
            allEmails.add(lead.contact_email);
          }
        });
      } else if (result.status === 'no_contacts') {
        noContactCount++;
        websiteResults.push({
          website_url: url,
          status: 'no_contacts',
          emails_found: 0,
          contacts: [],
        });
      } else {
        errorCount++;
        websiteResults.push({
          website_url: url,
          status: 'error',
          emails_found: 0,
          contacts: [],
          error: result.error || 'Failed to scrape',
        });
      }
    }
  }

  return {
    status: allResults.length > 0 ? 'success' : 'no_contacts',
    results: allResults,
    websiteResults: websiteResults,
    summary: {
      totalWebsites: urls.length,
      successCount,
      noContactsCount: noContactCount,
      errorCount,
      totalContactsFound: allResults.length,
      emailsFound: allEmails.size,
      fromFacebook: allResults.filter((r) => r.source === 'facebook').length,
    },
    aggregated: {
      emails: Array.from(allEmails),
    },
  };
}

module.exports = {
  initializeBrowserPool,
  closeBrowserPool,
  scrapeWebsiteWithPuppeteer,
  scrapeMultipleWebsitesWithPuppeteer,
  extractEmails,
  calculateConfidenceScore,
  normalizeUrl,
  decodeHtmlEntities,
  isValidEmail,
};
