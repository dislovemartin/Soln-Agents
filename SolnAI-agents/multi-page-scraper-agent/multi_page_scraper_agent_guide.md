# Multi-Page Scraper Agent Implementation Guide

## Overview

The Multi-Page Scraper Agent is designed to efficiently extract, process, and organize information from multiple web pages. This guide details how to implement the SolnAI core modules (llm-chain, llguidance, and aici) for this specific agent.

## Implementation Details

### 1. llm-chain Implementation

The Multi-Page Scraper Agent requires a robust workflow to handle multiple pages, extract relevant information, and process the results. Here's the optimal implementation using llm-chain:

```python
from llm_chain import Chain, Step

def multi_page_scraper_chain(start_url, max_pages=10, depth=2, extraction_schema=None, filters=None):
    # Define the processing steps with optimal dependencies
    steps = [
        Step("initialize_crawler", initialize_web_crawler, 
             config={"user_agent": "SolnAI Scraper/1.0", "respect_robots_txt": True, 
                     "request_delay": 1.5, "timeout": 30}),
        
        Step("analyze_start_page", analyze_page_structure, 
             depends_on=["initialize_crawler"],
             config={"extract_links": True, "identify_patterns": True, "detect_pagination": True}),
        
        Step("generate_crawl_plan", generate_crawl_strategy, 
             depends_on=["analyze_start_page"],
             config={"max_pages": max_pages, "max_depth": depth, "prioritize_relevance": True}),
        
        Step("extract_page_links", extract_navigation_links, 
             depends_on=["analyze_start_page"],
             config={"filter_external": True, "filter_duplicates": True}),
        
        Step("crawl_pages", execute_crawl_strategy, 
             depends_on=["generate_crawl_plan", "extract_page_links"],
             config={"parallel_requests": 3, "retry_count": 2, "handle_javascript": True}),
        
        Step("extract_content", extract_page_content, 
             depends_on=["crawl_pages"],
             config={"extraction_schema": extraction_schema, "clean_html": True, 
                     "extract_text": True, "extract_metadata": True}),
        
        Step("process_content", process_extracted_content, 
             depends_on=["extract_content"],
             config={"normalize_text": True, "remove_boilerplate": True, 
                     "detect_language": True, "handle_encoding": True}),
        
        Step("filter_content", filter_content_by_relevance, 
             depends_on=["process_content"],
             config={"filters": filters, "min_content_length": 100, 
                     "relevance_threshold": 0.6, "remove_duplicates": True}),
        
        Step("structure_data", structure_extracted_data, 
             depends_on=["filter_content"],
             config={"format": "json", "normalize_fields": True, 
                     "handle_missing_data": "ignore"}),
        
        Step("generate_metadata", generate_dataset_metadata, 
             depends_on=["structure_data", "crawl_pages"],
             config={"include_timestamps": True, "include_source_urls": True, 
                     "include_statistics": True}),
        
        Step("compile_results", compile_final_dataset, 
             depends_on=["structure_data", "generate_metadata"],
             config={"output_format": "json", "include_metadata": True, 
                     "compress_output": False})
    ]
    
    # Create and execute the chain with optimal batch size and concurrency
    chain = Chain(steps, batch_size=2, max_concurrency=4)
    
    # Prepare input data
    input_data = {
        "start_url": start_url,
        "max_pages": max_pages,
        "depth": depth,
        "extraction_schema": extraction_schema,
        "filters": filters
    }
    
    return chain.execute(**input_data)
```

### 2. llguidance Implementation

The Multi-Page Scraper Agent needs to ensure structured extraction of content from web pages. Here's the optimal implementation using llguidance:

