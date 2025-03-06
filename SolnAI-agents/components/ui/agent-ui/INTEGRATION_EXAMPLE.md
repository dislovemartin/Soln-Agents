# SolnAI Agent UI + AutoGen Studio Integration Example

This document provides a practical example of integrating SolnAI Agent UI with AutoGen Studio in a real-world application.

## Overview

This integration allows you to:

1. Use SolnAI Agent UI components alongside AutoGen Studio agents
2. Pass data between SolnAI agents and AutoGen Studio agents
3. Create a unified UI experience that leverages both frameworks

## Implementation Example

### Step 1: Set Up Your Project

First, ensure you have the required dependencies:

```bash
# Install SolnAI Agent UI
npm install @solnai/agent-ui

# Install AutoGen Studio (server-side)
pip install autogenstudio
```

### Step 2: Configure Your Application

Create a configuration file for your API settings:

```typescript
// config.ts
export const apiConfig = {
  baseUrl: process.env.API_URL || 'http://localhost:8000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

export const autogenConfig = {
  baseUrl: process.env.AUTOGEN_API_URL || 'http://localhost:8081/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

export const webSocketConfig = {
  url: process.env.WS_URL || 'ws://localhost:8000/ws',
  reconnectInterval: 3000,
  maxReconnectAttempts: 5,
};

export const autogenWebSocketConfig = {
  url: process.env.AUTOGEN_WS_URL || 'ws://localhost:8081/ws',
  reconnectInterval: 3000,
  maxReconnectAttempts: 5,
};
```

### Step 3: Create an Integration Component

Use the provided `AutoGenIntegrationUI` component or create a custom one:

```tsx
// pages/integrated-agent.tsx
import { AgentLayout, AutoGenIntegrationUI, AppProviders } from '@solnai/agent-ui';
import { apiConfig, autogenConfig, webSocketConfig } from '../config';

export default function IntegratedAgentPage() {
  return (
    <AppProviders 
      apiConfig={apiConfig}
      webSocketConfig={webSocketConfig}
      authToken="your-auth-token"
    >
      <AgentLayout>
        <AutoGenIntegrationUI />
      </AgentLayout>
    </AppProviders>
  );
}
```

### Step 4: Start Both Services

Run both services in parallel:

```bash
# Terminal 1: Start AutoGen Studio
autogenstudio ui --port 8081 --host 0.0.0.0

# Terminal 2: Start your SolnAI application
npm run dev
```

## Advanced Usage: Data Exchange Between Agents

To enable more sophisticated interactions between SolnAI agents and AutoGen Studio agents:

### 1. Create a Data Exchange Service

```typescript
// services/agent-exchange.ts
class AgentExchangeService {
  // Convert SolnAI agent results to AutoGen format
  convertSolnResultsToAutoGen(results) {
    return {
      content: results.map(r => `${r.title}: ${r.content}`).join('\n\n'),
      metadata: {
        source: 'solnai',
        timestamp: new Date().toISOString(),
        resultCount: results.length
      }
    };
  }
  
  // Pass data to AutoGen Session
  async sendToAutoGen(autoGenSessionId, data) {
    // Implementation details
  }
  
  // Create an AutoGen agent from SolnAI agent results
  async createAutoGenAgentFromResults(results, name, description) {
    // Implementation details
  }
}

export default new AgentExchangeService();
```

### 2. Use the Exchange Service in Your Component

```tsx
import agentExchange from '../services/agent-exchange';

// Inside your component
const handleProcessWithAutoGen = async () => {
  // Get results from SolnAI agent
  const formattedData = agentExchange.convertSolnResultsToAutoGen(results);
  
  // Create a session with an AutoGen agent
  const session = await createSession(selectedAgentId, 'Process SolnAI results');
  
  // Send the data to AutoGen
  await agentExchange.sendToAutoGen(session.id, formattedData);
  
  // Switch to the AutoGen tab to view results
  setActiveTab('autogen');
};
```

## Example Use Cases

### 1. Research and Analysis Pipeline

- Use SolnAI's research agent to gather information
- Pass the research results to an AutoGen Studio agent for analysis
- Generate a report with the AutoGen agent's capabilities

### 2. Content Generation Workflow

- Use SolnAI's YouTube summary agent to extract key points from videos
- Pass those points to an AutoGen Studio agent specialized in content creation
- Generate blog posts, social media content, or newsletters

### 3. Data Analysis and Visualization

- Use SolnAI's data analysis agent to process data files
- Pass the processed data to an AutoGen Studio agent with visualization skills
- Generate interactive charts and reports

## Troubleshooting

### Connection Issues

If you encounter connection issues:

1. Verify that both AutoGen Studio and your SolnAI application are running
2. Check the network configuration and ensure ports are accessible
3. Verify API endpoint URLs in your configuration
4. Check browser console for CORS errors

### Data Exchange Problems

If data isn't properly transferring between agents:

1. Verify data formats match the expected schema
2. Check that authentication tokens are valid
3. Look for detailed error messages in both application logs

## Resources

- [SolnAI Agent UI Documentation](https://docs.solnai.com/agent-ui)
- [AutoGen Studio Documentation](https://microsoft.github.io/autogen/docs/studio/)
- [AutoGen GitHub Repository](https://github.com/microsoft/autogen)