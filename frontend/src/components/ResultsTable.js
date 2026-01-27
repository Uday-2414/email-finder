import React from 'react';
import { Copy, Download, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import './ResultsTable.css';

function ResultsTable({ data }) {
  const [expandedWebsites, setExpandedWebsites] = React.useState({});

  const toggleWebsite = (index) => {
    setExpandedWebsites(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const downloadAsCSV = () => {
    if (!data.aggregated?.emails || data.aggregated.emails.length === 0) {
      toast.error('No emails to download');
      return;
    }

    let csv = 'Email\n';
    data.aggregated.emails.forEach(email => {
      csv += `"${email}"\n`;
    });

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', 'emails.csv');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Downloaded emails.csv');
  };

  const downloadAsJSON = () => {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data.aggregated?.emails || [], null, 2)));
    element.setAttribute('download', 'emails.json');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Downloaded emails.json');
  };

  const copyAllEmails = () => {
    const emailList = data.aggregated?.emails?.join('\n') || '';
    copyToClipboard(emailList);
  };

  // Organize results by website
  const websiteData = data.websiteResults || [];

  return (
    <div className="results-container">
      <div className="results-header">
        <h2 className="results-title">📊 Scraping Results</h2>
        <div className="results-actions">
          <button className="action-btn" onClick={copyAllEmails} title="Copy all emails">
            <Copy size={16} />
            Copy All
          </button>
          <button className="action-btn" onClick={downloadAsCSV}>
            <Download size={16} />
            CSV
          </button>
          <button className="action-btn" onClick={downloadAsJSON}>
            <Download size={16} />
            JSON
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="summary-stats">
        <div className="stat-card">
          <div className="stat-label">Total Websites</div>
          <div className="stat-value">{data.summary?.totalWebsites || 0}</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">✓ Found Emails</div>
          <div className="stat-value">{data.summary?.successCount || 0}</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">⊘ No Contact</div>
          <div className="stat-value">{data.summary?.noContactsCount || 0}</div>
        </div>
        <div className="stat-card error">
          <div className="stat-label">✕ Failed</div>
          <div className="stat-value">{data.summary?.errorCount || 0}</div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-label">📧 Total Emails</div>
          <div className="stat-value">{data.summary?.totalEmailsFound || 0}</div>
        </div>
      </div>

      {/* Websites with Results Table */}
      {websiteData.length > 0 && (
        <div className="websites-section">
          <h3 className="section-heading">🌐 All Websites ({websiteData.length})</h3>
          <div className="table-wrapper">
            <table className="websites-table">
              <thead>
                <tr>
                  <th>Website</th>
                  <th>Status</th>
                  <th>Emails Found</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {websiteData.map((website, idx) => {
                  const isExpanded = expandedWebsites[idx];
                  const emailCount = website.emails_found || 0;

                  return (
                    <React.Fragment key={idx}>
                      <tr 
                        className="website-row clickable"
                        onClick={() => toggleWebsite(idx)}
                      >
                        <td className="website-cell">
                          <a href={website.website_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                            {website.website_url}
                          </a>
                        </td>
                        <td className="status-cell">
                          <span className={`status-badge ${website.status}`}>
                            {website.status === 'success' && '✓ Found'}
                            {website.status === 'no_contacts' && '⊘ Not Available'}
                            {website.status === 'error' && '✕ Failed'}
                          </span>
                        </td>
                        <td className="count-cell">
                          <strong>{emailCount}</strong>
                          {emailCount > 1 && <span className="badge-small">{emailCount} emails</span>}
                          {emailCount === 1 && <span className="badge-small">1 email</span>}
                          {emailCount === 0 && <span className="badge-small">—</span>}
                        </td>
                        <td className="expand-cell">
                          {emailCount > 0 && (
                            isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />
                          )}
                        </td>
                      </tr>

                      {/* Expanded row - show emails for this website */}
                      {isExpanded && website.contacts && website.contacts.length > 0 && (
                        <tr className="expanded-row">
                          <td colSpan="4">
                            <div className="emails-list">
                              <table className="emails-table">
                                <thead>
                                  <tr>
                                    <th>#</th>
                                    <th>Email Address</th>
                                    <th>Source</th>
                                    <th>Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {website.contacts.map((contact, emailIdx) => (
                                    <tr key={emailIdx} className="email-row">
                                      <td className="index-cell">{emailIdx + 1}</td>
                                      <td className="email-cell">
                                        <a href={`mailto:${contact.contact_email}`}>
                                          {contact.contact_email}
                                        </a>
                                      </td>
                                      <td className="source-cell">
                                        <span className={`source-badge ${contact.source === 'facebook' ? 'facebook' : 'website'}`}>
                                          {contact.source === 'facebook' ? '📘 Facebook' : '🌐 Website'}
                                        </span>
                                      </td>
                                      <td className="action-cell">
                                        <button
                                          className="copy-btn-small"
                                          onClick={() => copyToClipboard(contact.contact_email)}
                                          title="Copy email"
                                        >
                                          <Copy size={14} />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All Extracted Emails - Global List */}
      {data.aggregated?.emails && data.aggregated.emails.length > 0 && (
        <div className="emails-section">
          <h3 className="section-heading">📧 All Extracted Emails ({data.aggregated.emails.length})</h3>
          <div className="table-wrapper">
            <table className="all-emails-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Email Address</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.aggregated.emails.map((email, idx) => (
                  <tr key={idx}>
                    <td className="index-cell">{idx + 1}</td>
                    <td className="email-cell">
                      <a href={`mailto:${email}`}>{email}</a>
                    </td>
                    <td className="action-cell">
                      <button
                        className="copy-btn-small"
                        onClick={() => copyToClipboard(email)}
                        title="Copy email"
                      >
                        <Copy size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No results message */}
      {(!data.aggregated?.emails || data.aggregated.emails.length === 0) && (
        <div className="no-results">
          <Mail size={48} />
          <p>No emails found. Check the website status above for details.</p>
        </div>
      )}
    </div>
  );
}

export default ResultsTable;
