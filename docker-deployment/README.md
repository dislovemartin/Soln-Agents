# SolnAI Docker Deployment

This directory contains the necessary files to deploy SolnAI using Docker Compose.

## Prerequisites

- Docker and Docker Compose installed on your system
- If you plan to use Ollama as your LLM provider, make sure it's installed and running

## Deployment Steps

1. **Review and modify the `.env` file**
   
   Update the environment variables in the `.env` file according to your needs. At minimum, you should:
   - Set a secure `JWT_SECRET` (a random string of at least 20 characters)
   - Configure your preferred LLM provider
   - Configure your preferred embedding model

2. **Deploy with Docker Compose**

   ```bash
   cd docker-deployment
   docker-compose up -d
   ```

3. **Access the application**

   Open your browser and navigate to `http://localhost:3001`

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

## Updating SolnAI

To update to the latest version of SolnAI:

```bash
cd docker-deployment
docker-compose pull
docker-compose up -d
``` 