import React, { useState } from 'react';
import { AgentApp } from '../';

/**
 * Demo page for the SolnAI Agent UI system
 */
const DemoPage: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);

  // Mock API configuration
  const apiConfig = {
    baseUrl: 'https://api.example.com',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  // Mock WebSocket configuration
  const webSocketConfig = {
    url: 'wss://api.example.com/ws',
    reconnectInterval: 3000,
    maxReconnectAttempts: 5
  };

  // Mock user data
  const userName = 'Demo User';
  const userAvatar = 'https://ui-avatars.com/api/?name=Demo+User&background=random';

  // Mock logout function
  const handleLogout = () => {
    console.log('User logged out');
    alert('Logout clicked - in a real app, this would log the user out');
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);

    // Apply dark mode to document
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Apply initial dark mode setting
  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <AgentApp
        apiConfig={apiConfig}
        webSocketConfig={webSocketConfig}
        userName={userName}
        userAvatar={userAvatar}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default DemoPage;
