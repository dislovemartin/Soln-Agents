import React, { useState } from 'react';
import { AppProviders } from '../context';
import { AutoGenStudioPanel } from '..';
import { Button } from '../shadcn/button';
import { Moon, Sun } from 'lucide-react';

/**
 * Demo page for AutoGen Studio integration
 */
const AutoGenStudioDemo: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // API configuration for AutoGen Studio
  const apiConfig = {
    baseUrl: 'http://localhost:8081/api', // Default AutoGen Studio API endpoint
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // WebSocket configuration for AutoGen Studio
  const webSocketConfig = {
    url: 'ws://localhost:8081/ws',
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="dark:bg-gray-900 bg-gray-50 min-h-screen">
        <AppProviders
          apiConfig={apiConfig}
          webSocketConfig={webSocketConfig}
          authToken="demo-token"
        >
          <div className="container mx-auto p-4">
            <header className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold dark:text-white">AutoGen Studio Integration Demo</h1>
              <Button variant="outline" size="icon" onClick={toggleDarkMode}>
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </header>

            <main className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 h-[80vh]">
              <AutoGenStudioPanel />
            </main>

            <footer className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              <p>
                This demo connects to an AutoGen Studio instance running at{' '}
                <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">
                  http://localhost:8081
                </code>
              </p>
              <p className="mt-2">
                Make sure AutoGen Studio is running before using this demo.
              </p>
            </footer>
          </div>
        </AppProviders>
      </div>
    </div>
  );
};

export default AutoGenStudioDemo;
