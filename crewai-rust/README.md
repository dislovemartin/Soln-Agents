# CrewAI Rust

A high-performance re-implementation of CrewAI in Rust with Python bindings. This project provides a modular, robust, and efficient implementation of the CrewAI framework leveraging Rust's performance and safety features while maintaining Python compatibility.

## Features

- **Three Execution Models**: Sequential, parallel (Rayon), and asynchronous (Tokio) execution models
- **Robust Error Handling**: Comprehensive error handling across Rust and Python boundaries
- **Modular Architecture**: Clean separation between core logic and Python bindings
- **Performance Measurement**: Built-in benchmarking and profiling tools
- **YAML Configuration**: Load crew configurations from YAML files with validation
- **Thread-Safe Async Runtime**: Single Tokio runtime instance shared across Python calls
- **Python Asyncio Integration**: Seamless integration with Python's asyncio

## Project Structure

```
crewai-rust/
├── Cargo.toml                 # Workspace configuration
├── crewai-core/               # Core Rust implementation
│   ├── Cargo.toml             # Core crate dependencies
│   └── src/
│       ├── agents.rs          # Agent implementation
│       ├── tasks.rs           # Task implementation
│       ├── crew.rs            # Crew implementation
│       ├── config.rs          # Configuration handling
│       ├── execution.rs       # Execution models
│       ├── tools.rs           # Utility tools
│       ├── errors.rs          # Error handling
│       └── lib.rs             # Library entry point
├── crewai-pyo3/               # Python bindings
│   ├── Cargo.toml             # PyO3 crate dependencies
│   └── src/
│       └── lib.rs             # PyO3 bindings
└── test_crewai.py             # Python test script
```

## Installation

### Prerequisites

- Rust (1.70+)
- Python (3.8+)
- [maturin](https://github.com/PyO3/maturin) for building Python wheels

### Building the Extension

```bash
cd crewai-rust/
cargo build --release  # Build the Rust library
cd crewai-pyo3/
maturin build --release  # Build the Python wheel
pip install ./target/wheels/crewai_rust-*.whl  # Install the wheel
```

## Basic Usage

```python
from crewai_rust import Crew, Agent, Task

# Create agents
researcher = Agent(name="Alice", role="Researcher", expertise="AI")

# Create tasks
research_task = Task(
    id=1, 
    description="Research latest AI trends", 
    expected_output="Report", 
    agent_name="Alice"
)

# Create crew and assign agents and tasks
crew = Crew(name="Research Team", process="sequential")
crew.add_agent(researcher)
crew.add_task(research_task)

# Execute tasks
crew.execute_sequential()  # Sequential execution
# crew.execute_parallel_rayon()  # Parallel execution using Rayon
# crew.execute_concurrent_tokio()  # Concurrent execution using Tokio
```

## Error Handling

The library includes comprehensive error handling, converting Rust errors to appropriate Python exceptions:

- `ValueError`: For configuration and validation errors
- `IOError`: For file and IO-related errors
- `RuntimeError`: For execution errors

Example error handling:

```python
try:
    crew = Crew.load_from_yaml("config.yaml")
    crew.execute_sequential()
except ValueError as e:
    print(f"Configuration error: {e}")
except RuntimeError as e:
    print(f"Execution error: {e}")
```

## Async Support

For asyncio integration:

```python
import asyncio

async def run_crew():
    crew = Crew(name="Async Crew", process="async")
    # Add agents and tasks...
    
    # Method 1: Using the asyncio-compatible method
    await crew.execute_concurrent_tokio_async()
    
    # Method 2: Using the general async execution method
    await crew.execute_async()

asyncio.run(run_crew())
```

## Performance

For performance-critical applications, use the parallel or async execution models:

```python
# Parallel execution with Rayon
crew.execute_parallel_rayon()

# Async execution with Tokio
crew.execute_concurrent_tokio()
```

## Benchmarking

Measure performance of your CrewAI workflows:

```python
execution_time = crew.benchmark_sequential_tasks()
memory_usage = crew.get_memory_usage()
print(f"Execution time: {execution_time:.4f} seconds")
print(f"Memory usage: {memory_usage / 1024:.2f} MB")
```

## YAML Configuration

Load crew configurations from YAML:

```yaml
# crew_config.yaml
name: "Research Team"
agents:
  - name: "Alice"
    role: "Researcher"
    expertise: "AI"
tasks:
  - id: 1
    description: "Research latest AI trends"
    expected_output: "Report"
    agent_name: "Alice"
process: "sequential"
```

```python
# Load from YAML
crew = Crew.load_from_yaml("crew_config.yaml")
crew.execute()
```

## Testing

Run the test script to verify functionality:

```bash
python test_crewai.py
```

## License

MIT 