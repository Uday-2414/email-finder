const xlsx = require('xlsx');
const { scrapeMultipleWebsites } = require('../utils/scraper');
const { scrapeMultipleWebsitesWithPuppeteer, initializeBrowserPool } = require('../utils/puppeteerScraper');

exports.parseExcelFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { facebookEmail, facebookPassword } = req.body;
    const usePuppeteer = true; // Always use Puppeteer

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    // Extract URLs from the first column
    const urls = data
      .map(row => {
        const values = Object.values(row);
        return values[0];
      })
      .filter(url => url && typeof url === 'string' && (url.includes('http') || url.includes('.')))
      .slice(0, 100); // Increased limit to 100

    if (urls.length === 0) {
      return res.status(400).json({ error: 'No valid URLs found in the file' });
    }

    let results;

    if (usePuppeteer) {
      // Initialize browser pool if not already done
      if (!global.browserPool) {
        global.browserPool = await initializeBrowserPool(5);
      }

      results = await scrapeMultipleWebsitesWithPuppeteer(
        urls,
        facebookEmail,
        facebookPassword,
        5
      );
    } else {
      results = await scrapeMultipleWebsites(urls);
    }

    res.json({
      summary: {
        totalWebsites: results.summary?.totalWebsites || urls.length,
        successCount: results.summary?.successCount || 0,
        noContactsCount: results.summary?.noContactsCount || 0,
        errorCount: results.summary?.errorCount || 0,
        totalEmailsFound: results.summary?.emailsFound || 0,
      },
      results: results.results,
      websiteResults: results.websiteResults,
      aggregated: results.aggregated,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.parseCSVText = async (req, res) => {
  try {
    const { csvText, facebookEmail, facebookPassword } = req.body;
    const usePuppeteer = true; // Always use Puppeteer

    if (!csvText) {
      return res.status(400).json({ error: 'CSV text is required' });
    }

    const urls = csvText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && (line.includes('http') || line.includes('.')))
      .slice(0, 100); // Increased limit to 100

    if (urls.length === 0) {
      return res.status(400).json({ error: 'No valid URLs found' });
    }

    let results;

    if (usePuppeteer) {
      // Initialize browser pool if not already done
      if (!global.browserPool) {
        global.browserPool = await initializeBrowserPool(5);
      }

      results = await scrapeMultipleWebsitesWithPuppeteer(
        urls,
        facebookEmail,
        facebookPassword,
        5
      );
    } else {
      results = await scrapeMultipleWebsites(urls);
    }

    res.json({
      summary: {
        totalWebsites: results.summary?.totalWebsites || urls.length,
        successCount: results.summary?.successCount || 0,
        noContactsCount: results.summary?.noContactsCount || 0,
        errorCount: results.summary?.errorCount || 0,
        totalEmailsFound: results.summary?.emailsFound || 0,
      },
      results: results.results,
      websiteResults: results.websiteResults,
      aggregated: results.aggregated,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
