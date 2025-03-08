# SolnAI Docker Deployment

This directory contains the necessary files to deploy the complete SolnAI system using Docker Compose, including the enhanced agent capabilities.

## System Components

This deployment includes:

1. **SolnAI Core** - The main application handling web UI, embeddings, and vector search
2. **Browser Tools MCP** - Model Context Protocol server for browser interaction
3. **Browser Tools Server** - Server that connects to the Chrome extension
4. **CrewAI Service** - Agent orchestration service for complex workflows

## Prerequisites

- Docker and Docker Compose installed on your system
- If you plan to use Ollama as your LLM provider, make sure it's installed and running
- For browser tools: Chrome with the Browser Tools extension installed

## Deployment Steps

1. **Review and modify the `.env` file**
   
   Update the environment variables in the `.env` file according to your needs. At minimum, you should:
   - Set a secure `JWT_SECRET` (a random string of at least 20 characters)
   - Configure your preferred LLM provider
   - Configure your preferred embedding model
   - Set paths for persistent storage:
     ```
     SOLNAI_STORAGE_PATH=/path/to/storage
     SOLNAI_AGENTS_PATH=/path/to/agents
     ```

2. **Deploy with the provided script**

   ```bash
   cd docker-deployment
   ./deploy.sh start
   ```

   This will:
   - Create necessary directories if they don't exist
   - Start all services in the correct order
   - Provide URLs for accessing each service

3. **Access the application**

   - Main application: `http://localhost:3001`
   - Browser Tools MCP: `http://localhost:3027` 
   - CrewAI Service: `http://localhost:8001`

## Configuration Options

### LLM Providers

SolnAI supports various LLM providers. To use a different provider, update the following variables in the `.env` file:

- `LLM_PROVIDER`: The name of the provider (e.g., `openai`, `anthropic`, `ollama`)
- Provider-specific variables (e.g., `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`)

### Embedding Models

For document embeddings, update the following variables:

- `EMBEDDING_ENGINE`: The embedding provider (e.g., `openai`, `ollama`)
- `EMBEDDING_MODEL_PREF`: The specific model to use

### Vector Databases

SolnAI uses LanceDB by default, but supports other vector databases:

- `VECTOR_DB`: The vector database to use (e.g., `lancedb`, `pinecone`, `qdrant`)
- Database-specific variables (e.g., `PINECONE_API_KEY`, `QDRANT_URL`)

## Troubleshooting

### Cannot connect to Ollama or other local services

If you're using Ollama or other services running on your host machine, make sure to use `host.docker.internal` instead of `localhost` in the connection URLs.

For Linux systems, the Docker Compose file already includes the necessary `extra_hosts` configuration to make `host.docker.internal` work.

### Data Persistence

All data is stored in the `/home/nvidia/system_monitoring/SolnAI/storage` directory on your host machine. This ensures that your data persists even if the container is removed or rebuilt.

## Script Commands

The `deploy.sh` script provides several commands to manage your SolnAI deployment:

- `./deploy.sh start` - Start all services
- `./deploy.sh stop` - Stop all services
- `./deploy.sh restart` - Restart all services
- `./deploy.sh status` - Check status of all services
- `./deploy.sh logs` - View logs from all services
- `./deploy.sh update` - Update SolnAI to the latest version

## New Features in this Deployment

This deployment includes all the enhanced agent capabilities:

1. **Robust Error Handling and Session Recovery**
   - Automated container and process restart on failure
   - Graceful error handling with detailed error messages
   - Session health checks and monitoring

2. **Message History Persistence**
   - Local storage of chat history
   - Chat history export functionality
   - Seamless recovery of conversations between sessions

3. **Agent Health Monitoring**
   - Visual status indicators in the UI
   - Real-time health checks
   - Detailed error reporting

4. **Agent Metrics and Analytics**
   - Performance tracking (execution time, success rate)
   - Usage statistics by agent and user
   - Historical data for trend analysis

5. **Browser Tools Integration**
   - Chrome extension for browser monitoring
   - Capture console logs and network activity
   - Take screenshots for debugging

## Updating SolnAI

To update to the latest version of SolnAI with all components:

```bash
cd docker-deployment
./deploy.sh update
```

This will:
- Pull the latest SolnAI core image
- Rebuild the custom services (Browser Tools, CrewAI)
- Restart all services with the new versions