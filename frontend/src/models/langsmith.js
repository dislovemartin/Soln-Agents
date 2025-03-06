import api from "../utils/api.js";

/**
 * Service to manage LangSmith integration
 */
const LangSmithService = {
  /**
   * Save LangSmith API keys for a workspace
   * @param {string} workspaceId - The workspace ID
   * @param {Object} data - API key data (api_key, api_url)
   * @returns {Promise<Object>} - Response with success status
   */
  async saveApiKeys(workspaceId, data) {
    try {
      const response = await api.post(`/langsmith/api-keys/${workspaceId}`, data);
      return response.data;
    } catch (error) {
      console.error("Error saving LangSmith API keys:", error);
      throw error;
    }
  },

  /**
   * Get LangSmith API keys for a workspace
   * @param {string} workspaceId - The workspace ID
   * @returns {Promise<Object>} - Response with API keys
   */
  async getApiKeys(workspaceId) {
    try {
      const response = await api.get(`/langsmith/api-keys/${workspaceId}`);
      return response.data;
    } catch (error) {
      console.error("Error getting LangSmith API keys:", error);
      throw error;
    }
  },

  /**
   * Toggle LangSmith integration status
   * @param {string} workspaceId - The workspace ID
   * @param {boolean} enabled - Enable/disable status
   * @returns {Promise<Object>} - Response with success status
   */
  async toggleEnabled(workspaceId, enabled) {
    try {
      const response = await api.put(`/langsmith/toggle/${workspaceId}`, { enabled });
      return response.data;
    } catch (error) {
      console.error("Error toggling LangSmith status:", error);
      throw error;
    }
  },

  /**
   * Test LangSmith API connection
   * @param {Object} data - API key data (api_key, api_url)
   * @returns {Promise<Object>} - Response with success status
   */
  async testConnection(data) {
    try {
      const response = await api.post("/langsmith/test-connection", data);
      return response.data.success;
    } catch (error) {
      console.error("Error testing LangSmith connection:", error);
      return false;
    }
  },

  /**
   * List projects from LangSmith
   * @param {string} workspaceId - The workspace ID
   * @returns {Promise<Object>} - Response with projects array
   */
  async listProjects(workspaceId) {
    try {
      const response = await api.get(`/langsmith/projects/${workspaceId}`);
      return response.data;
    } catch (error) {
      console.error("Error listing LangSmith projects:", error);
      throw error;
    }
  },

  /**
   * Create a new project in LangSmith
   * @param {string} workspaceId - The workspace ID
   * @param {Object} data - Project data (name, description)
   * @returns {Promise<Object>} - Response with created project
   */
  async createProject(workspaceId, data) {
    try {
      const response = await api.post(`/langsmith/projects/${workspaceId}`, data);
      return response.data;
    } catch (error) {
      console.error("Error creating LangSmith project:", error);
      throw error;
    }
  },

  /**
   * Get runs for a specific project
   * @param {string} workspaceId - The workspace ID
   * @param {string} projectId - The project ID
   * @param {number} limit - Number of runs to fetch
   * @returns {Promise<Object>} - Response with runs array
   */
  async getRuns(workspaceId, projectId, limit = 10) {
    try {
      const response = await api.get(`/langsmith/projects/${workspaceId}/${projectId}/runs`, {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error("Error getting LangSmith runs:", error);
      throw error;
    }
  },

  /**
   * Get details for a specific run
   * @param {string} workspaceId - The workspace ID
   * @param {string} runId - The run ID
   * @returns {Promise<Object>} - Response with run details
   */
  async getRunDetails(workspaceId, runId) {
    try {
      const response = await api.get(`/langsmith/runs/${workspaceId}/${runId}`);
      return response.data;
    } catch (error) {
      console.error("Error getting LangSmith run details:", error);
      throw error;
    }
  },

  /**
   * Get trace for a specific run
   * @param {string} workspaceId - The workspace ID
   * @param {string} runId - The run ID
   * @returns {Promise<Object>} - Response with run trace
   */
  async getRunTrace(workspaceId, runId) {
    try {
      const response = await api.get(`/langsmith/traces/${workspaceId}/${runId}`);
      return response.data;
    } catch (error) {
      console.error("Error getting LangSmith run trace:", error);
      throw error;
    }
  },
};

export default LangSmithService;