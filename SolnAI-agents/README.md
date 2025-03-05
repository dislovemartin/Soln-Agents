# SolnAI Agents Collection

This directory contains a collection of AI agents built for the SolnAI platform. These agents provide various functionalities and can be deployed as standalone services or integrated into the SolnAI ecosystem.

## Overview

SolnAI agents are specialized AI services that perform specific tasks, from summarizing YouTube videos to analyzing data, generating content, and more. Each agent is designed to be:

- **Self-contained**: Each agent operates as an independent service
- **Containerized**: Agents are packaged as Docker containers for easy deployment
- **API-driven**: Agents expose RESTful APIs for integration
- **Stateful**: Conversation history is maintained using databases like Supabase

## Directory Structure

The repository is organized as follows:

```
SolnAI-agents/
├── base_python_docker/         # Base Docker image for Python agents
├── components/                 # Shared UI components
│   └── ui/                     # Reusable UI elements
├── shared/                     # Shared utilities and types
│   ├── utils/                  # Utility functions and classes
│   ├── types/                  # Type definitions
│   └── testing/                # Testing utilities
├── example-agent/              # Example agent implementation
├── ~sample-n8n-agent~/         # Sample n8n workflow template
├── ~sample-python-agent~/      # Sample Python agent template
└── [agent-specific-directories] # Individual agent implementations
```

## Agent Types

The repository includes several types of agents:

1. **Python-based Agents**: Built with FastAPI and Python, these agents run as standalone services
   - Examples: youtube-summary-agent, data-analysis-agent, research-agent, example-agent

2. **n8n Workflow Agents**: Built using n8n automation platform
   - Examples: ~sample-n8n-agent~, n8n-agentic-rag-agent

3. **Web-based Agents**: Specialized for web interactions
   - Examples: multi-page-scraper-agent, crawl4AI-agent

## Common Agent Structure

Most agents follow a similar structure:

- **main.py**: Core implementation (for Python agents)
- **Dockerfile**: Container definition
- **requirements.txt**: Dependencies
- **README.md**: Documentation
- **.env.example**: Template for environment variables

## Getting Started

### Prerequisites

- Docker
- Python 3.11+
- n8n (for workflow agents)

### Running an Agent Locally

1. Clone the repository
2. Navigate to the agent directory
   ```bash
   cd SolnAI-agents/[agent-name]
   ```
3. Copy the environment file and configure it
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```
4. Install dependencies
   ```bash
   pip install -r requirements.txt
   ```
5. Run the agent
   ```bash
   python main.py
   # or
   uvicorn main:app --reload
   ```

### Building and Running with Docker

```bash
docker build -t [agent-name] .
docker run -p 8001:8001 --env-file .env [agent-name]
```

## Creating a New Agent

### Using Shared Utilities (Recommended)

1. Start with the `example-agent` as a template:
   ```bash
   cp -r example-agent my-new-agent
   ```

2. Extend the `BaseAgent` class and implement your agent's core functionality:
   ```python
   from shared.utils.base_agent import BaseAgent
   from shared.types.api import AgentRequest, AgentResponse

   class MyNewAgent(BaseAgent):
       async def process_request(self, request: AgentRequest) -> AgentResponse:
           # Implement your agent's logic here
           return AgentResponse(success=True, output="Your response")
   ```

3. Use the shared utilities for common functionality:
   - Authentication: `shared.utils.auth`
   - Database: `shared.utils.db`
   - LLM providers: `shared.utils.llm`
   - Error handling: `shared.utils.error_handling`
   - Testing: `shared.utils.testing`

4. Update the README.md with:
   - Description and features
   - Setup instructions
   - Usage examples
   - API documentation

5. Test your agent using the `AgentTester` utility:
   ```python
   from shared.utils.testing import AgentTester
   
   # Create tester
   tester = AgentTester(
       agent_class=MyNewAgent,
       agent_params={"name": "My New Agent", "description": "My custom agent"}
   )
   
   # Run test case
   response = tester.run_test_case(
       query="Hello, agent!",
       expected_contains=["Hello"],
       expected_success=True
   )
   
   # Clean up
   tester.cleanup()
   ```

6. Create a Dockerfile based on the base image

### Using Sample Templates (Alternative)

1. Start with one of the sample templates:
   - `~sample-python-agent~` for Python-based agents
   - `~sample-n8n-agent~` for n8n workflow agents

2. Implement your agent's core functionality

3. Update the README.md with documentation

4. Test your agent locally

5. Create a Dockerfile based on the base image

## API Structure

Most agents follow a standard API structure:

### Request Format

```json
{
    "query": "User's question or command",
    "user_id": "unique-user-identifier",
    "request_id": "request-tracking-id",
    "session_id": "conversation-session-id",
    "parameters": {
        "optional_param1": "value1",
        "optional_param2": "value2"
    }
}
```

### Response Format

```json
{
    "success": true,
    "output": "AI response content",
    "error": null,
    "data": {
        "additional_data": "value"
    },
    "response_id": "unique-response-identifier",
    "timestamp": "2023-01-01T12:00:00Z"
}
```

### Error Response Format

```json
{
    "success": false,
    "output": "Error: Something went wrong",
    "error": "Detailed error message",
    "data": {
        "error_code": "ERROR_CODE",
        "details": {
            "additional_error_details": "value"
        }
    },
    "response_id": "unique-response-identifier",
    "timestamp": "2023-01-01T12:00:00Z"
}
```

## Authentication

Agents typically use bearer token authentication:

```http
Authorization: Bearer your_token_here
Content-Type: application/json
```

## Database Integration

Most agents use Supabase for storing conversation history. The typical schema is:

```sql
CREATE TABLE messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_id TEXT NOT NULL,
    message JSONB NOT NULL
);
```

## Shared Utilities

The `shared` directory contains utilities, types, and testing tools that can be used across different agent implementations:

### Utilities

- **auth.py**: Authentication utilities for verifying API tokens
- **base_agent.py**: Base agent class that provides common functionality
- **db.py**: Database utilities for working with Supabase
- **llm.py**: LLM provider utilities for generating text with OpenAI, Anthropic, etc.
- **youtube.py**: YouTube API utilities for fetching video information and transcripts
- **error_handling.py**: Error handling and logging utilities for consistent error reporting
- **testing.py**: Testing utilities for agent development and debugging

### Types

- **api.py**: Common API type definitions using Pydantic models

### Testing

- **agent_tester.py**: Utility for testing agent implementations

For more details, see the [shared/README.md](shared/README.md) file.

## Contributing

1. Fork the repository
2. Create a new branch for your agent
3. Implement your agent following the structure guidelines
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Cole Medin](https://www.youtube.com/@ColeMedin) - Original author and maintainer
- All individual agent contributors listed in their respective README files 