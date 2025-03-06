#!/bin/bash
# Setup script for SolnAI + AutoGen Studio integration

echo "Setting up SolnAI + AutoGen Studio integration..."

# Create proxy directory
mkdir -p proxy

# Create proxy files
cat > proxy/package.json << 'EOF'
{
  "name": "autogen-proxy",
  "version": "1.0.0",
  "description": "Proxy server for AutoGen Studio integration",
  "main": "autogen-proxy.js",
  "scripts": {
    "start": "node autogen-proxy.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "express": "^4.18.2",
    "http-proxy-middleware": "^2.0.6"
  }
}
EOF

cat > proxy/autogen-proxy.js << 'EOF'
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
EOF

cat > proxy/.env << 'EOF'
PORT=3001
SOLNAI_ORIGIN=http://localhost:3000
AUTOGEN_API_URL=http://localhost:8081
AUTOGEN_WS_URL=ws://localhost:8081
EOF

cat > proxy/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY autogen-proxy.js .
COPY .env .

EXPOSE 3001

CMD ["node", "autogen-proxy.js"]
EOF

# Create directories for AutoGen Studio data
mkdir -p autogen-data

echo "Setting up Python environment for AutoGen Studio..."

# Check if Python is installed
if command -v python3 &>/dev/null; then
    # Create virtual environment
    echo "Creating virtual environment..."
    python3 -m venv autogen-env
    
    # Activate virtual environment based on OS
    if [[ "$OSTYPE" == "darwin"* ]] || [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "Activating virtual environment (Linux/Mac)..."
        source autogen-env/bin/activate
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        echo "Activating virtual environment (Windows)..."
        source autogen-env/Scripts/activate
    else
        echo "Unknown OS, please activate the virtual environment manually."
    fi
    
    # Install AutoGen Studio
    echo "Installing AutoGen Studio..."
    pip install autogenstudio
    
    echo "Python environment setup complete!"
else
    echo "Python not found. Please install Python 3.9+ and run this script again."
fi

# Install proxy dependencies
echo "Setting up proxy server..."
cd proxy
npm install
cd ..

echo "Setup complete! Follow these steps to run the integration:"
echo ""
echo "1. Start AutoGen Studio:"
echo "   source autogen-env/bin/activate  # Linux/Mac"
echo "   or autogen-env\\Scripts\\activate  # Windows"
echo "   autogenstudio ui --port 8081 --host 0.0.0.0"
echo ""
echo "2. Start the proxy server:"
echo "   cd proxy && node autogen-proxy.js"
echo ""
echo "3. Update your SolnAI configuration to use the proxy"
echo ""
echo "4. Start SolnAI"
echo ""
echo "Alternatively, use Docker Compose:"
echo "   docker-compose -f docker-compose.autogen.yml up -d"
echo ""
echo "For more information, see README_AUTOGEN_INTEGRATION.md"