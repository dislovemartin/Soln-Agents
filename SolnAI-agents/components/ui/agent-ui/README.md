# SolnAI Agent UI Components

A comprehensive UI component library for building agent-based interfaces in React applications.

## Overview

The SolnAI Agent UI components provide a complete solution for building agent-based interfaces. The library includes components for displaying agent information, handling chat interactions, managing settings, and displaying results.

## Features

- **Complete Agent UI System**: Ready-to-use components for building agent interfaces
- **Context-based State Management**: Centralized state management using React Context
- **API and WebSocket Integration**: Built-in services for connecting to backend APIs
- **File Upload/Download**: Support for file operations
- **Responsive Design**: Mobile-friendly components that adapt to different screen sizes
- **Dark Mode Support**: Built-in dark mode with easy toggling
- **Accessibility**: ARIA-compliant components for better accessibility
- **TypeScript Support**: Full TypeScript definitions for all components
- **AutoGen Studio Integration**: Connect to Microsoft's AutoGen Studio for advanced agent capabilities and agent workflows

## Installation

```bash
npm install @solnai/agent-ui
# or
yarn add @solnai/agent-ui
```

## Core Components

- **AgentApp**: Main container component that sets up the entire agent UI system
- **AgentLayout**: Layout component for structuring the agent interface
- **AgentHeader**: Header component with user information and controls
- **AgentSidebar**: Sidebar component for displaying and selecting agents
- **AgentContent**: Main content area for displaying agent interactions
- **AgentChat**: Chat interface for interacting with agents
- **AgentResults**: Component for displaying agent results
- **AgentSettings**: Component for managing agent settings
- **AutoGenStudioPanel**: Component for integrating with AutoGen Studio

## Context Providers

- **AppProviders**: Combines all providers for easy setup
- **ServiceProvider**: Provides API and WebSocket services
- **AgentProvider**: Manages agent state and interactions
- **FileProvider**: Handles file uploads and downloads

## Hooks

- **useApi**: Hook for making API requests
- **useWebSocket**: Hook for WebSocket communication
- **useAgent**: Hook for managing agent state
- **useFileHandler**: Hook for handling file operations
- **useAutoGenStudio**: Hook for interacting with AutoGen Studio

## Services

- **ApiService**: Service for making API requests
- **WebSocketService**: Service for WebSocket communication

## Basic Usage

```tsx
import { AgentApp } from "@solnai/agent-ui";

function App() {
  // API configuration
  const apiConfig = {
    baseUrl: "https://api.example.com",
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
    },
  };

  // WebSocket configuration
  const webSocketConfig = {
    url: "wss://api.example.com/ws",
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
  };

  return (
    <AgentApp
      apiConfig={apiConfig}
      webSocketConfig={webSocketConfig}
      authToken="your-auth-token"
      initialAgentId="default-agent"
      userName="John Doe"
      userAvatar="https://example.com/avatar.jpg"
      onLogout={() => console.log("Logout")}
    />
  );
}
```

## Advanced Usage

### Using Individual Components

```tsx
import {
  AgentLayout,
  AgentHeader,
  AgentSidebar,
  AgentContent,
  AppProviders,
} from "@solnai/agent-ui";

function CustomAgentApp() {
  // API and WebSocket configuration
  const apiConfig = {
    /* ... */
  };
  const webSocketConfig = {
    /* ... */
  };

  return (
    <AppProviders
      apiConfig={apiConfig}
      webSocketConfig={webSocketConfig}
      authToken="your-auth-token"
      initialAgentId="default-agent"
    >
      <AgentLayout
        header={<AgentHeader userName="John Doe" />}
        sidebar={<AgentSidebar />}
      >
        <AgentContent />
      </AgentLayout>
    </AppProviders>
  );
}
```

### Using Hooks

```tsx
import { useAgent, useFileHandler } from "@solnai/agent-ui";

function CustomAgentChat() {
  const { currentAgent, messages, sendMessage, isTyping } = useAgent();

  const { uploadFile, isUploading } = useFileHandler();

  // Custom chat implementation
  return (
    <div>
      {/* Chat messages */}
      <div>
        {messages.map((message) => (
          <div key={message.id}>{message.content}</div>
        ))}
      </div>

      {/* Input area */}
      <div>
        <input
          type="text"
          placeholder="Type a message..."
          onKeyDown={/* ... */}
        />
        <button onClick={/* ... */}>Send</button>
      </div>
    </div>
  );
}
```

### AutoGen Studio Integration

```tsx
import { AutoGenStudioPanel, AppProviders } from "@solnai/agent-ui";

function AutoGenStudioApp() {
  // API configuration for AutoGen Studio
  const apiConfig = {
    baseUrl: 'http://localhost:8081/api', // Default AutoGen Studio API endpoint
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // WebSocket configuration for AutoGen Studio
  const webSocketConfig = {
    url: 'ws://localhost:8081/ws',
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
  };

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

## Backend Integration

For information on integrating with backend services, see the [Integration Guide](./INTEGRATION.md).

## AutoGen Studio Integration

For detailed instructions on integrating with AutoGen Studio, see:

- [AutoGen Integration Guide](./README_AUTOGEN_INTEGRATION.md) - Complete guide to setting up the integration
- [AutoGen Integration Example](./INTEGRATION_EXAMPLE.md) - Example implementation
- [AutoGen Proxy Setup](./AUTOGEN_PROXY_SETUP.md) - Guide for setting up the proxy service

To quickly set up the integration:

```bash
# Set up the integration
./setup-autogen-integration.sh

# Launch all services
./launch-autogen-integration.sh
```

## Demo

A complete demo is available in the `demo` directory. To run the demo:

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Open your browser to the demo page

## Customization

The components can be customized using:

- **Props**: Most components accept props for customization
- **CSS Variables**: The components use CSS variables for styling
- **Tailwind CSS**: The components are built with Tailwind CSS and can be customized using Tailwind's utility classes

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
