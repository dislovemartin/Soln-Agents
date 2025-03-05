# General Researcher Agent Implementation Guide

## Name
general-researcher-agent

## Description
The General Researcher Agent (AI News Assistant) is an intelligent agent that scans the web for the latest information on user-specified topics, curates relevant articles, and delivers concise reports. It helps users stay informed about topics of interest without the need for manual searching, providing up-to-date information from reputable sources in an easily digestible format.

## Implementation

### Core Modules Integration

#### llm-chain Integration
The General Researcher Agent uses llm-chain to orchestrate the complex workflow of web research and report generation:

```javascript
// n8n workflow implementation using llm-chain concepts
const researchChain = {
  nodes: [
    {
      name: "Query Formulation",
      type: "Function",
      parameters: {
        functionCode: `
          // Transform user topic into effective search queries
          function formulateQueries(topic) {
            // Generate multiple search queries to cover different aspects
            const queries = generateSearchVariants(topic);
            
            // Prioritize queries based on likely information value
            return prioritizeQueries(queries);
          }
        `
      }
    },
    {
      name: "Web Search",
      type: "HTTPRequest",
      parameters: {
        url: "https://api.search.brave.com/res/v1/web/search",
        method: "GET",
        authentication: "Header Auth",
        headers: {
          "X-Subscription-Token": "{{$node[\"Credentials\"].json[\"braveApiKey\"]}}"
        }
      }
    },
    {
      name: "Content Extraction",
      type: "Function",
      parameters: {
        functionCode: `
          // Extract and clean content from search results
          function extractContent(searchResults) {
            const urls = extractUrls(searchResults);
            const contents = [];
            
            for (const url of urls) {
              const rawContent = fetchContent(url);
              const cleanedContent = cleanAndStructure(rawContent);
              contents.push({
                url,
                title: extractTitle(rawContent),
                content: cleanedContent,
                date: extractPublicationDate(rawContent)
              });
            }
            
            return contents;
          }
        `
      }
    },
    {
      name: "Content Analysis",
      type: "Function",
      parameters: {
        functionCode: `
          // Analyze extracted content for relevance and insights
          function analyzeContent(contents, topic) {
            return contents.map(content => {
              return {
                ...content,
                relevanceScore: calculateRelevance(content, topic),
                keyInsights: extractKeyInsights(content, topic),
                sentimentScore: analyzeSentiment(content)
              };
            }).filter(content => content.relevanceScore > 0.7);
          }
        `
      }
    },
    {
      name: "Report Generation",
      type: "OpenAI",
      parameters: {
        model: "gpt-4",
        systemPrompt: "You are a research assistant. Create a concise, well-structured report based on the analyzed content. Include key insights, trends, and cite sources appropriately.",
        temperature: 0.3
      }
    }
  ],
  connections: [
    {
      source: "Query Formulation",
      target: "Web Search"
    },
    {
      source: "Web Search",
      target: "Content Extraction"
    },
    {
      source: "Content Extraction",
      target: "Content Analysis"
    },
    {
      source: "Content Analysis",
      target: "Report Generation"
    }
  ]
};
```

#### llguidance Integration
The agent uses llguidance to ensure structured outputs for research reports:

```javascript
// Structured output schema for research reports
const reportSchema = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "The title of the research report"
    },
    summary: {
      type: "string",
      description: "A brief executive summary of the findings"
    },
    keyFindings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          finding: { type: "string" },
          importance: { type: "string", enum: ["high", "medium", "low"] },
          sources: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                url: { type: "string" },
                publicationDate: { type: "string" }
              }
            }
          }
        }
      }
    },
    trends: {
      type: "array",
      items: {
        type: "object",
        properties: {
          trend: { type: "string" },
          direction: { type: "string", enum: ["increasing", "decreasing", "stable", "emerging", "declining"] },
          supportingEvidence: { type: "string" }
        }
      }
    },
    sources: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          url: { type: "string" },
          publicationDate: { type: "string" },
          relevanceScore: { type: "number" },
          keyContribution: { type: "string" }
        }
      }
    }
  },
  required: ["title", "summary", "keyFindings", "sources"]
};
```

