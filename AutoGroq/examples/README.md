# AutoGroq Examples

This directory contains example scripts demonstrating how to use AutoGroq with various integrations, particularly the CrewAI-Rust integration for high-performance agent execution.

## Prerequisites

Before running these examples, ensure you have:

1. A valid Groq API key
2. The required packages installed:
   - AutoGroq
   - CrewAI-Rust (optional, but required for most examples)
   - LangGraph (for workflow orchestration)

## Available Examples

### 1. Basic AutoGroq with CrewAI-Rust

`autogroq_crewai_example.py` - Shows how to initialize AutoGroq with CrewAI-Rust integration and execute a dynamic team workflow.

**Key features demonstrated:**
- Initializing AutoGroqManager
- Creating and executing a DynamicTeamWorkflow
- Using CrewAI-Rust for parallel agent execution

**Running the example:**
```bash
# Set your API key as an environment variable
export GROQ_API_KEY="your_groq_api_key"

# Run the example
python autogroq_crewai_example.py
```

### 2. Custom CrewAI-Rust Workflow

`custom_workflow.py` - Demonstrates how to create a custom workflow that leverages CrewAI-Rust for execution.

**Key features demonstrated:**
- Creating a custom workflow by extending BaseWorkflow
- Implementing specialized agents and tasks
- Using different execution modes (sequential, parallel, async)

**Running the example:**
```bash
export GROQ_API_KEY="your_groq_api_key"
python custom_workflow.py
```

### 3. YAML-based Workflow

`yaml_workflow_example.py` - Shows how to load and execute a crew configuration from a YAML file.

**Key features demonstrated:**
- Loading crew configurations from YAML
- Validating YAML configurations
- Executing different execution strategies based on YAML settings

**Running the example:**
```bash
export GROQ_API_KEY="your_groq_api_key"
python yaml_workflow_example.py
```

## Configuration

The `config.yaml` file contains example configuration settings for AutoGroq:

```yaml
# AutoGroq Configuration File
groq:
  api_key: "" # Replace with your actual Groq API key or use environment variable
  
model:
  name: "llama3-70b-8192"  # Default model to use
  temperature: 0.7         # Default temperature for generation
  
workflow:
  default_team_size: 3     # Default team size for dynamic team workflows
  max_iterations: 10       # Maximum iterations for workflows
  
crewai_rust:
  execution_mode: "parallel"  # Can be "sequential", "parallel", or "async"
  
langsmith:
  project: "autogroq-example"  # Project name for LangSmith tracing
```

## YAML Crew Configuration

The `research_crew.yaml` file shows how to define a crew with agents and tasks:

```yaml
name: "Research and Analysis Team"
agents:
  - name: "DataMiner"
    role: "Research Specialist"
    expertise: "Data collection and organization"
  # Additional agents...
tasks:
  - id: 1
    description: "Collect all relevant data about the query topic"
    expected_output: "Comprehensive dataset with sources"
    agent_name: "DataMiner"
  # Additional tasks...
process: "parallel" # Execution mode: sequential, parallel, async
```

## Best Practices

1. **Error Handling**: Always handle potential errors, especially for API calls and integrations.
2. **Configuration Management**: Use configuration files for settings and secrets.
3. **Performance Optimization**: Choose the appropriate execution mode based on your task requirements:
   - `sequential`: For simple tasks with dependencies
   - `parallel`: For CPU-bound tasks that can run independently
   - `async`: For IO-bound tasks like API calls or web scraping
4. **Observability**: Use LangSmith's tracing features for debugging and monitoring.

## Troubleshooting

- **Authentication Errors**: Ensure your API key is correct and properly set.
- **ImportError for CrewAI-Rust**: Follow the installation instructions in the repository README.
- **Memory Issues**: Monitor memory usage with `get_memory_usage()` and adjust batch sizes if needed.