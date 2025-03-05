# Advanced Web Researcher Implementation Guide

## Name
advanced-web-researcher

## Description
The Advanced Web Researcher is an n8n-powered agent that leverages the Brave Search API to perform comprehensive online research. Unlike traditional web research tools, it uses Brave's powerful search capabilities combined with AI summarization to provide more accurate, detailed, and relevant information from across the web. This agent is particularly effective for complex topic investigation, multi-source fact verification, academic research assistance, and technical documentation searches.

## Implementation

### Core Modules Integration

#### llm-chain Integration
The Advanced Web Researcher uses workflow orchestration concepts similar to llm-chain through n8n's workflow system:

```javascript
// Conceptual representation of the workflow as an llm-chain
import { Chain, Step } from 'llm_chain';

function createWebResearchChain(query) {
  const chain = Chain.new();
  
  // Step 1: Process and format the user query
  chain.step(Step.new("process_query", formatSearchQuery, {
    replace_spaces: true, 
    use_plus_signs: true
  }));
  
  // Step 2: Perform the initial Brave Search
  chain.step(Step.new("brave_search", performBraveSearch, {
    api_key: process.env.BRAVE_API_KEY,
    include_summary: true
  }, depends_on=["process_query"]));
  
  // Step 3: Get the summarizer key from initial search
  chain.step(Step.new("get_summarizer_key", extractSummarizerKey, 
    depends_on=["brave_search"]));
  
  // Step 4: Use the summarizer key to get detailed summaries
  chain.step(Step.new("brave_summarize", performBraveSummarize, {
    api_key: process.env.BRAVE_API_KEY,
    include_entity_info: true
  }, depends_on=["get_summarizer_key"]));
  
  // Step 5: Format and analyze research results
  chain.step(Step.new("analyze_results", analyzeResearchResults, {
    model: "gpt-4o",
    max_tokens: 2000
  }, depends_on=["brave_summarize"]));
  
  return chain.execute({
    query: query,
    result_format: "markdown"
  });
}
```

The actual implementation in n8n connects nodes in a visual workflow that accomplishes the same sequence of operations, handling the flow of data between different processing steps.

#### llguidance Integration
The agent uses llguidance concepts through structured prompt templates and output formatting:

```javascript
// Conceptual representation of prompt template and guidance
import { PromptTemplate, OutputFormatter } from 'llguidance';

// System message template for the AI agent
const systemMessageTemplate = PromptTemplate.fromTemplate(`
You are an expert at researching the web to answer user questions that you can't answer yourself. 
You have access to the Brave API through a tool to do so. You give it a query and then it gives you 
back a summary of the articles found from searching the web with the query you gave.

Note: All queries you pass into the tool for web research must not have spaces. Instead you need to 
use plus signs. This is because the query will be used with the "q" parameter in a GET request.
`);

// Template for research summary formatting
const researchSummaryTemplate = PromptTemplate.fromTemplate(`
Based on the web research I conducted on "{{original_query}}", here's what I found:

