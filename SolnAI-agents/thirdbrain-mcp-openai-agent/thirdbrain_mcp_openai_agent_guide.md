# ThirdBrAIn MCP OpenAI Agent Implementation Guide

## Name
thirdbrain-mcp-openai-agent

## Description
The ThirdBrAIn MCP OpenAI Agent is a sophisticated bridge that makes Model Context Protocol (MCP) tools accessible to OpenAI-compatible language models. This agent enables the use of MCP servers across a wide range of models including OpenAI's GPT models, Deepseek models, and Ollama-hosted models. The agent centralizes resources, prompts, and tools while hiding implementation details, following the DRY (Don't Repeat Yourself) concept for distributed agentic systems.

## Implementation

### Core Modules Integration

#### llm-chain Integration
The ThirdBrAIn MCP OpenAI Agent implements llm-chain concepts through its workflow orchestration:

```python
from pydantic_ai import Agent, RunContext
from mcp import ClientSession

# Conceptual implementation of llm-chain using MCP client
def create_mcp_workflow_chain():
    chain = Chain.new()
    
    # Step 1: Initialize MCP connections
    chain.step(Step.new("initialize_mcp", initialize_mcp_connections))
    
    # Step 2: Process user query
    chain.step(Step.new("process_query", process_user_query, 
                       depends_on=["initialize_mcp"]))
    
    # Step 3: Identify required tools
    chain.step(Step.new("identify_tools", identify_required_tools, 
                       depends_on=["process_query"]))
    
    # Step 4: Execute tools via MCP
    chain.step(Step.new("execute_tools", execute_mcp_tools, 
                       depends_on=["identify_tools"]))
    
    # Step 5: Synthesize results
    chain.step(Step.new("synthesize_results", synthesize_tool_results, 
                       depends_on=["execute_tools"]))
    
    # Step 6: Generate response
    chain.step(Step.new("generate_response", generate_final_response, 
                       depends_on=["synthesize_results"]))
    
    return chain

# Implementation in the actual agent
async def agent_loop(query: str, tools: dict, messages: List[dict] = None, deps: Deps = None):
    """
    Main interaction loop that processes user queries using the LLM and available tools.
    
    This function:
    1. Sends the user query to the LLM with context about available tools
    2. Processes the LLM's response, including any tool calls
    3. Returns the final response to the user
    """
    # Initialize messages if not provided
    if messages is None:
        messages = [
            {"role": "system", "content": "You are a helpful AI assistant with access to tools."}
        ]
    
    # Add user query to messages
    messages.append({"role": "user", "content": query})
    
    # Continue processing until no more tool calls
    while True:
        # Call the LLM with the current messages and available tools
        response = await client.chat.completions.create(
            model=language_model,
            messages=messages,
            tools=list(tools.values()),
            tool_choice="auto"
        )
        
        # Extract the assistant's message
        assistant_message = response.choices[0].message
        messages.append(assistant_message.model_dump())
        
        # Check if there are tool calls
        if not assistant_message.tool_calls:
            # No tool calls, return the assistant's message
            return assistant_message.content
        
        # Process tool calls
        for tool_call in assistant_message.tool_calls:
            # Extract tool information
            tool_id = tool_call.id
            tool_name = tool_call.function.name
            tool_args = json.loads(tool_call.function.arguments)
            
            # Execute the tool
            try:
                tool_result = await execute_tool(tool_name, tool_args, deps)
                
                # Add tool result to messages
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_id,
                    "name": tool_name,
                    "content": str(tool_result)
                })
            except Exception as e:
                # Handle tool execution error
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_id,
                    "name": tool_name,
                    "content": f"Error executing tool: {str(e)}"
                })
```

#### llguidance Integration
The agent uses llguidance concepts through its structured handling of MCP tool schemas:

