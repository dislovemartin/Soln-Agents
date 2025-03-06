# SolnAI + AutoGen Studio Integration

This integration connects SolnAI Agent UI with Microsoft's AutoGen Studio, creating a powerful combined platform for building, managing, and interacting with AI agents.

## Features

- **Unified Interface**: Access both SolnAI agents and AutoGen Studio agents from a single UI
- **Data Exchange**: Pass data between SolnAI agents and AutoGen Studio agents
- **Shared Sessions**: Continue conversations across both platforms
- **Combined Capabilities**: Leverage the strengths of both frameworks

## Getting Started

### Prerequisites

- Node.js 16+ 
- Python 3.9+
- Docker and Docker Compose (for containerized deployment)

### Installation

#### 1. Install AutoGen Studio

```bash
# Create a virtual environment (recommended)
python -m venv autogen-env
source autogen-env/bin/activate  # Linux/Mac
# or
autogen-env\\Scripts\\activate  # Windows

# Install AutoGen Studio
pip install autogenstudio
```

#### 2. Set Up the SolnAI Agent UI

```bash
# Clone the repository if you haven't already
git clone https://github.com/your-org/solnai.git
cd solnai

# Install dependencies
npm install
```

#### 3. Configure the Integration

Update your SolnAI configuration to point to AutoGen Studio:

```typescript
// config.ts
export const autogenConfig = {
  baseUrl: 'http://localhost:8081/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

export const autogenWebSocketConfig = {
  url: 'ws://localhost:8081/ws',
  reconnectInterval: 3000,
  maxReconnectAttempts: 5,
};
```

### Running the Integration

#### Option 1: Development Mode

1. Start AutoGen Studio:
   ```bash
   autogenstudio ui --port 8081 --host 0.0.0.0
   ```

2. Start SolnAI in development mode:
   ```bash
   npm run dev
   ```

3. Access the integrated UI at http://localhost:3000

#### Option 2: Using Docker Compose

We've provided a Docker Compose configuration for easy deployment:

```bash
# Build and start all services
docker-compose -f docker-compose.autogen.yml up -d

# Stop all services
docker-compose -f docker-compose.autogen.yml down
```

Access the integrated UI at http://localhost:3000

## Using the Integration

### 1. Switching Between SolnAI and AutoGen Studio

The integrated UI provides a tabbed interface to switch between SolnAI agents and AutoGen Studio:

- **SolnAI Tab**: Interact with your SolnAI agents
- **AutoGen Tab**: Access AutoGen Studio features

### 2. Transferring Data Between Platforms

To send SolnAI agent results to AutoGen Studio:

1. Use a SolnAI agent to generate results
2. Click the "Export to AutoGen" button
3. The results will be sent to your selected AutoGen agent
4. Continue the conversation in AutoGen Studio

### 3. Creating AutoGen Agents from SolnAI Results

You can create a new AutoGen agent with knowledge from SolnAI results:

1. Generate results with a SolnAI agent
2. Click "Create AutoGen Agent"
3. Provide a name and description
4. The new agent will be created with the SolnAI results as its knowledge base

## Advanced Configuration

### Custom API Endpoints

If your AutoGen Studio is hosted on a different server:

```typescript
// config.ts
export const autogenConfig = {
  baseUrl: 'https://your-autogen-server.com/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${yourAuthToken}`,
  },
};
```

### Using the Proxy Server

For additional security or to solve CORS issues, use the proxy server:

1. Set up the proxy as described in `AUTOGEN_PROXY_SETUP.md`
2. Update your configuration to use the proxy

```typescript
export const autogenConfig = {
  baseUrl: 'http://localhost:3001/api/autogenstudio',
  // Other settings...
};
```

## Troubleshooting

### Connection Issues

If you can't connect to AutoGen Studio:

1. Verify AutoGen Studio is running (`curl http://localhost:8081/api/agents`)
2. Check for CORS issues in browser console
3. Try using the proxy server to resolve CORS problems

### Missing Agents or Skills

If agents or skills aren't appearing:

1. Refresh the agent list using the refresh button
2. Check AutoGen Studio logs for errors
3. Verify your authentication is correct

## Additional Resources

- [AutoGen Studio Documentation](https://microsoft.github.io/autogen/docs/studio/)
- [SolnAI Agent UI Documentation](https://docs.solnai.com/agent-ui)