```python
from llguidance import Grammar, JSONSchema

# Define the schema for extraction patterns with optimal constraints
extraction_schema = JSONSchema("""
{
  "type": "object",
  "properties": {
    "page_url": { "type": "string", "format": "uri" },
    "page_title": { "type": "string" },
    "extraction_patterns": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "selector": { 
            "type": "string",
            "description": "CSS selector or XPath expression"
          },
          "selector_type": { 
            "type": "string", 
            "enum": ["css", "xpath", "regex"]
          },
          "attribute": { 
            "type": "string",
            "description": "HTML attribute to extract (e.g., 'text', 'href', 'src')"
          },
          "required": { "type": "boolean" },
          "multiple": { "type": "boolean" },
          "post_process": {
            "type": "array",
            "items": {
              "type": "string",
              "enum": ["trim", "normalize_whitespace", "extract_number", "extract_date", "remove_html"]
            }
          }
        },
        "required": ["name", "selector", "selector_type"]
      },
      "minItems": 1
    },
    "content_filters": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "field": { "type": "string" },
          "operator": { 
            "type": "string", 
            "enum": ["contains", "not_contains", "equals", "not_equals", "greater_than", "less_than", "matches_regex"]
          },
          "value": { "type": "string" }
        },
        "required": ["field", "operator", "value"]
      }
    },
    "pagination": {
      "type": "object",
      "properties": {
        "selector": { "type": "string" },
        "selector_type": { 
          "type": "string", 
          "enum": ["css", "xpath"]
        },
        "max_pages": { "type": "integer", "minimum": 1 },
        "page_param": { "type": "string" }
      }
    }
  },
  "required": ["page_url", "extraction_patterns"]
}
""")

# Define the grammar for CSS selectors
css_selector_grammar = Grammar("""
css_selector ::= simple_selector_sequence (combinator simple_selector_sequence)*
simple_selector_sequence ::= element_name? (id | class | attribute | pseudo)*
element_name ::= /[a-zA-Z0-9]+/
id ::= /#[a-zA-Z0-9_-]+/
class ::= /\.[a-zA-Z0-9_-]+/
attribute ::= /\[[a-zA-Z0-9_-]+(=['"a-zA-Z0-9_-]+)?]/
pseudo ::= /:[a-zA-Z0-9_-]+(\([^)]*\))?/
combinator ::= />/ | /\+/ | /~/ | /\s+/
""")

# Define the grammar for XPath expressions
xpath_grammar = Grammar("""
xpath_expr ::= absolute_path | relative_path
absolute_path ::= /\/([^\/]+\/)*[^\/]+/
relative_path ::= /([^\/]+\/)*[^\/]+/
""")

# Define the grammar for regex patterns
regex_grammar = Grammar("""
regex_pattern ::= /^\/.*\/[gimuy]*$/
""")

# Apply the schemas to constrain the LLM output
def generate_extraction_config(url, page_content, target_data_description):
    # Generate extraction schema with structured output
    extraction_prompt = f"""
    Create an extraction configuration for the webpage at {url}.
    The page content is: {page_content[:1000]}...
    We need to extract the following information: {target_data_description}
    """
    
    # Generate extraction schema with appropriate constraints
    extraction_config = llm.generate(extraction_prompt, grammar=extraction_schema)
    
    # Validate selectors based on their type
    for pattern in extraction_config["extraction_patterns"]:
        selector_type = pattern["selector_type"]
        selector = pattern["selector"]
        
        if selector_type == "css":
            # Validate and potentially fix CSS selectors
            valid_selector = llm.generate(
                f"Fix this CSS selector if needed: {selector}",
                grammar=css_selector_grammar
            )
            pattern["selector"] = valid_selector
        elif selector_type == "xpath":
            # Validate and potentially fix XPath expressions
            valid_xpath = llm.generate(
                f"Fix this XPath expression if needed: {selector}",
                grammar=xpath_grammar
            )
            pattern["selector"] = valid_xpath
        elif selector_type == "regex":
            # Validate and potentially fix regex patterns
            valid_regex = llm.generate(
                f"Fix this regex pattern if needed: {selector}",
                grammar=regex_grammar
            )
            pattern["selector"] = valid_regex
    
    return extraction_config
```

### 3. aici Implementation

