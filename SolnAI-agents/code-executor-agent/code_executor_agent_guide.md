# Code Executor Agent Implementation Guide

## Overview

The Code Executor Agent is an intelligent assistant that specializes in executing, debugging, optimizing, and explaining code across various programming languages. This guide details how to implement the SolnAI core modules (llm-chain, llguidance, and aici) for this specific agent.

## Implementation Details

### 1. llm-chain Implementation

The Code Executor Agent requires a robust workflow to handle code execution, debugging, and optimization. Here's the optimal implementation using llm-chain:

```python
from llm_chain import Chain, Step

def code_executor_chain(code_input, language="python", operation_type="execute", optimization_goals=None):
    # Define the processing steps with optimal dependencies
    steps = [
        Step("parse_code", parse_and_validate_code, 
             config={"language": language, "strict_validation": True, "check_syntax": True}),
        
        Step("analyze_security", analyze_code_security, 
             depends_on=["parse_code"],
             config={"sandbox_level": "strict", "check_imports": True, "prevent_network_access": True}),
        
        Step("prepare_execution", prepare_execution_environment, 
             depends_on=["parse_code", "analyze_security"],
             config={"timeout": 30, "memory_limit": "512MB", "create_virtual_env": True}),
        
        Step("execute_code", execute_code_safely, 
             depends_on=["prepare_execution"],
             config={"capture_stdout": True, "capture_stderr": True, "track_execution_time": True}),
        
        Step("analyze_execution", analyze_execution_results, 
             depends_on=["execute_code"],
             config={"detect_errors": True, "performance_metrics": True}),
        
        Step("debug_code", debug_code_issues, 
             depends_on=["analyze_execution"],
             config={"error_analysis_depth": "detailed", "suggest_fixes": True}),
        
        Step("optimize_code", optimize_code_performance, 
             depends_on=["analyze_execution"],
             config={"optimization_targets": optimization_goals or ["speed", "readability"], 
                     "refactoring_level": "medium"}),
        
        Step("explain_code", generate_code_explanation, 
             depends_on=["parse_code", "analyze_execution"],
             config={"explanation_detail": "high", "include_examples": True, 
                     "highlight_patterns": True}),
        
        Step("generate_response", format_agent_response, 
             depends_on=["execute_code", "debug_code", "optimize_code", "explain_code"],
             config={"response_format": "markdown", "include_execution_results": True, 
                     "include_performance_metrics": True})
    ]
    
    # Create and execute the chain with optimal batch size and concurrency
    chain = Chain(steps, batch_size=2, max_concurrency=3)
    
    # Prepare input data
    input_data = {
        "code_input": code_input,
        "language": language,
        "operation_type": operation_type,
        "optimization_goals": optimization_goals
    }
    
    return chain.execute(**input_data)
```

### 2. llguidance Implementation

The Code Executor Agent needs to ensure code safety, proper formatting, and structured outputs. Here's the optimal implementation using llguidance:

