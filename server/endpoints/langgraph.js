const express = require("express");
const router = express.Router();
const { reqBody, validateUser, checkHasWorkspaceAuth } = require("./utils");
const LangGraphFlowsService = require("../models/langgraphFlows");

// List all LangGraph flows for a workspace
router.get(
  "/flows/:workspaceId",
  validateUser,
  checkHasWorkspaceAuth,
  async (req, res) => {
    try {
      const flows = await LangGraphFlowsService.list(req.params.workspaceId);
      return res.status(200).json({ flows });
    } catch (error) {
      console.error("[LangGraph] Error listing flows:", error);
      return res.status(500).json({ error: "Failed to list LangGraph flows" });
    }
  }
);

// Create a new LangGraph flow
router.post(
  "/flows",
  validateUser,
  checkHasWorkspaceAuth,
  reqBody(["name", "definition", "workspace_id"]),
  async (req, res) => {
    try {
      const { name, description, definition, workspace_id } = req.body;
      const flow = await LangGraphFlowsService.create({
        name,
        description,
        definition,
        workspace_id,
        created_by: req.user.id.toString(),
      });
      return res.status(201).json({ flow });
    } catch (error) {
      console.error("[LangGraph] Error creating flow:", error);
      return res.status(500).json({ error: "Failed to create LangGraph flow" });
    }
  }
);

// Get a specific LangGraph flow
router.get(
  "/flows/detail/:flowId",
  validateUser,
  async (req, res) => {
    try {
      const flow = await LangGraphFlowsService.get(req.params.flowId);
      return res.status(200).json({ flow });
    } catch (error) {
      console.error("[LangGraph] Error getting flow:", error);
      return res.status(500).json({ error: "Failed to get LangGraph flow" });
    }
  }
);

// Update a LangGraph flow
router.put(
  "/flows/:flowId",
  validateUser,
  reqBody(["name", "definition"]),
  async (req, res) => {
    try {
      const { name, description, definition, enabled } = req.body;
      const flow = await LangGraphFlowsService.update(req.params.flowId, {
        name,
        description,
        definition,
        enabled,
      });
      return res.status(200).json({ flow });
    } catch (error) {
      console.error("[LangGraph] Error updating flow:", error);
      return res.status(500).json({ error: "Failed to update LangGraph flow" });
    }
  }
);

// Delete a LangGraph flow
router.delete(
  "/flows/:flowId",
  validateUser,
  async (req, res) => {
    try {
      await LangGraphFlowsService.delete(req.params.flowId);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("[LangGraph] Error deleting flow:", error);
      return res.status(500).json({ error: "Failed to delete LangGraph flow" });
    }
  }
);

// Toggle a LangGraph flow's enabled status
router.put(
  "/flows/:flowId/toggle",
  validateUser,
  reqBody(["enabled"]),
  async (req, res) => {
    try {
      const { enabled } = req.body;
      const flow = await LangGraphFlowsService.toggleEnabled(
        req.params.flowId,
        enabled
      );
      return res.status(200).json({ flow });
    } catch (error) {
      console.error("[LangGraph] Error toggling flow:", error);
      return res.status(500).json({ error: "Failed to toggle LangGraph flow" });
    }
  }
);

// Execute a LangGraph flow
router.post(
  "/flows/:flowId/execute",
  validateUser,
  checkHasWorkspaceAuth,
  reqBody(["inputs"]),
  async (req, res) => {
    try {
      const { inputs } = req.body;
      const flow = await LangGraphFlowsService.get(req.params.flowId);
      
      if (!flow.enabled) {
        return res.status(400).json({ error: "LangGraph flow is disabled" });
      }
      
      // This would typically call the Python LangGraph execution service
      // For now, we'll just return a mock response
      const outputs = {
        result: "Mock execution result",
        metadata: {
          execution_time: 1.2,
          tokens_used: 250,
        },
      };
      
      const traces = {
        // Trace information would go here
      };
      
      // Record the run
      const run = await LangGraphFlowsService.recordRun(
        req.params.flowId,
        req.user.id.toString(),
        inputs,
        outputs,
        traces
      );
      
      return res.status(200).json({ outputs, run_id: run.id });
    } catch (error) {
      console.error("[LangGraph] Error executing flow:", error);
      return res.status(500).json({ error: "Failed to execute LangGraph flow" });
    }
  }
);

// Get run history for a LangGraph flow
router.get(
  "/flows/:flowId/runs",
  validateUser,
  async (req, res) => {
    try {
      const { limit } = req.query;
      const runs = await LangGraphFlowsService.getRunHistory(
        req.params.flowId,
        limit ? parseInt(limit) : 10
      );
      return res.status(200).json({ runs });
    } catch (error) {
      console.error("[LangGraph] Error getting run history:", error);
      return res.status(500).json({ error: "Failed to get LangGraph run history" });
    }
  }
);

// Track metrics for a LangGraph run
router.post(
  "/runs/:runId/metrics",
  validateUser,
  reqBody(["metrics"]),
  async (req, res) => {
    try {
      const { metrics } = req.body;
      const updatedRun = await LangGraphFlowsService.trackMetrics(
        req.params.runId,
        metrics
      );
      return res.status(200).json({ run: updatedRun });
    } catch (error) {
      console.error("[LangGraph] Error tracking metrics:", error);
      return res.status(500).json({ error: "Failed to track LangGraph metrics" });
    }
  }
);

module.exports = router;