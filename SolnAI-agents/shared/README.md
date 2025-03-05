# SolnAI Shared Agent Utilities

This directory contains shared utilities, types, and testing tools for SolnAI agents.

## Overview

The shared utilities provide a standardized foundation for building SolnAI agents, ensuring consistency across different agent implementations. By using these shared components, agent developers can focus on implementing the specific functionality of their agent without having to reimplement common patterns.

## Directory Structure

```
shared/
├── utils/           # Utility functions and classes
│   ├── auth.py      # Authentication utilities
│   ├── base_agent.py # Base agent class
│   ├── db.py        # Database utilities
│   ├── llm.py       # LLM provider utilities
│   └── youtube.py   # YouTube API utilities
├── types/           # Type definitions
│   └── api.py       # API type definitions
└── testing/         # Testing utilities
    └── agent_tester.py # Agent testing utility
```

## Components

### Base Agent

The `BaseAgent` class provides a foundation for building agents with FastAPI. It includes:

- FastAPI app setup with CORS and authentication
- Standard API endpoints (root, health, process)
- Database integration for conversation history
- Error handling

Example usage:

```python
from shared.utils.base_agent import BaseAgent
from shared.types.api import AgentRequest, AgentResponse

class MyAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="My Agent",
            description="My custom agent",
            version="1.0.0"
        )
    
    async def process_request(self, request: AgentRequest) -> AgentResponse:
        # Implement agent-specific logic here
        return AgentResponse(
            success=True,
            output="Hello, world!"
        )
```

### Authentication

The `auth.py` module provides utilities for authenticating API requests using bearer tokens.

Example usage:

```python
from fastapi import Depends
from shared.utils.auth import verify_token, security

@app.post("/secure-endpoint")
async def secure_endpoint(credentials = Depends(security)):
    verify_token(credentials)
    # Endpoint logic here
```

### Database

The `db.py` module provides utilities for working with Supabase, including functions for storing and retrieving conversation history.

Example usage:

```python
from shared.utils.db import store_message, fetch_conversation_history

# Store a message
await store_message(
    session_id="session123",
    message_type="human",
    content="Hello, agent!"
)

# Fetch conversation history
history = await fetch_conversation_history("session123")
```

### LLM Providers

The `llm.py` module provides utilities for working with different LLM providers, including OpenAI, Anthropic, and others.

Example usage:

```python
from shared.utils.llm import generate_chat_completion, create_system_message, create_user_message

# Generate a chat completion
messages = [
    create_system_message("You are a helpful assistant."),
    create_user_message("Hello, how are you?")
]
response = await generate_chat_completion(messages)
```

### YouTube

The `youtube.py` module provides utilities for working with the YouTube API, including functions for fetching video information and transcripts.

Example usage:

```python
from shared.utils.youtube import get_video_info, get_video_transcript

# Get video information
video_info = await get_video_info("dQw4w9WgXcQ")

# Get video transcript
transcript = await get_video_transcript("dQw4w9WgXcQ")
```

### Testing

The `agent_tester.py` module provides utilities for testing agent implementations.

Example usage:

```python
from shared.testing.agent_tester import AgentTester

# Create a tester
tester = AgentTester()

# Test the agent
results = await tester.run_test_suite([
    {"query": "Hello, how are you?"},
    {"query": "What is the capital of France?"}
])

# Print results
tester.print_test_results(results)
```

## Contributing

When adding new shared utilities, please follow these guidelines:

1. Use clear, descriptive names for functions and classes
2. Add comprehensive docstrings
3. Include type hints
4. Write tests for new functionality
5. Update this README with examples of how to use new utilities
