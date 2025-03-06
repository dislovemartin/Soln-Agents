const express = require("express");
const router = express.Router();
const { reqBody, validateUser, checkHasWorkspaceAuth } = require("./utils");
const LangSmithIntegrationService = require("../models/langsmithIntegration");

// Save LangSmith API keys
router.post(
  "/api-keys/:workspaceId",
  validateUser,
  checkHasWorkspaceAuth,
  reqBody(["api_key"]),
  async (req, res) => {
    try {
      const { api_key, api_url } = req.body;
      const config = await LangSmithIntegrationService.saveApiKeys(
        req.params.workspaceId,
        { api_key, api_url }
      );
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("[LangSmith] Error saving API keys:", error);
      return res.status(500).json({ error: "Failed to save LangSmith API keys" });
    }
  }
);

// Get LangSmith API keys
router.get(
  "/api-keys/:workspaceId",
  validateUser,
  checkHasWorkspaceAuth,
  async (req, res) => {
    try {
      const config = await LangSmithIntegrationService.getApiKeys(
        req.params.workspaceId
      );
      return res.status(200).json({ config });
    } catch (error) {
      console.error("[LangSmith] Error getting API keys:", error);
      return res.status(500).json({ error: "Failed to get LangSmith API keys" });
    }
  }
);

// Toggle LangSmith enabled status
router.put(
  "/toggle/:workspaceId",
  validateUser,
  checkHasWorkspaceAuth,
  reqBody(["enabled"]),
  async (req, res) => {
    try {
      const { enabled } = req.body;
      await LangSmithIntegrationService.toggleEnabled(
        req.params.workspaceId,
        enabled
      );
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("[LangSmith] Error toggling status:", error);
      return res.status(500).json({ error: "Failed to toggle LangSmith status" });
    }
  }
);

// Test LangSmith API connection
router.post(
  "/test-connection",
  validateUser,
  reqBody(["api_key"]),
  async (req, res) => {
    try {
      const { api_key, api_url } = req.body;
      const success = await LangSmithIntegrationService.testConnection(
        api_key,
        api_url || "https://api.smith.langchain.com"
      );
      return res.status(200).json({ success });
    } catch (error) {
      console.error("[LangSmith] Error testing connection:", error);
      return res.status(500).json({ error: "Failed to test LangSmith connection" });
    }
  }
);

// List LangSmith projects
router.get(
  "/projects/:workspaceId",
  validateUser,
  checkHasWorkspaceAuth,
  async (req, res) => {
    try {
      const projects = await LangSmithIntegrationService.listProjects(
        req.params.workspaceId
      );
      return res.status(200).json({ projects });
    } catch (error) {
      console.error("[LangSmith] Error listing projects:", error);
      return res.status(500).json({ error: "Failed to list LangSmith projects" });
    }
  }
);

// Create a new LangSmith project
router.post(
  "/projects/:workspaceId",
  validateUser,
  checkHasWorkspaceAuth,
  reqBody(["name"]),
  async (req, res) => {
    try {
      const { name, description } = req.body;
      const project = await LangSmithIntegrationService.createProject(
        req.params.workspaceId,
        name,
        description
      );
      return res.status(201).json({ project });
    } catch (error) {
      console.error("[LangSmith] Error creating project:", error);
      return res.status(500).json({ error: "Failed to create LangSmith project" });
    }
  }
);

// Get runs for a specific project
router.get(
  "/projects/:workspaceId/:projectId/runs",
  validateUser,
  checkHasWorkspaceAuth,
  async (req, res) => {
    try {
      const { limit } = req.query;
      const runs = await LangSmithIntegrationService.getRuns(
        req.params.workspaceId,
        req.params.projectId,
        limit ? parseInt(limit) : 10
      );
      return res.status(200).json({ runs });
    } catch (error) {
      console.error("[LangSmith] Error getting runs:", error);
      return res.status(500).json({ error: "Failed to get LangSmith runs" });
    }
  }
);

// Get details for a specific run
router.get(
  "/runs/:workspaceId/:runId",
  validateUser,
  checkHasWorkspaceAuth,
  async (req, res) => {
    try {
      const run = await LangSmithIntegrationService.getRunDetails(
        req.params.workspaceId,
        req.params.runId
      );
      return res.status(200).json({ run });
    } catch (error) {
      console.error("[LangSmith] Error getting run details:", error);
      return res.status(500).json({ error: "Failed to get LangSmith run details" });
    }
  }
);

// Get trace for a specific run
router.get(
  "/traces/:workspaceId/:runId",
  validateUser,
  checkHasWorkspaceAuth,
  async (req, res) => {
    try {
      const trace = await LangSmithIntegrationService.getRunTrace(
        req.params.workspaceId,
        req.params.runId
      );
      return res.status(200).json({ trace });
    } catch (error) {
      console.error("[LangSmith] Error getting run trace:", error);
      return res.status(500).json({ error: "Failed to get LangSmith run trace" });
    }
  }
);

module.exports = router;