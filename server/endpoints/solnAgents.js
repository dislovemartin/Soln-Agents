const express = require("express");
const router = express.Router();
const { validatedRequest, flexUserRoleValid } = require("../utils/middleware");
const solnAgentsAdapter = require("../utils/agents/soln-agents-adapter");
const { Telemetry } = require("../utils/telemetry");

// List all available agents
router.get("/solnAgents", [validatedRequest, flexUserRoleValid], async (req, res) => {
  try {
    const result = await solnAgentsAdapter.listAvailableAgents();
    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error("Error listing SolnAI agents:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to list SolnAI agents" 
    });
  }
});

// Create a new agent session
router.post("/solnAgents/sessions", [validatedRequest], async (req, res) => {
  try {
    const { agentId, config = {} } = req.body;
    
    if (!agentId) {
      return res.status(400).json({ 
        success: false, 
        error: "Agent ID is required" 
      });
    }
    
    // Add user info to config
    const sessionConfig = {
      ...config,
      userId: req.user.id,
      username: req.user.username
    };
    
    const result = await solnAgentsAdapter.createSession(agentId, sessionConfig);
    
    if (result.success) {
      // Log telemetry
      Telemetry.sendTelemetry("solnai_agent_session_created", {
        user_id: req.user.id,
        agent_id: agentId,
        agent_type: result.agentType,
        success: true
      });
    }
    
    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error("Error creating SolnAI agent session:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to create SolnAI agent session" 
    });
  }
});

// Send a message to an agent session
router.post("/solnAgents/sessions/:sessionId/messages", [validatedRequest], async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        success: false, 
        error: "Message is required" 
      });
    }
    
    const result = await solnAgentsAdapter.sendMessage(sessionId, message);
    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error("Error sending message to SolnAI agent:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to send message to SolnAI agent" 
    });
  }
});

// End an agent session
router.delete("/solnAgents/sessions/:sessionId", [validatedRequest], async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await solnAgentsAdapter.endSession(sessionId);
    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error("Error ending SolnAI agent session:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to end SolnAI agent session" 
    });
  }
});

// List all active agent sessions
router.get("/solnAgents/sessions", [validatedRequest, flexUserRoleValid], async (req, res) => {
  try {
    const result = await solnAgentsAdapter.listSessions();
    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error("Error listing SolnAI agent sessions:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to list SolnAI agent sessions" 
    });
  }
});

// Get info about a specific session
router.get("/solnAgents/sessions/:sessionId", [validatedRequest], async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await solnAgentsAdapter.getSessionInfo(sessionId);
    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error("Error getting SolnAI agent session info:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to get SolnAI agent session info" 
    });
  }
});

// Clean up all agent sessions (admin only)
router.post("/solnAgents/cleanup", [validatedRequest, flexUserRoleValid], async (req, res) => {
  try {
    // Only allow admins to clean up all sessions
    if (req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Only admins can clean up all SolnAI agent sessions" 
      });
    }
    
    const result = await solnAgentsAdapter.cleanup();
    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error("Error cleaning up SolnAI agent sessions:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to clean up SolnAI agent sessions" 
    });
  }
});

module.exports = router;