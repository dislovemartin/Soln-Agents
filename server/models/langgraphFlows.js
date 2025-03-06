const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");
const { embedVector } = require("../utils/embeddings");
const { LangGraphError } = require("../utils/errors");

/**
 * Service to manage LangGraph flows in the system
 */
const LangGraphFlowsService = {
  /**
   * List all LangGraph flows for a workspace
   * @param {string} workspaceId - The workspace ID
   * @returns {Promise<Array>} - Array of flows
   */
  async list(workspaceId) {
    return await prisma.langGraphFlows.findMany({
      where: {
        workspace_id: workspaceId,
      },
      orderBy: {
        updated_at: "desc",
      },
    });
  },

  /**
   * Create a new LangGraph flow
   * @param {Object} data - Flow data
   * @returns {Promise<Object>} - Created flow
   */
  async create(data) {
    const { name, description, definition, workspace_id, created_by } = data;
    
    try {
      return await prisma.langGraphFlows.create({
        data: {
          id: uuidv4(),
          name,
          description,
          definition,
          workspace_id,
          created_by,
          enabled: true,
          updated_at: new Date(),
        },
      });
    } catch (error) {
      console.error("Error creating LangGraph flow:", error);
      throw new LangGraphError("Failed to create LangGraph flow");
    }
  },

  /**
   * Get a specific LangGraph flow
   * @param {string} flowId - The flow ID
   * @returns {Promise<Object>} - Flow details
   */
  async get(flowId) {
    const flow = await prisma.langGraphFlows.findUnique({
      where: {
        id: flowId,
      },
    });
    
    if (!flow) {
      throw new LangGraphError("LangGraph flow not found");
    }
    
    return flow;
  },

  /**
   * Update a LangGraph flow
   * @param {string} flowId - The flow ID
   * @param {Object} data - Updated flow data
   * @returns {Promise<Object>} - Updated flow
   */
  async update(flowId, data) {
    const { name, description, definition, enabled } = data;
    
    try {
      return await prisma.langGraphFlows.update({
        where: {
          id: flowId,
        },
        data: {
          name,
          description,
          definition,
          enabled,
          updated_at: new Date(),
        },
      });
    } catch (error) {
      console.error("Error updating LangGraph flow:", error);
      throw new LangGraphError("Failed to update LangGraph flow");
    }
  },

  /**
   * Delete a LangGraph flow
   * @param {string} flowId - The flow ID
   * @returns {Promise<Object>} - Deleted flow
   */
  async delete(flowId) {
    try {
      // First delete any run history
      await prisma.langGraphRunHistory.deleteMany({
        where: {
          flow_id: flowId,
        },
      });
      
      // Then delete the flow
      return await prisma.langGraphFlows.delete({
        where: {
          id: flowId,
        },
      });
    } catch (error) {
      console.error("Error deleting LangGraph flow:", error);
      throw new LangGraphError("Failed to delete LangGraph flow");
    }
  },

  /**
   * Toggle a LangGraph flow's enabled status
   * @param {string} flowId - The flow ID
   * @param {boolean} enabled - Enable/disable status
   * @returns {Promise<Object>} - Updated flow
   */
  async toggleEnabled(flowId, enabled) {
    try {
      return await prisma.langGraphFlows.update({
        where: {
          id: flowId,
        },
        data: {
          enabled,
          updated_at: new Date(),
        },
      });
    } catch (error) {
      console.error("Error toggling LangGraph flow:", error);
      throw new LangGraphError("Failed to toggle LangGraph flow status");
    }
  },

  /**
   * Record a new run of a LangGraph flow
   * @param {string} flowId - The flow ID
   * @param {string} userId - The user ID who initiated the run
   * @param {Object} inputs - The inputs to the flow
   * @param {Object} outputs - The outputs from the flow
   * @param {Object} traces - The trace information
   * @returns {Promise<Object>} - Created run history
   */
  async recordRun(flowId, userId, inputs, outputs, traces) {
    try {
      return await prisma.langGraphRunHistory.create({
        data: {
          id: uuidv4(),
          flow_id: flowId,
          user_id: userId,
          inputs: JSON.stringify(inputs),
          outputs: JSON.stringify(outputs),
          traces: JSON.stringify(traces),
          status: "completed",
          created_at: new Date(),
        },
      });
    } catch (error) {
      console.error("Error recording LangGraph run:", error);
      throw new LangGraphError("Failed to record LangGraph run");
    }
  },

  /**
   * Get run history for a LangGraph flow
   * @param {string} flowId - The flow ID
   * @param {number} limit - Number of runs to fetch
   * @returns {Promise<Array>} - Array of run history
   */
  async getRunHistory(flowId, limit = 10) {
    try {
      return await prisma.langGraphRunHistory.findMany({
        where: {
          flow_id: flowId,
        },
        orderBy: {
          created_at: "desc",
        },
        take: limit,
      });
    } catch (error) {
      console.error("Error fetching LangGraph run history:", error);
      throw new LangGraphError("Failed to fetch LangGraph run history");
    }
  },

  /**
   * Track metrics for a LangGraph run
   * @param {string} runId - The run ID
   * @param {Object} metrics - The metrics to track
   * @returns {Promise<Object>} - Updated run history
   */
  async trackMetrics(runId, metrics) {
    try {
      const run = await prisma.langGraphRunHistory.findUnique({
        where: {
          id: runId,
        },
      });
      
      if (!run) {
        throw new LangGraphError("LangGraph run not found");
      }
      
      const existingMetrics = run.metrics ? JSON.parse(run.metrics) : {};
      const updatedMetrics = { ...existingMetrics, ...metrics };
      
      return await prisma.langGraphRunHistory.update({
        where: {
          id: runId,
        },
        data: {
          metrics: JSON.stringify(updatedMetrics),
        },
      });
    } catch (error) {
      console.error("Error tracking LangGraph metrics:", error);
      throw new LangGraphError("Failed to track LangGraph metrics");
    }
  },
};

module.exports = LangGraphFlowsService;