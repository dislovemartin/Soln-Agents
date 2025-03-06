# CrewAI Service

A FastAPI service that provides an API for executing [CrewAI](https://github.com/joaomdmoura/crewai) workflows. This service allows you to leverage CrewAI's agent orchestration capabilities through a REST API.

## Features

- REST API for executing CrewAI workflows
- Support for parallel or sequential execution
- LLM configuration management
- Task dependency handling
- Performance metrics tracking
- Batched execution for resource management

## Getting Started

### Prerequisites

- Python 3.10+
- pip

### Installation

1. Clone the repository
2. Install dependencies:

```bash
pip install -r requirements.txt
```

### Running the Service

```bash
cd app
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Running Tests

```bash
python test_service.py
```

## API Documentation

Once the service is running, you can access the Swagger documentation at:

```
http://localhost:8000/docs
```

## Using the Client Library

```python
from crewai_service_integration import CrewAIServiceIntegration

# Initialize the client
client = CrewAIServiceIntegration(
    execution_mode="parallel",
    task_batch_size=5
)

# Create agents
researcher = client.create_agent(
    name="Researcher",
    role="Research Assistant",
    goal="Find comprehensive information"
)

# Create tasks
task = client.create_task(
    id=1,
    description="Research quantum computing",
    expected_output="A summary of findings",
    agent_name="Researcher"
)

# Execute workflow
result = client.execute_crew(
    crew_name="research-crew",
    agents=[researcher],
    tasks=[task]
)
```

## Configuration

The service can be configured using environment variables:

- `CREWAI_SERVICE_URL`: URL for the service (default: http://localhost:8000)