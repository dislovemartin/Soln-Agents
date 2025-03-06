import React, { useState, useEffect } from "react";
import { 
  getAutoGenStudioConfig, 
  updateAutoGenStudioConfig,
  installAutoGenStudioPlugin
} from "../../../models/autogenStudio";
import { useToast } from "../../../hooks/useToast";
import paths from "../../../utils/paths";

export const AutoGenStudioSettings = () => {
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState(null);
  const [config, setConfig] = useState({
    enabled: false,
    baseUrl: "http://localhost:8081",
    apiPath: "/api",
    wsPath: "/ws",
    timeout: 30000,
  });
  const { showToast } = useToast();

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      const response = await getAutoGenStudioConfig();
      
      if (response.error) {
        setError(response.error);
        showToast({ message: `Error: ${response.error}`, type: "error" });
      } else {
        setConfig(response);
      }
      
      setLoading(false);
    };
    
    fetchConfig();
  }, [showToast]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setConfig((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setConfig((prev) => ({ ...prev, [name]: parseInt(value, 10) }));
    } else {
      setConfig((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const response = await updateAutoGenStudioConfig(config);
    
    if (response.error) {
      setError(response.error);
      showToast({ message: `Error: ${response.error}`, type: "error" });
    } else {
      showToast({ message: "AutoGen Studio settings updated successfully", type: "success" });
    }
    
    setLoading(false);
  };

  const handleInstallPlugin = async () => {
    setInstalling(true);
    
    const response = await installAutoGenStudioPlugin();
    
    if (response.error) {
      setError(response.error);
      showToast({ message: `Error: ${response.error}`, type: "error" });
    } else {
      showToast({ message: "AutoGen Studio plugin installed successfully", type: "success" });
    }
    
    setInstalling(false);
  };

  return (
    <div className="w-full flex flex-col">
      <div className="flex flex-col gap-y-4 overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              AutoGen Studio Settings
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configure integration with Microsoft's AutoGen Studio
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center">
              <input
                id="enabled"
                name="enabled"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={config.enabled}
                onChange={handleChange}
                disabled={loading}
              />
              <label htmlFor="enabled" className="ml-2 block text-sm text-gray-900 dark:text-white font-medium">
                Enable AutoGen Studio Integration
              </label>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="baseUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  AutoGen Studio URL
                </label>
                <input
                  type="text"
                  name="baseUrl"
                  id="baseUrl"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="http://localhost:8081"
                  value={config.baseUrl}
                  onChange={handleChange}
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  The base URL where AutoGen Studio is running
                </p>
              </div>

              <div>
                <label htmlFor="timeout" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Request Timeout (ms)
                </label>
                <input
                  type="number"
                  name="timeout"
                  id="timeout"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="30000"
                  value={config.timeout}
                  onChange={handleChange}
                  disabled={loading}
                  min="1000"
                  max="120000"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Timeout for requests to AutoGen Studio (in milliseconds)
                </p>
              </div>

              <div>
                <label htmlFor="apiPath" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  API Path
                </label>
                <input
                  type="text"
                  name="apiPath"
                  id="apiPath"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="/api"
                  value={config.apiPath}
                  onChange={handleChange}
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  The API path for AutoGen Studio
                </p>
              </div>

              <div>
                <label htmlFor="wsPath" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  WebSocket Path
                </label>
                <input
                  type="text"
                  name="wsPath"
                  id="wsPath"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="/ws"
                  value={config.wsPath}
                  onChange={handleChange}
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  The WebSocket path for AutoGen Studio
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  installing ? "opacity-75 cursor-not-allowed" : ""
                }`}
                onClick={handleInstallPlugin}
                disabled={installing || !config.enabled}
              >
                {installing ? "Installing..." : "Install Plugin"}
              </button>
              
              <button
                type="submit"
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  loading ? "opacity-75 cursor-not-allowed" : ""
                }`}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </form>

        <div className="mt-6 bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Using AutoGen Studio with SolnAI
          </h2>
          <div className="prose dark:prose-invert max-w-full">
            <p>
              AutoGen Studio is a powerful tool for creating and managing AI agents. 
              By integrating it with SolnAI, you can use SolnAI components in AutoGen Studio 
              and vice versa.
            </p>
            
            <h3>Getting Started</h3>
            <ol>
              <li>Install and run AutoGen Studio (see the <a href="https://microsoft.github.io/autogen/docs/studio/" target="_blank" rel="noopener noreferrer">AutoGen Studio documentation</a>)</li>
              <li>Enable the integration above and set the URL to your AutoGen Studio instance</li>
              <li>Install the SolnAI plugin to AutoGen Studio</li>
              <li>Access the AutoGen Studio UI to use SolnAI components</li>
            </ol>
            
            <p>
              For more information, see the <a href={paths.admin.autogenStudioDocs}>AutoGen Studio Integration Guide</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoGenStudioSettings;