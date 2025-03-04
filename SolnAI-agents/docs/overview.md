# SolnAI Agents Collection Overview

## Introduction

The SolnAI Agents Collection is a comprehensive library of AI agents built for the SolnAI platform. These agents provide a wide range of functionalities and can be deployed as standalone services or integrated into the SolnAI ecosystem. This documentation provides an in-depth overview of the collection, its architecture, and how to work with the agents.

## What are SolnAI Agents?

SolnAI agents are specialized AI services that perform specific tasks, from summarizing YouTube videos to analyzing data, generating content, and more. Each agent is designed to be:

- **Self-contained**: Each agent operates as an independent service
- **Containerized**: Agents are packaged as Docker containers for easy deployment
- **API-driven**: Agents expose RESTful APIs for integration
- **Stateful**: Conversation history is maintained using databases like Supabase

## Architecture Overview

The SolnAI-agents repository follows a modular architecture that enables easy development, deployment, and integration of agents. The architecture consists of several key components:

### Directory Structure

```
SolnAI-agents/
├── base_python_docker/         # Base Docker image for Python agents
├── components/                 # Shared UI components
│   └── ui/                     # Reusable UI elements
├── ~sample-n8n-agent~/         # Sample n8n workflow template
├── ~sample-python-agent~/      # Sample Python agent template
└── [agent-specific-directories] # Individual agent implementations
```

### Agent Types

The repository includes several types of agents:

1. **Python-based Agents**: Built with FastAPI and Python, these agents run as standalone services
   - Examples: youtube-summary-agent, data-analysis-agent, research-agent

2. **n8n Workflow Agents**: Built using n8n automation platform
   - Examples: ~sample-n8n-agent~, n8n-agentic-rag-agent

3. **Web-based Agents**: Specialized for web interactions
   - Examples: multi-page-scraper-agent, crawl4AI-agent

### Common Agent Structure

Most agents follow a similar structure:

- **main.py**: Core implementation (for Python agents)
- **Dockerfile**: Container definition
- **requirements.txt**: Dependencies
- **README.md**: Documentation
- **.env.example**: Template for environment variables

### API Structure

Most agents follow a standard API structure:

#### Request Format

```json
{
    "query": "User's question or command",
    "user_id": "unique-user-identifier",
    "request_id": "request-tracking-id",
    "session_id": "conversation-session-id"
}
```

#### Response Format

```json
{
    "success": true,
    "output": "AI response content",
    "data": "Additional response data"
}
```

### Authentication

Agents typically use bearer token authentication:

```http
Authorization: Bearer your_token_here
Content-Type: application/json
```

### Database Integration

Most agents use Supabase for storing conversation history. The typical schema is:

```sql
CREATE TABLE messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_id TEXT NOT NULL,
    message JSONB NOT NULL
);
```

## Development Workflow

The development workflow for SolnAI agents typically follows these steps:

1. **Choose a Template**: Start with one of the sample templates based on your needs
2. **Implement Core Logic**: Develop the agent's specific functionality
3. **Test Locally**: Verify the agent works as expected
4. **Containerize**: Package the agent as a Docker container
5. **Deploy**: Deploy the agent to your environment

## Deployment Options

SolnAI agents can be deployed in various ways:

1. **Local Development**: Run the agent locally for development and testing
2. **Docker Containers**: Deploy as standalone containers
3. **Kubernetes**: Orchestrate multiple agents in a Kubernetes cluster
4. **Cloud Services**: Deploy to cloud platforms like AWS, GCP, or Azure

## Integration Patterns

SolnAI agents can be integrated with other systems in several ways:

1. **Direct API Calls**: Make HTTP requests to the agent's API
2. **Event-Driven**: Use message queues or event buses for asynchronous communication
3. **Webhook Integration**: Configure webhooks to trigger agent actions
4. **UI Integration**: Embed agent UIs in web applications

## Best Practices

When working with SolnAI agents, consider these best practices:

1. **Security**: Always use proper authentication and secure your API keys
2. **Error Handling**: Implement robust error handling in your agent
3. **Logging**: Add comprehensive logging for debugging and monitoring
4. **Testing**: Write tests for your agent's functionality
5. **Documentation**: Document your agent's API and usage examples
6. **Resource Management**: Optimize resource usage, especially for memory-intensive operations

## Conclusion

The SolnAI Agents Collection provides a powerful framework for building and deploying AI agents. By following the patterns and practices outlined in this documentation, you can create robust, scalable agents that integrate seamlessly with the SolnAI ecosystem. 