```python
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional

# Define structured schema for MCP tool definitions
class MCPParameter(BaseModel):
    name: str = Field(..., description="Name of the parameter")
    type: str = Field(..., description="Type of the parameter (string, number, boolean, etc.)")
    description: str = Field(..., description="Description of the parameter")
    required: bool = Field(False, description="Whether the parameter is required")

class MCPToolDefinition(BaseModel):
    name: str = Field(..., description="Name of the tool")
    description: str = Field(..., description="Description of the tool")
    parameters: Dict[str, MCPParameter] = Field(..., description="Parameters for the tool")
    server: str = Field(..., description="MCP server providing this tool")

class MCPToolResponse(BaseModel):
    success: bool = Field(..., description="Whether the tool execution was successful")
    result: Any = Field(..., description="Result of the tool execution")
    error: Optional[str] = Field(None, description="Error message if the execution failed")

# Implementation in the MCPClient class
def simplify_schema(schema):
    """
    Simplifies a JSON schema by removing unsupported constructs like 'allOf', 'oneOf', etc.,
    and preserving the core structure and properties.
    
    Args:
        schema (dict): The original JSON schema.
        
    Returns:
        dict: A simplified JSON schema.
    """
    if not isinstance(schema, dict):
        return schema
    
    # Create a new schema with only supported fields
    simplified = {}
    
    # Copy basic fields
    for key in ["type", "description", "default", "enum"]:
        if key in schema:
            simplified[key] = schema[key]
    
    # Handle properties
    if "properties" in schema:
        simplified["properties"] = {}
        for prop_name, prop_schema in schema["properties"].items():
            simplified["properties"][prop_name] = simplify_schema(prop_schema)
    
    # Handle required fields
    if "required" in schema:
        simplified["required"] = schema["required"]
    
    # Handle items for arrays
    if "items" in schema and schema.get("type") == "array":
        simplified["items"] = simplify_schema(schema["items"])
    
    return simplified
```

#### aici Integration
The agent implements aici concepts through its dynamic tool handling and real-time control:

```python
# Conceptual implementation of aici in MCPClient context
async def call_tool(self, server__tool_name: str):
    """
    Create a callable function for a specific tool.
    This allows us to execute functions through the MCP server.
    
    Args:
        server__tool_name (str): The name of the tool to create a callable for.
        
    Returns:
        Any: A callable async function that executes the specified tool.
    """
    server_name, tool_name = server__tool_name.split("__", 1)
    
    async def callable(*args, **kwargs):
        # Get the session for the specified server
        session = self.sessions.get(server_name)
        if not session:
            raise ConnectionError(f"No active session for server: {server_name}")
        
        try:
            # Execute the tool with dynamic control based on arguments
            if "temperature" in kwargs:
                await session.stream_tokens(f"Executing {tool_name} with temperature {kwargs['temperature']}...\n")
            elif "max_tokens" in kwargs:
                await session.stream_tokens(f"Executing {tool_name} with max_tokens {kwargs['max_tokens']}...\n")
            else:
                await session.stream_tokens(f"Executing {tool_name}...\n")
            
            # Prepare arguments for the tool
            tool_args = {}
            for arg in args:
                if isinstance(arg, dict):
                    tool_args.update(arg)
            tool_args.update(kwargs)
            
            # Execute the tool with the prepared arguments
            result = await session.call_function(tool_name, tool_args)
            
            # Process the result with dynamic control
            if isinstance(result, dict) and "error" in result:
                await session.stream_tokens(f"Error executing {tool_name}: {result['error']}\n")
                raise ToolError(f"Error executing {tool_name}: {result['error']}")
            
            return result
        except Exception as e:
            # Handle exceptions with dynamic control
            await session.stream_tokens(f"Exception executing {tool_name}: {str(e)}\n")
            raise ToolError(f"Exception executing {tool_name}: {str(e)}")
    
    return callable
```

### Architecture
The ThirdBrAIn MCP OpenAI Agent uses a client-server architecture with the following components:

1. **FastAPI Server**: Provides HTTP endpoints for agent interaction
2. **MCP Client**: Manages connections to MCP servers and tool execution
3. **Supabase Integration**: Stores conversation history and agent state
4. **OpenAI Client**: Interfaces with OpenAI-compatible models
5. **Tool Manager**: Dynamically registers and manages MCP tools

