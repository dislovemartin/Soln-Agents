# Goose Tools - Context Management for Large Language Models

Goose Tools is a collection of utilities for managing context in Large Language Model (LLM) interactions. It provides command-line and API-based tools for extracting, cleaning, and analyzing LLM conversation contexts.

## Features

- **Web Content Extraction**: Extract relevant content from web pages
- **Code Content Extraction**: Extract key components from code files
- **Session Management**: Track and manage LLM conversation sessions
- **Context Analysis**: Analyze token usage and optimize prompts
- **Content Conversion**: Convert between different formats (Markdown, HTML, etc.)
- **Web Dashboard**: Visual interface for all tools

## Installation

```bash
# Using pip
pip install goose-tools

# From source
git clone https://github.com/solnai/goose-tools.git
cd goose-tools
pip install -e .
```

## Command Line Usage

```bash
# Extract content from a web page
goose-tools web https://example.com output.txt

# Extract key components from a code file
goose-tools code src/main.py code_extract.txt

# List available sessions
goose-tools session --list

# Clean up old sessions
goose-tools clean --max-days 7 --preview

# Start the web API server
goose-tools api
```

## Web Dashboard

The Goose Tools package includes a web dashboard that provides a visual interface for all tools.

```bash
# Start the dashboard
goose-tools api
```

Then open your browser to: http://localhost:5000/

## API Usage

The Goose Tools API can be used to integrate context management into your own applications.

```python
import requests

# Extract web content
response = requests.post(
    "http://localhost:5000/api/web/extract",
    json={
        "url": "https://example.com",
        "options": {"summary": True}
    }
)

if response.status_code == 200:
    data = response.json()
    if data["success"]:
        content = data["content"]
        print(f"Extracted content: {content[:100]}...")
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.