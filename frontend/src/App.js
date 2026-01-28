import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import { Toaster } from 'react-hot-toast';
import { API_BASE_URL } from './utils/api';
import './App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [apiHealth, setApiHealth] = useState(false);
  const [mainContentRef, setMainContentRef] = useState(null);

  useEffect(() => {
    // Check if backend is running
    fetch(`${API_BASE_URL}/api/health`)
      .then(res => res.json())
      .then(() => setApiHealth(true))
      .catch(() => setApiHealth(false));
  }, []);

  const handleFacebookCredentialsChange = (email, password) => {
    // Pass credentials to MainContent via ref
    if (mainContentRef) {
      mainContentRef.setFacebookEmail?.(email);
      mainContentRef.setFacebookPassword?.(password);
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen}
        onFacebookCredentialsChange={handleFacebookCredentialsChange}
      />
      <main className={`main-wrapper ${sidebarOpen ? '' : 'sidebar-closed'}`}>
        <MainContent apiHealth={apiHealth} ref={setMainContentRef} />
      </main>
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;
