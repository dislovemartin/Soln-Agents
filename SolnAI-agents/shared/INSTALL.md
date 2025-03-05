# Installing SolnAI Agent Utilities

This guide explains how to install the SolnAI agent utilities package for use in your agent development.

## Installation Options

### Option 1: Install from Local Directory (Development)

For local development, you can install the package in development mode:

```bash
# From the SolnAI-agents directory
pip install -e shared/
```

This creates an "editable" installation, meaning changes to the source code will be immediately reflected without needing to reinstall.

### Option 2: Install from Git Repository

You can install directly from the Git repository:

```bash
pip install git+https://github.com/yourusername/SolnAI.git#subdirectory=SolnAI-agents/shared
```

Replace `yourusername` with the actual GitHub username or organization.

### Option 3: Install from PyPI (Future)

In the future, the package may be published to PyPI, allowing installation via:

```bash
pip install solnai-agent-utils
```

## Verifying Installation

To verify that the installation was successful, run the following Python code:

```python
from shared.utils.base_agent import BaseAgent
from shared.types.api import AgentRequest, AgentResponse

print("SolnAI agent utilities installed successfully!")
```

## Dependencies

The package includes the following dependencies:

- FastAPI: Web framework for building APIs
- Uvicorn: ASGI server for running FastAPI applications
- Pydantic: Data validation and settings management
- Supabase: Python client for Supabase
- Python-dotenv: Environment variable management
- Requests/httpx: HTTP client libraries
- OpenAI: OpenAI API client
- Pytest: Testing framework

## Development Dependencies

For development, additional dependencies are included:

- Black: Code formatter
- isort: Import sorter
- mypy: Static type checker
- pytest-asyncio: Pytest plugin for testing async code

Install development dependencies with:

```bash
pip install -e "shared/[dev]"
```
