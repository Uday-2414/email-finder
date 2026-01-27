import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import './Header.css';

function Header({ apiHealth }) {
  return (
    <div className="header">
      <div className="header-left">
        <h1 className="header-title">Contact Scraper Pro</h1>
        <p className="header-subtitle">Scrape emails, phone numbers & social links from websites</p>
      </div>
      
      <div className="header-right">
        <div className={`status-badge ${apiHealth ? 'online' : 'offline'}`}>
          {apiHealth ? (
            <>
              <CheckCircle size={16} />
              <span>Backend Online</span>
            </>
          ) : (
            <>
              <AlertCircle size={16} />
              <span>Backend Offline</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Header;
