const express = require('express');
const router = express.Router();
const scraperController = require('../controllers/scraperController');

router.post('/single', scraperController.scrapeSingleWebsite);
router.post('/multiple', scraperController.scrapeMultipleWebsites);
router.post('/extract', scraperController.extractContacts);

module.exports = router;
