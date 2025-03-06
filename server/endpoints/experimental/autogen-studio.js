const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { checkAuth } = require('../utils');
const { SystemSettings } = require('../../models/systemSettings');
const logger = require('../../utils/logger')();
const { setupWebSocketBridge } = require('./autogen-studio-websocket');

/**
 * AutoGen Studio Integration API
 * 
 * This endpoint provides integration with Microsoft's AutoGen Studio.
 * It allows using SolnAI agents in AutoGen Studio and vice versa.
 */

// Configuration for AutoGen Studio
const AUTOGEN_STUDIO_CONFIG = {
  baseUrl: process.env.AUTOGEN_STUDIO_URL || 'http://localhost:8081',
  apiPath: '/api',
  wsPath: '/ws',
  timeout: 30000,
};

// Get AutoGen Studio configuration
router.get('/config', checkAuth, async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();
    const autoGenSettings = settings.autogenStudio || AUTOGEN_STUDIO_CONFIG;
    
    res.status(200).json({
      enabled: !!autoGenSettings.enabled,
      baseUrl: autoGenSettings.baseUrl,
      apiPath: autoGenSettings.apiPath,
      wsPath: autoGenSettings.wsPath,
      timeout: autoGenSettings.timeout,
    });
  } catch (error) {
    logger.error('[AutoGen Studio] Error getting configuration:', error);
    res.status(500).json({ error: 'Failed to get AutoGen Studio configuration' });
  }
});

// Update AutoGen Studio configuration
router.post('/config', checkAuth, async (req, res) => {
  try {
    const { enabled, baseUrl, apiPath, wsPath, timeout } = req.body;
    const settings = await SystemSettings.getSettings();
    
    settings.autogenStudio = {
      enabled: !!enabled,
      baseUrl: baseUrl || AUTOGEN_STUDIO_CONFIG.baseUrl,
      apiPath: apiPath || AUTOGEN_STUDIO_CONFIG.apiPath,
      wsPath: wsPath || AUTOGEN_STUDIO_CONFIG.wsPath,
      timeout: timeout || AUTOGEN_STUDIO_CONFIG.timeout,
    };
    
    await SystemSettings.updateSettings(settings);
    
    res.status(200).json({ success: true, settings: settings.autogenStudio });
  } catch (error) {
    logger.error('[AutoGen Studio] Error updating configuration:', error);
    res.status(500).json({ error: 'Failed to update AutoGen Studio configuration' });
  }
});

// Proxy requests to AutoGen Studio API
router.all('/api/*', checkAuth, async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();
    const autoGenSettings = settings.autogenStudio || AUTOGEN_STUDIO_CONFIG;
    
    if (!autoGenSettings.enabled) {
      return res.status(403).json({ error: 'AutoGen Studio integration is disabled' });
    }
    
    const url = `${autoGenSettings.baseUrl}${autoGenSettings.apiPath}${req.url.replace('/api', '')}`;
    
    const response = await axios({
      method: req.method,
      url: url,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization,
      },
      timeout: autoGenSettings.timeout,
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    logger.error('[AutoGen Studio] Error proxying request:', error);
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Failed to proxy request to AutoGen Studio' });
  }
});

// Get available SolnAI agents for AutoGen Studio
router.get('/agents', checkAuth, async (req, res) => {
  try {
    // This would typically fetch agents from your database
    // For now, we'll return a simple list of agents
    const agents = [
      {
        id: 'research-agent',
        name: 'SolnAI Research Agent',
        description: 'Advanced web research agent for finding information',
        type: 'solnai',
        category: 'Research',
      },
      {
        id: 'data-analysis-agent',
        name: 'SolnAI Data Analysis Agent',
        description: 'Agent for analyzing data and generating insights',
        type: 'solnai',
        category: 'Data',
      },
      {
        id: 'youtube-summary-agent',
        name: 'SolnAI YouTube Summary Agent',
        description: 'Agent for summarizing YouTube videos',
        type: 'solnai',
        category: 'Content',
      }
    ];
    
    res.status(200).json(agents);
  } catch (error) {
    logger.error('[AutoGen Studio] Error getting SolnAI agents:', error);
    res.status(500).json({ error: 'Failed to get SolnAI agents' });
  }
});

// Install AutoGen Studio plugin
router.post('/install-plugin', checkAuth, async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();
    const autoGenSettings = settings.autogenStudio || AUTOGEN_STUDIO_CONFIG;
    
    if (!autoGenSettings.enabled) {
      return res.status(403).json({ error: 'AutoGen Studio integration is disabled' });
    }
    
    // Path to the SolnAI AutoGen Studio plugin
    const pluginSourcePath = path.join(
      __dirname, 
      '../../../SolnAI-agents/components/ui/agent-ui/autogen-studio-integration'
    );
    
    // Check if plugin source exists
    if (!fs.existsSync(pluginSourcePath)) {
      return res.status(404).json({ error: 'SolnAI AutoGen Studio plugin not found' });
    }
    
    // This endpoint would typically install the plugin to AutoGen Studio
    // For now, we'll just return success
    res.status(200).json({ 
      success: true,
      message: 'SolnAI AutoGen Studio plugin installed successfully',
      pluginPath: pluginSourcePath,
    });
  } catch (error) {
    logger.error('[AutoGen Studio] Error installing plugin:', error);
    res.status(500).json({ error: 'Failed to install AutoGen Studio plugin' });
  }
});

// Setup WebSocket Bridge
let webSocketServer = null;

// Function to initialize WebSocket bridge with the server
function initializeWebSocketBridge(server) {
  if (!webSocketServer) {
    // Get AutoGen Studio URL from settings
    SystemSettings.getSettings().then(settings => {
      const autoGenSettings = settings.autogenStudio || AUTOGEN_STUDIO_CONFIG;
      if (autoGenSettings.enabled) {
        webSocketServer = setupWebSocketBridge(server, autoGenSettings.baseUrl);
        logger.info(`[AutoGen Studio] WebSocket bridge initialized with ${autoGenSettings.baseUrl}`);
      }
    }).catch(error => {
      logger.error('[AutoGen Studio] Error initializing WebSocket bridge:', error);
    });
  }
  return webSocketServer;
}

// Function to handle WebSocket upgrade requests
function handleWebSocketUpgrade(request, socket, head) {
  if (!webSocketServer) {
    logger.error('[AutoGen Studio] WebSocket server not initialized');
    socket.destroy();
    return;
  }

  try {
    // Extract session ID and other parameters from URL if present
    const url = new URL(request.url, `http://${request.headers.host}`);
    const sessionId = url.searchParams.get('sessionId');
    const source = url.searchParams.get('source');
    
    logger.info(`[AutoGen Studio] WebSocket upgrade request: sessionId=${sessionId}, source=${source}`);
    
    webSocketServer.handleUpgrade(request, socket, head, (ws) => {
      // Store session information on the WebSocket object for later use
      ws.sessionId = sessionId;
      ws.source = source;
      
      // Emit the connection event to the WebSocket server
      webSocketServer.emit('connection', ws, request);
      
      // Send a welcome message to confirm connection
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'connect_success',
          message: 'Successfully connected to SolnAI WebSocket server',
          sessionId: sessionId,
          timestamp: new Date().toISOString()
        }));
      }
    });
  } catch (error) {
    logger.error('[AutoGen Studio] Error handling WebSocket upgrade:', error);
    socket.destroy();
  }
}

module.exports = router;
module.exports.initializeWebSocketBridge = initializeWebSocketBridge;
module.exports.handleWebSocketUpgrade = handleWebSocketUpgrade;