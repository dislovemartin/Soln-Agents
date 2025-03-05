# Crawl4AI Agent Implementation Guide

## Name
crawl4AI-agent

## Description
The Crawl4AI Agent is a specialized intelligent web crawling and data extraction agent for SolnAI. Built on AutoGen v0.4.7 with Claude 3.7 Sonnet integration, it autonomously navigates websites, extracts structured data, and integrates the information with other SolnAI agents. The agent handles various content types including HTML, PDF, images (via OCR), and JavaScript-rendered content while respecting ethical crawling practices.

## Implementation

### Core Modules Integration

#### llm-chain Integration
The Crawl4AI Agent uses llm-chain to orchestrate the complex workflow of web crawling and content processing:

```python
from llm_chain import Chain, Step

def crawl_website_chain(start_url, max_depth=3, extraction_criteria=None):
    """
    Create a chain for crawling a website and extracting information.
    
    Args:
        start_url: The starting URL for crawling
        max_depth: Maximum depth for crawling
        extraction_criteria: Criteria for extracting content
        
    Returns:
        A configured Chain object
    """
    chain = Chain.new()
    
    # Step 1: Validate and normalize the URL
    chain.step(Step.new("validate_url", validate_and_normalize_url))
    
    # Step 2: Check robots.txt and crawling permissions
    chain.step(Step.new("check_robots_txt", check_robots_txt, 
                       depends_on=["validate_url"]))
    
    # Step 3: Fetch initial page content
    chain.step(Step.new("fetch_page", fetch_page_content, 
                       depends_on=["check_robots_txt"]))
    
    # Step 4: Parse content based on content type
    chain.step(Step.new("parse_content", parse_content_by_type, 
                       depends_on=["fetch_page"]))
    
    # Step 5: Extract relevant information
    chain.step(Step.new("extract_information", extract_relevant_information, 
                       depends_on=["parse_content"]))
    
    # Step 6: Discover and filter links for further crawling
    chain.step(Step.new("discover_links", discover_and_filter_links, 
                       depends_on=["parse_content"]))
    
    # Step 7: Recursive crawling with depth control
    chain.step(Step.new("recursive_crawl", recursive_crawl_with_depth_control, 
                       depends_on=["discover_links", "extract_information"]))
    
    # Step 8: Consolidate and structure extracted information
    chain.step(Step.new("consolidate_information", consolidate_extracted_information, 
                       depends_on=["recursive_crawl"]))
    
    # Step 9: Generate summary of crawled content
    chain.step(Step.new("generate_summary", generate_content_summary, 
                       depends_on=["consolidate_information"]))
    
    return chain
```

#### llguidance Integration
The agent uses llguidance to ensure structured outputs for extracted web content:

```python
from llguidance import Guidance

# Define schema for extracted web content
web_content_schema = {
    "type": "object",
    "properties": {
        "page_info": {
            "type": "object",
            "properties": {
                "url": {"type": "string"},
                "title": {"type": "string"},
                "last_modified": {"type": "string"},
                "content_type": {"type": "string"}
            },
            "required": ["url", "title", "content_type"]
        },
        "content": {
            "type": "object",
            "properties": {
                "main_text": {"type": "string"},
                "headings": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "level": {"type": "integer"},
                            "text": {"type": "string"}
                        }
                    }
                },
                "links": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "text": {"type": "string"},
                            "url": {"type": "string"},
                            "is_internal": {"type": "boolean"}
                        }
                    }
                },
                "images": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "alt_text": {"type": "string"},
                            "url": {"type": "string"},
                            "ocr_text": {"type": "string"}
                        }
                    }
                },
                "tables": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "headers": {
                                "type": "array",
                                "items": {"type": "string"}
                            },
                            "rows": {
                                "type": "array",
                                "items": {
                                    "type": "array",
                                    "items": {"type": "string"}
                                }
                            }
                        }
                    }
                }
            },
            "required": ["main_text"]
        },
        "metadata": {
            "type": "object",
            "properties": {
                "crawl_depth": {"type": "integer"},
                "crawl_timestamp": {"type": "string"},
                "processing_time": {"type": "number"}
            }
        }
    },
    "required": ["page_info", "content"]
}

# Create guidance for structured extraction
extraction_guidance = Guidance.new().with_json_schema(web_content_schema)
```

#### aici Integration
The agent implements aici for real-time control over web content processing:

```python
import aici

async def process_web_content(url, content_type, raw_content):
    """
    Process web content with real-time control based on content type and structure.
    
    Args:
        url: URL of the content
        content_type: Type of content (html, pdf, image, etc.)
        raw_content: Raw content to process
        
    Returns:
        Processed and structured content
    """
    # Determine content processing approach
    if content_type == "text/html":
        await aici.FixedTokens("Processing HTML content...\n")
        
        # Check if content is a product page
        if await aici.detect_product_page(raw_content):
            await aici.FixedTokens("Detected product page, extracting product information...\n")
            return await extract_product_information(raw_content)
        
        # Check if content is an article
        elif await aici.detect_article_page(raw_content):
            await aici.FixedTokens("Detected article page, extracting article content...\n")
            return await extract_article_content(raw_content)
        
        # Default HTML processing
        else:
            await aici.FixedTokens("Processing general HTML content...\n")
            return await process_general_html(raw_content)
    
    # Process PDF content
    elif content_type == "application/pdf":
        await aici.FixedTokens("Processing PDF content...\n")
        return await process_pdf_content(raw_content)
    
    # Process image content with OCR
    elif content_type.startswith("image/"):
        await aici.FixedTokens("Processing image content with OCR...\n")
        return await process_image_with_ocr(raw_content)
    
    # Default processing for other content types
    else:
        await aici.FixedTokens(f"Processing {content_type} content...\n")
        return await process_generic_content(raw_content)
```

