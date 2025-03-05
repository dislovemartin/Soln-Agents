# Error Handling and Logging in SolnAI Agents

This document provides an overview of the error handling and logging system in SolnAI agents, including best practices and examples.

## Table of Contents

- [Overview](#overview)
- [Error Classes](#error-classes)
- [Using Error Handling](#using-error-handling)
- [Logging](#logging)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Overview

The SolnAI error handling system provides a standardized way to raise, handle, and report errors across different agent implementations. It includes:

- A hierarchy of error classes for different types of errors
- Standardized error responses for API endpoints
- Consistent logging of errors and requests
- Integration with FastAPI's exception handling

## Error Classes

All error classes inherit from the base `AgentError` class, which provides common functionality:

- `AgentError`: Base class for all agent errors
  - `ConfigurationError`: Error related to configuration issues
  - `AuthenticationError`: Error related to authentication issues
  - `DatabaseError`: Error related to database operations
  - `LLMError`: Error related to LLM providers
  - `ValidationError`: Error related to input validation

Each error class includes:
- Error code
- Error message
- Optional additional details
- HTTP status code

## Using Error Handling

### Raising Errors

```python
from shared.utils.error_handling import DatabaseError

# Raise a database error
raise DatabaseError(
    message="Failed to connect to the database",
    details={"connection_string": "redacted"}
)
```

### Handling Errors

The `BaseAgent` class automatically handles errors in the `/process` endpoint:

```python
try:
    # Process the request
    response = await self.process_request(request)
    return response
except AgentError as e:
    # Handle specific agent errors
    logger.error(f"Agent error processing request: {e.code} - {e.message}")
    
    # Create error response
    error_response = AgentResponse(
        success=False,
        output=f"Error: {e.message}",
        error=e.message,
        data={"error_code": e.code, "details": e.details}
    )
    
    return error_response
except Exception as e:
    # Handle generic exceptions
    logger.error(f"Unexpected error processing request: {str(e)}", exc_info=True)
    
    # Create error response
    error_response = AgentResponse(
        success=False,
        output=f"An unexpected error occurred. Please try again later.",
        error=str(e) if self.debug_mode else "Internal server error"
    )
    
    return error_response
```

### Setting Up Exception Handlers

The `setup_exception_handlers` function sets up exception handlers for a FastAPI application:

```python
from shared.utils.error_handling import setup_exception_handlers

# Set up exception handlers
setup_exception_handlers(app, debug_mode=False)
```

## Logging

The logging system provides consistent logging of requests, responses, and errors:

### Request Logging

```python
from shared.utils.error_handling import log_request

# Log a request
log_request(request)
```

### Response Logging

```python
from shared.utils.error_handling import log_response

# Log a response
log_response(request, response, elapsed_time)
```

### Error Logging

```python
from shared.utils.error_handling import logger

# Log an error
logger.error(f"Failed to process request: {str(e)}", exc_info=True)
```

## Best Practices

1. **Use Specific Error Classes**: Use the most specific error class for the situation.
2. **Include Relevant Details**: Include relevant details in the error to help with debugging.
3. **Handle Errors Gracefully**: Handle errors gracefully and provide helpful error messages to users.
4. **Log Errors Appropriately**: Log errors with appropriate severity levels and include context.
5. **Don't Expose Sensitive Information**: Don't expose sensitive information in error messages or logs.

## Examples

### Example 1: Handling Configuration Errors

```python
from shared.utils.error_handling import ConfigurationError

def load_config(config_path):
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
        return config
    except FileNotFoundError:
        raise ConfigurationError(
            message=f"Configuration file not found: {config_path}",
            details={"config_path": config_path}
        )
    except json.JSONDecodeError as e:
        raise ConfigurationError(
            message=f"Invalid JSON in configuration file: {str(e)}",
            details={"config_path": config_path, "error": str(e)}
        )
```

### Example 2: Handling LLM Errors

```python
from shared.utils.error_handling import LLMError

async def generate_response(messages):
    try:
        response = await llm_provider.generate(messages)
        return response
    except Exception as e:
        raise LLMError(
            message=f"Failed to generate response from LLM provider: {str(e)}",
            details={"provider": llm_provider.name, "error": str(e)}
        )
```

### Example 3: Handling Database Errors

```python
from shared.utils.error_handling import DatabaseError

async def fetch_data(query):
    try:
        result = await database.execute(query)
        return result
    except Exception as e:
        raise DatabaseError(
            message=f"Failed to execute database query: {str(e)}",
            details={"query": query, "error": str(e)}
        )
```

### Example 4: Handling Validation Errors

```python
from shared.utils.error_handling import ValidationError

def validate_input(input_data):
    if not input_data.get("name"):
        raise ValidationError(
            message="Name is required",
            details={"input": input_data}
        )
    if len(input_data.get("name", "")) > 100:
        raise ValidationError(
            message="Name must be less than 100 characters",
            details={"input": input_data, "name_length": len(input_data.get("name", ""))}
        )
    return input_data
```
