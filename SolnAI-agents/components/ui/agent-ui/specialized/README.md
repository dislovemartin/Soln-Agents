# Specialized Agent UI Components

This directory contains specialized UI components for different types of agents in the SolnAI platform. Each component provides a tailored interface for a specific type of agent, optimizing the user experience for that agent's capabilities.

## Available Components

### ResearchAgentUI

A specialized interface for research agents that includes:
- Research query input with search depth options
- Source selection for research
- Real-time research results display
- Chat interface for follow-up questions

```tsx
import { ResearchAgentUI } from 'components/ui/agent-ui/specialized';

function MyComponent() {
  return (
    <ResearchAgentUI
      agentId="research-agent"
      agentName="Research Agent"
      agentIcon="🔍"
    />
  );
}
```

### YouTubeSummaryUI

A specialized interface for YouTube video summarization agents that includes:
- YouTube URL input
- Summary type selection (concise, detailed, transcript)
- Option to include timestamps
- Video details display
- Summary results with key points

```tsx
import { YouTubeSummaryUI } from 'components/ui/agent-ui/specialized';

function MyComponent() {
  return (
    <YouTubeSummaryUI
      agentId="youtube-summary"
      agentName="YouTube Summarizer"
      agentIcon="📹"
    />
  );
}
```

### DataAnalysisUI

A specialized interface for data analysis agents that includes:
- File upload for data files (CSV, Excel, JSON, TXT)
- Analysis type selection (exploratory, statistical, predictive)
- Visualization type selection
- Analysis results with visualizations and insights

```tsx
import { DataAnalysisUI } from 'components/ui/agent-ui/specialized';

function MyComponent() {
  return (
    <DataAnalysisUI
      agentId="data-analysis"
      agentName="Data Analysis"
      agentIcon="📊"
    />
  );
}
```

## Adding New Specialized UIs

To add a new specialized UI for an agent type:

1. Create a new component file in this directory (e.g., `MyAgentUI.tsx`)
2. Implement the component with the appropriate interface
3. Export the component from `index.ts`
4. Add the agent ID to component mapping in the `AGENT_UI_MAP` object in `index.ts`

Example:

```tsx
// MyAgentUI.tsx
import React from 'react';

interface MyAgentUIProps {
  agentId: string;
  agentName: string;
  agentIcon?: string;
}

export function MyAgentUI({ agentId, agentName, agentIcon = '🤖' }: MyAgentUIProps) {
  // Implement your specialized UI
  return (
    <div>
      <h1>{agentName}</h1>
      {/* ... */}
    </div>
  );
}

export default MyAgentUI;
```

Then in `index.ts`:

```ts
export { default as MyAgentUI } from './MyAgentUI';

// Update the map
export const AGENT_UI_MAP = {
  // ... existing mappings
  'my-agent': 'MyAgentUI',
};
```

## Best Practices

When creating specialized UIs:

1. Focus on the unique capabilities of the agent
2. Provide clear input mechanisms for the agent's parameters
3. Display results in a format that makes sense for the agent's output
4. Include a chat interface for follow-up interactions
5. Maintain consistent styling with the rest of the application
6. Ensure responsive design for all screen sizes
7. Implement proper loading states and error handling
