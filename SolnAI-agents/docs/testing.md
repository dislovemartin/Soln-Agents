# Testing SolnAI Agents

This document provides an overview of the testing utilities for SolnAI agents, including best practices and examples.

## Table of Contents

- [Overview](#overview)
- [AgentTester Class](#agenttester-class)
- [Writing Test Cases](#writing-test-cases)
- [Running Tests](#running-tests)
- [Mocking Dependencies](#mocking-dependencies)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Overview

The SolnAI testing system provides utilities for testing agent implementations, including:

- Mocking dependencies (LLM providers, database, etc.)
- Simulating requests
- Validating responses
- Running test suites

## AgentTester Class

The `AgentTester` class is the main utility for testing agents:

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

## Writing Test Cases

Test cases are defined as dictionaries with the following keys:

- `query`: The user query to test
- `expected_contains`: List of strings that should be in the response (optional)
- `expected_not_contains`: List of strings that should not be in the response (optional)
- `expected_success`: Whether the response should be successful (optional, defaults to `True`)
- `parameters`: Optional parameters to include in the request (optional)

Example:

```python
test_cases = [
    {
        "query": "Hello, agent!",
        "expected_contains": ["Hello", "help"],
        "expected_success": True
    },
    {
        "query": "What's the weather like?",
        "expected_contains": ["weather"],
        "expected_not_contains": ["don't know"],
        "expected_success": True
    },
    {
        "query": "",
        "expected_success": False
    }
]
```

## Running Tests

You can run individual test cases or entire test suites:

```python
# Run a single test case
response = tester.run_test_case(
    query="Hello, agent!",
    expected_contains=["Hello", "help"],
    expected_success=True
)

# Run a test suite
results = tester.run_test_suite(test_cases)
```

The `run_test_suite` method returns a dictionary with the following keys:

- `total`: Total number of test cases
- `passed`: Number of passed test cases
- `failed`: Number of failed test cases
- `details`: List of detailed results for each test case

## Mocking Dependencies

The `AgentTester` class automatically mocks the following dependencies:

- LLM provider
- Supabase client

### Mocking LLM Responses

You can provide mock LLM responses when creating the tester:

```python
tester = AgentTester(
    agent_class=MyAgent,
    mock_llm_responses={
        "hello": "Hello, how can I help you?",
        "weather": "The weather is sunny today."
    }
)
```

The keys are substrings to match in the user query, and the values are the mock responses.

### Mocking Database

You can provide mock messages when creating the tester:

```python
tester = AgentTester(
    agent_class=MyAgent,
    mock_messages=[
        {
            "id": "1",
            "created_at": "2023-01-01T12:00:00Z",
            "session_id": "test-session",
            "message": {
                "type": "human",
                "content": "Hello, agent!",
                "data": None
            }
        },
        {
            "id": "2",
            "created_at": "2023-01-01T12:01:00Z",
            "session_id": "test-session",
            "message": {
                "type": "ai",
                "content": "Hello, how can I help you?",
                "data": None
            }
        }
    ]
)
```

## Best Practices

1. **Test Happy Paths**: Test common user queries and expected responses.
2. **Test Edge Cases**: Test edge cases like empty queries, very long queries, etc.
3. **Test Error Handling**: Test error scenarios to ensure they are handled gracefully.
4. **Use Descriptive Test Cases**: Use descriptive names and comments for test cases.
5. **Keep Tests Independent**: Each test case should be independent of others.
6. **Clean Up After Tests**: Always call `tester.cleanup()` after running tests.

## Examples

### Example 1: Basic Test Suite

```python
from shared.utils.testing import AgentTester
from my_agent import MyAgent

# Create tester
tester = AgentTester(
    agent_class=MyAgent,
    agent_params={"name": "My Agent", "description": "My agent for testing"}
)

# Define test cases
test_cases = [
    {
        "query": "Hello, agent!",
        "expected_contains": ["Hello", "help"],
        "expected_success": True
    },
    {
        "query": "What's the weather like?",
        "expected_contains": ["weather"],
        "expected_success": True
    },
    {
        "query": "",
        "expected_success": False
    }
]

# Run test suite
results = tester.run_test_suite(test_cases)

# Print results
print(f"Passed: {results['passed']}/{results['total']}")
for detail in results['details']:
    if detail['status'] == 'failed':
        print(f"Test case {detail['test_case']} failed: {detail['error']}")

# Clean up
tester.cleanup()
```

### Example 2: Testing with Mock LLM Responses

```python
from shared.utils.testing import AgentTester
from my_agent import MyAgent

# Create tester with mock LLM responses
tester = AgentTester(
    agent_class=MyAgent,
    agent_params={"name": "My Agent", "description": "My agent for testing"},
    mock_llm_responses={
        "hello": "Hello, how can I help you?",
        "weather": "The weather is sunny today.",
        "name": "My name is SolnAI Agent.",
        "help": "I can help you with various tasks. Here are some examples: ..."
    }
)

# Define test cases
test_cases = [
    {
        "query": "Hello, what's your name?",
        "expected_contains": ["name", "SolnAI"],
        "expected_success": True
    },
    {
        "query": "What can you help me with?",
        "expected_contains": ["help", "tasks", "examples"],
        "expected_success": True
    },
    {
        "query": "What's the weather like today?",
        "expected_contains": ["weather", "sunny"],
        "expected_success": True
    }
]

# Run test suite
results = tester.run_test_suite(test_cases)

# Clean up
tester.cleanup()
```

### Example 3: Testing API Endpoints

```python
from shared.utils.testing import AgentTester
from my_agent import MyAgent

# Create tester
tester = AgentTester(
    agent_class=MyAgent,
    agent_params={"name": "My Agent", "description": "My agent for testing"}
)

# Test health endpoint
response = tester.test_endpoint("/health")
assert response.status_code == 200
assert response.json()["status"] == "healthy"

# Test root endpoint
response = tester.test_endpoint("/")
assert response.status_code == 200
assert response.json()["name"] == "My Agent"
assert response.json()["status"] == "running"

# Clean up
tester.cleanup()
```

### Example 4: Testing with Custom Parameters

```python
from shared.utils.testing import AgentTester
from my_agent import MyAgent

# Create tester
tester = AgentTester(
    agent_class=MyAgent,
    agent_params={"name": "My Agent", "description": "My agent for testing"}
)

# Define test cases with custom parameters
test_cases = [
    {
        "query": "Summarize this text",
        "parameters": {
            "text": "This is a sample text that needs to be summarized. It contains multiple sentences with various information."
        },
        "expected_contains": ["summary", "sample", "information"],
        "expected_success": True
    },
    {
        "query": "Translate to French",
        "parameters": {
            "text": "Hello, how are you?"
        },
        "expected_contains": ["Bonjour", "comment"],
        "expected_success": True
    }
]

# Run test suite
results = tester.run_test_suite(test_cases)

# Clean up
tester.cleanup()
```