The Multi-Page Scraper Agent needs fine-grained control over token generation for extracting and processing web content. Here's the optimal implementation using aici:

```python
import pyaici.server as aici
import json
import re

async def scrape_and_process_pages(start_url, extraction_config, max_pages=10, depth=2):
    # Initialize with scraping parameters
    await aici.FixedTokens(f"# Multi-Page Scraper Configuration\n\n")
    await aici.FixedTokens(f"Starting URL: {start_url}\n")
    await aici.FixedTokens(f"Max Pages: {max_pages}\n")
    await aici.FixedTokens(f"Max Depth: {depth}\n\n")
    
    # Fetch the initial page content using an external API
    initial_page = await aici.call_external_api(
        "web_fetcher",
        {"url": start_url, "javascript_rendering": True},
        timeout=10000
    )
    
    # Extract links from the initial page
    await aici.FixedTokens("## Analyzing Initial Page\n\n")
    await aici.FixedTokens(f"Title: {initial_page['title']}\n")
    await aici.FixedTokens(f"Found {len(initial_page['links'])} links\n\n")
    
    # Generate a crawl plan based on the initial page analysis
    await aici.FixedTokens("## Generating Crawl Plan\n\n")
    
    # Filter and prioritize links
    relevant_links = []
    for link in initial_page['links']:
        # Apply filtering logic to determine relevance
        if is_relevant_link(link, start_url):
            relevant_links.append(link)
    
    await aici.FixedTokens(f"Identified {len(relevant_links)} relevant links to crawl\n\n")
    
    # Create a structured crawl plan
    await aici.FixedTokens("## Crawl Plan Details\n\n")
    crawl_plan_marker = aici.Label()
    
    # Generate the crawl plan with controlled structure
    await aici.FixedTokens("```json\n")
    await aici.FixedTokens("{\n  \"pages\": [\n")
    
    # Add the start page
    await aici.FixedTokens(f'    {{"url": "{start_url}", "depth": 0, "priority": 1.0}}')
    
    # Add the relevant links with priority
    for i, link in enumerate(relevant_links[:min(max_pages-1, len(relevant_links))]):
        priority = calculate_priority(link, start_url, extraction_config)
        await aici.FixedTokens(f',\n    {{"url": "{link}", "depth": 1, "priority": {priority}}}')
    
    await aici.FixedTokens("\n  ],\n")
    await aici.FixedTokens('  "extraction_config": ')
    await aici.FixedTokens(json.dumps(extraction_config, indent=2).replace('\n', '\n  '))
    await aici.FixedTokens("\n}\n```\n\n")
    
    # Execute the crawl plan using an external API
    crawl_results = await aici.call_external_api(
        "web_crawler",
        {
            "start_url": start_url,
            "max_pages": max_pages,
            "max_depth": depth,
            "extraction_config": extraction_config,
            "relevant_links": relevant_links
        },
        timeout=60000
    )
    
    # Process the crawled data
    await aici.FixedTokens("## Processing Crawled Data\n\n")
    await aici.FixedTokens(f"Successfully crawled {len(crawl_results['pages'])} pages\n\n")
    
    # Generate structured data from the crawled content
    await aici.FixedTokens("## Extracted Data\n\n")
    await aici.FixedTokens("```json\n")
    await aici.FixedTokens("[\n")
    
    # Process each page's extracted data
    for i, page_data in enumerate(crawl_results['pages']):
        # Clean and structure the extracted content
        cleaned_data = clean_extracted_data(page_data, extraction_config)
        
        # Add the structured data to the output
        json_data = json.dumps(cleaned_data, indent=2)
        if i > 0:
            await aici.FixedTokens(",\n")
        await aici.FixedTokens(json_data)
    
    await aici.FixedTokens("\n]\n```\n\n")
    
    # Generate a summary of the extraction
    await aici.FixedTokens("## Extraction Summary\n\n")
    summary_marker = aici.Label()
    
    # Generate summary statistics
    total_data_points = sum(len(page.get('extracted_data', {})) for page in crawl_results['pages'])
    await aici.FixedTokens(f"- Total pages crawled: {len(crawl_results['pages'])}\n")
    await aici.FixedTokens(f"- Total data points extracted: {total_data_points}\n")
    await aici.FixedTokens(f"- Extraction success rate: {crawl_results['success_rate']}%\n\n")
    
    # Generate insights about the extracted data
    await aici.FixedTokens("### Data Insights\n\n")
    insights_marker = aici.Label()
    await aici.gen_text(stop_at="\n\n", max_tokens=300)
    
    # Generate recommendations for improving extraction
    await aici.FixedTokens("### Extraction Recommendations\n\n")
    recommendations_marker = aici.Label()
    await aici.gen_text(stop_at="\n\n", max_tokens=300)
    
    # Store the generated content
    aici.set_var("crawl_plan", crawl_plan_marker.text_since())
    aici.set_var("summary", summary_marker.text_since())
    aici.set_var("insights", insights_marker.text_since())
    aici.set_var("recommendations", recommendations_marker.text_since())
    
    # Return the structured results
    return {
        "crawl_results": crawl_results,
        "extraction_summary": {
            "pages_crawled": len(crawl_results['pages']),
            "data_points_extracted": total_data_points,
            "success_rate": crawl_results['success_rate'],
            "insights": aici.get_var("insights"),
            "recommendations": aici.get_var("recommendations")
        }
    }

