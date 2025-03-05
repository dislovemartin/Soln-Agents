# SolnAI Agent Utilities Tests

This directory contains tests for the SolnAI agent utilities.

## Running Tests

To run all tests:

```bash
cd shared
pytest
```

To run a specific test file:

```bash
pytest tests/test_utils.py
```

To run a specific test function:

```bash
pytest tests/test_utils.py::test_extract_youtube_id
```

## Test Files

- **test_utils.py**: Tests for utility functions in `utils/auth.py`, `utils/llm.py`, and `utils/youtube.py`
- **test_base_agent.py**: Tests for the `BaseAgent` class in `utils/base_agent.py`
- **test_agent_tester.py**: Tests for the `AgentTester` class in `testing/agent_tester.py`

## Adding New Tests

When adding new functionality to the shared utilities, please add corresponding tests. Follow these guidelines:

1. Create a new test file if testing a new module
2. Use descriptive test function names (e.g., `test_extract_youtube_id`)
3. Include docstrings for each test function
4. Use pytest fixtures for common setup
5. Use pytest.mark.asyncio for testing async functions
6. Mock external dependencies (e.g., API calls)

## Test Coverage

To generate a test coverage report:

```bash
pytest --cov=shared
```

For a more detailed HTML report:

```bash
pytest --cov=shared --cov-report=html
```

This will create a `htmlcov` directory with the coverage report.

## Continuous Integration

These tests are designed to be run in a CI/CD pipeline. The pipeline should:

1. Install the package in development mode
2. Install test dependencies
3. Run the tests
4. Generate a coverage report
5. Fail if coverage is below a certain threshold

## Dependencies

The tests require the following dependencies:

- pytest
- pytest-asyncio
- pytest-cov
- httpx
- fastapi
- unittest.mock

These are included in the dev dependencies of the package.
