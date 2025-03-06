# SolnAI Development Guide

## Build Commands
- Setup: `yarn setup` (sets up environments, database, etc.)
- Server: `yarn dev:server` (run server in dev mode)
- Frontend: `yarn dev:frontend` (run frontend in dev mode)
- Linting: `yarn lint` (runs linting across codebase)
- Python Tests: `pytest tests/` (run all tests), `pytest tests/test_file.py::test_function -v` (run specific test)
- CrewAI Service: `cd crewai-service/app && uvicorn main:app --host 0.0.0.0 --port 8001 --reload` (run CrewAI service)

## Code Style
- Python: Follow PEP 8, use Black (88 char limit), isort for imports, mypy for types
- JavaScript: Use ESLint rules defined in package.json
- Documentation: Follow Markdown guidelines in `.cursor/rules/400-md-docs.mdc`
- Error Handling: Create specific error classes, include relevant details, log appropriately

## Project Structure
- Python agents should include: `main.py`, `Dockerfile`, `requirements.txt`, `README.md`, tests in `tests/`
- JavaScript: Follow module structure in each package with clear separation of concerns
- Agent interface: Follow patterns in shared utils for consistent API patterns
- CrewAI: Use service-based architecture with FastAPI for agent orchestration

## Type Safety
- Python: Use type hints and enforce with mypy (strict mode)
- JavaScript/TypeScript: Use proper typing for all functions and variables