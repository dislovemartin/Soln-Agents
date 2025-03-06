const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configure CORS
app.use(cors({
  origin: process.env.SOLNAI_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add basic auth middleware if needed
app.use((req, res, next) => {
  // You can add authentication logic here
  next();
});

// Proxy API requests to AutoGen Studio
app.use('/api/autogenstudio', createProxyMiddleware({
  target: process.env.AUTOGEN_API_URL || 'http://localhost:8081',
  changeOrigin: true,
  pathRewrite: {
    '^/api/autogenstudio': '/api' // Rewrite path
  },
  onProxyReq: (proxyReq, req, res) => {
    // Transform request if needed
    console.log(`Proxying ${req.method} request to: ${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Transform response if needed
  }
}));

// Proxy WebSocket requests
app.use('/ws/autogenstudio', createProxyMiddleware({
  target: process.env.AUTOGEN_WS_URL || 'ws://localhost:8081',
  ws: true,
  changeOrigin: true,
  pathRewrite: {
    '^/ws/autogenstudio': '/ws' // Rewrite path
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`AutoGen Proxy server running on port ${PORT}`);
});
