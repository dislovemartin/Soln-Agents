# SolnAI Agent Utilities

This directory contains utility modules for SolnAI agents, providing common functionality that can be used across different agent implementations.

## Overview

The utilities are organized into the following modules:

- `base_agent.py`: Base agent class that provides common functionality for all agents
- `auth.py`: Authentication utilities for verifying API tokens
- `db.py`: Database utilities for storing and retrieving conversation history
- `llm.py`: LLM provider utilities for generating responses
- `error_handling.py`: Error handling and logging utilities
- `testing.py`: Testing utilities for agent development and debugging

## Base Agent

The `BaseAgent` class provides common functionality for all agents, including:

- FastAPI app setup with CORS and authentication
- Database integration for conversation history
- Standard request/response handling
- Error handling and logging

Example usage:

```python
from shared.utils.base_agent import BaseAgent
from shared.types.api import AgentRequest, AgentResponse

class MyAgent(BaseAgent):
    async def process_request(self, request: AgentRequest) -> AgentResponse:
        # Process the request
        return AgentResponse(
            success=True,
            output="Hello, world!",
            data={"processed": True}
        )

# Create and run the agent
agent = MyAgent(
    name="My Agent",
    description="My custom agent"
)
agent.run()
```

## Authentication

The `auth.py` module provides utilities for verifying API tokens:

```python
from shared.utils.auth import verify_token

# Verify a token
verify_token(token)
```

## Database

The `db.py` module provides utilities for storing and retrieving conversation history:

```python
from shared.utils.db import store_message, fetch_conversation_history

# Store a message
await store_message(
    session_id="user-session-123",
    type="human",
    content="Hello, agent!",
    data=None
)

# Fetch conversation history
messages = await fetch_conversation_history(
    session_id="user-session-123",
    limit=10
)
```

## LLM Provider

The `llm.py` module provides utilities for generating responses from LLM providers:

```python
from shared.utils.llm import get_llm_provider
from shared.types.api import LLMMessage

# Get LLM provider
llm = get_llm_provider()

# Generate a response
response = await llm.generate([
    LLMMessage(role="system", content="You are a helpful assistant."),
    LLMMessage(role="user", content="Hello, how are you?")
])
```

## Error Handling

The `error_handling.py` module provides utilities for error handling and logging:

```python
from shared.utils.error_handling import DatabaseError, logger

# Log a message
logger.info("Processing request")

# Raise an error
raise DatabaseError(
    message="Failed to connect to the database",
    details={"connection_string": "redacted"}
)
```

See the [Error Handling Documentation](../../docs/error_handling.md) for more details.

## Testing

The `testing.py` module provides utilities for testing agent implementations:

```python
from shared.utils.testing import AgentTester
from my_agent import MyAgent

# Create tester
tester = AgentTester(
    agent_class=MyAgent,
    agent_params={"name": "My Agent", "description": "My agent for testing"},
    mock_llm_responses={
        "hello": "Hello, how can I help you?",
        "weather": "The weather is sunny today."
    }
)

# Run test case
response = tester.run_test_case(
    query="Hello, agent!",
    expected_contains=["Hello", "help"],
    expected_success=True
)

# Clean up
tester.cleanup()
```

See the [Testing Documentation](../../docs/testing.md) for more details.