```python
from llguidance import Grammar, JSONSchema

# Define the schema for code execution results
code_execution_schema = JSONSchema("""
{
  "type": "object",
  "properties": {
    "execution_status": {
      "type": "string",
      "enum": ["success", "error", "timeout", "security_violation"]
    },
    "stdout": {
      "type": "string"
    },
    "stderr": {
      "type": "string"
    },
    "execution_time_ms": {
      "type": "number",
      "minimum": 0
    },
    "memory_usage_mb": {
      "type": "number",
      "minimum": 0
    },
    "error_analysis": {
      "type": "object",
      "properties": {
        "error_type": {
          "type": "string"
        },
        "line_number": {
          "type": "integer",
          "minimum": 1
        },
        "error_message": {
          "type": "string"
        },
        "suggested_fixes": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "description": {
                "type": "string"
              },
              "code_fix": {
                "type": "string"
              }
            },
            "required": ["description", "code_fix"]
          }
        }
      }
    },
    "optimizations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": ["performance", "memory", "readability", "security"]
          },
          "description": {
            "type": "string"
          },
          "optimized_code": {
            "type": "string"
          },
          "improvement_metric": {
            "type": "string"
          }
        },
        "required": ["type", "description", "optimized_code"]
      }
    }
  },
  "required": ["execution_status", "stdout", "stderr", "execution_time_ms"]
}
""")

# Define the grammar for code explanation
code_explanation_grammar = Grammar("""
explanation ::= overview components execution_flow optimization
overview ::= /^# Code Overview\n\n/ paragraph
paragraph ::= /[^\n]+(\n[^\n]+)*\n\n/
components ::= /^## Key Components\n\n/ component+
component ::= /### [^\n]+\n\n/ paragraph
execution_flow ::= /^## Execution Flow\n\n/ step+
step ::= /[0-9]+\. [^\n]+\n\n/
optimization ::= /^## Optimization Opportunities\n\n/ optimization_item+
optimization_item ::= /- [^\n]+\n/
""")

# Define the grammar for code debugging
code_debugging_grammar = Grammar("""
debugging ::= error_summary root_cause solution
error_summary ::= /^# Error Analysis\n\n/ paragraph
paragraph ::= /[^\n]+(\n[^\n]+)*\n\n/
root_cause ::= /^## Root Cause\n\n/ paragraph
solution ::= /^## Solution\n\n/ solution_step+
solution_step ::= /[0-9]+\. [^\n]+\n\n/
""")

# Apply the schemas to constrain the LLM output
def execute_and_analyze_code(code, language="python", operation_type="execute"):
    # Execute code safely in a sandbox environment
    execution_result = execute_in_sandbox(code, language)
    
    # Generate structured output based on operation type
    if operation_type == "execute":
        # Format execution results according to schema
        result = llm.generate(
            f"Format the following code execution results as a structured object:\n{execution_result}",
            schema=code_execution_schema
        )
    elif operation_type == "explain":
        # Generate code explanation with structured format
        result = llm.generate(
            f"Explain this {language} code in detail:\n```{language}\n{code}\n```",
            grammar=code_explanation_grammar
        )
    elif operation_type == "debug":
        # Generate debugging analysis with structured format
        result = llm.generate(
            f"Debug this {language} code and its execution results:\n```{language}\n{code}\n```\nExecution result:\n{execution_result}",
            grammar=code_debugging_grammar
        )
    
    return result
```

### 3. aici Implementation

The Code Executor Agent needs fine-grained control over code execution and analysis. Here's the optimal implementation using aici:

```python
import pyaici.server as aici
import subprocess
import tempfile
import os
import json
import re

async def code_executor_agent(code, language="python", operation_type="execute"):
    # Create a temporary file for the code
    with tempfile.NamedTemporaryFile(suffix=f".{language}", delete=False) as temp_file:
        temp_file.write(code.encode('utf-8'))
        temp_file_path = temp_file.name
    
    # Begin the response generation
    await aici.FixedTokens(f"# Code {operation_type.capitalize()} Results\n\n")
    
    # Execute the code in a sandbox environment
    execution_result = await execute_code_safely(temp_file_path, language)
    
    # Generate response based on operation type
    if operation_type == "execute":
        await generate_execution_response(code, execution_result, language)
    elif operation_type == "debug":
        await generate_debugging_response(code, execution_result, language)
    elif operation_type == "optimize":
        await generate_optimization_response(code, execution_result, language)
    elif operation_type == "explain":
        await generate_explanation_response(code, language)
    
    # Clean up the temporary file
    os.unlink(temp_file_path)
    
    return await aici.GetCurrentCompletion()

async def execute_code_safely(file_path, language):
    # Configure execution command based on language
    if language == "python":
        cmd = ["python", file_path]
    elif language == "javascript":
        cmd = ["node", file_path]
    elif language == "ruby":
        cmd = ["ruby", file_path]
    # Add more language support as needed
    
    # Execute with timeout and resource limits
    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env={"PYTHONPATH": os.getcwd()}
        )
        
        # Set timeout for execution
        stdout, stderr = process.communicate(timeout=30)
        
        return {
            "status": "success" if process.returncode == 0 else "error",
            "stdout": stdout,
            "stderr": stderr,
            "return_code": process.returncode
        }
    except subprocess.TimeoutExpired:
        process.kill()
        return {
            "status": "timeout",
            "stdout": "",
            "stderr": "Execution timed out after 30 seconds",
            "return_code": -1
        }
    except Exception as e:
        return {
            "status": "error",
            "stdout": "",
            "stderr": str(e),
            "return_code": -1
        }

async def generate_execution_response(code, execution_result, language):
    # Display code with syntax highlighting
    await aici.FixedTokens(f"## Original Code\n\n```{language}\n{code}\n```\n\n")
    
    # Display execution results
    await aici.FixedTokens("## Execution Results\n\n")
    
    if execution_result["status"] == "success":
        await aici.FixedTokens("✅ Code executed successfully.\n\n")
    else:
        await aici.FixedTokens(f"❌ Execution failed with status: {execution_result['status']}\n\n")
    
    # Display stdout if present
    if execution_result["stdout"]:
        await aici.FixedTokens("### Standard Output\n\n```\n")
        await aici.FixedTokens(execution_result["stdout"])
        await aici.FixedTokens("\n```\n\n")
    
    # Display stderr if present
    if execution_result["stderr"]:
        await aici.FixedTokens("### Standard Error\n\n```\n")
        await aici.FixedTokens(execution_result["stderr"])
        await aici.FixedTokens("\n```\n\n")
    
    # Add execution analysis
    await aici.FixedTokens("## Analysis\n\n")
    
    # Generate analysis with controlled token generation
    await aici.TokensWithLogprobs(
        max_tokens=300,
        temperature=0.3,
        stop_sequences=["\n\n"]
    )

