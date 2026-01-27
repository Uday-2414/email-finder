const {
  scrapeWebsite,
  extractEmails,
  extractPhones,
  calculateConfidenceScore
} = require('../utils/scraper');

const {
  scrapeWebsiteWithPuppeteer,
  scrapeMultipleWebsitesWithPuppeteer,
  initializeBrowserPool,
  closeBrowserPool
} = require('../utils/puppeteerScraper');

/**
 * Single website scraping endpoint
 * Uses Puppeteer for JavaScript rendering and better email capture
 */
exports.scrapeSingleWebsite = async (req, res) => {
  try {
    const { url, facebookEmail, facebookPassword, usePuppeteer = true } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    let result;

    if (usePuppeteer) {
      // Initialize browser pool if not already done
      if (!global.browserPool) {
        global.browserPool = await initializeBrowserPool(5);
      }

      result = await scrapeWebsiteWithPuppeteer(url, facebookEmail, facebookPassword);
    } else {
      // Fallback to old scraper
      result = await scrapeWebsite(url);
    }

    // Format response
    res.json({
      status: result.status,
      error: result.error || null,
      results: result.results || [],
      websiteResults: [{
        website_url: url,
        status: result.status,
        emails_found: result.results?.length || 0,
        contacts: result.results || [],
      }],
      summary: result.summary || {
        total_found: 0,
        emails: 0,
        from_facebook: 0,
        processing_time_seconds: 0,
      },
      aggregated: result.results
        ? {
            emails: result.results
              .filter((r) => r.contact_email)
              .map((r) => r.contact_email),
          }
        : { emails: [] },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      results: [],
      summary: {
        total_found: 0,
        emails: 0,
        from_facebook: 0,
      },
    });
  }
};

/**
 * Multiple websites scraping endpoint
 * Uses Puppeteer for better email capture with concurrent browser pool
 */
exports.scrapeMultipleWebsites = async (req, res) => {
  try {
    const { urls, facebookEmail, facebookPassword, usePuppeteer = true, concurrency = 5 } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'Array of URLs is required' });
    }

    // Limit to 100 URLs per request
    if (urls.length > 100) {
      return res.status(400).json({ error: 'Maximum 100 URLs allowed per request' });
    }

    const startTime = Date.now();
    let results;

    if (usePuppeteer) {
      // Initialize browser pool if not already done
      if (!global.browserPool) {
        global.browserPool = await initializeBrowserPool(concurrency);
      }

      results = await scrapeMultipleWebsitesWithPuppeteer(
        urls,
        facebookEmail,
        facebookPassword,
        concurrency
      );
    } else {
      // Fallback to old scraper
      const { scrapeMultipleWebsites: oldScraper } = require('../utils/scraper');
      results = await oldScraper(urls);
    }

    const processingTime = Math.round((Date.now() - startTime) / 1000);

    // Response with unified format
    res.json({
      status: results.status,
      results: results.results,
      websiteResults: results.websiteResults,
      summary: {
        totalWebsites: results.summary.totalWebsites,
        successCount: results.summary.successCount,
        noContactsCount: results.summary.noContactsCount,
        errorCount: results.summary.errorCount,
        totalContactsFound: results.summary.totalContactsFound,
        emailsFound: results.summary.emailsFound,
        fromFacebook: results.summary.fromFacebook,
        processingTimeSeconds: processingTime,
        averageConfidenceScore: results.results.length > 0 
          ? Math.round(results.results.reduce((sum, r) => sum + r.confidence_score, 0) / results.results.length)
          : 0
      },
      aggregated: results.aggregated
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      results: [],
      websiteResults: [],
      summary: {
        totalWebsites: 0,
        successCount: 0,
        noContactsCount: 0,
        errorCount: 0,
        totalContactsFound: 0,
        emailsFound: 0,
        fromFacebook: 0,
        processingTimeSeconds: 0
      },
      aggregated: {
        emails: []
      }
    });
  }
};

exports.extractContacts = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const emails = extractEmails(text);
    const phones = extractPhones(text);

    res.json({
      emails,
      phones,
      totalContacts: emails.length + phones.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
