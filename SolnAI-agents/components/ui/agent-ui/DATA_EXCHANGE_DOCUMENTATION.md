# SolnAI-AutoGen Data Exchange Service Documentation

This document provides comprehensive documentation for the Data Exchange Service that enables bidirectional data conversion between SolnAI and AutoGen Studio.

## Overview

The Data Exchange Service is responsible for:

1. Converting data between SolnAI and AutoGen Studio formats
2. Enriching data with appropriate metadata
3. Parsing and structuring content intelligently
4. Ensuring data integrity during exchanges
5. Handling different content types (text, code, links, etc.)

## Exchange Format

The service uses a standardized exchange format for transferring data:

```typescript
interface ExchangeFormat {
  content: string;
  contentType: 'text' | 'markdown' | 'code' | 'structured' | 'mixed';
  metadata: {
    source: string;
    timestamp: string;
    [key: string]: any;
  };
  blocks?: ContentBlock[];
}

interface ContentBlock {
  type: 'text' | 'code' | 'image' | 'link' | 'file' | 'table';
  content: string;
  language?: string;
  title?: string;
  metadata?: Record<string, any>;
}
```

## Service Configuration

Create a new instance of the Agent Exchange Service with custom configuration:

```typescript
import { createAgentExchangeService } from './services/agent-exchange';

const exchangeService = createAgentExchangeService({
  apiService: yourApiService,
  autogenApiUrl: 'http://localhost:8081/api',     // URL to AutoGen Studio API
  defaultModel: 'gpt-4',                         // Default model for agent creation
  defaultTemperature: 0.7,                       // Default temperature setting
  preserveFormatting: true,                      // Preserve markdown formatting in conversions
  enableStructuredData: true                     // Enable structured data in exchanges
});
```

## Data Conversion Methods

### 1. SolnAI Results → Exchange Format

Convert SolnAI result items to the exchange format:

```typescript
const results = [
  {
    id: 'result1',
    title: 'Research Summary',
    content: 'Findings from the research...',
    type: 'text',
    metadata: { source: 'web-search', timestamp: '2023-01-01T00:00:00Z' }
  },
  {
    id: 'result2',
    title: 'Sample Code',
    content: 'function example() { return "Hello"; }',
    type: 'code',
    metadata: { language: 'javascript', timestamp: '2023-01-01T00:01:00Z' }
  }
];

// Convert to exchange format
const exchangeData = exchangeService.convertSolnResultsToExchange(results, {
  includeBlocks: true,             // Include structured content blocks
  customMetadata: {                // Add custom metadata
    projectId: 'project-123',
    source: 'research-agent'
  }
});
```

The resulting exchange format will include:
- Properly formatted content with markdown for code blocks and links
- Content type (text, markdown, code, etc.)
- Comprehensive metadata including source, timestamp, and result count
- Structured content blocks (if requested)

### 2. SolnAI Chat Messages → Exchange Format

Convert SolnAI chat messages to the exchange format:

```typescript
const messages = [
  {
    id: 'msg1',
    role: 'user',
    content: 'Can you research quantum computing?',
    timestamp: '2023-01-01T00:00:00Z'
  },
  {
    id: 'msg2',
    role: 'assistant',
    content: 'I found information about quantum computing...',
    timestamp: '2023-01-01T00:01:00Z'
  }
];

// Convert to exchange format
const exchangeData = exchangeService.convertSolnMessagesToExchange(messages, {
  formatAsMarkdown: true,         // Format as markdown with headers
  includeBlocks: true,            // Include structured content blocks
  customMetadata: {               // Add custom metadata
    conversationId: 'conv-456',
    topic: 'quantum-computing'
  }
});
```

### 3. AutoGen Messages → SolnAI Messages

Convert AutoGen Studio messages to SolnAI chat messages:

```typescript
// Fetch messages from AutoGen Studio
const sessionId = 'session-123';
const messages = await exchangeService.getAutoGenMessagesForSolnAI(sessionId);

// messages will be in SolnAI chat message format:
// [
//   { id: 'msg1', role: 'user', content: '...', timestamp: '...' },
//   { id: 'msg2', role: 'assistant', content: '...', timestamp: '...' }
// ]
```

### 4. AutoGen Messages → SolnAI Results

Convert AutoGen Studio messages to SolnAI result items:

```typescript
// Fetch results from AutoGen Studio
const sessionId = 'session-123';
const results = await exchangeService.getAutoGenResultsForSolnAI(sessionId);

// results will be in SolnAI result item format:
// [
//   { id: 'result1', title: '...', content: '...', type: 'text', metadata: {...} }
// ]
```

## Sending Data to AutoGen Studio

### 1. Send Data to Existing Session

Send data to an existing AutoGen Studio session:

```typescript
const sessionId = 'session-123';
const exchangeData = exchangeService.convertSolnResultsToExchange(results);

const success = await exchangeService.sendToAutoGen(sessionId, exchangeData);
if (success) {
  console.log('Data successfully sent to AutoGen Studio');
} else {
  console.error('Failed to send data to AutoGen Studio');
}
```

### 2. Create AutoGen Agent from SolnAI Results

Create a new AutoGen Studio agent with knowledge from SolnAI results:

