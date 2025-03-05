# Goose Tools API

This API provides programmatic access to the Goose Context Management Tools. It allows you to integrate these tools into your own applications and workflows.

## Requirements

- Python 3.6+
- Flask
- Flask-CORS
- Goose Context Management Tools scripts

## Installation

1. Make sure all the Goose Context Management Tools scripts are in the same directory as the API script
2. Install the required Python packages:

```bash
pip install flask flask-cors
```

## Running the API

```bash
python goose_api.py [--port PORT] [--host HOST] [--debug]
```

Options:
- `--port PORT`: Specify the port to run the API on (default: 5000)
- `--host HOST`: Specify the host to bind to (default: 0.0.0.0)
- `--debug`: Run in debug mode (with more verbose output)

You can also use the provided launch script:

```bash
./launch_goose_tools.sh [--port PORT] [--host HOST] [--no-browser] [--debug]
```

This script will check for dependencies, install them if necessary, and launch the API server.

## Web Dashboard

The API includes a web dashboard for managing sessions and using all the tools through a graphical interface. 
Access it by opening your browser to:

```
http://localhost:5000/
```

## API Endpoints

### Dashboard and Static Files

```
GET /
```

Serves the web dashboard.

```
GET /<filename>
```

Serves static files from the API directory.

### Version Information

```
GET /api/version
```

Returns version information for the API and tools.

### Health Check

```
GET /api/health
```

Returns the health status of the API service.

### Web Content Extraction

```
POST /api/web/extract
```

Extract content from a web page.

**Request Body:**
```json
{
  "url": "https://example.com",
  "output_file": "optional_output_file.txt",
  "options": {
    "max-lines": 500,
    "render-js": true,
    "summary": true
  }
}
```

### Code Content Extraction

```
POST /api/code/extract
```

Extract key components from a code file.

**Request Body:**
```json
{
  "file_path": "/path/to/file.py",
  "output_file": "optional_output_file.txt",
  "options": {
    "lang": "python",
    "full-functions": true,
    "max-lines": 100
  }
}
```

### Session Management

```
GET /api/sessions
```

List all available sessions with their metadata.

```
GET /api/sessions/search?keyword=example
```

Search for sessions containing a specific keyword.

```
GET /api/sessions/{session_name}
```

Get the content and metadata of a specific session.

### Session Cleanup

```
POST /api/clean
```

Clean up old or large sessions.

**Request Body:**
```json
{
  "max-days": 14,
  "max-size": 20,
  "backup": true,
  "preserve-tags": "important,documentation",
  "preview": true
}
```

### Content Conversion

```
POST /api/convert
```

Convert content between different formats.

**Request Body:**
```json
{
  "input_file": "/path/to/input.txt",
  "format": "html",
  "output_file": "optional_output.html"
}
```

### Analytics

```
GET /api/analytics/token_usage?days=7
```

Get token usage statistics for sessions created in the last N days.

```
GET /api/analytics/session_growth?session=session_name
```

Analyze the growth pattern of a specific session and get optimization recommendations.

## Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "content": "...",
  "message": "..."
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "message": "Additional information"
}
```

## Integrating with SolnAI

This API is designed to be integrated with the broader SolnAI system. You can use it as a microservice in your architecture to manage LLM context and sessions.

## Examples

### cURL Examples

Extract web content:
```bash
curl -X POST http://localhost:5000/api/web/extract \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "options": {"summary": true}}'
```

List sessions:
```bash
curl -X GET http://localhost:5000/api/sessions
```

Clean sessions:
```bash
curl -X POST http://localhost:5000/api/clean \
  -H "Content-Type: application/json" \
  -d '{"max-days": 14, "preview": true}'
```

Get token usage:
```bash
curl -X GET http://localhost:5000/api/analytics/token_usage?days=7
```

### Python Example

```python
import requests
import json

# Extract web content
response = requests.post(
    "http://localhost:5000/api/web/extract",
    json={
        "url": "https://example.com",
        "options": {"summary": True}
    }
)

# Check response
if response.status_code == 200:
    data = response.json()
    if data["success"]:
        content = data["content"]
        print(f"Extracted content: {content[:100]}...")
    else:
        print(f"Error: {data['error']}")
else:
    print(f"HTTP Error: {response.status_code}")
```

## Security Considerations

- This API does not include authentication or authorization. If deploying in a production environment, add appropriate security measures.
- The API exposes file system operations. Ensure proper access controls are in place.
- Sanitize all inputs to prevent command injection vulnerabilities.

## Logging

The API logs information to:
- Console output
- `~/.local/share/goose/api.log`

In debug mode, more verbose logging is enabled.