{{#if has_summary}}
## Summary
{{summary}}
{{/if}}

## Key Information
{{#each key_points}}
- {{this}}
{{/each}}

## Sources
{{#each sources}}
- [{{this.title}}]({{this.url}})
{{/each}}

{{#if limitations}}
## Limitations
{{limitations}}
{{/if}}
`);

// Output formatter for structured research results
const researchFormatter = new OutputFormatter({
  schema: {
    type: "object",
    properties: {
      summary: { type: "string" },
      key_points: { 
        type: "array",
        items: { type: "string" }
      },
      sources: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            url: { type: "string" },
            snippet: { type: "string" }
          }
        }
      },
      limitations: { type: "string" }
    }
  }
});
```

In the n8n implementation, these concepts are represented through AI Agent nodes and API integration nodes with carefully crafted system messages and formatting logic.

#### aici Integration
While not explicitly implemented in the current version, aici concepts for real-time guidance could be integrated:

```javascript
// Conceptual implementation of aici in web research context
async function researchWithAici(query) {
  // Format the query
  const formattedQuery = query.replace(/\s+/g, '+');
  
  // Inform about search process
  await aici.FixedTokens(`Researching information about "${query}"...\n`);
  
  // Detect query type to tailor search approach
  if (query.includes("latest") || query.includes("recent") || query.includes("new")) {
    await aici.FixedTokens("Detected request for recent information. Prioritizing recency in search results...\n");
    searchParams = {recency_boost: true};
  } else if (query.includes("history") || query.includes("background") || query.includes("origin")) {
    await aici.FixedTokens("Detected request for historical information. Adjusting search parameters...\n");
    searchParams = {comprehensive: true};
  } else if (query.includes("compare") || query.includes("versus") || query.includes("vs")) {
    await aici.FixedTokens("Detected comparison request. Looking for contrasting viewpoints...\n");
    searchParams = {diverse_results: true};
  }
  
  // Execute search
  await aici.FixedTokens("Executing web search...\n");
  const searchResults = await performSearch(formattedQuery, searchParams);
  
  // Analyze results quality
  await aici.FixedTokens(`Found ${searchResults.length} relevant sources. Analyzing content...\n`);
  
  if (searchResults.length < 3) {
    await aici.FixedTokens("Limited results found. Broadening search...\n");
    const additionalResults = await performSearch(formattedQuery, {broader: true});
    searchResults.push(...additionalResults);
  }
  
  // Generate detailed summaries
  await aici.FixedTokens("Generating comprehensive summary from sources...\n");
  return summarizeResults(searchResults);
}
```

### Architecture
The Advanced Web Researcher uses a workflow-based architecture with the following components:

1. **Webhook Entry Point**: Receives the research query via HTTP POST
2. **Query Processor**: Formats the query appropriately for the Brave API
3. **Brave Search Integration**: Performs the initial search and retrieves results
4. **Brave Summarizer**: Uses Brave's summarization service for deeper insights
5. **AI Analysis**: Uses an AI agent to process and analyze research findings
6. **Response Formatter**: Structures the research output for readability

### Configuration Structure
```json
{
  "name": "Advanced Web Researcher",
  "nodes": [
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "name": "query",
              "value": "={{ $json.body.query }}",
              "type": "string"
            }
          ]
        }
      },
      "name": "Edit Fields",
      "type": "n8n-nodes-base.set"
    },
    {
      "parameters": {
        "promptType": "define",
        "text": "={{ $('Edit Fields').item.json.query }}",
        "options": {
          "systemMessage": "=You are an expert at researching the web to answer user questions that you can't answer yourself. You have access to the Brave API through a tool to do so. You give it a query and then it gives you back a summary of the articles found in from searching the web with the query you gave.\n\nNote: All queries you pass into the tool for web research most not have spaces. Instead you need to use plus signs. This is because the query will be used with the \"q\" parameter in a GET request.",
          "maxIterations": 5
        }
      },
      "name": "AI Agent",
      "type": "@n8n/n8n-nodes-langchain.agent"
    },
    {
      "parameters": {
        "url": "=https://api.search.brave.com/res/v1/web/search?q={{ $('Execute Workflow Trigger').item.json.query.query }}&summary=1",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Accept",
              "value": "application/json"
            },
            {
              "name": "Accept-Encoding",
              "value": "gzip"
            }
          ]
        }
      },
      "name": "HTTP Request",
      "type": "n8n-nodes-base.httpRequest"
    },
    {
      "parameters": {
        "url": "=https://api.search.brave.com/res/v1/summarizer/search?key={{ $('HTTP Request').item.json.summarizer.key }}&entity_info=1",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth"
      },
      "name": "HTTP Request1",
      "type": "n8n-nodes-base.httpRequest"
    }
  ]
}
```

### Performance Optimization
- **Efficient API Usage**: Makes targeted API calls to minimize rate limiting issues
- **Summarization Service**: Leverages Brave's built-in summarization to reduce processing time
- **Entity Information**: Includes entity information for more contextual summaries
- **Minimal Iterations**: Sets a reasonable maximum of 5 iterations for the AI agent
- **Structured Response Format**: Creates well-organized responses for faster consumption

### Ethical Considerations
- **Source Attribution**: Maintains links to original sources for verification
- **Result Diversity**: Ensures varied perspectives in research results
- **Content Quality**: Uses Brave Search for higher quality results with less spam
- **Privacy Focus**: Benefits from Brave's privacy-focused approach to web search
- **Limitations Acknowledgment**: Includes limitations of the research in results

## Example Usage

### Basic Research Query
```javascript
// Example webhook request for researching a topic
fetch('https://your-n8n-instance.com/webhook/invoke-advanced-web-researcher', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    query: "What are the latest updates to React with React 19?",
    user_id: "user-123",
    request_id: "req-456",
    session_id: "session-789"
  })
})
.then(response => response.json())
.then(data => {
  console.log('Research results:', data);
})
.catch(error => console.error('Error:', error));
```

### Example Response
```json
{
  "research_results": {
    "summary": "React 19 introduces several significant updates including improved server components, enhanced streaming architecture, and better performance optimizations. Key features include the new compiler architecture (React Forget), simplified API for managing state, and improved integration with modern JavaScript features.",
    "key_points": [
      "React Forget: A new compilation approach that automatically optimizes re-renders",
      "Improved server components with better hydration strategies",
      "Enhanced streaming architecture for improved performance",
      "Simplified hooks API with better TypeScript integration",
      "New transition API for smoother UI updates",
      "Built-in code splitting improvements"
    ],
    "sources": [
      {
        "title": "What's New in React 19",
        "url": "https://react.dev/blog/2023/03/16/introducing-react-19",
        "snippet": "Today we're releasing React 19, a major update to React that includes substantial improvements to performance, developer experience, and user experience."
      },
      {
        "title": "React 19 Release Notes",
        "url": "https://github.com/facebook/react/releases/tag/v19.0.0",
        "snippet": "This release contains several major new features, dozens of bug fixes, and numerous smaller improvements."
      },
      {
        "title": "Understanding React Forget",
        "url": "https://vercel.com/blog/understanding-react-forget",
        "snippet": "React Forget is the new compiler-informed optimization that automatically inserts memo() and useMemo() for you based on static analysis."
      }
    ],
    "limitations": "This research only includes information available as of the last Brave search index update. Some very recent updates or experimental features may not be covered."
  }
}
```

### Integration with Content Creation
```javascript
// Example of integrating the researcher with content creation
// n8n workflow configuration (conceptual)
{
  "nodes": [
    // ... existing researcher workflow ...
    {
      "parameters": {
        "modelId": "gpt-4o",
        "messages": [
          {
            "role": "system",
            "content": "You are a technical writer creating a blog post based on research findings."
          },
          {
            "role": "user",
            "content": "=Create a comprehensive blog post about {{ $node['Input Data'].json.topic }} using the following research:\n\n{{ $node['Advanced Web Researcher'].json.research_results.summary }}\n\n{{ $node['Advanced Web Researcher'].json.research_results.key_points.join('\n') }}"
          }
        ]
      },
      "name": "Generate Blog Post",
      "type": "@n8n/n8n-nodes-langchain.openAi"
    }
  ]
}
```

## Testing
The agent includes testing considerations for:
- API response handling
- Error cases (rate limiting, invalid queries)
- Result quality evaluation
- Edge cases (very specific or very broad queries)

Test scenarios should include:
1. Technical research queries
2. News and current events queries
3. Historical or factual queries
4. Comparative analysis queries
5. Edge cases with limited information

## Future Enhancements
1. Add support for multiple search engines beyond Brave
2. Implement source credibility scoring
3. Add domain-specific research modes (academic, news, technical)
4. Implement interactive research sessions with follow-up questions
5. Add visualization options for complex research topics
6. Create a feedback loop to improve search quality over time
