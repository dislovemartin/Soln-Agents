# n8n GitHub Assistant Implementation Guide

## Name
n8n-github-assistant

## Description
The n8n GitHub Assistant is an intelligent agent that helps users explore, understand, and analyze GitHub repositories. It can navigate repository structures, retrieve and explain file contents, track context for follow-up questions, and provide detailed information about repository organization. The agent serves as a bridge between users and GitHub repositories, making codebases more accessible and understandable.

## Implementation

### Core Modules Integration

#### llm-chain Integration
The n8n GitHub Assistant uses llm-chain to orchestrate the complex workflow of repository analysis and query processing:

```javascript
// n8n workflow implementation using llm-chain concepts
const githubAssistantChain = {
  nodes: [
    {
      name: "Query Analysis",
      type: "Function",
      parameters: {
        functionCode: `
          // Analyze user query to determine intent and required GitHub operations
          function analyzeQuery(query, conversationContext) {
            const intents = {
              REPO_STRUCTURE: /structure|organization|layout|overview/i,
              FILE_CONTENT: /content|show me|what's in|code in/i,
              FILE_SEARCH: /find|locate|search for|where is/i,
              CODE_EXPLANATION: /explain|how does|what does|purpose of/i,
              DEPENDENCY_ANALYSIS: /dependencies|packages|libraries|imports/i
            };
            
            // Determine primary intent
            let primaryIntent = "GENERAL";
            for (const [intent, pattern] of Object.entries(intents)) {
              if (pattern.test(query)) {
                primaryIntent = intent;
                break;
              }
            }
            
            // Extract repository information
            const repoInfo = extractRepositoryInfo(query, conversationContext);
            
            return {
              primaryIntent,
              repoInfo,
              requiresFileAccess: primaryIntent === "FILE_CONTENT" || primaryIntent === "CODE_EXPLANATION",
              requiresRepoStructure: primaryIntent === "REPO_STRUCTURE" || primaryIntent === "FILE_SEARCH"
            };
          }
        `
      }
    },
    {
      name: "GitHub API Integration",
      type: "HTTPRequest",
      parameters: {
        url: "={{$json.apiEndpoint}}",
        method: "GET",
        authentication: "OAuth2",
        oAuth2: {
          tokenType: "Bearer"
        }
      }
    },
    {
      name: "Repository Structure Analysis",
      type: "Function",
      parameters: {
        functionCode: `
          // Analyze repository structure from GitHub API response
          function analyzeRepoStructure(repoContents) {
            // Organize files by type and directory
            const filesByType = categorizeFilesByType(repoContents);
            const directoryStructure = buildDirectoryTree(repoContents);
            
            // Identify key components
            const keyComponents = identifyKeyComponents(repoContents);
            
            return {
              filesByType,
              directoryStructure,
              keyComponents,
              totalFiles: countFiles(repoContents),
              primaryLanguages: detectPrimaryLanguages(repoContents)
            };
          }
        `
      }
    },
    {
      name: "File Content Retrieval",
      type: "HTTPRequest",
      parameters: {
        url: "={{$json.fileUrl}}",
        method: "GET",
        authentication: "OAuth2",
        oAuth2: {
          tokenType: "Bearer"
        }
      }
    },
    {
      name: "Code Analysis",
      type: "Function",
      parameters: {
        functionCode: `
          // Analyze code content from GitHub file
          function analyzeCode(fileContent, fileName) {
            const fileExtension = fileName.split('.').pop().toLowerCase();
            
            // Language-specific analysis
            let analysis;
            switch (fileExtension) {
              case 'js':
              case 'ts':
                analysis = analyzeJavaScript(fileContent);
                break;
              case 'py':
                analysis = analyzePython(fileContent);
                break;
              case 'java':
                analysis = analyzeJava(fileContent);
                break;
              default:
                analysis = analyzeGenericCode(fileContent);
            }
            
            return {
              summary: generateCodeSummary(fileContent, analysis),
              keyFunctions: analysis.functions,
              imports: analysis.imports,
              complexity: estimateComplexity(fileContent, analysis)
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
        systemPrompt: "You are a GitHub repository assistant. Provide clear, concise information about repositories, code, and file structures. Include relevant code snippets when helpful, and format your responses in markdown.",
        temperature: 0.3
      }
    }
  ],
  connections: [
    {
      source: "Query Analysis",
      target: "GitHub API Integration"
    },
    {
      source: "GitHub API Integration",
      target: "Repository Structure Analysis",
      condition: "{{$node[\"Query Analysis\"].json[\"requiresRepoStructure\"] === true}}"
    },
    {
      source: "GitHub API Integration",
      target: "File Content Retrieval",
      condition: "{{$node[\"Query Analysis\"].json[\"requiresFileAccess\"] === true}}"
    },
    {
      source: "File Content Retrieval",
      target: "Code Analysis"
    },
    {
      source: "Repository Structure Analysis",
      target: "Response Generation"
    },
    {
      source: "Code Analysis",
      target: "Response Generation"
    }
  ]
};
```

#### llguidance Integration
The agent uses llguidance to ensure structured outputs for repository analysis and code explanations:

```javascript
// Structured output schema for repository analysis
const repositoryAnalysisSchema = {
  type: "object",
  properties: {
    repositoryOverview: {
      type: "object",
      properties: {
        name: { type: "string" },
        owner: { type: "string" },
        description: { type: "string" },
        primaryLanguages: {
          type: "array",
          items: { type: "string" }
        },
        totalFiles: { type: "integer" },
        lastUpdated: { type: "string" }
      }
    },
    directoryStructure: {
      type: "object",
      properties: {
        rootDirectories: {
          type: "array",
          items: { type: "string" }
        },
        keyDirectories: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              purpose: { type: "string" },
              fileCount: { type: "integer" }
            }
          }
        }
      }
    },
    keyComponents: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          path: { type: "string" },
          purpose: { type: "string" },
          language: { type: "string" }
        }
      }
    },
    fileAnalysis: {
      type: "object",
      properties: {
        byType: {
          type: "object",
          additionalProperties: {
            type: "integer"
          }
        },
        configurationFiles: {
          type: "array",
          items: { type: "string" }
        },
        documentationFiles: {
          type: "array",
          items: { type: "string" }
        }
      }
    }
  },
  required: ["repositoryOverview", "directoryStructure", "keyComponents"]
};
```

#### aici Integration
The agent implements aici concepts for real-time control over response generation:

```javascript
// Conceptual implementation of aici in n8n context
function dynamicResponseControl(queryAnalysis, retrievedData) {
  // Detect if query is about code explanation
  if (queryAnalysis.primaryIntent === "CODE_EXPLANATION") {
    return {
      responsePrefix: "## Code Explanation\n\nHere's an explanation of the code you asked about:\n\n",
      formatCodeBlocks: true,
      includeLineReferences: true,
      focusOnFunctionality: true
    };
  }
  
  // Detect if query is about repository structure
  if (queryAnalysis.primaryIntent === "REPO_STRUCTURE") {
    return {
      responsePrefix: "## Repository Structure\n\nHere's an overview of how this repository is organized:\n\n",
      formatAsList: true,
      includeDirectoryTree: true,
      highlightKeyComponents: true
    };
  }
  
  // Detect if query is about file content
  if (queryAnalysis.primaryIntent === "FILE_CONTENT") {
    return {
      responsePrefix: "## File Content\n\nHere's the content of the file you requested:\n\n",
      includeFullCodeBlock: true,
      addSyntaxHighlighting: true,
      offerExplanation: true
    };
  }
  
  // Default response format
  return {
    responsePrefix: "## GitHub Repository Information\n\n",
    balancedFormat: true
  };
}
```

### Architecture
The n8n GitHub Assistant uses a single-agent architecture with specialized components:

1. **Query Analyzer**: Interprets user questions and identifies the intent
2. **GitHub API Client**: Interfaces with GitHub's API to retrieve repository data
3. **Repository Structure Analyzer**: Analyzes and organizes repository structure
4. **Code Analyzer**: Parses and analyzes code files for explanation
5. **Context Manager**: Maintains conversation context for follow-up questions

### Performance Optimization
- **Caching**: Repository structure and frequently accessed files are cached
- **Selective Retrieval**: Only retrieving necessary files rather than entire repositories
- **Response Streaming**: Generating responses incrementally for faster user feedback

### Ethical Considerations
- **Authentication Security**: Secure handling of GitHub authentication tokens
- **Rate Limiting**: Respecting GitHub API rate limits
- **Attribution**: Properly attributing code and content to original authors

## Example Usage

### Basic Repository Analysis
```javascript
// Example n8n workflow execution
const workflow = {
  execute: async (input) => {
    const query = input.query;
    const conversationContext = input.conversationContext || {};
    
    // Execute the GitHub assistant chain
    const queryAnalysis = await executeNode("Query Analysis", { query, conversationContext });
    
    // Prepare GitHub API endpoint based on query analysis
    const apiEndpoint = buildGitHubApiEndpoint(queryAnalysis.repoInfo);
    
    const apiResponse = await executeNode("GitHub API Integration", { apiEndpoint });
    
    let response;
    if (queryAnalysis.requiresRepoStructure) {
      const repoStructure = await executeNode("Repository Structure Analysis", { repoContents: apiResponse });
      response = await executeNode("Response Generation", {
        query,
        queryAnalysis,
        repoStructure,
        outputFormat: repositoryAnalysisSchema
      });
    } else if (queryAnalysis.requiresFileAccess) {
      const fileUrl = buildGitHubFileUrl(queryAnalysis.repoInfo, apiResponse);
      const fileContent = await executeNode("File Content Retrieval", { fileUrl });
      const codeAnalysis = await executeNode("Code Analysis", { 
        fileContent: fileContent.content, 
        fileName: fileContent.name 
      });
      response = await executeNode("Response Generation", {
        query,
        queryAnalysis,
        codeAnalysis
      });
    } else {
      response = await executeNode("Response Generation", {
        query,
        queryAnalysis,
        apiResponse
      });
    }
    
    return response;
  }
};

// Example execution
const result = await workflow.execute({
  query: "What's the structure of the n8n repository?",
  conversationContext: {
    currentRepository: "https://github.com/n8n-io/n8n"
  }
});

console.log(result);
```

### Code Explanation
```javascript
// Example of code explanation workflow
const codeExplanationWorkflow = {
  execute: async (input) => {
    const query = "Explain the main.js file in this repository";
    const repoUrl = "https://github.com/example/project";
    
    // Analyze query to find the file
    const fileInfo = await locateFileInRepository(repoUrl, "main.js");
    
    // Retrieve and analyze the file
    const fileContent = await retrieveFileContent(fileInfo.url);
    const explanation = await analyzeAndExplainCode(fileContent, "main.js");
    
    return formatCodeExplanation(explanation);
  }
};
```

## Testing
The agent includes comprehensive testing for:
- Query interpretation accuracy
- GitHub API integration reliability
- Repository structure analysis
- Code explanation quality
- Context management for conversations

Tests are automated using n8n's testing framework and run against various repository types to ensure consistent performance across different codebases.
