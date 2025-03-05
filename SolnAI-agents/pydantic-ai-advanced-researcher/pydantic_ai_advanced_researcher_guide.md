# Pydantic AI Advanced Researcher Implementation Guide

## Name
pydantic-ai-advanced-researcher

## Description
The Pydantic AI Advanced Researcher is a sophisticated web search agent that leverages the Brave Search API to provide comprehensive and accurate answers to user queries. What sets this agent apart is its ability to summarize information from multiple search results to create concise yet comprehensive responses. The agent can be configured to use either OpenAI's GPT models or Ollama's local models, making it flexible for various deployment scenarios.

## Implementation

### Core Modules Integration

#### llm-chain Integration
The Pydantic AI Advanced Researcher uses llm-chain concepts through Pydantic AI's agent framework:

```python
from pydantic_ai import Agent, ModelRetry, RunContext
from pydantic_ai.models.openai import OpenAIModel

# Define the search workflow chain
def create_search_workflow_chain():
    chain = Chain.new()
    
    # Step 1: Process and refine the user query
    chain.step(Step.new("refine_query", refine_search_query))
    
    # Step 2: Perform web search using Brave API
    chain.step(Step.new("web_search", perform_brave_search, 
                       depends_on=["refine_query"]))
    
    # Step 3: Extract and process search results
    chain.step(Step.new("process_results", extract_relevant_information, 
                       depends_on=["web_search"]))
    
    # Step 4: Synthesize information into a comprehensive answer
    chain.step(Step.new("synthesize_answer", synthesize_comprehensive_answer, 
                       depends_on=["process_results"]))
    
    # Step 5: Format and present the final response
    chain.step(Step.new("format_response", format_final_response, 
                       depends_on=["synthesize_answer"]))
    
    return chain

# Implementation of the chain using Pydantic AI's agent framework
@web_search_agent.tool
async def search_web(ctx: RunContext[Deps], web_query: str) -> str:
    """Search the web given a query defined to answer the user's question."""
    # This is equivalent to the "web_search" step in the chain
    brave_api_key = ctx.deps.brave_api_key or os.environ.get('BRAVE_API_KEY')
    if not brave_api_key:
        return "Error: Brave API key not provided. Please set the BRAVE_API_KEY environment variable."

    headers = {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': brave_api_key
    }

    params = {
        'q': web_query,
        'count': '10'
    }

    async with ctx.deps.client as client:
        response = await client.get('https://api.search.brave.com/res/v1/web/search', headers=headers, params=params)
        
    if response.status_code != 200:
        return f"Error: Failed to search the web. Status code: {response.status_code}"

    results = response.json()
    
    # Process and synthesize the search results (equivalent to the remaining steps in the chain)
    web_results = []
    for result in results.get('web', {}).get('results', []):
        title = result.get('title', '')
        description = result.get('description', '')
        web_results.append(f"Title: {title}\nDescription: {description}\n")
    
    return "\n".join(web_results) if web_results else "No results found."
```

#### llguidance Integration
The agent uses llguidance concepts through Pydantic AI's structured data handling:

```python
from pydantic import BaseModel, Field
from typing import List, Optional

# Define structured output schema for search results
class SearchResult(BaseModel):
    title: str = Field(..., description="The title of the search result")
    url: str = Field(..., description="The URL of the search result")
    description: str = Field(..., description="A brief description or snippet from the search result")
    
class WebSearchResponse(BaseModel):
    query: str = Field(..., description="The search query that was used")
    results: List[SearchResult] = Field(..., description="List of search results")
    summary: str = Field(..., description="A synthesized summary of the search results")
    
# Implementation using Pydantic AI
@web_search_agent.message
async def answer_with_web_search(
    ctx: RunContext[Deps], 
    question: str,
) -> str:
    """Answer a question by searching the web and synthesizing the results."""
    # Generate an effective search query based on the user's question
    search_query = await ctx.run_tool(
        "generate_search_query",
        question=question,
    )
    
    # Search the web using the generated query
    search_results = await ctx.run_tool(
        "search_web",
        web_query=search_query,
    )
    
    # Parse and structure the search results
    structured_results = WebSearchResponse(
        query=search_query,
        results=[
            SearchResult(
                title=result["title"],
                url=result["url"],
                description=result["description"]
            )
            for result in search_results
        ],
        summary="Synthesized information from the search results..."
    )
    
    # Generate a comprehensive answer based on the structured results
    return f"Based on my research, {structured_results.summary}\n\nSources:\n" + "\n".join(
        f"- {result.title}: {result.url}" for result in structured_results.results[:3]
    )
```

#### aici Integration
The agent implements aici concepts through Pydantic AI's context management:

