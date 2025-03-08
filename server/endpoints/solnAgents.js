const express = require("express");
const router = express.Router();
const { validatedRequest, flexUserRoleValid } = require("../utils/middleware");
const solnAgentsAdapter = require("../utils/agents/soln-agents-adapter");
const { Telemetry } = require("../utils/telemetry");
const { AgentExecutionHistory } = require("../models/agentExecutionHistory");
const logger = require("../utils/logger")();

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
    
    // Get start time for performance tracking
    const startTime = Date.now();
    
    // Get session info for recording
    let sessionInfo = null;
    try {
      sessionInfo = await solnAgentsAdapter.getSessionInfo(sessionId);
    } catch (error) {
      logger.warn(`Failed to get session info for metrics: ${error.message}`);
    }
    
    // Send message to agent
    const result = await solnAgentsAdapter.sendMessage(sessionId, message);
    
    // Calculate execution time
    const executionTime = Date.now() - startTime;
    
    // Record metrics only if we have session info
    if (sessionInfo && sessionInfo.success) {
      try {
        // Extract agent info
        const agentType = sessionInfo.type || "unknown";
        let agentId = sessionInfo.agentId || sessionId;
        
        // Create execution record
        await AgentExecutionHistory.create({
          agentId,
          agentType,
          agentName: sessionInfo.agentName || "Unknown Agent",
          workspaceId: null, // Optional integration with workspaces
          userId: req.user?.id || null,
          executionTime,
          prompt: message,
          result: result.success ? (
            typeof result.data === 'object' ? JSON.stringify(result.data) : String(result.data)
          ) : null,
          status: result.success ? "success" : "error",
          error: result.success ? null : (result.error || "Unknown error"),
          metadata: JSON.stringify({
            sessionId,
            timestamp: new Date().toISOString(),
            sessionType: sessionInfo.type,
          })
        });
        
        logger.info(`Recorded metrics for agent ${agentId}, execution time: ${executionTime}ms`);
      } catch (recordError) {
        logger.error(`Failed to record agent metrics: ${recordError.message}`);
      }
    }
    
    // Send telemetry data
    Telemetry.sendTelemetry("solnai_agent_message", {
      user_id: req.user?.id,
      agent_id: sessionInfo?.agentId || sessionId,
      execution_time: executionTime,
      success: result.success
    });
    
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

// Get agent metrics and analytics
router.get("/solnAgents/metrics", [validatedRequest, flexUserRoleValid], async (req, res) => {
  try {
    const { agentId, agentType, startDate, endDate, limit = 100 } = req.query;
    
    // Apply filters
    const filters = {};
    if (agentId) filters.agentId = agentId;
    if (agentType) filters.agentType = agentType;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    
    // Get time series data
    const timeSeriesData = await AgentExecutionHistory.getTimeSeriesData(filters);
    
    // Get agent stats
    const stats = await AgentExecutionHistory.getAgentStats(filters);
    
    // Get recent executions
    const executions = await AgentExecutionHistory.findRecent(parseInt(limit, 10));
    
    return res.status(200).json({
      success: true,
      metrics: {
        timeSeries: timeSeriesData,
        stats,
        recentExecutions: executions,
      }
    });
  } catch (error) {
    logger.error("Error getting agent metrics:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to get agent metrics" 
    });
  }
});

// Get agent execution history
router.get("/solnAgents/metrics/:agentId", [validatedRequest], async (req, res) => {
  try {
    const { agentId } = req.params;
    const { limit = 100 } = req.query;
    
    const executions = await AgentExecutionHistory.findByAgentId(agentId, parseInt(limit, 10));
    
    return res.status(200).json({
      success: true,
      executions
    });
  } catch (error) {
    logger.error(`Error getting execution history for agent ${req.params.agentId}:`, error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to get agent execution history" 
    });
  }
});

module.exports = router;