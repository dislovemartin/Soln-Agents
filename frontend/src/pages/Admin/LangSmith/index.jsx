import React, { useState, useEffect } from "react";
import { FiSave, FiRefreshCw, FiCheck, FiX, FiBarChart2 } from "react-icons/fi";
import LangSmithService from "../../../models/langsmith.js";
import { useToast } from "../../../hooks/useToast.js";

export default function LangSmithIntegration({ workspaceId }) {
  const { createToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showRunDetails, setShowRunDetails] = useState(false);
  
  const [apiKeys, setApiKeys] = useState({
    api_key: "",
    api_url: "https://api.smith.langchain.com",
    enabled: false,
  });
  
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
  });
  
  useEffect(() => {
    async function fetchApiKeys() {
      try {
        const config = await LangSmithService.getApiKeys(workspaceId);
        if (config && config.config) {
          setApiKeys({
            api_key: config.config.api_key || "",
            api_url: config.config.api_url || "https://api.smith.langchain.com",
            enabled: config.config.enabled || false,
          });
          
          if (config.config.enabled) {
            fetchProjects();
          }
        }
      } catch (error) {
        console.error("Failed to fetch LangSmith API keys:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchApiKeys();
  }, [workspaceId]);
  
  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const result = await LangSmithService.listProjects(workspaceId);
      setProjects(result.projects || []);
    } catch (error) {
      console.error("Failed to fetch LangSmith projects:", error);
      createToast({
        title: "Failed to load projects",
        type: "error",
        description: "Could not load LangSmith projects. Please check your API key.",
      });
    } finally {
      setLoadingProjects(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setApiKeys((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleNewProjectChange = (e) => {
    const { name, value } = e.target;
    setNewProject((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSubmitApiKeys = async () => {
    try {
      await LangSmithService.saveApiKeys(workspaceId, {
        api_key: apiKeys.api_key,
        api_url: apiKeys.api_url,
      });
      
      createToast({
        title: "API Keys Saved",
        type: "success",
        description: "LangSmith API keys have been saved successfully.",
      });
      
      // After saving, enable if not already enabled
      if (!apiKeys.enabled) {
        handleToggleEnabled(true);
      } else {
        fetchProjects();
      }
    } catch (error) {
      console.error("Failed to save LangSmith API keys:", error);
      createToast({
        title: "Failed to save API keys",
        type: "error",
        description: "Could not save LangSmith API keys. Please try again.",
      });
    }
  };
  
  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const success = await LangSmithService.testConnection({
        api_key: apiKeys.api_key,
        api_url: apiKeys.api_url,
      });
      
      if (success) {
        createToast({
          title: "Connection Successful",
          type: "success",
          description: "Successfully connected to LangSmith API.",
        });
      } else {
        createToast({
          title: "Connection Failed",
          type: "error",
          description: "Could not connect to LangSmith API. Please check your credentials.",
        });
      }
    } catch (error) {
      console.error("Failed to test LangSmith connection:", error);
      createToast({
        title: "Connection Failed",
        type: "error",
        description: "Could not connect to LangSmith API. Please check your credentials.",
      });
    } finally {
      setTesting(false);
    }
  };
  
  const handleToggleEnabled = async (enabled) => {
    try {
      await LangSmithService.toggleEnabled(workspaceId, enabled);
      setApiKeys((prev) => ({ ...prev, enabled }));
      
      createToast({
        title: enabled ? "LangSmith Enabled" : "LangSmith Disabled",
        type: "success",
        description: `LangSmith integration has been ${enabled ? "enabled" : "disabled"} successfully.`,
      });
      
      if (enabled) {
        fetchProjects();
      }
    } catch (error) {
      console.error("Failed to toggle LangSmith status:", error);
      createToast({
        title: "Failed to update status",
        type: "error",
        description: `Could not ${enabled ? "enable" : "disable"} LangSmith integration. Please try again.`,
      });
    }
  };
  
  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      createToast({
        title: "Validation Error",
        type: "error",
        description: "Project name is required",
      });
      return;
    }
    
    try {
      await LangSmithService.createProject(workspaceId, newProject);
      
      createToast({
        title: "Project Created",
        type: "success",
        description: "New LangSmith project has been created successfully.",
      });
      
      setNewProject({
        name: "",
        description: "",
      });
      setShowCreateProject(false);
      fetchProjects();
    } catch (error) {
      console.error("Failed to create LangSmith project:", error);
      createToast({
        title: "Failed to create project",
        type: "error",
        description: "Could not create LangSmith project. Please try again.",
      });
    }
  };
  
  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    // Here you would fetch runs for the selected project
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner" />
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          LangSmith Integration
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Connect to LangSmith to track, monitor, and debug your LangGraph flows. 
          LangSmith provides powerful observability tools for LLM applications.
        </p>
        
        <div className="p-4 mb-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center mb-2">
            <div className={`h-4 w-4 rounded-full mr-2 ${apiKeys.enabled ? "bg-green-500" : "bg-red-500"}`}></div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Status: {apiKeys.enabled ? "Connected" : "Disconnected"}
            </h3>
          </div>
          {apiKeys.enabled && (
            <button
              onClick={() => handleToggleEnabled(false)}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Disconnect
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 gap-4 mb-6">
          <div>
            <label
              htmlFor="api_key"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              LangSmith API Key
            </label>
            <input
              type="password"
              id="api_key"
              name="api_key"
              value={apiKeys.api_key}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
              placeholder="Enter your LangSmith API key"
            />
          </div>
          
          <div>
            <label
              htmlFor="api_url"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              LangSmith API URL
            </label>
            <input
              type="text"
              id="api_url"
              name="api_url"
              value={apiKeys.api_url}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
              placeholder="https://api.smith.langchain.com"
            />
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleSubmitApiKeys}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={!apiKeys.api_key}
          >
            <FiSave className="mr-2" />
            Save Credentials
          </button>
          
          <button
            onClick={handleTestConnection}
            className="flex items-center px-4 py-2 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            disabled={!apiKeys.api_key || testing}
          >
            {testing ? (
              <div className="mr-2 h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            ) : (
              <FiRefreshCw className="mr-2" />
            )}
            Test Connection
          </button>
          
          {!apiKeys.enabled && apiKeys.api_key && (
            <button
              onClick={() => handleToggleEnabled(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <FiCheck className="mr-2" />
              Enable Integration
            </button>
          )}
        </div>
      </div>
      
      {apiKeys.enabled && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              LangSmith Projects
            </h3>
            <button
              onClick={() => setShowCreateProject(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Create New Project
            </button>
          </div>
          
          {loadingProjects ? (
            <div className="flex justify-center items-center h-32">
              <div className="loading-spinner" />
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-gray-100 dark:bg-zinc-700 rounded-lg p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No projects found in your LangSmith account.
              </p>
              <button
                onClick={() => setShowCreateProject(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Create Your First Project
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-zinc-700">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Description
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Created At
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-zinc-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {projects.map((project) => (
                    <tr 
                      key={project.id}
                      className={`cursor-pointer ${selectedProject?.id === project.id ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                      onClick={() => handleProjectSelect(project)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {project.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {project.description || "No description"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(project.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProject(project);
                            setShowRunDetails(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <FiBarChart2 className="inline-block" size={18} /> View Runs
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {/* Create Project Modal */}
      {showCreateProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Create New Project
              </h3>
              <button
                onClick={() => setShowCreateProject(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Project Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newProject.name}
                  onChange={handleNewProjectChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
                  placeholder="Enter project name"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={newProject.description}
                  onChange={handleNewProjectChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
                  placeholder="Enter project description"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateProject(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Project Runs Modal (placeholder) */}
      {showRunDetails && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl p-6 max-w-4xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Runs for "{selectedProject.name}"
              </h3>
              <button
                onClick={() => setShowRunDetails(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
              >
                ×
              </button>
            </div>
            <div className="mb-6">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                This is where run data from LangSmith would be displayed. 
                Connect this project to your LangGraph flows to start collecting runs.
              </p>
              {/* Placeholder for run data, would be fetched from LangSmith API */}
              <div className="h-64 bg-gray-100 dark:bg-zinc-700 rounded-lg flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">No runs available yet</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowRunDetails(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}