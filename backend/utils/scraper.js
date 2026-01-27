const axios = require('axios');
const cheerio = require('cheerio');

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

// ===== PHONE VALIDATION =====
const PHONE_PATTERNS = [
  /\+?(\d{1,3})?[-.\s]?\(?(\d{1,4})\)?[-.\s]?(\d{1,4})[-.\s]?(\d{1,9})/g,
  /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g,
];
const MIN_PHONE_DIGITS = 8;

// ===== DOMAIN PATTERNS =====
const DOMAIN_PATTERNS = {
  facebook: /facebook\.com/i,
  twitter: /twitter\.com/i,
  linkedin: /linkedin\.com/i,
  instagram: /instagram\.com/i,
  youtube: /youtube\.com/i,
  tiktok: /tiktok\.com/i,
};

const PRIORITY_EMAILS = ['info', 'contact', 'sales', 'hello', 'support'];

// ===== UTILITY FUNCTIONS =====

/**
 * Normalize URL - add https:// if protocol is missing
 * Handles both "example.com" and "https://example.com"
 */
function normalizeUrl(url) {
  if (!url) return null;
  url = url.trim();
  
  // If URL doesn't start with http:// or https://, add https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  return url;
}

/**
 * Fetch page content with timeout and error handling
 */
async function fetchPageContent(url, timeout = 10000) {
  try {
    const response = await axios.get(url, {
      timeout,
      maxRedirects: 5,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    return null;
  }
}

/**
 * Validate email address
 * Checks RFC compliance and filters invalid patterns
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;

  // Check against invalid patterns
  if (INVALID_EMAIL_PATTERNS.some((pattern) => pattern.test(email))) {
    return false;
  }

  // RFC 5322 simplified check
  const rfcRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return rfcRegex.test(email);
}

/**
 * Get email priority rank (lower = higher priority)
 */
function getEmailPriority(email) {
  const prefix = email.split('@')[0].toLowerCase();

  for (let i = 0; i < PRIORITY_EMAILS.length; i++) {
    if (prefix.startsWith(PRIORITY_EMAILS[i])) {
      return i;
    }
  }

  // Personal emails (team/about pages) get lower priority
  return 999;
}

/**
 * Validate phone number
 * Must have at least MIN_PHONE_DIGITS digits, avoid dates/prices
 */
function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;

  const digitsOnly = phone.replace(/\D/g, '');

  // Check minimum digits
  if (digitsOnly.length < MIN_PHONE_DIGITS) return false;

  // Reject if too many consecutive same digits (likely not a phone)
  const maxConsecutive = Math.max(
    ...digitsOnly.match(/(\d)\1*/g).map((m) => m.length)
  );
  if (maxConsecutive >= 5) return false;

  return true;
}

/**
 * Normalize phone number with country code
 */
function normalizePhone(phone) {
  if (!phone) return null;

  let digits = phone.replace(/\D/g, '');
  let countryCode = '1'; // Default to US

  if (digits.startsWith('1') && digits.length > 10) {
    countryCode = digits.substring(0, digits.length - 10);
    digits = digits.substring(digits.length - 10);
  } else if (digits.length > 10) {
    countryCode = digits.substring(0, digits.length - 10);
    digits = digits.substring(digits.length - 10);
  }

  return {
    originalFormat: phone,
    countryCode,
    nationalNumber: digits,
    formatted: `+${countryCode}-${digits.substring(0, 3)}-${digits.substring(3)}`,
  };
}

/**
 * Extract and validate emails from text
 */
function extractEmails(text, pageUrl = '') {
  if (!text) return [];

  const matches = text.match(EMAIL_REGEX) || [];
  const validEmails = [];
  const seen = new Set();

  // Remove duplicates and invalid emails
  matches.forEach((email) => {
    const normalized = email.toLowerCase();
    if (!seen.has(normalized) && isValidEmail(normalized)) {
      seen.add(normalized);
      validEmails.push({
        email: normalized,
        source_page_url: pageUrl,
        priority: getEmailPriority(normalized),
      });
    }
  });

  // Sort by priority
  validEmails.sort((a, b) => a.priority - b.priority);

  return validEmails.map((item) => ({
    email: item.email,
    source_page_url: item.source_page_url,
  }));
}

/**
 * Extract and validate phone numbers from text
 */
function extractPhones(text) {
  if (!text) return [];

  const phones = new Set();

  PHONE_PATTERNS.forEach((pattern) => {
    const matches = text.match(pattern) || [];
    matches.forEach((phone) => {
      if (isValidPhone(phone)) {
        phones.add(phone);
      }
    });
  });

  return Array.from(phones)
    .map((phone) => normalizePhone(phone))
    .filter((phone) => phone !== null);
}

/**
 * Extract social media links from HTML
 */
function extractSocialLinks(html) {
  const $ = cheerio.load(html);
  const socialLinks = {};

  $('a[href]').each((i, el) => {
    const href = $(el).attr('href') || '';
    if (!href) return;

    // Check each domain pattern
    for (const [platform, pattern] of Object.entries(DOMAIN_PATTERNS)) {
      if (pattern.test(href)) {
        if (!socialLinks[platform]) {
          socialLinks[platform] = [];
        }

        // Clean up URL - prefer official pages, not share links
        let cleanUrl = href;
        if (!cleanUrl.includes('://')) {
          cleanUrl = 'https://' + platform + '.com' + href;
        }

        // Skip share links
        if (
          cleanUrl.includes('/share') ||
          cleanUrl.includes('sharer') ||
          cleanUrl.includes('fbclid')
        ) {
          return;
        }

        if (!socialLinks[platform].includes(cleanUrl)) {
          socialLinks[platform].push(cleanUrl);
        }
      }
    }
  });

  return socialLinks;
}

/**
 * Find contact page URL
 */
function findContactPage(html, baseUrl) {
  const $ = cheerio.load(html);
  const patterns = [/contact/i, /about/i, /team/i, /info/i, /support/i];

  let contactUrl = null;

  $('a[href]').each((i, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().toLowerCase();

    if (patterns.some((p) => p.test(text)) && href) {
      try {
        if (href.startsWith('http')) {
          contactUrl = href;
        } else if (href.startsWith('/')) {
          contactUrl = new URL(href, baseUrl).toString();
        }
        return false; // Break
      } catch (e) {
        // Invalid URL, continue
      }
    }
  });

  return contactUrl;
}

/**
 * Calculate confidence score for a lead
 * Factors: source, page type, email quality, phone present, domain match
 */
function calculateConfidenceScore(lead) {
  let score = 0;

  // Email found on official domain (+40)
  if (
    lead.contact_email &&
    lead.website_url &&
    lead.contact_email.endsWith(new URL(lead.website_url).hostname)
  ) {
    score += 40;
  }

  // Email found on contact/about page (+20)
  if (lead.contact_email && lead.source_page_url) {
    const pageText = lead.source_page_url.toLowerCase();
    if (
      pageText.includes('/contact') ||
      pageText.includes('/about') ||
      pageText.includes('/team')
    ) {
      score += 20;
    }
  }

  // Email from Facebook fallback (+10)
  if (lead.source === 'facebook') {
    score += 10;
  }

  // Phone number present (+10)
  if (lead.contact_phone) {
    score += 10;
  }

  // Domain match - email matches domain (+20)
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

  return Math.min(score, 100); // Cap at 100
}

/**
 * Scrape Facebook page for ALL emails
 * Extract all emails found on the page
 */
async function scrapeFacebookForContacts(facebookUrl) {
  try {
    console.log(`[FB] Scraping: ${facebookUrl}`);

    const html = await fetchPageContent(facebookUrl);
    if (!html) return { emails: [] };

    const $ = cheerio.load(html);

    // Get all visible text content
    const fullText = $('body').text();

    // Extract ALL emails - no filtering by domain
    const emailMatches = fullText.match(EMAIL_REGEX) || [];
    const emails = [];
    const seen = new Set();

    emailMatches.forEach((email) => {
      const normalized = email.toLowerCase().trim();
      if (!seen.has(normalized) && isValidEmail(normalized)) {
        seen.add(normalized);
        emails.push(normalized);
      }
    });

    console.log(`[FB] Found ${emails.length} emails from Facebook page`);

    return {
      emails: emails,
      source: 'facebook',
      source_url: facebookUrl,
    };
  } catch (error) {
    console.error('[FB] Error:', error.message);
    return { emails: [], phones: [] };
  }
}

/**
 * Main scraping function - extracts unified lead data
 * Returns array of contact records with confidence scores
 */
async function scrapeWebsite(url) {
  const startTime = Date.now();
  const contacts = [];

  try {
    // Normalize URL - add https:// if missing
    url = normalizeUrl(url);
    if (!url) {
      return {
        status: 'error',
        error: 'Invalid URL format',
        results: [],
        summary: {
          total_found: 0,
          emails: 0,
          phones: 0,
          from_facebook: 0,
        },
      };
    }

    // Validate URL format
    new URL(url);

    // Step 1: Fetch main page
    console.log(`[MAIN] Fetching: ${url}`);
    const mainHtml = await fetchPageContent(url);

    if (!mainHtml) {
      return {
        status: 'error',
        error: 'Failed to fetch website',
        results: [],
        summary: {
          total_found: 0,
          emails: 0,
          phones: 0,
          from_facebook: 0,
        },
      };
    }

    // Step 2: Extract from main page
    const mainEmails = extractEmails(mainHtml, url);
    const socialLinks = extractSocialLinks(mainHtml);
    const contactPageUrl = findContactPage(mainHtml, url);

    // Create lead records from main page - ONLY EMAILS, NO PHONES
    const mainLeads = [];

    // Add email leads from main page
    mainEmails.forEach((item) => {
      mainLeads.push({
        website_url: url,
        contact_email: item.email,
        source: 'website',
        source_page_url: url,
        confidence_score: 0,
        extracted_at: new Date().toISOString(),
      });
    });

    contacts.push(...mainLeads);

    // Step 3: Try contact page if no emails found
    if (mainLeads.length === 0 && contactPageUrl) {
      console.log(`[CONTACT] Trying contact page: ${contactPageUrl}`);
      const contactHtml = await fetchPageContent(contactPageUrl);

      if (contactHtml) {
        const contactEmails = extractEmails(contactHtml, contactPageUrl);

        contactEmails.forEach((item) => {
          contacts.push({
            website_url: url,
            contact_email: item.email,
            source: 'website',
            source_page_url: contactPageUrl,
            confidence_score: 0,
            extracted_at: new Date().toISOString(),
          });
        });
      }
    }

    // Step 4: Try Facebook fallback if still no emails
    if (contacts.filter((c) => c.contact_email).length === 0) {
      const facebookUrl = socialLinks.facebook?.[0];

      if (facebookUrl) {
        console.log(`[FACEBOOK] Trying fallback: ${facebookUrl}`);
        const fbData = await scrapeFacebookForContacts(facebookUrl);

        if (fbData.emails.length > 0) {
          fbData.emails.forEach((email) => {
            contacts.push({
              website_url: url,
              contact_email: email,
              source: 'facebook',
              source_page_url: facebookUrl,
              confidence_score: 0,
              extracted_at: new Date().toISOString(),
            });
          });
        }
      }
    }

    // Step 5: Calculate confidence scores
    contacts.forEach((contact) => {
      contact.confidence_score = calculateConfidenceScore(contact);
    });

    // Step 6: Remove duplicates (keep highest confidence)
    const uniqueContacts = [];
    const seen = new Set();

    contacts
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .forEach((contact) => {
        const key = `${contact.contact_email || ''}|${
          contact.contact_phone?.nationalNumber || ''
        }`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueContacts.push(contact);
        }
      });

    const endTime = Date.now();
    const processingTime = Math.round((endTime - startTime) / 1000);

    return {
      status: uniqueContacts.length > 0 ? 'success' : 'no_contacts',
      results: uniqueContacts,
      summary: {
        total_found: uniqueContacts.length,
        emails: uniqueContacts.filter((c) => c.contact_email).length,
        from_facebook: uniqueContacts.filter((c) => c.source === 'facebook')
          .length,
        processing_time_seconds: processingTime,
      },
    };
  } catch (error) {
    console.error('[ERROR]', error.message);
    return {
      status: 'error',
      error: error.message,
      results: [],
      summary: {
        total_found: 0,
        emails: 0,
        from_facebook: 0,
      },
    };
  }
}

/**
 * Scrape multiple websites and return aggregated results
 * @param {string[]} urls - Array of URLs to scrape
 * @returns {Promise<object[]>} Array of scraping results
 */
async function scrapeMultipleWebsites(urls) {
  const allResults = [];
  const allEmails = new Set();
  const websiteResults = [];
  let successCount = 0;
  let errorCount = 0;
  let noContactCount = 0;

  for (const url of urls) {
    try {
      const result = await scrapeWebsite(url);
      
      if (result.status === 'success' && result.results && result.results.length > 0) {
        successCount++;
        allResults.push(...result.results);
        
        // Track website result with email count
        websiteResults.push({
          website_url: url,
          status: 'success',
          emails_found: result.results.length,
          contacts: result.results,
        });
        
        // Aggregate unique emails
        result.results.forEach(lead => {
          if (lead.contact_email) {
            allEmails.add(lead.contact_email);
          }
        });
      } else if (result.status === 'no_contacts') {
        noContactCount++;
        // Track website with no contacts
        websiteResults.push({
          website_url: url,
          status: 'no_contacts',
          emails_found: 0,
          contacts: [],
        });
      } else {
        errorCount++;
        // Track failed website
        websiteResults.push({
          website_url: url,
          status: 'error',
          emails_found: 0,
          contacts: [],
          error: result.error || 'Failed to scrape',
        });
      }
    } catch (error) {
      console.error(`[BULK] Error scraping ${url}:`, error.message);
      errorCount++;
      websiteResults.push({
        website_url: url,
        status: 'error',
        emails_found: 0,
        contacts: [],
        error: error.message,
      });
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
      fromFacebook: allResults.filter(r => r.source === 'facebook').length,
      processingTimeSeconds: 0,
    },
    aggregated: {
      emails: Array.from(allEmails),
    }
  };
}

module.exports = {
  scrapeWebsite,
  scrapeMultipleWebsites,
  scrapeFacebookForContacts,
  extractEmails,
  extractPhones,
  extractSocialLinks,
  findContactPage,
  isValidEmail,
  isValidPhone,
  normalizePhone,
  normalizeUrl,
  calculateConfidenceScore,
};
