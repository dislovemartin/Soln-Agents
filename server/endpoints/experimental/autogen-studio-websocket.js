const WebSocket = require('ws');
const logger = require('../../utils/logger')();

function setupWebSocketBridge(server, autogenStudioUrl) {
  const wss = new WebSocket.Server({ noServer: true, path: '/api/experimental/autogen-studio/ws' });

  wss.on('connection', (ws, request) => {
    // Parse connection parameters
    const params = new URLSearchParams(request.url.split('?')[1] || '');
    const sessionId = params.get('sessionId');
    
    // Log connection details
    logger.info(`[WebSocket Bridge] New connection established, sessionId: ${sessionId || 'none'}`);
    
    // Connect to AutoGen Studio WebSocket
    const autogenUrl = `${autogenStudioUrl.replace('http', 'ws')}/ws${sessionId ? `?sessionId=${sessionId}` : ''}`;
    const autogenWs = new WebSocket(autogenUrl);

    // Forward messages from SolnAI to AutoGen Studio
    ws.on('message', (message) => {
      if (autogenWs.readyState === WebSocket.OPEN) {
        autogenWs.send(message);
      }
    });

    // Forward messages from AutoGen Studio to SolnAI
    autogenWs.on('message', (message) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });

    // Handle connection errors
    ws.on('error', (error) => {
      logger.error('[WebSocket Bridge] SolnAI client error:', error);
    });

    autogenWs.on('error', (error) => {
      logger.error('[WebSocket Bridge] AutoGen Studio connection error:', error);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'error', message: 'Error connecting to AutoGen Studio' }));
      }
    });

    // Handle connection close
    ws.on('close', () => {
      if (autogenWs.readyState === WebSocket.OPEN) {
        autogenWs.close();
      }
    });

    autogenWs.on('close', () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'disconnect', message: 'AutoGen Studio disconnected' }));
        ws.close();
      }
    });
  });

  return wss;
}

module.exports = { setupWebSocketBridge };