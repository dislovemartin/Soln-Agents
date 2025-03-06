const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const { LangSmithError } = require("../utils/errors");

/**
 * Service to manage LangSmith integration
 */
const LangSmithIntegrationService = {
  /**
   * Save LangSmith API keys for a workspace
   * @param {string} workspaceId - The workspace ID
   * @param {Object} data - API key data
   * @returns {Promise<Object>} - Saved API keys
   */
  async saveApiKeys(workspaceId, data) {
    const { api_key, api_url } = data;
    
    try {
      // Check if keys already exist
      const existing = await prisma.langSmithConfig.findFirst({
        where: {
          workspace_id: workspaceId,
        },
      });
      
      if (existing) {
        // Update existing keys
        return await prisma.langSmithConfig.update({
          where: {
            id: existing.id,
          },
          data: {
            api_key,
            api_url: api_url || "https://api.smith.langchain.com",
            updated_at: new Date(),
          },
        });
      } else {
        // Create new keys
        return await prisma.langSmithConfig.create({
          data: {
            id: uuidv4(),
            workspace_id: workspaceId,
            api_key,
            api_url: api_url || "https://api.smith.langchain.com",
            enabled: true,
            updated_at: new Date(),
          },
        });
      }
    } catch (error) {
      console.error("Error saving LangSmith API keys:", error);
      throw new LangSmithError("Failed to save LangSmith API keys");
    }
  },

  /**
   * Get LangSmith API keys for a workspace
   * @param {string} workspaceId - The workspace ID
   * @returns {Promise<Object>} - API keys
   */
  async getApiKeys(workspaceId) {
    try {
      const config = await prisma.langSmithConfig.findFirst({
        where: {
          workspace_id: workspaceId,
        },
      });
      
      if (!config) {
        return null;
      }
      
      return {
        api_key: config.api_key,
        api_url: config.api_url,
        enabled: config.enabled,
      };
    } catch (error) {
      console.error("Error getting LangSmith API keys:", error);
      throw new LangSmithError("Failed to get LangSmith API keys");
    }
  },

  /**
   * Toggle LangSmith integration status
   * @param {string} workspaceId - The workspace ID
   * @param {boolean} enabled - Enable/disable status
   * @returns {Promise<Object>} - Updated config
   */
  async toggleEnabled(workspaceId, enabled) {
    try {
      const config = await prisma.langSmithConfig.findFirst({
        where: {
          workspace_id: workspaceId,
        },
      });
      
      if (!config) {
        throw new LangSmithError("LangSmith configuration not found");
      }
      
      return await prisma.langSmithConfig.update({
        where: {
          id: config.id,
        },
        data: {
          enabled,
          updated_at: new Date(),
        },
      });
    } catch (error) {
      console.error("Error toggling LangSmith status:", error);
      throw new LangSmithError("Failed to toggle LangSmith status");
    }
  },

  /**
   * Test LangSmith API connection
   * @param {string} apiKey - The API key
   * @param {string} apiUrl - The API URL
   * @returns {Promise<boolean>} - Success status
   */
  async testConnection(apiKey, apiUrl) {
    try {
      const response = await axios.get(`${apiUrl}/api/projects`, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
      });
      
      return response.status === 200;
    } catch (error) {
      console.error("Error testing LangSmith connection:", error);
      return false;
    }
  },

  /**
   * List projects from LangSmith
   * @param {string} workspaceId - The workspace ID
   * @returns {Promise<Array>} - Array of projects
   */
  async listProjects(workspaceId) {
    try {
      const config = await this.getApiKeys(workspaceId);
      
      if (!config || !config.enabled) {
        throw new LangSmithError("LangSmith is not configured or enabled");
      }
      
      const response = await axios.get(`${config.api_url}/api/projects`, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": config.api_key,
        },
      });
      
      return response.data;
    } catch (error) {
      console.error("Error listing LangSmith projects:", error);
      throw new LangSmithError("Failed to list LangSmith projects");
    }
  },

  /**
   * Create a new project in LangSmith
   * @param {string} workspaceId - The workspace ID
   * @param {string} projectName - The project name
   * @param {string} description - The project description
   * @returns {Promise<Object>} - Created project
   */
  async createProject(workspaceId, projectName, description) {
    try {
      const config = await this.getApiKeys(workspaceId);
      
      if (!config || !config.enabled) {
        throw new LangSmithError("LangSmith is not configured or enabled");
      }
      
      const response = await axios.post(
        `${config.api_url}/api/projects`,
        {
          name: projectName,
          description: description || "",
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": config.api_key,
          },
        }
      );
      
      return response.data;
    } catch (error) {
      console.error("Error creating LangSmith project:", error);
      throw new LangSmithError("Failed to create LangSmith project");
    }
  },

  /**
   * Get runs for a specific project from LangSmith
   * @param {string} workspaceId - The workspace ID
   * @param {string} projectId - The project ID
   * @param {number} limit - Number of runs to fetch
   * @returns {Promise<Array>} - Array of runs
   */
  async getRuns(workspaceId, projectId, limit = 10) {
    try {
      const config = await this.getApiKeys(workspaceId);
      
      if (!config || !config.enabled) {
        throw new LangSmithError("LangSmith is not configured or enabled");
      }
      
      const response = await axios.get(
        `${config.api_url}/api/runs`,
        {
          params: {
            project_id: projectId,
            limit,
          },
          headers: {
            "Content-Type": "application/json",
            "x-api-key": config.api_key,
          },
        }
      );
      
      return response.data;
    } catch (error) {
      console.error("Error getting LangSmith runs:", error);
      throw new LangSmithError("Failed to get LangSmith runs");
    }
  },

  /**
   * Get details for a specific run
   * @param {string} workspaceId - The workspace ID
   * @param {string} runId - The run ID
   * @returns {Promise<Object>} - Run details
   */
  async getRunDetails(workspaceId, runId) {
    try {
      const config = await this.getApiKeys(workspaceId);
      
      if (!config || !config.enabled) {
        throw new LangSmithError("LangSmith is not configured or enabled");
      }
      
      const response = await axios.get(
        `${config.api_url}/api/runs/${runId}`,
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": config.api_key,
          },
        }
      );
      
      return response.data;
    } catch (error) {
      console.error("Error getting LangSmith run details:", error);
      throw new LangSmithError("Failed to get LangSmith run details");
    }
  },

  /**
   * Get trace for a specific run
   * @param {string} workspaceId - The workspace ID
   * @param {string} runId - The run ID
   * @returns {Promise<Object>} - Run trace
   */
  async getRunTrace(workspaceId, runId) {
    try {
      const config = await this.getApiKeys(workspaceId);
      
      if (!config || !config.enabled) {
        throw new LangSmithError("LangSmith is not configured or enabled");
      }
      
      const response = await axios.get(
        `${config.api_url}/api/traces/${runId}`,
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": config.api_key,
          },
        }
      );
      
      return response.data;
    } catch (error) {
      console.error("Error getting LangSmith run trace:", error);
      throw new LangSmithError("Failed to get LangSmith run trace");
    }
  },
};

module.exports = LangSmithIntegrationService;