#### aici Integration
The agent implements aici concepts for real-time control over report generation:

```javascript
// Conceptual implementation of aici in n8n context
function dynamicReportControl(topic, researchResults) {
  // Detect if topic is technical
  if (isTechnicalTopic(topic)) {
    return {
      responsePrefix: "## Technical Research Report: " + topic + "\n\n",
      includeTechnicalDetails: true,
      includeCodeExamples: true,
      formatTables: true
    };
  }
  
  // Detect if topic is news-related
  if (isNewsRelatedTopic(topic)) {
    return {
      responsePrefix: "## Breaking News Update: " + topic + "\n\n",
      chronologicalOrder: true,
      highlightLatestDevelopments: true,
      includeTimelineVisualization: true
    };
  }
  
  // Detect if topic is product-related
  if (isProductRelatedTopic(topic)) {
    return {
      responsePrefix: "## Product Research: " + topic + "\n\n",
      includeComparisonTable: true,
      addProsAndCons: true,
      includePriceInformation: true
    };
  }
  
  // Default response format
  return {
    responsePrefix: "## Research Report: " + topic + "\n\n",
    balancedFormat: true
  };
}
```

### Architecture
The General Researcher Agent uses a single-agent architecture with specialized components:

1. **Query Formulator**: Transforms user topics into effective search queries
2. **Web Searcher**: Retrieves relevant information from the web
3. **Content Analyzer**: Evaluates and extracts insights from retrieved content
4. **Report Generator**: Creates structured, concise reports from analyzed content

### Performance Optimization
- **Query Batching**: Multiple search queries are executed in parallel
- **Content Caching**: Recently retrieved content is cached to reduce redundant fetching
- **Incremental Processing**: Processing content as it's retrieved rather than waiting for all results

### Ethical Considerations
- **Source Attribution**: All information is properly attributed to original sources
- **Bias Mitigation**: Retrieving information from diverse sources to reduce bias
- **Information Verification**: Cross-checking facts across multiple sources when possible

## Example Usage

### Basic Research Report Generation
```javascript
// Example n8n workflow execution
const workflow = {
  execute: async (input) => {
    const topic = input.topic;
    
    // Execute the research chain
    const queries = await executeNode("Query Formulation", { topic });
    const searchResults = await executeNode("Web Search", { queries });
    const extractedContent = await executeNode("Content Extraction", { searchResults });
    const analyzedContent = await executeNode("Content Analysis", { contents: extractedContent, topic });
    const report = await executeNode("Report Generation", {
      topic,
      analyzedContent,
      outputFormat: reportSchema
    });
    
    return report;
  }
};

// Example execution
const result = await workflow.execute({
  topic: "Advances in Quantum Computing 2025"
});

console.log(result.title);
console.log(result.summary);
console.log(result.keyFindings);
```

### Scheduled Research Updates
```javascript
// Example of scheduled research updates
const scheduledResearchWorkflow = {
  execute: async (input) => {
    const topics = input.subscribedTopics;
    const lastUpdateTime = input.lastUpdateTime;
    
    const reports = [];
    
    for (const topic of topics) {
      // Only search for content newer than the last update
      const report = await generateResearchReport(topic, lastUpdateTime);
      
      if (report.hasNewFindings) {
        reports.push(report);
      }
    }
    
    return {
      reports,
      updateTime: new Date().toISOString()
    };
  }
};
```

## Testing
The agent includes comprehensive testing for:
- Query formulation effectiveness
- Content retrieval accuracy
- Report quality and relevance
- Source diversity and reliability

Tests are automated using n8n's testing framework and run against a variety of topics to ensure consistent performance across different domains.