# Helper function to determine if a link is relevant
def is_relevant_link(link, base_url):
    # Check if the link is on the same domain
    base_domain = re.search(r'https?://([^/]+)', base_url).group(1)
    link_domain = re.search(r'https?://([^/]+)', link).group(1) if re.match(r'https?://', link) else None
    
    # If it's a relative link or on the same domain, it's potentially relevant
    if link_domain is None or link_domain == base_domain:
        # Exclude common irrelevant paths
        exclude_patterns = [
            r'/login', r'/signup', r'/register', r'/contact', r'/about',
            r'/terms', r'/privacy', r'/sitemap', r'/rss', r'/feed'
        ]
        
        for pattern in exclude_patterns:
            if re.search(pattern, link):
                return False
        
        return True
    
    return False

# Helper function to calculate priority for a link
def calculate_priority(link, base_url, extraction_config):
    # Start with a base priority
    priority = 0.5
    
    # Increase priority for links that likely contain relevant content
    for pattern in extraction_config.get('extraction_patterns', []):
        if pattern.get('name') in link:
            priority += 0.2
    
    # Adjust priority based on link depth
    path_depth = link.count('/') - base_url.count('/')
    if path_depth <= 1:
        priority += 0.2
    elif path_depth > 3:
        priority -= 0.2
    
    # Ensure priority is between 0 and 1
    return max(0.1, min(1.0, priority))

# Helper function to clean extracted data
def clean_extracted_data(page_data, extraction_config):
    cleaned_data = {
        "url": page_data["url"],
        "title": page_data["title"],
        "extracted_at": page_data["timestamp"],
        "data": {}
    }
    
    # Process each extracted field according to the configuration
    for field_name, field_value in page_data.get("extracted_data", {}).items():
        # Find the corresponding extraction pattern
        pattern = next((p for p in extraction_config.get("extraction_patterns", []) 
                        if p.get("name") == field_name), None)
        
        if pattern and field_value:
            # Apply post-processing steps if defined
            processed_value = field_value
            for process in pattern.get("post_process", []):
                if process == "trim":
                    processed_value = processed_value.strip()
                elif process == "normalize_whitespace":
                    processed_value = re.sub(r'\s+', ' ', processed_value).strip()
                elif process == "extract_number":
                    numbers = re.findall(r'\d+\.?\d*', processed_value)
                    processed_value = float(numbers[0]) if numbers else None
                elif process == "extract_date":
                    # Simple date extraction, would need more sophisticated logic in practice
                    date_match = re.search(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2}', processed_value)
                    processed_value = date_match.group(0) if date_match else processed_value
                elif process == "remove_html":
                    processed_value = re.sub(r'<[^>]+>', '', processed_value)
            
            cleaned_data["data"][field_name] = processed_value
    
    return cleaned_data

