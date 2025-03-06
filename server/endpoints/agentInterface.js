const express = require("express");
const router = express.Router();
const { validatedRequest, flexUserRoleValid } = require("../utils/middleware");
const { AgentInterface } = require("../models/agentInterface");

router.get("/v1/agents", [validatedRequest, flexUserRoleValid], async (req, res) => {
  try {
    const agents = await AgentInterface.getAll();
    return res.status(200).json({ agents });
  } catch (error) {
    console.error("Error fetching agents:", error);
    return res.status(500).json({ error: "Failed to fetch agents" });
  }
});

router.get("/v1/agents/:agentId", [validatedRequest, flexUserRoleValid], async (req, res) => {
  try {
    const { agentId } = req.params;
    const agent = await AgentInterface.get(agentId);
    if (!agent) return res.status(404).json({ error: "Agent not found" });
    return res.status(200).json({ agent });
  } catch (error) {
    console.error("Error fetching agent:", error);
    return res.status(500).json({ error: "Failed to fetch agent" });
  }
});

router.post("/v1/agents", [validatedRequest, flexUserRoleValid], async (req, res) => {
  try {
    const { name, description, configuration } = req.body;
    if (!name) return res.status(400).json({ error: "Agent name is required" });
    
    const agent = await AgentInterface.create({
      name,
      description,
      configuration,
      createdBy: req.user.id
    });
    
    return res.status(201).json({ agent });
  } catch (error) {
    console.error("Error creating agent:", error);
    return res.status(500).json({ error: "Failed to create agent" });
  }
});

router.put("/v1/agents/:agentId", [validatedRequest, flexUserRoleValid], async (req, res) => {
  try {
    const { agentId } = req.params;
    const { name, description, configuration } = req.body;
    
    const updated = await AgentInterface.update(agentId, {
      name,
      description,
      configuration
    });
    
    if (!updated) return res.status(404).json({ error: "Agent not found" });
    return res.status(200).json({ success: true, agent: updated });
  } catch (error) {
    console.error("Error updating agent:", error);
    return res.status(500).json({ error: "Failed to update agent" });
  }
});

router.delete("/v1/agents/:agentId", [validatedRequest, flexUserRoleValid], async (req, res) => {
  try {
    const { agentId } = req.params;
    const deleted = await AgentInterface.delete(agentId);
    if (!deleted) return res.status(404).json({ error: "Agent not found" });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting agent:", error);
    return res.status(500).json({ error: "Failed to delete agent" });
  }
});

module.exports = router;