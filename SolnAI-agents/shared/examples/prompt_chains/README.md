# Prompt Chain Examples

This directory contains examples of different prompt chain patterns that can be used to build sophisticated AI agent systems. Each example demonstrates a specific pattern with practical implementation details.

## What are Prompt Chains?

Prompt chains are sequences of prompts that work together to solve complex tasks by breaking them down into smaller, more manageable steps. They allow for more structured and reliable AI agent behavior by:

1. Breaking complex tasks into simpler sub-tasks
2. Maintaining state between steps
3. Enabling specialized processing at each step
4. Providing better control over the overall process

## Included Examples

### 1. Sequential Chain (`sequential_chain.py`)

A sequential prompt chain processes a task through multiple steps in a fixed order, with each step building on the results of previous steps.

**Key features:**
- Linear flow from one step to the next
- Each step has access to outputs from all previous steps
- Simple to implement and reason about
- Example use case: Research paper summarization

### 2. Branching Chain (`branching_chain.py`)

A branching prompt chain that takes different paths based on the output of previous steps, allowing for more dynamic and adaptive processing.

**Key features:**
- Decision points that determine which path to take
- Conditional logic based on intermediate results
- More flexible than sequential chains
- Example use case: Customer support ticket routing

### 3. Recursive Chain (`recursive_chain.py`)

A recursive prompt chain that can call itself to solve complex problems by breaking them down into smaller sub-problems.

**Key features:**
- Self-referential structure
- Automatic problem decomposition
- Depth-limited recursion to prevent infinite loops
- Example use case: Complex problem solving

### 4. Parallel Chain (`parallel_chain.py`)

A parallel prompt chain that processes multiple sub-tasks concurrently and then aggregates the results.

**Key features:**
- Concurrent processing of independent tasks
- Aggregation of multiple perspectives
- Improved efficiency for non-sequential tasks
- Example use case: Product analysis from multiple angles

### 5. Tool-Augmented Chain (`tool_augmented_chain.py`)

A prompt chain that can use external tools to enhance its capabilities, allowing the chain to access and process external information.

**Key features:**
- Integration with external tools and APIs
- Dynamic tool selection based on query
- Enhanced capabilities beyond the LLM's knowledge
- Example use case: Information assistant with real-time data access

### 6. Utility Module (`chain_utils.py`)

A collection of utilities for building and working with prompt chains.

**Key features:**
- Output parsers for different formats (JSON, lists, key-value pairs)
- Prompt templates for consistent formatting
- Chain metrics for performance monitoring
- Helper functions for creating chain steps

## Usage

Each example includes:
- A standalone implementation of the chain pattern
- An agent class that wraps the chain for use within the SolnAI framework
- Example usage code that can be run directly

To run any example:

```bash
python sequential_chain.py
python branching_chain.py
python recursive_chain.py
python parallel_chain.py
python tool_augmented_chain.py
```

## Best Practices

When implementing your own prompt chains, consider these best practices:

1. **Clear Separation of Concerns**: Each step in the chain should have a well-defined purpose
2. **Robust Error Handling**: Handle failures at each step to prevent cascading errors
3. **Logging and Observability**: Log intermediate results for debugging and monitoring
4. **Temperature Control**: Use lower temperatures for tasks requiring precision, higher for creative tasks
5. **Prompt Engineering**: Carefully design system and user prompts for each step
6. **Output Parsing**: Implement robust parsing of LLM outputs between chain steps
7. **State Management**: Maintain a clear state object that passes between steps
8. **Concurrency Management**: Use asyncio for parallel operations to improve efficiency
9. **Tool Integration**: Design tools with clear interfaces and robust error handling
10. **Performance Metrics**: Track execution time and token usage to optimize chains

## Combining Chain Patterns

These patterns can be combined to create more sophisticated chains:

- **Sequential-Branching Hybrid**: A sequential chain with conditional branches at specific points
- **Recursive-Parallel Hybrid**: A recursive chain that spawns parallel sub-tasks
- **Tool-Augmented Sequential Chain**: A sequential chain where specific steps can use tools
- **Branching Chain with Aggregation**: A branching chain that aggregates results from multiple paths

## References

For more information on prompt engineering and chain patterns, see:
- [LangChain Documentation](https://python.langchain.com/docs/modules/chains/)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)
- [Chain-of-Thought Prompting](https://arxiv.org/abs/2201.11903)
- [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)
- [Tool-Augmented LLMs](https://www.anthropic.com/research/tool-use)