### Architecture
The Crawl4AI Agent uses a single-agent architecture with specialized components:

1. **Crawler Engine**: Core component for web navigation and content retrieval
2. **Content Processor**: Extracts and processes different content types
3. **LLM Integration**: Uses Claude 3.7 Sonnet for content understanding and summarization
4. **Memory Store**: Maintains context and history of crawled content
5. **API Interface**: Exposes functionality to other SolnAI agents

### Code Structure
```python
class Crawl4AIAgent(ConversableAgent):
    """Agent for web crawling and data extraction."""
    
    def __init__(self, name, system_message, llm_config, **kwargs):
        """Initialize the Crawl4AI agent."""
        super().__init__(name=name, system_message=system_message, 
                         llm_config=llm_config, **kwargs)
        self.visited_urls = set()
        self.url_content_cache = {}
        self.rate_limit = float(os.getenv("CRAWL4AI_RATE_LIMIT", "5"))
        self.max_depth = int(os.getenv("CRAWL4AI_MAX_DEPTH", "3"))
        self.user_agent = os.getenv(
            "CRAWL4AI_USER_AGENT", 
            "Crawl4AI Bot (https://solnai.com/bot)"
        )
        self.last_request_time = 0
        
    def crawl_website(self, url, depth=0, extraction_criteria=None):
        """Crawl a website starting from the given URL."""
        # Implementation details...
        
    def fetch_page(self, url):
        """Fetch page content with rate limiting and politeness."""
        # Implementation details...
        
    def parse_content(self, url, content, content_type):
        """Parse content based on its type."""
        # Implementation details...
        
    def extract_information(self, parsed_content, criteria=None):
        """Extract relevant information based on criteria."""
        # Implementation details...
        
    def discover_links(self, url, parsed_content):
        """Discover and filter links for further crawling."""
        # Implementation details...
```

### Performance Optimization
- **URL Caching**: Caching visited URLs to avoid redundant crawling
- **Rate Limiting**: Implementing configurable rate limiting to respect server resources
- **Selective Crawling**: Using semantic relevance to prioritize which links to follow
- **Content Type Detection**: Optimizing processing based on content type

### Ethical Considerations
- **Robots.txt Compliance**: Respecting website crawling policies
- **Rate Limiting**: Implementing configurable rate limiting to prevent server overload
- **User-Agent Identification**: Clearly identifying the bot with a configurable user-agent
- **Content Attribution**: Properly attributing content to its source

## Example Usage

### Basic Website Crawling
```python
from crawl4ai import Crawl4AIAgent
from autogen import UserProxyAgent
import anthropic

# Initialize the agent
crawl_agent = Crawl4AIAgent(
    name="crawl4ai",
    system_message="You are an intelligent web crawling agent that can navigate websites, extract information, and summarize content.",
    llm_config={
        "config_list": [{"model": "claude-3.7-sonnet", "api_key": os.getenv("ANTHROPIC_API_KEY")}],
        "temperature": 0.2,
    }
)

# Create a user proxy agent
user_proxy = UserProxyAgent(
    name="user_proxy",
    human_input_mode="TERMINATE",
    max_consecutive_auto_reply=10,
    is_termination_msg=lambda x: x.get("content", "") and "TERMINATE" in x.get("content", "")
)

# Start a conversation
user_proxy.initiate_chat(
    crawl_agent,
    message="Crawl https://example.com and extract all product information."
)
```

### Integration with Other SolnAI Agents
```python
from crawl4ai import Crawl4AIAgent
from other_agent import ResearchAgent
from autogen import GroupChat, GroupChatManager

# Initialize agents
crawl_agent = Crawl4AIAgent(
    name="crawl4ai",
    system_message="You are an intelligent web crawling agent that can navigate websites, extract information, and summarize content.",
    llm_config={
        "config_list": [{"model": "claude-3.7-sonnet", "api_key": os.getenv("ANTHROPIC_API_KEY")}],
        "temperature": 0.2,
    }
)

research_agent = ResearchAgent(
    name="researcher",
    system_message="You are a research agent that can analyze information and generate insights.",
    llm_config={
        "config_list": [{"model": "claude-3.7-sonnet", "api_key": os.getenv("ANTHROPIC_API_KEY")}],
        "temperature": 0.3,
    }
)

# Set up group chat
group_chat = GroupChat(
    agents=[crawl_agent, research_agent, user_proxy],
    messages=[],
    max_round=20
)

# Create manager
manager = GroupChatManager(
    groupchat=group_chat,
    llm_config={
        "config_list": [{"model": "claude-3.7-sonnet", "api_key": os.getenv("ANTHROPIC_API_KEY")}],
        "temperature": 0.2,
    }
)

# Start the group chat
user_proxy.initiate_chat(
    manager,
    message="Research the latest developments in quantum computing by crawling relevant websites and analyzing the information."
)
```

## Testing
The agent includes comprehensive testing for:
- URL validation and normalization
- Content fetching and parsing
- Information extraction accuracy
- Rate limiting and politeness mechanisms
- Error handling and recovery

Tests are automated and run against both mock websites and real-world websites to ensure reliable performance across different scenarios.
