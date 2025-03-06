import api from "../utils/api.js";

/**
 * Service to manage LangGraph flows
 */
const LangGraphService = {
  /**
   * List all LangGraph flows for a workspace
   * @param {string} workspaceId - The workspace ID
   * @returns {Promise<Object>} - Response with flows array
   */
  async listFlows(workspaceId) {
    try {
      const response = await api.get(`/langgraph/flows/${workspaceId}`);
      return response.data;
    } catch (error) {
      console.error("Error listing LangGraph flows:", error);
      throw error;
    }
  },

  /**
   * Create a new LangGraph flow
   * @param {Object} data - Flow data (name, description, definition, workspace_id)
   * @returns {Promise<Object>} - Response with created flow
   */
  async createFlow(data) {
    try {
      const response = await api.post("/langgraph/flows", data);
      return response.data;
    } catch (error) {
      console.error("Error creating LangGraph flow:", error);
      throw error;
    }
  },

  /**
   * Get a specific LangGraph flow
   * @param {string} flowId - The flow ID
   * @returns {Promise<Object>} - Response with flow details
   */
  async getFlow(flowId) {
    try {
      const response = await api.get(`/langgraph/flows/detail/${flowId}`);
      return response.data;
    } catch (error) {
      console.error("Error getting LangGraph flow:", error);
      throw error;
    }
  },

  /**
   * Update a LangGraph flow
   * @param {string} flowId - The flow ID
   * @param {Object} data - Updated flow data (name, description, definition)
   * @returns {Promise<Object>} - Response with updated flow
   */
  async updateFlow(flowId, data) {
    try {
      const response = await api.put(`/langgraph/flows/${flowId}`, data);
      return response.data;
    } catch (error) {
      console.error("Error updating LangGraph flow:", error);
      throw error;
    }
  },

  /**
   * Delete a LangGraph flow
   * @param {string} flowId - The flow ID
   * @returns {Promise<Object>} - Response with success status
   */
  async deleteFlow(flowId) {
    try {
      const response = await api.delete(`/langgraph/flows/${flowId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting LangGraph flow:", error);
      throw error;
    }
  },

  /**
   * Toggle a LangGraph flow's enabled status
   * @param {string} flowId - The flow ID
   * @param {boolean} enabled - Enable/disable status
   * @returns {Promise<Object>} - Response with updated flow
   */
  async toggleFlow(flowId, enabled) {
    try {
      const response = await api.put(`/langgraph/flows/${flowId}/toggle`, { enabled });
      return response.data;
    } catch (error) {
      console.error("Error toggling LangGraph flow:", error);
      throw error;
    }
  },

  /**
   * Execute a LangGraph flow
   * @param {string} flowId - The flow ID
   * @param {Object} inputs - The inputs to the flow
   * @returns {Promise<Object>} - Response with execution results
   */
  async executeFlow(flowId, inputs) {
    try {
      const response = await api.post(`/langgraph/flows/${flowId}/execute`, { inputs });
      return response.data;
    } catch (error) {
      console.error("Error executing LangGraph flow:", error);
      throw error;
    }
  },

  /**
   * Get run history for a LangGraph flow
   * @param {string} flowId - The flow ID
   * @param {number} limit - Number of runs to fetch
   * @returns {Promise<Object>} - Response with runs array
   */
  async getRunHistory(flowId, limit = 10) {
    try {
      const response = await api.get(`/langgraph/flows/${flowId}/runs`, {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error("Error getting LangGraph run history:", error);
      throw error;
    }
  },

  /**
   * Track metrics for a LangGraph run
   * @param {string} runId - The run ID
   * @param {Object} metrics - The metrics to track
   * @returns {Promise<Object>} - Response with updated run
   */
  async trackMetrics(runId, metrics) {
    try {
      const response = await api.post(`/langgraph/runs/${runId}/metrics`, { metrics });
      return response.data;
    } catch (error) {
      console.error("Error tracking LangGraph metrics:", error);
      throw error;
    }
  },
};

export default LangGraphService;