### Code Structure
```python
# Main agent class
class MCPClient:
    """
    A client class for interacting with the MCP server.
    This class manages the connection and communication with the tools through MCP.
    """
    
    def __init__(self):
        # Initialize sessions and agents dictionaries
        self.sessions = {}  # Dictionary to store {server_name: session}
        self.agents = {}  # Dictionary to store {server_name: agent}
        self.exit_stack = AsyncExitStack()
        self.available_tools = []
        self.tools = {}
        self.connected = False
        self.config_file = 'mcp_config.json'
        self.dynamic_tools = []  # List to store dynamic pydantic tools
    
    async def connect_to_server(self):
        """Connect to the MCP server using the configuration file."""
        # Implementation details...
    
    async def call_tool(self, server__tool_name: str):
        """Create a callable function for a specific tool."""
        # Implementation details...
    
    async def get_available_tools(self):
        """Retrieve a list of available tools from the MCP server."""
        # Implementation details...
    
    # Other methods...

# FastAPI endpoint for agent interaction
async def thirdbrain_mcp_openai_agent(
    request: AgentRequest,
    authenticated: bool = Depends(verify_token)
):
    """
    Main endpoint for the ThirdBrAIn MCP OpenAI agent.
    
    This endpoint:
    1. Retrieves conversation history
    2. Processes the user query
    3. Executes any required tools
    4. Returns the response to the user
    """
    # Implementation details...
```

### Performance Optimization
- **Asynchronous Processing**: Using async/await for efficient I/O operations
- **Connection Pooling**: Reusing MCP server connections
- **Schema Simplification**: Optimizing tool schemas for faster processing
- **Message Caching**: Storing conversation history for context

### Ethical Considerations
- **API Key Security**: Securely managing API keys for various services
- **Rate Limiting**: Implementing rate limiting to prevent abuse
- **Error Handling**: Providing clear error messages without exposing sensitive information
- **Audit Logging**: Logging tool usage for accountability

## Example Usage

### Basic Usage with OpenAI Model
```python
import asyncio
import os
from dotenv import load_dotenv
from mcp_client import MCPClient, agent_loop

# Load environment variables
load_dotenv()

# Initialize MCP client
mcp_client = MCPClient()

async def main():
    # Connect to MCP servers
    await mcp_client.connect_to_server()
    
    # Get available tools
    tools = await mcp_client.get_available_tools()
    
    # Process user query
    query = "What's the weather like in Denver next weekend?"
    response = await agent_loop(query, tools)
    
    print(f"Response: {response}")
    
    # Clean up
    await mcp_client.cleanup()

if __name__ == "__main__":
    asyncio.run(main())
```

### Integration with FastAPI
```python
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from mcp_client import MCPClient, agent_loop
from contextlib import asynccontextmanager

# Initialize MCP client
mcp_client = MCPClient()

# Define request and response models
class AgentRequest(BaseModel):
    query: str
    user_id: str
    request_id: str
    session_id: str

class AgentResponse(BaseModel):
    success: bool
    response: str

# Define context manager for startup and shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: connect to MCP servers
    await mcp_client.connect_to_server()
    yield
    # Shutdown: clean up resources
    await mcp_client.cleanup()

# Initialize FastAPI app
app = FastAPI(lifespan=lifespan)
security = HTTPBearer()

# Define authentication function
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials.credentials != os.getenv("API_BEARER_TOKEN"):
        raise HTTPException(status_code=401, detail="Invalid token")
    return True

# Define agent endpoint
@app.post("/agent", response_model=AgentResponse)
async def process_agent_request(
    request: AgentRequest,
    authenticated: bool = Depends(verify_token)
):
    try:
        # Get available tools
        tools = await mcp_client.get_available_tools()
        
        # Process user query
        response = await agent_loop(
            query=request.query,
            tools=tools,
            session_id=request.session_id
        )
        
        return AgentResponse(success=True, response=response)
    except Exception as e:
        return AgentResponse(success=False, response=f"Error: {str(e)}")
```

## Testing
The agent includes comprehensive testing for:
- MCP server connection and tool discovery
- Tool execution and error handling
- Authentication and authorization
- Conversation history management

Tests are automated and run against both mock MCP servers and real MCP servers to ensure reliable performance across different scenarios.
