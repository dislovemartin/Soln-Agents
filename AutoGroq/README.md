# AutoGroq

AutoGroq is a sophisticated agent workflow system built on LangGraph, designed to dynamically create and manage agent teams for complex task execution using Groq's high-performance LLM APIs.

## Features

- Dynamic agent team creation based on task requirements
- LangGraph workflow integration for complex, multi-step reasoning
- High-performance execution through Groq's API endpoints
- Integration with CrewAI-Rust for parallel and asynchronous task execution
- Compatibility with LangSmith for observability and debugging
- Seamless integration with existing SolnAI agent frameworks

## Getting Started

### Prerequisites

- Python 3.8+
- Rust 1.70+ (for CrewAI-Rust integration)
- A Groq API key

### Installation

```bash
# Clone the repository if you haven't already
git clone https://github.com/yourusername/Soln-Agents.git
cd Soln-Agents

# Install dependencies
pip install -r AutoGroq/requirements.txt

# Build CrewAI-Rust for high-performance execution
cd crewai-rust/
cargo build --release
cd crewai-pyo3/
maturin build --release
pip install ./target/wheels/crewai_rust-*.whl
```

### Basic Usage

```python
from autogroq import AutoGroqManager
from autogroq.workflows import DynamicTeamWorkflow

# Initialize the manager
manager = AutoGroqManager(api_key="your-groq-api-key")

# Create a workflow
workflow = DynamicTeamWorkflow(
    task="Research the latest advancements in quantum computing",
    team_size=3,
    model="llama3-70b-8192"
)

# Execute the workflow
result = manager.execute_workflow(workflow)
print(result)
```

## Integration with Other Frameworks

AutoGroq is designed to work seamlessly with other agent frameworks:

- **LangGraph**: Use AutoGroq workflows as nodes in larger LangGraph workflows
- **CrewAI-Rust**: Leverage Rust's performance for parallel agent execution
- **LangSmith**: Monitor and debug workflows with full tracing support
- **AutoGen**: Combine with AutoGen agents for enhanced capabilities

## Architecture

AutoGroq follows a modular architecture:

- **Core**: Base classes and interfaces for workflow components
- **Agents**: Specialized agent implementations
- **Workflows**: Pre-built workflow templates
- **Integrations**: Connectors for external frameworks and tools
- **Utils**: Helper functions and utilities

## License

MIT License