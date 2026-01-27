import React, { useState } from 'react';
import SingleScraper from './SingleScraper';
import BulkScraper from './BulkScraper';
import ResultsTable from './ResultsTable';
import ScrapingTimer from './ScrapingTimer';
import Header from './Header';
import { X } from 'lucide-react';
import './MainContent.css';

function MainContent({ apiHealth }) {
  const [activeTab, setActiveTab] = useState('single');
  const [scrapingResults, setScrapingResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [facebookEmail, setFacebookEmail] = useState('');
  const [facebookPassword, setFacebookPassword] = useState('');

  const handleFacebookCredentialsChange = (email, password) => {
    setFacebookEmail(email);
    setFacebookPassword(password);
  };

  const handleScrapingStart = () => {
    setIsLoading(true);
    setShowResults(false);
  };

  const handleScrapingComplete = (results) => {
    setScrapingResults(results);
    setIsLoading(false);
    setShowResults(true);
  };

  const handleCloseResults = () => {
    setShowResults(false);
    setTimeout(() => setScrapingResults(null), 300);
  };

  return (
    <div className="main-content">
      <Header apiHealth={apiHealth} />
      
      <div className="content-container">
        <div className="tabs-wrapper">
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'single' ? 'active' : ''}`}
              onClick={() => setActiveTab('single')}
            >
              Single URL
            </button>
            <button 
              className={`tab ${activeTab === 'bulk' ? 'active' : ''}`}
              onClick={() => setActiveTab('bulk')}
            >
              Bulk Upload
            </button>
          </div>
        </div>

        <div className="content-area">
          {activeTab === 'single' && (
            <SingleScraper 
              onStart={handleScrapingStart}
              onComplete={handleScrapingComplete}
              isLoading={isLoading}
              facebookEmail={facebookEmail}
              facebookPassword={facebookPassword}
            />
          )}
          {activeTab === 'bulk' && (
            <BulkScraper 
              onStart={handleScrapingStart}
              onComplete={handleScrapingComplete}
              isLoading={isLoading}
              facebookEmail={facebookEmail}
              facebookPassword={facebookPassword}
            />
          )}
        </div>

        {/* Timer - Shows while scraping */}
        <ScrapingTimer isScrapin={isLoading} />

        {/* Results Modal - Hidden during scraping, shown after */}
        {scrapingResults && showResults && (
          <div className="results-modal-overlay">
            <div className="results-modal">
              <div className="modal-header">
                <h2>Scraping Results</h2>
                <button 
                  className="close-button"
                  onClick={handleCloseResults}
                  title="Close results"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="modal-content">
                <ResultsTable data={scrapingResults} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

MainContent.onFacebookCredentialsChange = function(email, password) {
  // This is set by Sidebar
};

export default MainContent;
