const express = require('express');
const multer = require('multer');
const router = express.Router();
const uploadController = require('../controllers/uploadController');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/excel', upload.single('file'), uploadController.parseExcelFile);
router.post('/csv', uploadController.parseCSVText);

module.exports = router;
