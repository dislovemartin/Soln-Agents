# Example Agent

A simple example agent that demonstrates how to use the SolnAI shared utilities to create a new agent.

## Overview

This agent serves as a template and reference implementation for creating new agents using the SolnAI shared utilities. It demonstrates:

1. How to extend the `BaseAgent` class
2. How to process user requests
3. How to use the LLM utilities for generating responses
4. How to manage conversation history

## Features

- Simple LLM-powered conversational agent
- Conversation history management
- Error handling
- Containerized deployment

## Requirements

- Python 3.11+
- FastAPI
- Supabase
- OpenAI API key (or other supported LLM provider)

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your API keys
3. Install dependencies:

```bash
pip install -r requirements.txt
```

## Running Locally

```bash
python main.py
```

The agent will be available at http://localhost:8001

## API Endpoints

- `GET /`: Agent information
- `GET /health`: Health check
- `POST /process`: Process a user request

### Request Format

```json
{
  "query": "User's question or command",
  "user_id": "unique-user-identifier",
  "request_id": "request-tracking-id",
  "session_id": "conversation-session-id"
}
```

### Response Format

```json
{
  "success": true,
  "output": "Agent's response",
  "error": null,
  "data": null
}
```

## Docker Deployment

Build the Docker image:

```bash
docker build -t solnai-example-agent .
```

Run the container:

```bash
docker run -p 8001:8001 --env-file .env solnai-example-agent
```

## Testing

This agent includes example tests that demonstrate how to use the `AgentTester` utility to test agent functionality.

Run the tests:

```bash
pytest tests/
```

## License

This project is licensed under the terms of the MIT license.