# Start the aici controller with optimal timeout
aici.start(scrape_and_process_pages(start_url, extraction_config, max_pages, depth), timeout=180000)
```

## Integration and Optimization

To integrate all three modules for the Multi-Page Scraper Agent:

```python
def multi_page_scraper_agent(start_url, target_data_description, max_pages=10, depth=2, filters=None):
    # 1. Fetch the initial page to analyze its structure
    initial_page_content = fetch_page_content(start_url)
    
    # 2. Use llguidance to generate an optimal extraction configuration
    extraction_config = generate_extraction_config(
        url=start_url,
        page_content=initial_page_content,
        target_data_description=target_data_description
    )
    
    # 3. Use llm-chain for the overall scraping workflow
    chain_results = multi_page_scraper_chain(
        start_url=start_url,
        max_pages=max_pages,
        depth=depth,
        extraction_schema=extraction_config,
        filters=filters
    )
    
    # 4. Use aici for fine-grained control over the extraction and processing
    final_results = aici.run(
        scrape_and_process_pages,
        start_url=start_url,
        extraction_config=extraction_config,
        max_pages=max_pages,
        depth=depth,
        context={
            "chain_results": chain_results,
            "target_data_description": target_data_description
        },
        max_tokens=10000,
        temperature=0.2
    )
    
    # 5. Compile and return the final dataset
    return {
        "extracted_data": final_results["crawl_results"]["pages"],
        "metadata": {
            "start_url": start_url,
            "pages_crawled": final_results["extraction_summary"]["pages_crawled"],
            "data_points_extracted": final_results["extraction_summary"]["data_points_extracted"],
            "success_rate": final_results["extraction_summary"]["success_rate"]
        },
        "insights": final_results["extraction_summary"]["insights"],
        "recommendations": final_results["extraction_summary"]["recommendations"]
    }

# Helper function to fetch page content
def fetch_page_content(url):
    # Implementation would use a web scraping library like requests, selenium, or playwright
    # This is a placeholder for the actual implementation
    import requests
    from bs4 import BeautifulSoup
    
    response = requests.get(url, headers={"User-Agent": "SolnAI Scraper/1.0"})
    soup = BeautifulSoup(response.text, "html.parser")
    
    return soup.get_text()
```

## Optimal Configuration Values

For the Multi-Page Scraper Agent, the following configuration values are optimal:

| Parameter | Value | Explanation |
|-----------|-------|-------------|
| `batch_size` | 2 | Balances memory usage with processing efficiency for web pages |
| `max_concurrency` | 4 | Optimal for parallel web requests without overwhelming servers |
| `request_delay` | 1.5 | Respects server resources while maintaining reasonable speed (seconds) |
| `timeout` | 30 | Sufficient time for most page loads (seconds) |
| `parallel_requests` | 3 | Balances speed with server load |
| `retry_count` | 2 | Handles temporary failures without excessive retries |
| `relevance_threshold` | 0.6 | Balances precision with recall for content filtering |
| `max_pages` | 10-50 | Depends on the specific use case (start with 10) |
| `depth` | 2 | Sufficient for most structured websites without going too deep |
| `temperature` | 0.2 | Lower temperature for more precise extraction patterns |
| `max_tokens` | 10000 | Sufficient for processing multiple pages of content |
| `timeout` (aici) | 180000 | Allows for complex web scraping operations (3 minutes) |

## Conclusion

This implementation guide provides a comprehensive approach to implementing the SolnAI core modules for the Multi-Page Scraper Agent. By following these guidelines and using the optimal configuration values, you can create a powerful web scraping tool that efficiently extracts, processes, and organizes information from multiple web pages. 