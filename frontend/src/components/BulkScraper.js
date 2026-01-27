import React, { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, Loader, Clock } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import './BulkScraper.css';

function BulkScraper({ onStart, onComplete, isLoading, facebookEmail, facebookPassword }) {
  const [csvText, setCsvText] = useState('');
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isScrapingActive, setIsScrapingActive] = useState(false);

  // Update estimated time based on URL count
  useEffect(() => {
    const urlCount = csvText
      .split('\n')
      .filter(line => line.trim().length > 0).length;
    
    if (urlCount > 0) {
      // Estimate ~10 seconds per URL with Puppeteer + 5 second overhead
      const estimated = Math.max(urlCount * 10 + 5, 5);
      setEstimatedTime(estimated);
      setTimeRemaining(estimated);
    } else {
      setEstimatedTime(null);
      setTimeRemaining(null);
    }
  }, [csvText]);

  // Countdown timer
  useEffect(() => {
    let interval;
    if (isScrapingActive && timeRemaining !== null && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev > 0 ? prev - 1 : 0);
      }, 1000);
    } else if (timeRemaining === 0) {
      setIsScrapingActive(false);
    }
    return () => clearInterval(interval);
  }, [isScrapingActive, timeRemaining]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    onStart();
    setIsScrapingActive(true);
    setTimeRemaining(estimatedTime);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('facebookEmail', facebookEmail);
      formData.append('facebookPassword', facebookPassword);

      const response = await axios.post('/api/upload/excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onComplete(response.data);
      toast.success(`Scraped ${response.data.summary.successCount} sites!`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error processing file');
    } finally {
      setIsScrapingActive(false);
    }
  };

  const handleCSVScrape = async () => {
    if (!csvText.trim()) {
      toast.error('Please enter URLs');
      return;
    }

    onStart();
    setIsScrapingActive(true);
    setTimeRemaining(estimatedTime);
    
    try {
      const response = await axios.post('/api/upload/csv', { 
        csvText,
        facebookEmail,
        facebookPassword
      });
      onComplete(response.data);
      toast.success(`Scraped ${response.data.summary.successCount} sites!`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error scraping URLs');
    } finally {
      setIsScrapingActive(false);
    }
  };

  return (
    <div className="bulk-scraper">
      <div className="upload-section">
        <h3 className="section-title">📤 Upload Excel/CSV File</h3>
        <label className="upload-area">
          <div className="upload-content">
            <FileSpreadsheet size={40} />
            <p className="upload-text">Drag and drop your Excel or CSV file here</p>
            <p className="upload-hint">or click to browse</p>
          </div>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            disabled={isLoading}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      <div className="divider">
        <span>OR</span>
      </div>

      <div className="manual-section">
        <h3 className="section-title">✏️ Enter URLs Manually</h3>
        <textarea
          placeholder="Enter URLs (one per line)&#10;https://example.com&#10;https://another-site.com"
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          disabled={isLoading}
          className="url-textarea"
        />
        
        {estimatedTime && (
          <div className="estimated-time">
            <Clock size={16} />
            <span>
              {isScrapingActive 
                ? `⏳ Time remaining: ${timeRemaining}s` 
                : `⏱️ Estimated time: ${estimatedTime}s`}
            </span>
          </div>
        )}
        
        <button 
          className={`scrape-button ${isLoading ? 'loading' : ''}`}
          onClick={handleCSVScrape}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader size={18} className="spinner" />
              <span>Scraping...</span>
            </>
          ) : (
            <>
              <Upload size={18} />
              <span>Start Scraping</span>
            </>
          )}
        </button>
      </div>

      <div className="info-box">
        <p><strong>💡 Note:</strong> Maximum 100 URLs per batch</p>
        <p><strong>📊 Format:</strong> Excel (.xlsx) or CSV with URLs in first column</p>
        <p><strong>⏱️ Time:</strong> ~10 seconds per URL (Puppeteer with JS rendering)</p>
        {facebookEmail && <p><strong>✅ Facebook:</strong> Configured for deeper scraping</p>}
      </div>
    </div>
  );
}

export default BulkScraper;
