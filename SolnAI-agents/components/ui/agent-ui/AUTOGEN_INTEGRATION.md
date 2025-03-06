# AutoGen Studio Integration Guide

This guide explains how to integrate the SolnAI Agent UI with Microsoft's AutoGen Studio.

## What is AutoGen Studio?

[AutoGen Studio](https://microsoft.github.io/autogen/docs/studio/) is a low-code interface built on top of Microsoft's AutoGen framework that helps you:

- Rapidly prototype AI agents
- Enhance agents with skills
- Compose agents into workflows
- Interact with agents to accomplish tasks

## Prerequisites

Before integrating with AutoGen Studio, you need to:

1. Install AutoGen Studio:
   ```bash
   pip install autogenstudio
   ```

2. Run the AutoGen Studio server:
   ```bash
   autogenstudio ui --port 8081 --host 0.0.0.0
   ```

## Integration Steps

### 1. Configure API Connection

The SolnAI Agent UI connects to AutoGen Studio through its API. Configure the connection in your application:

```tsx
const apiConfig = {
  baseUrl: 'http://localhost:8081/api', // Default AutoGen Studio API endpoint
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

const webSocketConfig = {
  url: 'ws://localhost:8081/ws',
  reconnectInterval: 3000,
  maxReconnectAttempts: 5,
};
```

### 2. Use the AutoGenStudioPanel Component

The simplest way to integrate is to use the `AutoGenStudioPanel` component:

```tsx
import { AutoGenStudioPanel, AppProviders } from "@solnai/agent-ui";

function App() {
  return (
    <AppProviders
      apiConfig={apiConfig}
      webSocketConfig={webSocketConfig}
      authToken="your-auth-token"
    >
      <div className="container mx-auto p-4 h-screen">
        <AutoGenStudioPanel />
      </div>
    </AppProviders>
  );
}
```

### 3. Use the useAutoGenStudio Hook

For more customized integrations, use the `useAutoGenStudio` hook:

```tsx
import { useAutoGenStudio } from "@solnai/agent-ui";

function CustomAutoGenComponent() {
  const {
    agents,
    currentAgent,
    messages,
    loading,
    error,
    fetchAgents,
    fetchAgent,
    createSession,
    sendMessage,
  } = useAutoGenStudio();

  // Custom implementation
  return (
    <div>
      {/* Your custom UI */}
    </div>
  );
}
```

## API Reference

### AutoGenStudioPanel Props

| Prop | Type | Description |
|------|------|-------------|
| className | string | Optional CSS class name |

### useAutoGenStudio Hook

The hook returns the following:

| Property | Type | Description |
|----------|------|-------------|
| agents | AutoGenAgent[] | List of available agents |
| currentAgent | AutoGenAgent | Currently selected agent |
| currentSession | AutoGenSession | Current active session |
| messages | AutoGenMessage[] | Messages in the current session |
| skills | AutoGenSkill[] | Available skills |
| loading | boolean | Loading state |
| error | string | Error message |
| fetchAgents | () => Promise<void> | Fetch all agents |
| fetchAgent | (id: string) => Promise<AutoGenAgent> | Fetch a specific agent |
| createSession | (agentId: string, task: string) => Promise<AutoGenSession> | Create a new session |
| sendMessage | (message: string) => Promise<AutoGenMessage> | Send a message |
| fetchMessages | (sessionId: string) => Promise<AutoGenMessage[]> | Fetch messages for a session |
| fetchSkills | () => Promise<AutoGenSkill[]> | Fetch all skills |
| addSkillToAgent | (agentId: string, skillId: string) => Promise<boolean> | Add a skill to an agent |

## Custom Backend Integration

If you're running AutoGen Studio on a different URL or with custom authentication, update the API configuration:

```tsx
const apiConfig = {
  baseUrl: 'https://your-autogen-studio-url/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${yourAuthToken}`,
  },
};
```

## Running the Demo

A complete demo is available in the `demo` directory:

```tsx
import { AutoGenStudioDemo } from "@solnai/agent-ui/demo";

function App() {
  return <AutoGenStudioDemo />;
}
```

## Troubleshooting

### Connection Issues

If you're having trouble connecting to AutoGen Studio:

1. Ensure the AutoGen Studio server is running
2. Check that the API URL is correct
3. Verify any firewall or network settings
4. Check browser console for CORS errors

### API Errors

If you're seeing API errors:

1. Check the AutoGen Studio server logs
2. Verify your authentication token
3. Ensure you're using the correct API endpoints

## Resources

- [AutoGen Documentation](https://microsoft.github.io/autogen/docs/Getting-Started)
- [AutoGen Studio Documentation](https://microsoft.github.io/autogen/docs/studio/)
- [AutoGen GitHub Repository](https://github.com/microsoft/autogen)