```python
# Conceptual implementation of aici in Pydantic AI context
@web_search_agent.message
async def answer_with_web_search(
    ctx: RunContext[Deps], 
    question: str,
) -> str:
    """Answer a question by searching the web and synthesizing the results."""
    # Dynamic control of search behavior based on question type
    if "current events" in question.lower() or "news" in question.lower():
        await ctx.stream("I'll search for the latest information on this topic...\n")
        search_params = {
            "fresh": True,
            "count": 15,
            "time_range": "d"  # last day
        }
    elif "historical" in question.lower() or "background" in question.lower():
        await ctx.stream("I'll search for comprehensive background information on this topic...\n")
        search_params = {
            "fresh": False,
            "count": 10,
            "time_range": "a"  # all time
        }
    elif "technical" in question.lower() or "scientific" in question.lower():
        await ctx.stream("I'll search for technical or scientific information on this topic...\n")
        search_params = {
            "fresh": False,
            "count": 10,
            "search_type": "scholarly"
        }
    else:
        await ctx.stream("Searching for information to answer your question...\n")
        search_params = {
            "count": 10
        }
    
    # Generate search query with appropriate parameters
    search_query = await ctx.run_tool(
        "generate_search_query",
        question=question,
    )
    
    # Perform search with dynamic parameters
    search_results = await ctx.run_tool(
        "search_web",
        web_query=search_query,
        **search_params
    )
    
    # Process results and generate response
    # ...
```

### Architecture
The Pydantic AI Advanced Researcher uses a single-agent architecture with the following components:

1. **Query Processor**: Refines user queries for optimal search results
2. **Web Search Engine**: Interfaces with the Brave Search API
3. **Result Synthesizer**: Extracts and combines information from search results
4. **Response Generator**: Creates comprehensive, well-formatted answers

### Code Structure
```python
# Main agent definition
web_search_agent = Agent(
    model,
    system_prompt=f'You are an expert at researching the web to answer user questions. The current date is: {datetime.now().strftime("%Y-%m-%d")}',
    deps_type=Deps,
    retries=2
)

# Web search tool
@web_search_agent.tool
async def search_web(ctx: RunContext[Deps], web_query: str) -> str:
    """Search the web given a query defined to answer the user's question."""
    # Implementation details...

# Main message handler
@web_search_agent.message
async def answer_with_web_search(ctx: RunContext[Deps], question: str) -> str:
    """Answer a question by searching the web and synthesizing the results."""
    # Implementation details...
```

### Performance Optimization
- **Asynchronous Processing**: Using async/await for efficient I/O operations
- **Result Caching**: Caching search results to avoid redundant API calls
- **Query Optimization**: Refining search queries for more relevant results
- **Concurrent Searches**: Performing multiple searches in parallel when needed

### Ethical Considerations
- **Source Attribution**: Properly citing sources in responses
- **Bias Mitigation**: Being aware of and mitigating potential biases in search results
- **Privacy**: Not storing user queries or search results beyond the session
- **Rate Limiting**: Respecting API rate limits to avoid abuse

## Example Usage

### Basic Usage with OpenAI Model
```python
import asyncio
import os
from httpx import AsyncClient
from dotenv import load_dotenv
from pydantic_ai import Agent, RunContext
from pydantic_ai.models.openai import OpenAIModel

load_dotenv()

# Initialize the model and agent
model = OpenAIModel("gpt-4o")
web_search_agent = Agent(
    model,
    system_prompt="You are an expert at researching the web to answer user questions.",
    deps_type=Deps,
    retries=2
)

# Define dependencies
@dataclass
class Deps:
    client: AsyncClient
    brave_api_key: str | None

# Define the main function
async def main():
    async with AsyncClient() as client:
        deps = Deps(client=client, brave_api_key=os.getenv("BRAVE_API_KEY"))
        
        # Get user question
        question = input("What would you like to know? ")
        
        # Get answer from agent
        answer = await web_search_agent.answer_with_web_search(
            question=question,
            deps=deps
        )
        
        print(f"\nAnswer: {answer}")

if __name__ == "__main__":
    asyncio.run(main())
```

### Integration with Streamlit UI
```python
import streamlit as st
import asyncio
import os
from httpx import AsyncClient
from dotenv import load_dotenv
from pydantic_ai import Agent, RunContext
from pydantic_ai.models.openai import OpenAIModel

load_dotenv()

# Initialize the model and agent
model = OpenAIModel("gpt-4o")
web_search_agent = Agent(
    model,
    system_prompt="You are an expert at researching the web to answer user questions.",
    deps_type=Deps,
    retries=2
)

# Define dependencies
@dataclass
class Deps:
    client: AsyncClient
    brave_api_key: str | None

# Streamlit UI
st.title("Web Research Assistant")
st.write("Ask me anything, and I'll search the web for answers!")

# User input
question = st.text_input("What would you like to know?")

if question:
    st.write("Searching the web...")
    
    # Create async function to get answer
    async def get_answer():
        async with AsyncClient() as client:
            deps = Deps(client=client, brave_api_key=os.getenv("BRAVE_API_KEY"))
            return await web_search_agent.answer_with_web_search(
                question=question,
                deps=deps
            )
    
    # Run async function and display result
    answer = asyncio.run(get_answer())
    st.write("### Answer")
    st.write(answer)
```

## Testing
The agent includes comprehensive testing for:
- Query processing accuracy
- Web search functionality
- Result synthesis quality
- Error handling and recovery

Tests are automated and run against a variety of question types to ensure consistent performance across different domains and query complexities.
