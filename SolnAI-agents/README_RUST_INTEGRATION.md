# Rust-Powered Text Processing for SolnAI Agents

This document describes the integration of high-performance Rust extensions for text processing in the SolnAI agent framework.

## Overview

The Rust integration provides significant performance improvements for text processing operations in SolnAI agents, particularly for token counting, text chunking, and other text analysis operations that are computationally intensive.

## Components

### 1. Text Processor Utility

Location: `/shared/utils/text_processor.py`

This utility provides a consistent API for text processing operations, automatically using Rust extensions when available and falling back to Python implementations when necessary.

Key features:
- Token counting with optimized implementations
- Text chunking for large documents
- Batch processing for multiple texts
- Various text transformations (lowercase, uppercase, trim, etc.)
- HTML removal and keyword extraction

### 2. Text Processing Node

Location: `/nodes/text_processing_node.py`

This node integrates with the SolnAI agent builder, allowing agents to perform high-performance text processing operations as part of their workflow.

Key features:
- Configurable operations
- Variable input and output
- Performance optimization with Rust extensions
- Fallback to Python implementations

### 3. Frontend Integration

Location: `/frontend/src/pages/Admin/AgentBuilder/nodes/TextProcessingNode/index.jsx`

This component provides a user interface for configuring text processing operations in the agent builder.

Key features:
- Selection of processing operations
- Configuration of chunk size and other parameters
- Toggle for Rust extensions
- Advanced options for model-specific processing

## Performance Benchmarks

The Rust implementations provide significant performance improvements over the Python implementations, particularly for large texts and batch processing operations.

To run the benchmarks:

```bash
python3 /home/nvidia/system_monitoring/SolnAI/SolnAI-agents/benchmark_text_processing.py
```

Typical performance improvements:
- Token counting: 10-20x faster
- Text chunking: 5-10x faster
- HTML removal: 15-25x faster
- Keyword extraction: 8-15x faster

## Usage in Agents

### Basic Usage

1. Add a Text Processing node to your agent flow
2. Configure the input variable containing the text to process
3. Select the desired operations
4. Configure the result variable to store the processed text

### Advanced Usage

1. Chain multiple text processing operations
2. Use the token count to make decisions in your agent flow
3. Process text chunks in parallel for large documents
4. Combine with LLM instructions for advanced text analysis

## Implementation Details

### Rust Extensions

The Rust extensions are implemented using PyO3, which provides bindings between Python and Rust. The extensions are compiled into a Python module that can be imported and used like any other Python module.

The extensions are located in the `octotools_rs` package, which provides the following classes:
- `TokenCounter`: For counting tokens in text
- `TextProcessor`: For various text processing operations

### Fallback Implementations

When Rust extensions are not available, the system falls back to Python implementations. While these implementations are slower, they provide the same functionality and API, ensuring that agents continue to work correctly.

## Future Enhancements

- Additional text processing operations
- Support for more tokenizers and models
- Parallel processing for very large documents
- Integration with other components of the SolnAI framework
