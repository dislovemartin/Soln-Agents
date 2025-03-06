# Setting Up the AutoGen Studio Proxy for SolnAI

This guide explains how to set up a proxy server to connect your SolnAI Agent UI with AutoGen Studio.

## Why a Proxy?

A proxy service helps solve several integration challenges:

1. **CORS Issues**: Prevents cross-origin resource sharing problems
2. **Authentication**: Centralizes auth between both systems
3. **Data Transformation**: Normalizes data formats between systems
4. **Rate Limiting**: Manages API request volumes

## Setup Instructions

### 1. Create a Simple Express Proxy Server

Create a file named `autogen-proxy.js`:

```javascript
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

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
```

### 2. Install Dependencies

Create a package.json file and install the necessary dependencies:

```bash
npm init -y
npm install express cors http-proxy-middleware
```

### 3. Configure Environment Variables

Create a `.env` file:

```
PORT=3001
SOLNAI_ORIGIN=http://localhost:3000
AUTOGEN_API_URL=http://localhost:8081
AUTOGEN_WS_URL=ws://localhost:8081
```

### 4. Run the Proxy

```bash
node autogen-proxy.js
```

## Update SolnAI Configuration

Update your SolnAI application to point to the proxy instead of directly to AutoGen Studio:

```typescript
// config.ts
export const autogenConfig = {
  baseUrl: 'http://localhost:3001/api/autogenstudio',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

export const autogenWebSocketConfig = {
  url: 'ws://localhost:3001/ws/autogenstudio',
  reconnectInterval: 3000,
  maxReconnectAttempts: 5,
};
```

## Docker Deployment

For production deployment, you can containerize this proxy:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY autogen-proxy.js .
COPY .env.example .env

EXPOSE 3001

CMD ["node", "autogen-proxy.js"]
```

Build and run the container:

```bash
docker build -t autogen-proxy .
docker run -p 3001:3001 -e AUTOGEN_API_URL=http://autogenstudio:8081 autogen-proxy
```

## Testing the Proxy

To verify the proxy is working correctly:

1. Start AutoGen Studio
2. Start the proxy server
3. Make a test request:

```bash
curl http://localhost:3001/api/autogenstudio/agents
```

You should see a list of agents from AutoGen Studio.