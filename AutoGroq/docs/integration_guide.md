# AutoGroq Integration Guide

This guide explains how to integrate AutoGroq with other agent frameworks and workflow systems.

## Integration with LangGraph

AutoGroq workflows are built on LangGraph, making them fully compatible with larger LangGraph workflows. You can use AutoGroq workflows as nodes within a larger LangGraph graph.

### Example: Using AutoGroq as a LangGraph Node

```python
from langgraph.graph import StateGraph
from autogroq import AutoGroqManager, DynamicTeamWorkflow

# Create the AutoGroq manager
manager = AutoGroqManager(api_key="your-groq-api-key")

# Create an AutoGroq workflow
autogroq_workflow = DynamicTeamWorkflow(
    task="Research quantum computing advancements",
    team_size=3,
    model="llama3-70b-8192"
)

# Build the workflow
autogroq_graph = autogroq_workflow.build()

# Create a larger LangGraph workflow
class ExternalState:
    def __init__(self):
        self.tasks = []
        self.results = {}
        self.status = "initialized"

# Create the main graph
main_graph = StateGraph(ExternalState)

# Define other nodes in the graph
def prepare_task(state):
    # Prepare the task for AutoGroq
    return state

def process_results(state):
    # Process the results from AutoGroq
    return state

# Add nodes to the graph
main_graph.add_node("prepare_task", prepare_task)
main_graph.add_node("autogroq_workflow", autogroq_graph)
main_graph.add_node("process_results", process_results)

# Define the edges
main_graph.add_edge("prepare_task", "autogroq_workflow")
main_graph.add_edge("autogroq_workflow", "process_results")

# Set the entry point
main_graph.set_entry_point("prepare_task")

# Compile and execute the graph
compiled_graph = main_graph.compile()
result = compiled_graph.invoke({"initial_task": "Research quantum computing"})
```

## Integration with CrewAI-Rust

AutoGroq integrates with CrewAI-Rust for high-performance parallel execution. This allows you to leverage Rust's performance benefits for agent workflows.

### Example: Using CrewAI-Rust with AutoGroq

```python
from autogroq import AutoGroqManager
from autogroq.integrations.crewai_rust_integration import CrewAIRustIntegration

# Create the CrewAI-Rust integration
crewai_integration = CrewAIRustIntegration(execution_mode="parallel")

# Create agents and tasks
agent1 = crewai_integration.create_agent(name="Researcher", role="Research Agent", expertise="Quantum Physics")
agent2 = crewai_integration.create_agent(name="Writer", role="Writing Agent", expertise="Technical Writing")

task1 = crewai_integration.create_task(
    id=1,
    description="Research quantum computing advancements",
    expected_output="Detailed research report",
    agent_name="Researcher"
)

task2 = crewai_integration.create_task(
    id=2,
    description="Write a summary of the research",
    expected_output="Summary report",
    agent_name="Writer"
)

# Create a crew
crew = crewai_integration.create_crew(name="Research Team")

# Execute the crew with tasks and agents
result = crewai_integration.execute_crew(crew, [task1, task2], [agent1, agent2])

print(f"Execution success: {result['success']}")
if result['success']:
    print(f"Execution time: {result['execution_time']} seconds")
    print(f"Memory usage: {result['memory_usage']} MB")
```

## Integration with LangSmith

AutoGroq integrates with LangSmith for tracing and evaluating workflow execution. This allows you to monitor and debug your workflows.

### Example: Using LangSmith with AutoGroq

```python
from autogroq import AutoGroqManager
from autogroq.integrations.langsmith_integration import LangSmithIntegration

# Create the LangSmith integration
langsmith_integration = LangSmithIntegration(api_key="your-langsmith-api-key")

# Create a project for your runs
project_id = langsmith_integration.create_project("autogroq-project", "AutoGroq Project")

# Create the AutoGroq manager with LangSmith project
manager = AutoGroqManager(
    api_key="your-groq-api-key",
    langsmith_project="autogroq-project"
)

# Create and execute a workflow
workflow = DynamicTeamWorkflow(
    task="Research quantum computing advancements",
    team_size=3,
    model="llama3-70b-8192"
)

# The execution will automatically be traced in LangSmith
result = manager.execute_workflow(workflow)

# Get details of the run from LangSmith
# Assuming the run_id is available in the result metadata
run_id = result.metadata.get("run_id")
if run_id:
    run_details = langsmith_integration.get_run_details(run_id)
    print(f"Run details: {run_details}")

# Evaluate the run
evaluation = langsmith_integration.evaluate_run(
    run_id=run_id,
    evaluator_name="criteria",
    evaluation_criteria={
        "criteria": {
            "relevance": "Is the result relevant to the task?",
            "accuracy": "Is the information accurate?",
            "completeness": "Is the result complete?"
        }
    }
)
print(f"Evaluation result: {evaluation}")
```

## Integration with AutoGen

AutoGroq can be used alongside AutoGen agents to create more powerful and flexible agent systems.

### Example: Using AutoGroq with AutoGen

```python
import autogen
from autogroq import AutoGroqManager, DynamicTeamWorkflow

# Initialize AutoGroq
manager = AutoGroqManager(api_key="your-groq-api-key")

# Create an AutoGroq workflow
autogroq_workflow = DynamicTeamWorkflow(
    task="Research quantum computing advancements",
    team_size=3,
    model="llama3-70b-8192"
)

# Define AutoGen agents
assistant = autogen.AssistantAgent(
    name="assistant",
    llm_config={"model": "gpt-4"}
)

user_proxy = autogen.UserProxyAgent(
    name="user_proxy",
    human_input_mode="NEVER"
)

# Function to execute AutoGroq workflow from AutoGen
def execute_autogroq_workflow(task_description):
    """Execute an AutoGroq workflow from AutoGen."""
    # Update the workflow task
    autogroq_workflow.task = task_description
    
    # Execute the workflow
    result = manager.execute_workflow(autogroq_workflow)
    
    # Return the result
    return result.final_output if result.success else f"Error: {result.error}"

# Register the function with the user proxy
user_proxy.register_function(
    function_map={"execute_autogroq_workflow": execute_autogroq_workflow}
)

# Start the conversation
user_proxy.initiate_chat(
    assistant,
    message="Can you help me research quantum computing advancements using AutoGroq?"
)
```

## General Integration Patterns

When integrating AutoGroq with other frameworks, consider these patterns:

1. **Workflow as a Service**: Expose AutoGroq workflows as services that can be called by other frameworks
2. **Component Integration**: Use specific components of AutoGroq (agents, tools) within other frameworks
3. **Data Sharing**: Share data between AutoGroq and other frameworks through common storage or APIs
4. **Event-based Integration**: Use events to trigger AutoGroq workflows from other systems
5. **Pipeline Integration**: Include AutoGroq workflows as steps in larger pipelines

## Best Practices

1. **State Management**: Ensure proper state management when integrating different frameworks
2. **Error Handling**: Implement robust error handling across framework boundaries
3. **Authentication**: Securely manage API keys and credentials
4. **Resource Management**: Monitor and optimize resource usage, especially for parallel execution
5. **Logging and Observability**: Use consistent logging and monitoring across frameworks
