# Research Agent Implementation Guide

## Name
research-agent

## Description
The Research Agent is an intelligent assistant that specializes in conducting comprehensive research, analyzing information, and generating well-structured reports. Built on AutoGen v0.4.7 with Claude 3.7 Sonnet integration, this agent provides high-quality research capabilities within the SolnAI ecosystem. It can conduct in-depth research on any given topic, analyze information from multiple sources, generate structured reports, answer complex questions, and support interactive research sessions.

## Implementation

### Core Modules Integration

#### llm-chain Integration
The Research Agent uses llm-chain concepts through AutoGen's sequential workflow orchestration:

```python
from llm_chain import Chain, Step

def research_workflow_chain(topic):
    """
    Create a chain for research workflow.
    
    Args:
        topic: Research topic to investigate
        
    Returns:
        A configured Chain object
    """
    chain = Chain.new()
    
    # Step 1: Information gathering
    chain.step(Step.new("web_search", search_for_information,
                        config={"max_results": 10, "sort_by_relevance": True}))
    
    # Step 2: Data extraction and preprocessing
    chain.step(Step.new("extract_data", extract_relevant_data, 
                       depends_on=["web_search"]))
    
    # Step 3: Information analysis
    chain.step(Step.new("analyze_data", analyze_research_data, 
                       depends_on=["extract_data"]))
    
    # Step 4: Report generation
    chain.step(Step.new("generate_report", create_research_report, 
                       depends_on=["analyze_data"]))
    
    return chain.execute({
        "topic": topic,
        "format": "markdown",
        "include_sources": True
    })

# Implementation in AutoGen format
async def research(self, topic: str) -> Dict[str, Any]:
    """
    Conduct research on a given topic.
    
    Args:
        topic: Research topic
        
    Returns:
        Dict with research results
    """
    logger.info(f"Starting research on topic: {topic}")
    
    # Create the research request
    research_request = TextMessage(
        content=f"Conduct comprehensive research on the following topic: {topic}", 
        source="user"
    )
    
    # Get the research response
    response = await self.researcher.on_messages(
        [research_request],
        cancellation_token=CancellationToken(),
    )
    
    # Extract the research results
    research_results = {
        "topic": topic,
        "response": response.chat_message.content,
        "inner_messages": [str(msg) for msg in response.inner_messages]
    }
    
    logger.info(f"Research completed for topic: {topic}")
    return research_results
```

#### llguidance Integration
The agent uses llguidance concepts through structured output formatting:

```python
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

# Define structured schema for research reports
class ResearchSource(BaseModel):
    """Information about a research source."""
    title: str = Field(..., description="Source title")
    url: Optional[str] = Field(None, description="Source URL if available")
    author: Optional[str] = Field(None, description="Source author if available")
    publication_date: Optional[str] = Field(None, description="Publication date if available")
    credibility_score: Optional[float] = Field(None, description="Source credibility score (0-10)")

class ResearchSection(BaseModel):
    """A section in a research report."""
    title: str = Field(..., description="Section title")
    content: str = Field(..., description="Section content in markdown format")
    subsections: Optional[List['ResearchSection']] = Field(None, description="Optional subsections")

class ResearchFinding(BaseModel):
    """A key finding from the research."""
    finding: str = Field(..., description="The finding statement")
    evidence: str = Field(..., description="Evidence supporting the finding")
    confidence: float = Field(..., description="Confidence score (0-10)")
    sources: List[int] = Field(..., description="List of source indices that support this finding")

class ResearchReport(BaseModel):
    """Complete research report structure."""
    topic: str = Field(..., description="Research topic")
    summary: str = Field(..., description="Executive summary of findings")
    sections: List[ResearchSection] = Field(..., description="Report sections")
    key_findings: List[ResearchFinding] = Field(..., description="Key research findings")
    sources: List[ResearchSource] = Field(..., description="Sources referenced in the report")
    limitations: Optional[str] = Field(None, description="Research limitations")
    
# Implementation in the report generation method
async def generate_report(self, topic: str, report_format: str = "markdown") -> Dict[str, Any]:
    """
    Generate a structured research report on a given topic with guidance.
    
    Args:
        topic: Report topic
        report_format: Format of the report (markdown, json, etc.)
        
    Returns:
        Dict with report and metadata
    """
    # Create report request with structured guidance
    structured_prompt = f"""
    Generate a comprehensive research report on '{topic}'. 
    Format the report in {report_format}.
    
    Follow this structure:
    1. Executive Summary
    2. Introduction
    3. Methodology
    4. Key Findings
    5. Detailed Analysis (with sub-sections as needed)
    6. Conclusions
    7. References
    
    Ensure each section is well-developed with specific details and insights.
    """
    
    report_request = TextMessage(content=structured_prompt, source="user")
    
    # Get the report response with structured guidance
    response = await self.researcher.on_messages(
        [report_request],
        cancellation_token=CancellationToken(),
    )
    
    return {
        "topic": topic,
        "format": report_format,
        "report": response.chat_message.content,
        "inner_messages": [str(msg) for msg in response.inner_messages]
    }
```

#### aici Integration
The agent implements aici concepts through its tool-based interactions:

```python
# Conceptual implementation of aici in research context
async def _web_search(self, query: str) -> str:
    """
    Perform web search with real-time control.
    """
    await aici.FixedTokens(f"Searching for information on '{query}'...\n")
    
    # Detect query type to tailor search approach
    if "latest" in query or "recent" in query or "current" in query:
        await aici.FixedTokens("Detected request for recent information. Prioritizing recency in search results...\n")
        search_params = {"recency_priority": True}
    elif "historical" in query or "history" in query or "evolution" in query:
        await aici.FixedTokens("Detected request for historical information. Prioritizing comprehensive timeline in search results...\n")
        search_params = {"historical_priority": True}
    elif "statistical" in query or "statistics" in query or "data" in query:
        await aici.FixedTokens("Detected request for statistical information. Prioritizing data sources in search results...\n")
        search_params = {"data_priority": True}
    else:
        await aici.FixedTokens("Performing general search with balanced priorities...\n")
        search_params = {"balanced": True}
    
    # Perform search with appropriate parameters
    search_results = perform_search(query, search_params)
    
    # Analyze result quality
    if len(search_results) < 3:
        await aici.FixedTokens("Limited results found. Broadening search criteria...\n")
        search_results = perform_search(query, {"broaden": True})
    
    await aici.FixedTokens(f"Found {len(search_results)} relevant sources. Processing information...\n")
    return format_search_results(search_results)
```

### Architecture
The Research Agent uses a single-agent architecture with the following components:

1. **AnthropicChatCompletionClient**: Powers communication with Claude 3.7 Sonnet
2. **AssistantAgent**: Handles core research functionality
3. **UserProxyAgent**: Manages user interactions
4. **BufferedChatCompletionContext**: Maintains conversation context efficiently
5. **Tool Functions**: Simulated web search, data extraction, and analysis capabilities

### Code Structure
```python
class ResearchAgent:
    """
    Research Agent for conducting in-depth research and information analysis.
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize the Research Agent."""
        # Initialize model client, researcher agent, and user proxy
        
    async def _web_search(self, query: str) -> str:
        """Simulate web search to find information."""
        # Implementation details...
    
    async def _extract_data(self, text: str, extraction_pattern: Dict[str, Any]) -> Dict[str, Any]:
        """Extract structured data from text."""
        # Implementation details...
    
    async def _analyze_data(self, data: Dict[str, Any], analysis_type: str) -> Dict[str, Any]:
        """Analyze data to extract insights."""
        # Implementation details...
    
    async def research(self, topic: str) -> Dict[str, Any]:
        """Conduct research on a given topic."""
        # Implementation details...
    
    async def answer_question(self, question: str) -> Dict[str, Any]:
        """Answer a complex question with detailed research."""
        # Implementation details...
    
    async def generate_report(self, topic: str, report_format: str = "markdown") -> Dict[str, Any]:
        """Generate a structured research report on a given topic."""
        # Implementation details...
    
    async def run_interactive_session(self) -> None:
        """Run an interactive research session where the user can ask questions."""
        # Implementation details...
```

### Performance Optimization
- **Buffered Context**: Maintains efficient conversation history with `BufferedChatCompletionContext`
- **Cancellation Support**: Uses `CancellationToken` to allow graceful termination
- **Simulated Tool Functions**: Provides placeholders for real implementations
- **Asynchronous Operations**: Uses `async/await` for non-blocking operations

### Ethical Considerations
- **Source Attribution**: Encourages citation of sources
- **Acknowledging Limitations**: Explicitly mentions limitations in research findings
- **Maintaining Objectivity**: System prompt emphasizes avoiding biases
- **Information Quality**: Focuses on comprehensive and accurate information

## Example Usage

### Basic Research
```python
import asyncio
from research_agent import ResearchAgent

async def run_research():
    # Initialize the agent
    agent = ResearchAgent(api_key="your_anthropic_api_key")
    
    # Conduct research on a topic
    results = await agent.research("The impact of artificial intelligence on healthcare")
    
    # Print the research results
    print(f"Research topic: {results['topic']}")
    print(f"Research findings:\n{results['response']}")

# Run the research
asyncio.run(run_research())
```

### Report Generation
```python
import asyncio
from research_agent import ResearchAgent

async def generate_markdown_report():
    # Initialize the agent
    agent = ResearchAgent(api_key="your_anthropic_api_key")
    
    # Generate a research report in markdown format
    report = await agent.generate_report(
        topic="Sustainable urban development in the 21st century",
        report_format="markdown"
    )
    
    # Save the report to a file
    with open("research_report.md", "w") as f:
        f.write(report["report"])
    
    print(f"Report generated and saved to research_report.md")

# Generate the report
asyncio.run(generate_markdown_report())
```

### Question Answering
```python
import asyncio
from research_agent import ResearchAgent

async def answer_complex_question():
    # Initialize the agent
    agent = ResearchAgent(api_key="your_anthropic_api_key")
    
    # Ask a complex question
    answer = await agent.answer_question(
        "What are the potential implications of quantum computing on modern cryptography systems?"
    )
    
    # Print the answer
    print(f"Question: {answer['question']}")
    print(f"Answer:\n{answer['answer']}")

# Get the answer
asyncio.run(answer_complex_question())
```

### Interactive Session
```python
import asyncio
from research_agent import ResearchAgent

async def run_interactive_session():
    # Initialize the agent
    agent = ResearchAgent(api_key="your_anthropic_api_key")
    
    # Start an interactive session
    await agent.run_interactive_session()

# Run the interactive session
asyncio.run(run_interactive_session())
```

## Testing
The agent includes comprehensive testing for:
- Research quality and depth
- Report structure and formatting
- Question answering accuracy
- Tool function integration

Tests cover both successful scenarios and error handling to ensure robust performance across various research contexts.