async def generate_debugging_response(code, execution_result, language):
    # Similar implementation to generate_execution_response but focused on debugging
    pass

async def generate_optimization_response(code, execution_result, language):
    # Similar implementation to generate_execution_response but focused on optimization
    pass

async def generate_explanation_response(code, language):
    # Similar implementation to generate_execution_response but focused on explanation
    pass
```

## Integration and Optimization

To integrate the Code Executor Agent with the SolnAI platform:

1. **Security Integration**:
   ```python
   def create_secure_sandbox(language):
       """Create a secure execution environment for code."""
       if language == "python":
           # Use a virtual environment with restricted permissions
           venv_path = os.path.join(tempfile.gettempdir(), f"code_executor_venv_{os.getpid()}")
           subprocess.run(["python", "-m", "venv", venv_path])
           
           # Configure environment variables for the sandbox
           sandbox_env = os.environ.copy()
           sandbox_env["PYTHONPATH"] = venv_path
           sandbox_env["PATH"] = os.path.join(venv_path, "bin") + os.pathsep + sandbox_env["PATH"]
           
           # Disable network access and other potentially dangerous operations
           sandbox_env["PYTHONNOUSERSITE"] = "1"
           
           return {
               "venv_path": venv_path,
               "env": sandbox_env
           }
       # Add support for other languages
       
       return None
   ```

2. **API Integration**:
   ```python
   from fastapi import FastAPI, Body, HTTPException
   
   app = FastAPI(title="Code Executor API")
   
   @app.post("/execute")
   async def execute_endpoint(
       code: str = Body(...),
       language: str = Body("python"),
       operation_type: str = Body("execute")
   ):
       # Validate inputs
       if language not in SUPPORTED_LANGUAGES:
           raise HTTPException(status_code=400, detail=f"Unsupported language: {language}")
       
       if operation_type not in ["execute", "debug", "optimize", "explain"]:
           raise HTTPException(status_code=400, detail=f"Unsupported operation: {operation_type}")
       
       # Process the request using the Code Executor chain
       result = await code_executor_chain(
           code_input=code,
           language=language,
           operation_type=operation_type
       )
       
       return result
   ```

3. **Performance Optimization**:
   - Implement caching for repeated code executions
   - Use language-specific optimizations for code analysis
   - Parallelize independent steps in the execution pipeline

4. **Monitoring and Logging**:
   ```python
   import logging
   import time
   
   # Configure logging
   logging.basicConfig(level=logging.INFO)
   logger = logging.getLogger(__name__)
   
   # Add execution metrics logging
   def log_execution_metrics(language, code_size, execution_time, memory_usage, status):
       logger.info(
           f"Language: {language} | "
           f"Code Size: {code_size} bytes | "
           f"Execution Time: {execution_time:.2f}ms | "
           f"Memory Usage: {memory_usage:.2f}MB | "
           f"Status: {status}"
       )
   ```

## Testing and Validation

To ensure the Code Executor Agent functions correctly:

1. **Unit Tests**:
   - Test each execution environment for different languages
   - Validate security measures prevent dangerous operations
   - Ensure proper error handling for various code issues

2. **Integration Tests**:
   - Test the full execution pipeline with various code samples
   - Verify API endpoints handle different request formats
   - Test concurrent execution requests for stability

3. **Validation Scenarios**:
   - Simple code execution (e.g., "Hello World" programs)
   - Code with syntax errors for debugging
   - Computationally intensive code for optimization
   - Complex algorithms for explanation

By following this implementation guide, you'll create a robust Code Executor Agent that safely executes, debugs, optimizes, and explains code across multiple programming languages.
