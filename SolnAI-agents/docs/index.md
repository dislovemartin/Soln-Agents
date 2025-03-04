# SolnAI Agents Documentation

Welcome to the SolnAI Agents documentation. This documentation provides comprehensive information about the SolnAI Agents Collection, including how to use, develop, deploy, and troubleshoot agents.

## Documentation Sections

### Core Documentation

- [**Overview**](overview.md) - A comprehensive overview of the SolnAI Agents Collection
- [**API Reference**](agent_api_reference.md) - Detailed API documentation for SolnAI agents
- [**Creating a New Agent**](creating_new_agent.md) - Step-by-step guide for creating your own agent

### Deployment and Operations

- [**Deployment Guide**](deployment_guide.md) - Instructions for deploying agents in various environments
- [**Troubleshooting Guide**](troubleshooting_guide.md) - Solutions to common issues and debugging techniques

## Quick Start

To get started with SolnAI agents quickly:

1. **Understand the basics**: Read the [Overview](overview.md) to understand what SolnAI agents are and how they work.

2. **Create your first agent**: Follow the [Creating a New Agent](creating_new_agent.md) guide to build your own agent.

3. **Deploy your agent**: Use the [Deployment Guide](deployment_guide.md) to deploy your agent to your preferred environment.

4. **Integrate with your application**: Refer to the [API Reference](agent_api_reference.md) to learn how to interact with your agent.

## Example: Basic Agent Usage

Here's a simple example of how to interact with a SolnAI agent using Python:

```python
import requests
import json

def call_agent(query, user_id, request_id, session_id, api_token):
    headers = {
        "Authorization": f"Bearer {api_token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "query": query,
        "user_id": user_id,
        "request_id": request_id,
        "session_id": session_id
    }
    
    response = requests.post(
        "https://api.solnai.com/api/agent-name",
        headers=headers,
        data=json.dumps(payload)
    )
    
    return response.json()

# Example usage
result = call_agent(
    query="What is the capital of France?",
    user_id="user123",
    request_id="req456",
    session_id="sess789",
    api_token="your_api_token_here"
)

print(result["output"])
```

## Contributing

We welcome contributions to the SolnAI Agents Collection! If you'd like to contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

Please ensure your code follows our coding standards and includes appropriate tests.

## Support

If you need help with SolnAI agents:

- Check the [Troubleshooting Guide](troubleshooting_guide.md) for solutions to common issues
- Search for similar issues in the GitHub repository
- Create a new issue with detailed information about your problem
- Contact the SolnAI support team at support@solnai.com for urgent issues 