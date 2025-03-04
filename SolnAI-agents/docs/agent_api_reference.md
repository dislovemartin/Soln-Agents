# SolnAI Agent API Reference

This document provides a comprehensive reference for the SolnAI Agent API, including request/response formats, authentication, endpoints, and usage examples.

## Table of Contents

- [Authentication](#authentication)
- [Common Request Format](#common-request-format)
- [Common Response Format](#common-response-format)
- [Error Handling](#error-handling)
- [Standard Endpoints](#standard-endpoints)
- [Agent-Specific Endpoints](#agent-specific-endpoints)
- [Webhook Integration](#webhook-integration)
- [Rate Limiting](#rate-limiting)
- [Code Examples](#code-examples)

## Authentication

All SolnAI agents use bearer token authentication:

```http
Authorization: Bearer your_token_here
Content-Type: application/json
```

The token should be provided in the environment variable `API_BEARER_TOKEN` for each agent.

## Common Request Format

Most agent endpoints accept a standard request format:

```json
{
    "query": "User's question or command",
    "user_id": "unique-user-identifier",
    "request_id": "request-tracking-id",
    "session_id": "conversation-session-id"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `query` | string | The user's question, command, or input text |
| `user_id` | string | A unique identifier for the user making the request |
| `request_id` | string | A unique identifier for the request (for tracking and debugging) |
| `session_id` | string | A unique identifier for the conversation session (for maintaining context) |

## Common Response Format

Most agent endpoints return responses in a standard format:

```json
{
    "success": true,
    "output": "AI response content",
    "data": {
        "additional": "response data",
        "metadata": {
            "processing_time": "0.5s",
            "model_used": "model-name"
        }
    }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Indicates whether the request was successful |
| `output` | string | The main response text from the agent |
| `data` | object | Additional data or structured information (optional) |

## Error Handling

When an error occurs, agents return a response with `success: false` and an error message:

```json
{
    "success": false,
    "output": "An error occurred while processing your request.",
    "error": "Detailed error message"
}
```

Common error codes:

| HTTP Status | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid input parameters |
| 401 | Unauthorized - Invalid or missing authentication token |
| 404 | Not Found - Requested resource not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server-side error |

## Standard Endpoints

All SolnAI agents implement these standard endpoints:

### Health Check

```
GET /health
```

Returns the health status of the agent.

**Response:**

```json
{
    "status": "healthy"
}
```

### Process Request

```
POST /api/{agent-name}
```

The main endpoint for interacting with the agent.

**Request:**

```json
{
    "query": "Your question or command",
    "user_id": "user123",
    "request_id": "req456",
    "session_id": "sess789"
}
```

**Response:**

```json
{
    "success": true,
    "output": "Agent's response",
    "data": {
        "additional": "response data"
    }
}
```

## Agent-Specific Endpoints

Different agents may implement additional specialized endpoints. Here are some examples:

### YouTube Summary Agent

```
POST /api/youtube-summary
```

**Request:**

```json
{
    "query": "Summarize this video",
    "user_id": "user123",
    "request_id": "req456",
    "session_id": "sess789",
    "video_url": "https://www.youtube.com/watch?v=example"
}
```

### Data Analysis Agent

```
POST /api/data-analysis
```

**Request:**

```json
{
    "query": "Analyze this dataset",
    "user_id": "user123",
    "request_id": "req456",
    "session_id": "sess789",
    "data_url": "https://example.com/dataset.csv"
}
```

## Webhook Integration

Agents can be configured to send webhook notifications when processing is complete:

```json
{
    "query": "Process this task",
    "user_id": "user123",
    "request_id": "req456",
    "session_id": "sess789",
    "webhook_url": "https://your-service.com/webhook",
    "webhook_auth_token": "your_webhook_token"
}
```

## Rate Limiting

SolnAI agents implement rate limiting to prevent abuse. The default limits are:

- 60 requests per minute per IP address
- 1000 requests per day per user_id

When rate limits are exceeded, the agent returns a 429 status code with a response:

```json
{
    "success": false,
    "error": "Rate limit exceeded. Please try again later.",
    "retry_after": 60
}
```

## Code Examples

### Python Example

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

### JavaScript Example

```javascript
async function callAgent(query, userId, requestId, sessionId, apiToken) {
    const headers = {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
    };
    
    const payload = {
        query,
        user_id: userId,
        request_id: requestId,
        session_id: sessionId
    };
    
    const response = await fetch('https://api.solnai.com/api/agent-name', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
    });
    
    return await response.json();
}

// Example usage
callAgent(
    'What is the capital of France?',
    'user123',
    'req456',
    'sess789',
    'your_api_token_here'
).then(result => {
    console.log(result.output);
});
```

### cURL Example

```bash
curl -X POST https://api.solnai.com/api/agent-name \
  -H "Authorization: Bearer your_api_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the capital of France?",
    "user_id": "user123",
    "request_id": "req456",
    "session_id": "sess789"
  }'
``` 