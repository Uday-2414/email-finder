import React, { useState } from 'react';
import { Search, Loader } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../utils/api';
import './SingleScraper.css';

function SingleScraper({ onStart, onComplete, isLoading, facebookEmail, facebookPassword }) {
  const [url, setUrl] = useState('');

  const handleScrape = async () => {
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    onStart();
    try {
      const response = await axios.post(`${API_BASE_URL}/api/scraper/single`, { 
        url,
        facebookEmail,
        facebookPassword,
        usePuppeteer: true
      });
      onComplete(response.data);
      
      if (response.data.status === 'success') {
        toast.success(`Found ${response.data.aggregated.emails.length} emails!`);
      } else if (response.data.status === 'no_contacts') {
        toast.error('No direct contacts found. Check social links.');
      } else {
        toast.error('Failed to scrape website');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error scraping website');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleScrape();
    }
  };

  return (
    <div className="scraper-container">
      <div className="input-group">
        <div className="input-wrapper">
          <Search className="input-icon" size={20} />
          <input
            type="text"
            placeholder="Enter website URL (e.g., https://example.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="url-input"
          />
        </div>
        
        <button 
          className={`scrape-button ${isLoading ? 'loading' : ''}`}
          onClick={handleScrape}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader size={18} className="spinner" />
              <span>Scraping...</span>
            </>
          ) : (
            <>
              <Search size={18} />
              <span>Scrape</span>
            </>
          )}
        </button>
      </div>

      {!isLoading && (
        <div className="suggestions">
          <p className="suggestion-title">✨ Tips:</p>
          <ul>
            <li>Include the full URL with https:// or http://</li>
            <li>The tool will find emails, phone numbers & social links</li>
            <li>Results appear in the table below</li>
            <li>{facebookEmail ? '✅ Facebook credentials configured' : '⚙️ Add Facebook credentials in Settings for better results'}</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default SingleScraper;
