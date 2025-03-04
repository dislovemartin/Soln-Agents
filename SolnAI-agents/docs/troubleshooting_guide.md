# SolnAI Agent Troubleshooting Guide

This guide provides solutions to common issues you might encounter when working with SolnAI agents.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Configuration Problems](#configuration-problems)
- [Runtime Errors](#runtime-errors)
- [API Connection Issues](#api-connection-issues)
- [Database Problems](#database-problems)
- [Performance Issues](#performance-issues)
- [Deployment Challenges](#deployment-challenges)
- [Common Error Messages](#common-error-messages)
- [Debugging Techniques](#debugging-techniques)
- [Getting Help](#getting-help)

## Installation Issues

### Python Dependency Conflicts

**Problem**: Conflicting Python package versions when installing dependencies.

**Solution**: Use a virtual environment and specify exact package versions:

```bash
# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies with specific versions
pip install -r requirements.txt
```

If you're still experiencing conflicts, try:

```bash
# Clear pip cache
pip cache purge

# Install dependencies one by one
pip install fastapi==0.110.0
pip install uvicorn==0.27.1
# Continue with other dependencies
```

### Docker Build Failures

**Problem**: Docker build fails with errors.

**Solution**: Check for common issues:

1. Ensure your Dockerfile is correctly formatted
2. Verify base image compatibility
3. Check for network issues during build

```bash
# Build with verbose output
docker build --progress=plain -t your-agent .

# Check if base image can be pulled
docker pull ottomator/base-python:latest
```

## Configuration Problems

### Missing Environment Variables

**Problem**: Agent fails to start due to missing environment variables.

**Solution**: Ensure all required environment variables are set:

1. Check if `.env` file exists and is properly formatted
2. Verify environment variables are loaded correctly

```bash
# Create .env file from example
cp .env.example .env

# Edit .env file with your values
nano .env

# Verify environment variables are loaded
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.getenv('API_BEARER_TOKEN'))"
```

### Invalid Configuration Format

**Problem**: Configuration files have syntax errors or invalid values.

**Solution**: Validate your configuration files:

```bash
# For JSON files
python -c "import json; json.load(open('config.json'))"

# For YAML files
python -c "import yaml; yaml.safe_load(open('config.yaml'))"
```

## Runtime Errors

### Agent Crashes on Startup

**Problem**: Agent crashes immediately after starting.

**Solution**: Check for common startup issues:

1. Look at the error message in the logs
2. Verify port availability
3. Check database connection

```bash
# Run with debug logging
LOG_LEVEL=DEBUG python main.py

# Check if port is already in use
lsof -i :8001  # On Linux/Mac
netstat -ano | findstr :8001  # On Windows
```

### Unhandled Exceptions

**Problem**: Agent crashes with unhandled exceptions during operation.

**Solution**: Implement proper error handling and logging:

```python
# Add try-except blocks around critical code
try:
    # Your code here
    result = process_request(request)
    return result
except Exception as e:
    logger.error(f"Error processing request: {e}")
    return {"success": False, "error": str(e)}
```

## API Connection Issues

### Authentication Failures

**Problem**: API requests fail with authentication errors.

**Solution**: Verify your authentication token:

1. Check if `API_BEARER_TOKEN` is set correctly
2. Ensure the token is included in the request header

```bash
# Test API with curl
curl -X POST http://localhost:8001/api/your-agent \
  -H "Authorization: Bearer your_token_here" \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'
```

### CORS Issues

**Problem**: Browser requests fail with CORS errors.

**Solution**: Configure CORS properly in your agent:

```python
# In FastAPI app
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Database Problems

### Connection Failures

**Problem**: Agent can't connect to Supabase.

**Solution**: Verify your Supabase configuration:

1. Check `SUPABASE_URL` and `SUPABASE_KEY` values
2. Ensure network connectivity to Supabase
3. Verify the Supabase project is active

```bash
# Test Supabase connection
curl -X GET "https://your-supabase-url/rest/v1/messages?limit=1" \
  -H "apikey: your-supabase-key" \
  -H "Authorization: Bearer your-supabase-key"
```

### Missing Tables

**Problem**: Database queries fail because tables don't exist.

**Solution**: Create the required tables:

```sql
-- Run this SQL in the Supabase SQL Editor
CREATE TABLE IF NOT EXISTS messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_id TEXT NOT NULL,
    message JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages (session_id);
```

## Performance Issues

### Slow Response Times

**Problem**: Agent responses are slow.

**Solution**: Optimize performance:

1. Check resource usage (CPU, memory)
2. Optimize database queries
3. Implement caching for frequent operations

```python
# Add caching for expensive operations
from functools import lru_cache

@lru_cache(maxsize=100)
def expensive_operation(input_data):
    # Your expensive operation here
    return result
```

### Memory Leaks

**Problem**: Agent's memory usage grows over time.

**Solution**: Identify and fix memory leaks:

1. Use memory profiling tools
2. Check for unclosed resources (file handles, connections)
3. Implement proper cleanup in your code

```bash
# Install memory profiler
pip install memory-profiler

# Run with memory profiling
python -m memory_profiler main.py
```

## Deployment Challenges

### Container Orchestration Issues

**Problem**: Kubernetes pods fail to start or become unhealthy.

**Solution**: Troubleshoot Kubernetes deployments:

1. Check pod status and logs
2. Verify resource limits and requests
3. Ensure health checks are properly configured

```bash
# Check pod status
kubectl get pods

# View pod logs
kubectl logs your-agent-pod-name

# Describe pod for more details
kubectl describe pod your-agent-pod-name
```

### Load Balancing Problems

**Problem**: Traffic isn't properly distributed to agent instances.

**Solution**: Verify load balancer configuration:

1. Check service and endpoint definitions
2. Ensure health checks are passing
3. Verify network policies allow traffic

```bash
# Check service endpoints
kubectl get endpoints your-agent-service

# Test service from within the cluster
kubectl run -it --rm debug --image=curlimages/curl -- curl http://your-agent-service/health
```

## Common Error Messages

### "Failed to connect to database"

**Problem**: Agent can't establish a connection to Supabase.

**Solution**:
1. Verify `SUPABASE_URL` and `SUPABASE_KEY` are correct
2. Check network connectivity to Supabase
3. Ensure your IP is allowed in Supabase settings

### "Invalid token"

**Problem**: Authentication token is rejected.

**Solution**:
1. Verify `API_BEARER_TOKEN` is set correctly
2. Ensure the token is included in the request header
3. Check for whitespace or special characters in the token

### "Port already in use"

**Problem**: Agent can't start because the port is already occupied.

**Solution**:
1. Stop any other services using the port
2. Change the port in your configuration
3. Use a process manager to handle port conflicts

```bash
# Change port in .env file
echo "PORT=8002" >> .env
```

## Debugging Techniques

### Enable Debug Logging

Increase log verbosity to get more information:

```bash
# Set log level to DEBUG
export LOG_LEVEL=DEBUG
python main.py
```

### Use Interactive Debugging

Use Python's debugger for interactive troubleshooting:

```python
# Add this to your code where you want to debug
import pdb; pdb.set_trace()
```

Or use an IDE like VS Code with breakpoints.

### HTTP Request Inspection

Use tools to inspect HTTP requests and responses:

```bash
# Install httpie for better request visualization
pip install httpie

# Make a request with httpie
http POST http://localhost:8001/api/your-agent \
  Authorization:"Bearer your_token_here" \
  query="test" \
  user_id="user123" \
  request_id="req456" \
  session_id="sess789"
```

## Getting Help

If you're still experiencing issues:

1. **Check Documentation**: Review the agent's README.md and other documentation
2. **Search Issues**: Look for similar issues in the GitHub repository
3. **Ask for Help**: Create a new issue with detailed information:
   - Agent version
   - Environment details (OS, Python version)
   - Steps to reproduce
   - Error messages and logs
   - What you've tried so far

For urgent issues, contact the SolnAI support team at support@solnai.com. 