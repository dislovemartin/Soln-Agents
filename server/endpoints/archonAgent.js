const express = require("express");
const router = express.Router();
const { validatedRequest, flexUserRoleValid } = require("../utils/middleware");
const archonHandler = require("../utils/agents/archon-handler");
const { Telemetry } = require("../utils/telemetry");

router.get("/archon/status", [validatedRequest, flexUserRoleValid], async (req, res) => {
  try {
    const isInstalled = await archonHandler.isInstalled();
    return res.status(200).json({ 
      success: true,
      isInstalled,
      message: isInstalled ? 
        "Archon is properly installed and available" : 
        "Archon is not properly installed. Please check the installation path."
    });
  } catch (error) {
    console.error("Error checking Archon status:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to check Archon status" 
    });
  }
});

router.post("/archon/sessions", [validatedRequest, flexUserRoleValid], async (req, res) => {
  try {
    const { config = {} } = req.body;
    const userId = req.user.id;
    
    // Merge user-provided config with defaults and user info
    const sessionConfig = {
      ...config,
      userId
    };
    
    // Create the session
    const result = await archonHandler.createSession(sessionConfig);
    
    if (result.success) {
      // Log telemetry
      Telemetry.sendTelemetry("archon_session_created", {
        user_id: userId,
        success: true
      });
    }
    
    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error("Error creating Archon session:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to create Archon session" 
    });
  }
});

router.post("/archon/sessions/:sessionId/messages", [validatedRequest], async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        success: false, 
        error: "Message is required" 
      });
    }
    
    const result = await archonHandler.sendMessage(sessionId, message);
    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error("Error sending message to Archon:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to send message to Archon" 
    });
  }
});

router.delete("/archon/sessions/:sessionId", [validatedRequest], async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await archonHandler.endSession(sessionId);
    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error("Error ending Archon session:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to end Archon session" 
    });
  }
});

router.get("/archon/sessions", [validatedRequest, flexUserRoleValid], async (req, res) => {
  try {
    const result = await archonHandler.listSessions();
    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error("Error listing Archon sessions:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to list Archon sessions" 
    });
  }
});

router.get("/archon/sessions/:sessionId", [validatedRequest], async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await archonHandler.getSessionInfo(sessionId);
    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error("Error getting Archon session info:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to get Archon session info" 
    });
  }
});

// Cleanup all Archon sessions (admin only)
router.post("/archon/cleanup", [validatedRequest, flexUserRoleValid], async (req, res) => {
  try {
    // Only allow admins to clean up all sessions
    if (req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Only admins can clean up all Archon sessions" 
      });
    }
    
    const result = await archonHandler.cleanup();
    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error("Error cleaning up Archon sessions:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to clean up Archon sessions" 
    });
  }
});

module.exports = router;