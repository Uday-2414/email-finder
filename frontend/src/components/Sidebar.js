import React, { useState, useEffect } from 'react';
import { Menu, X, Search, Upload, Zap, Settings, Eye, EyeOff, Lock } from 'lucide-react';
import './Sidebar.css';

function Sidebar({ isOpen, setIsOpen, onFacebookCredentialsChange }) {
  const [facebookEmail, setFacebookEmail] = useState('');
  const [facebookPassword, setFacebookPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [expandSettings, setExpandSettings] = useState(false);

  // Load credentials from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('facebookCredentials');
    if (saved) {
      try {
        const creds = JSON.parse(saved);
        setFacebookEmail(creds.email || '');
        setFacebookPassword(creds.password || '');
      } catch (e) {
        // Invalid JSON, ignore
      }
    }
  }, []);

  // Save credentials and notify parent
  const handleCredentialChange = (email, password) => {
    setFacebookEmail(email);
    setFacebookPassword(password);
    
    localStorage.setItem('facebookCredentials', JSON.stringify({
      email,
      password
    }));

    onFacebookCredentialsChange?.(email, password);
  };

  const menuItems = [
    { icon: Search, label: 'Single URL', id: 'single' },
    { icon: Upload, label: 'Bulk Upload', id: 'bulk' },
    { icon: Zap, label: 'Quick Scrape', id: 'quick' },
    { icon: Settings, label: 'Settings', id: 'settings' }
  ];

  return (
    <>
      <button 
        className="mobile-menu-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">🔍</div>
            <h1>ContactScraper</h1>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <h3 className="nav-section-title">Tools</h3>
            {menuItems.map((item) => (
              <a 
                key={item.id}
                href={`#${item.id}`}
                className="nav-item"
                onClick={() => {
                  if (item.id === 'settings') {
                    setExpandSettings(!expandSettings);
                  }
                }}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </a>
            ))}
          </div>

          {expandSettings && (
            <div className="nav-section facebook-credentials">
              <h3 className="nav-section-title">
                <Lock size={16} /> Facebook Credentials
              </h3>
              <p className="credentials-hint">
                📱 Enter your Facebook credentials to access Facebook pages for email extraction. Your credentials are stored locally on your device.
              </p>
              
              <div className="credential-input-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="your@facebook.com"
                  value={facebookEmail}
                  onChange={(e) => handleCredentialChange(e.target.value, facebookPassword)}
                  className="credential-input"
                />
              </div>

              <div className="credential-input-group">
                <label>Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={facebookPassword}
                    onChange={(e) => handleCredentialChange(facebookEmail, e.target.value)}
                    className="credential-input"
                  />
                  <button
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {facebookEmail && facebookPassword && (
                <div className="credentials-status">
                  ✅ Credentials saved (stored locally)
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="footer-item">
            <div className="footer-icon">⚡</div>
            <div className="footer-text">
              <p className="footer-label">Powered by Puppeteer</p>
              <p className="footer-desc">JavaScript-enabled scraping</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
