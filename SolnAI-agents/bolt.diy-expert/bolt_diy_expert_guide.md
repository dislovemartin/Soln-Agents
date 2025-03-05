# bolt.diy Expert Agent Implementation Guide

## Name
bolt.diy-expert

## Description
The bolt.diy Expert Agent is a specialized n8n AI agent designed to provide comprehensive support for bolt.diy - an open-source tool that enables users to choose from multiple LLM providers for web development. The agent answers questions, troubleshoots issues, and provides guidance on using different LLM providers within the bolt.diy ecosystem.

## Implementation

### Core Modules Integration

#### llm-chain Integration
The bolt.diy Expert Agent uses llm-chain to orchestrate the knowledge retrieval and response generation workflow:

```javascript
// n8n workflow implementation using llm-chain concepts
const documentationChain = {
  nodes: [
    {
      name: "Query Analysis",
      type: "Function",
      parameters: {
        functionCode: `
          // Analyze user query to identify intent and extract key terms
          function analyzeQuery(query) {
            const categories = ["installation", "setup", "providers", "features", "troubleshooting", "contributing"];
            const categoryScores = categories.map(category => {
              return { category, score: calculateRelevance(query, category) };
            });
            return {
              intent: categoryScores.sort((a, b) => b.score - a.score)[0].category,
              keyTerms: extractKeyTerms(query)
            };
          }
        `
      }
    },
    {
      name: "Documentation Retrieval",
      type: "Function",
      parameters: {
        functionCode: `
          // Retrieve relevant documentation based on query analysis
          function retrieveDocumentation(queryAnalysis) {
            const { intent, keyTerms } = queryAnalysis;
            
            // Vector search through documentation
            const relevantDocs = documentationDB.search(keyTerms, intent);
            
            return {
              primarySources: relevantDocs.slice(0, 3),
              secondarySources: relevantDocs.slice(3, 8)
            };
          }
        `
      }
    },
    {
      name: "Response Generation",
      type: "OpenAI",
      parameters: {
        model: "gpt-4",
        systemPrompt: "You are a bolt.diy expert assistant. Use the provided documentation to answer user questions accurately and helpfully.",
        temperature: 0.3
      }
    }
  ],
  connections: [
    {
      source: "Query Analysis",
      target: "Documentation Retrieval"
    },
    {
      source: "Documentation Retrieval",
      target: "Response Generation"
    }
  ]
};
```

#### llguidance Integration
The agent uses llguidance to ensure structured outputs for documentation references and code examples:

```javascript
// Structured output schema for bolt.diy responses
const responseSchema = {
  type: "object",
  properties: {
    answer: {
      type: "string",
      description: "The main answer to the user's question"
    },
    references: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          url: { type: "string" },
          relevance: { type: "number" }
        }
      }
    },
    codeExamples: {
      type: "array",
      items: {
        type: "object",
        properties: {
          language: { type: "string" },
          code: { type: "string" },
          description: { type: "string" }
        }
      }
    },
    followUpSuggestions: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: ["answer"]
};
```

#### aici Integration
The agent implements aici concepts for real-time control over response generation:

```javascript
// Conceptual implementation of aici in n8n context
function dynamicResponseControl(userQuery, documentationContext) {
  // Detect if query is about code implementation
  if (containsCodeQuestion(userQuery)) {
    return {
      responsePrefix: "Here's how you can implement this in code:\n\n",
      responseSuffix: "\n\nYou can find more examples in the documentation.",
      highlightCodeBlocks: true
    };
  }
  
  // Detect if query is about troubleshooting
  if (containsTroubleshootingQuestion(userQuery)) {
    return {
      responsePrefix: "Let's troubleshoot this issue step by step:\n\n",
      responseSuffix: "\n\nIf you're still experiencing issues, please check the GitHub issues or community forum.",
      formatAsList: true
    };
  }
  
  // Default response format
  return {
    responsePrefix: "",
    responseSuffix: "",
    formatAsParagraphs: true
  };
}
```

### Architecture
The bolt.diy Expert Agent uses a single-agent architecture with specialized components:

1. **Query Analyzer**: Interprets user questions and identifies the intent
2. **Documentation Retriever**: Searches and retrieves relevant documentation
3. **Response Generator**: Creates comprehensive answers based on the documentation
4. **Code Example Provider**: Generates or retrieves code examples when appropriate

### Performance Optimization
- **Caching**: Frequently accessed documentation is cached for faster retrieval
- **Query Classification**: Pre-classification of queries to optimize document retrieval
- **Incremental Response**: Generating responses incrementally for faster user feedback

### Ethical Considerations
- **Source Attribution**: All information is properly attributed to official documentation
- **Uncertainty Handling**: The agent clearly indicates when it's uncertain about an answer
- **Up-to-date Information**: Regular updates to the knowledge base to ensure accuracy

## Example Usage

### Basic Query Handling
```javascript
// Example n8n workflow execution
const workflow = {
  execute: async (input) => {
    const query = input.query;
    
    // Execute the documentation chain
    const queryAnalysis = await executeNode("Query Analysis", { query });
    const docResults = await executeNode("Documentation Retrieval", queryAnalysis);
    const response = await executeNode("Response Generation", {
      query,
      documentation: docResults,
      outputFormat: responseSchema
    });
    
    return response;
  }
};

// Example execution
const result = await workflow.execute({
  query: "How do I set up bolt.diy with OpenAI?"
});

console.log(result.answer);
console.log(result.codeExamples);
```

### Interactive Troubleshooting
```javascript
// Example of interactive troubleshooting flow
const troubleshootingWorkflow = {
  execute: async (input) => {
    const issue = input.issue;
    
    // Initial diagnosis
    const diagnosis = await executeNode("Issue Diagnosis", { issue });
    
    // Generate step-by-step troubleshooting guide
    const troubleshootingSteps = await executeNode("Generate Troubleshooting Steps", diagnosis);
    
    // Format as interactive guide
    return formatInteractiveTroubleshootingGuide(troubleshootingSteps);
  }
};
```

## Testing
The agent includes comprehensive testing for:
- Documentation retrieval accuracy
- Response quality and relevance
- Code example correctness
- Edge case handling for uncommon queries

Tests are automated using n8n's testing framework and run against a test set of common bolt.diy questions to ensure consistent performance.
