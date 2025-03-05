# SolnAI Agent Examples

This directory contains example agents that demonstrate how to use the SolnAI shared utilities.

## Examples

### 1. Simple Agent (`simple_agent.py`)

A basic agent that echoes the user's query with a greeting. This example demonstrates:

- How to extend the `BaseAgent` class
- How to implement the `process_request` method
- How to handle errors and return responses

To run the example:

```bash
python simple_agent.py
```

### 2. LLM Agent (`llm_agent.py`)

An agent that uses an LLM to generate responses to user queries. This example demonstrates:

- How to use the LLM utilities for generating text
- How to manage conversation history
- How to format messages for different LLM providers

To run the example:

```bash
python llm_agent.py
```

### 3. YouTube Agent (`youtube_agent.py`)

An agent that summarizes YouTube videos. This example demonstrates:

- How to use the YouTube utilities to fetch video information and transcripts
- How to extract YouTube IDs from URLs
- How to combine multiple utilities (YouTube API and LLM) in a single agent

To run the example:

```bash
python youtube_agent.py
```

## Prerequisites

Before running the examples, make sure to:

1. Install the required dependencies:

```bash
pip install -e ..
```

2. Set up the necessary environment variables in a `.env` file:

```
# API authentication
API_BEARER_TOKEN=your_bearer_token_here

# Supabase configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key

# LLM configuration
LLM_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o

# YouTube API configuration
YOUTUBE_API_KEY=your_youtube_api_key
```

## Testing the Examples

Once an example agent is running, you can test it using curl:

```bash
curl -X POST http://localhost:8080/process \
  -H "Authorization: Bearer your_bearer_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Hello, how are you?",
    "user_id": "test_user",
    "request_id": "test_request",
    "session_id": "test_session"
  }'
```

Or using the `AgentTester` utility:

```python
from shared.testing.agent_tester import AgentTester

async def test_agent():
    tester = AgentTester(base_url="http://localhost:8080")
    response = await tester.send_request("Hello, how are you?")
    print(response)

import asyncio
asyncio.run(test_agent())
```