```typescript
const agentId = await exchangeService.createAutoGenAgentFromResults(
  results,
  'Research Assistant',
  'An agent that has knowledge about research findings',
  {
    model: 'claude-3-opus',        // Optional: override default model
    temperature: 0.5,              // Optional: override default temperature
    skillIds: ['web-search']       // Optional: add skills to agent
  }
);

if (agentId) {
  console.log(`New AutoGen agent created with ID: ${agentId}`);
} else {
  console.error('Failed to create AutoGen agent');
}
```

### 3. Create AutoGen Session with SolnAI Results

Create a new AutoGen Studio session and populate it with SolnAI results:

```typescript
const sessionId = await exchangeService.createAutoGenSessionWithResults(
  'agent-123',           // AutoGen agent ID
  'Research quantum computing and summarize findings',  // Task description
  results                // SolnAI results to include
);

if (sessionId) {
  console.log(`New AutoGen session created with ID: ${sessionId}`);
} else {
  console.error('Failed to create AutoGen session');
}
```

## Content Parsing and Formatting

The service includes sophisticated content parsing capabilities, particularly for identifying and handling different content types:

### Code Block Detection

The service can parse markdown-formatted content and identify code blocks:

```typescript
// Input content with mixed text and code
const content = `
Here's some information about algorithms.

\`\`\`python
def example_algorithm(data):
    return sorted(data)
\`\`\`

This is a simple sorting algorithm.
`;

// The service will parse this into separate content blocks:
// [
//   { type: 'text', content: "Here's some information about algorithms." },
//   { type: 'code', content: "def example_algorithm(data):\n    return sorted(data)", language: "python" },
//   { type: 'text', content: "This is a simple sorting algorithm." }
// ]
```

### Rich Markdown Formatting

When converting SolnAI results to AutoGen format, the service creates properly formatted markdown:

```typescript
// Code results are formatted with markdown code blocks
// ```javascript
// function example() { return "Hello"; }
// ```

// Link results are formatted as markdown links
// [Link Title](https://example.com)

// Images are formatted as markdown images
// ![Image Title](https://example.com/image.jpg)
```

## Error Handling

The service includes comprehensive error handling:

```typescript
try {
  const exchangeData = exchangeService.convertSolnResultsToExchange(results);
  const success = await exchangeService.sendToAutoGen(sessionId, exchangeData);

  if (!success) {
    // Handle API error
  }
} catch (error) {
  // Handle validation or unexpected errors
  console.error('Error in data exchange:', error.message);
}
```

## Input Validation

All methods include input validation to ensure data integrity:

```typescript
// These will throw validation errors:
exchangeService.convertSolnResultsToExchange(null);  // Invalid results
exchangeService.convertSolnResultsToExchange([]);    // Empty array
exchangeService.sendToAutoGen('', exchangeData);     // Empty session ID
```

## Advanced Features

### 1. Content Block Extraction

The service can parse content into structured blocks:

```typescript
// Extract content blocks from auto-detected code sections, links, etc.
const exchangeData = exchangeService.convertSolnResultsToExchange(results, {
  includeBlocks: true
});

// Access the structured blocks
const blocks = exchangeData.blocks;
```

### 2. Enhanced Metadata

Add custom metadata to enrich the exchange data:

```typescript
const exchangeData = exchangeService.convertSolnResultsToExchange(results, {
  customMetadata: {
    category: 'research',
    priority: 'high',
    tags: ['quantum', 'physics', 'computing']
  }
});
```

### 3. Content Type Detection

The service automatically detects the appropriate content type based on the input data:

```typescript
const exchangeData = exchangeService.convertSolnResultsToExchange(results);

// contentType will be automatically determined:
// - 'text' for plain text results
// - 'code' for code-only results
// - 'markdown' for mixed content types
console.log(exchangeData.contentType);
```

## Integration with React Components

The data exchange service can be used effectively with React components:

```jsx
import React, { useState, useEffect } from 'react';
import { useAutoGenStudio } from '../hooks/useAutoGenStudio';
import { createAgentExchangeService } from '../services/agent-exchange';

function AutoGenIntegration({ solnaiResults }) {
  const { agents, createSession, sendMessage } = useAutoGenStudio();
  const [exchangeService] = useState(() => createAgentExchangeService({
    apiService: yourApiService,
    autogenApiUrl: 'http://localhost:8081/api'
  }));
  
  const handleSendToAutoGen = async (agentId) => {
    // Convert SolnAI results to exchange format
    const exchangeData = exchangeService.convertSolnResultsToExchange(
      solnaiResults,
      { includeBlocks: true }
    );
    
    // Create a new session
    const session = await createSession(agentId, "Analyze this data");
    
    // Send the data to the session
    if (session) {
      await sendMessage(session.id, exchangeData.content);
    }
  };
  
  return (
    <div>
      <h2>Send to AutoGen Studio</h2>
      <select onChange={(e) => handleSendToAutoGen(e.target.value)}>
        {agents.map(agent => (
          <option key={agent.id} value={agent.id}>{agent.name}</option>
        ))}
      </select>
    </div>
  );
}
```

## Conclusion

The Data Exchange Service provides a robust and flexible way to exchange data between SolnAI and AutoGen Studio. By handling format conversion, content parsing, and metadata enrichment, it enables seamless integration between the two platforms.

For specific implementation details, refer to the code documentation in `agent-exchange.ts`.