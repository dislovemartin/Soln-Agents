# Backend Integration Guide for SolnAI Agent UI

This guide explains how to integrate the SolnAI Agent UI components with backend services to create fully functional agent applications.

## Overview

The SolnAI Agent UI components are designed to be easily integrated with various backend services. This guide covers:

1. API integration patterns
2. Authentication
3. Agent data fetching
4. Message handling
5. File uploads and downloads
6. Result handling
7. Settings management
8. Error handling

## API Integration Patterns

### RESTful API Integration

The most common integration pattern is with a RESTful API. Here's how to connect the UI components to a REST backend:

```tsx
import { AgentApp } from "components/ui/agent-ui";
import { useState, useEffect } from "react";

function App() {
  const [agentCategories, setAgentCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch agent data from your API
    const fetchAgents = async () => {
      try {
        setLoading(true);
        const response = await fetch("https://your-api.com/agents");
        const data = await response.json();

        // Transform the data to match the AgentCategory structure
        const categories = transformToAgentCategories(data);
        setAgentCategories(categories);
        setLoading(false);
      } catch (err) {
        setError("Failed to load agents");
        setLoading(false);
        console.error("Error fetching agents:", err);
      }
    };

    fetchAgents();
  }, []);

  // Transform function to convert API data to AgentCategory format
  const transformToAgentCategories = (data) => {
    // Example transformation - adjust based on your API response structure
    const categoryMap = {};

    data.forEach((agent) => {
      if (!categoryMap[agent.category]) {
        categoryMap[agent.category] = {
          name: agent.category,
          agents: [],
        };
      }

      categoryMap[agent.category].agents.push({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        icon: agent.icon || "🤖", // Default icon if none provided
      });
    });

    return Object.values(categoryMap);
  };

  if (loading) {
    return <div>Loading agents...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <AgentApp
      customAgentCategories={agentCategories}
      onAgentChange={handleAgentChange}
    />
  );
}
```

### WebSocket Integration

For real-time communication with agents, WebSocket integration is recommended:

```tsx
import { AgentApp } from "components/ui/agent-ui";
import { useState, useEffect, useRef } from "react";

function App() {
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket
    socketRef.current = new WebSocket("wss://your-websocket-api.com");

    // Handle incoming messages
    socketRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages((prev) => [...prev, message]);
    };

    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  // Send message to the agent
  const sendMessage = (message) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  };

  return (
    <AgentApp
      // Pass custom message handlers
      onSendMessage={sendMessage}
      messages={messages}
    />
  );
}
```

## Authentication

### JWT Authentication

To integrate with JWT authentication:

```tsx
import { AgentApp } from "components/ui/agent-ui";
import { useState, useEffect } from "react";

function App() {
  const [token, setToken] = useState(localStorage.getItem("auth_token"));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("https://your-api.com/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const userData = await response.json();
      setUser(userData);
    } catch (err) {
      console.error("Error fetching user profile:", err);
      // Handle authentication error
      setToken(null);
      localStorage.removeItem("auth_token");
    }
  };

  const login = async (credentials) => {
    try {
      const response = await fetch("https://your-api.com/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });
      const data = await response.json();
      setToken(data.token);
      localStorage.setItem("auth_token", data.token);
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  if (!token) {
    return <LoginForm onLogin={login} />;
  }

  return (
    <AgentApp
      userName={user?.name}
      userAvatar={user?.avatar}
      // Add auth token to API requests
      apiConfig={{
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }}
    />
  );
}
```

## Agent Data Fetching

### Fetching Agent Definitions

To fetch agent definitions from your backend:

```tsx
import { AgentApp } from "components/ui/agent-ui";
import { useState, useEffect } from "react";

function App() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch("https://your-api.com/agents");
        const data = await response.json();

        // Group agents by category
        const agentsByCategory = data.reduce((acc, agent) => {
          if (!acc[agent.category]) {
            acc[agent.category] = [];
          }
          acc[agent.category].push(agent);
          return acc;
        }, {});

        // Convert to format expected by AgentApp
        const agentCategories = Object.entries(agentsByCategory).map(
          ([name, agents]) => ({
            name,
            agents: agents.map(({ id, name, description, icon }) => ({
              id,
              name,
              description,
              icon: icon || getDefaultIcon(id),
            })),
          })
        );

        setAgents(agentCategories);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching agents:", err);
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  // Helper function to get default icon based on agent type
  const getDefaultIcon = (agentId) => {
    if (agentId.includes("research")) return "🔍";
    if (agentId.includes("youtube")) return "📺";
    if (agentId.includes("data")) return "📊";
    return "🤖";
  };

  if (loading) {
    return <div>Loading agents...</div>;
  }

  return <AgentApp customAgentCategories={agents} />;
}
```

## Message Handling

### Sending and Receiving Messages

To handle sending and receiving messages with agents:

```tsx
import { AgentContent } from "components/ui/agent-ui";
import { useState } from "react";

function AgentPage({ agentId, agentName, agentIcon }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (content) => {
    try {
      setLoading(true);

      // Add user message to the chat
      const userMessage = {
        id: Date.now().toString(),
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);

      // Send to API
      const response = await fetch("https://your-api.com/agents/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId,
          message: content,
        }),
      });

      const data = await response.json();

      // Add agent response to the chat
      const agentMessage = {
        id: data.id || Date.now().toString() + "-response",
        role: "assistant",
        content: data.response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, agentMessage]);
      setLoading(false);
    } catch (err) {
      console.error("Error sending message:", err);
      setLoading(false);

      // Add error message
      const errorMessage = {
        id: Date.now().toString() + "-error",
        role: "system",
        content: "Sorry, there was an error processing your request.",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  return (
    <AgentContent
      agentId={agentId}
      agentName={agentName}
      agentIcon={agentIcon}
      messages={messages}
      onSendMessage={sendMessage}
      isLoading={loading}
    />
  );
}
```

## File Uploads and Downloads

### Handling File Uploads

For agents that require file uploads (like the Data Analysis agent):

```tsx
import { DataAnalysisUI } from "components/ui/agent-ui/specialized";
import { useState } from "react";

function DataAnalysisPage({ agentId, agentName }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const handleFileUpload = async (file, analysisType) => {
    try {
      setLoading(true);

      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("analysisType", analysisType);
      formData.append("agentId", agentId);

      // Upload to API
      const response = await fetch(
        "https://your-api.com/agents/data-analysis/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      setResults(data.results);
      setLoading(false);
    } catch (err) {
      console.error("Error uploading file:", err);
      setLoading(false);
    }
  };

  return (
    <DataAnalysisUI
      agentId={agentId}
      agentName={agentName}
      onFileUpload={handleFileUpload}
      results={results}
      isLoading={loading}
    />
  );
}
```

### Handling File Downloads

For downloading results:

```tsx
import { AgentResults } from "components/ui/agent-ui";

function ResultsPage({ results }) {
  const handleDownload = async (result) => {
    try {
      // For file results
      if (result.type === "file") {
        const response = await fetch(
          `https://your-api.com/results/download/${result.id}`
        );
        const blob = await response.blob();

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = result.filename || "download";
        document.body.appendChild(a);
        a.click();

        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      // For text results
      else if (result.type === "text") {
        const blob = new Blob([result.content], { type: "text/plain" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `${result.title || "result"}.txt`;
        document.body.appendChild(a);
        a.click();

        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error("Error downloading result:", err);
    }
  };

  return <AgentResults results={results} onDownload={handleDownload} />;
}
```

## Settings Management

### Saving and Loading Agent Settings

To manage agent settings:

```tsx
import { AgentSettings } from "components/ui/agent-ui";
import { useState, useEffect } from "react";

function SettingsPage({ agentId }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(
          `https://your-api.com/agents/${agentId}/settings`
        );
        const data = await response.json();
        setSettings(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching settings:", err);
        setLoading(false);
      }
    };

    fetchSettings();
  }, [agentId]);

  // Save settings
  const saveSettings = async (updatedSettings) => {
    try {
      const response = await fetch(
        `https://your-api.com/agents/${agentId}/settings`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedSettings),
        }
      );

      const data = await response.json();
      setSettings(data);
      return { success: true };
    } catch (err) {
      console.error("Error saving settings:", err);
      return { success: false, error: err.message };
    }
  };

  if (loading) {
    return <div>Loading settings...</div>;
  }

  return (
    <AgentSettings
      agentId={agentId}
      initialSettings={settings}
      onSave={saveSettings}
    />
  );
}
```

## Error Handling

### Global Error Handling

Implement global error handling for API requests:

```tsx
import { AgentApp } from "components/ui/agent-ui";
import { useState } from "react";

function App() {
  const [error, setError] = useState(null);

  // Create a wrapper for fetch that handles errors
  const fetchWithErrorHandling = async (url, options = {}) => {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Request failed with status ${response.status}`
        );
      }

      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  return (
    <>
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={clearError}>Dismiss</button>
        </div>
      )}
      <AgentApp apiClient={fetchWithErrorHandling} />
    </>
  );
}
```

## Complete Integration Example

Here's a complete example integrating the AgentApp component with a backend:

```tsx
import { AgentApp } from "components/ui/agent-ui";
import { useState, useEffect, useCallback } from "react";

function App() {
  const [token, setToken] = useState(localStorage.getItem("auth_token"));
  const [user, setUser] = useState(null);
  const [agentCategories, setAgentCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );

  // API client with authentication
  const apiClient = useCallback(
    async (endpoint, options = {}) => {
      const url = `https://your-api.com${endpoint}`;
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      };

      try {
        const response = await fetch(url, {
          ...options,
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `Request failed with status ${response.status}`
          );
        }

        return await response.json();
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [token]
  );

  // Fetch user profile
  useEffect(() => {
    if (token) {
      const fetchUserProfile = async () => {
        try {
          const userData = await apiClient("/user/profile");
          setUser(userData);
        } catch (err) {
          console.error("Error fetching user profile:", err);
          // Handle authentication error
          setToken(null);
          localStorage.removeItem("auth_token");
        }
      };

      fetchUserProfile();
    }
  }, [token, apiClient]);

  // Fetch agent categories
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        const data = await apiClient("/agents");

        // Group agents by category
        const agentsByCategory = data.reduce((acc, agent) => {
          if (!acc[agent.category]) {
            acc[agent.category] = [];
          }
          acc[agent.category].push(agent);
          return acc;
        }, {});

        // Convert to format expected by AgentApp
        const categories = Object.entries(agentsByCategory).map(
          ([name, agents]) => ({
            name,
            agents: agents.map(({ id, name, description, icon }) => ({
              id,
              name,
              description,
              icon: icon || getDefaultIcon(id),
            })),
          })
        );

        setAgentCategories(categories);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching agents:", err);
        setLoading(false);
      }
    };

    fetchAgents();
  }, [apiClient]);

  // Helper function to get default icon based on agent type
  const getDefaultIcon = (agentId) => {
    if (agentId.includes("research")) return "🔍";
    if (agentId.includes("youtube")) return "📺";
    if (agentId.includes("data")) return "📊";
    return "🤖";
  };

  // Handle agent change
  const handleAgentChange = (agentId) => {
    console.log(`Agent changed to: ${agentId}`);
    // You can perform additional actions here
  };

  // Toggle dark mode
  const handleToggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode.toString());

    // Also toggle the class on the document for global dark mode
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Login handler
  const handleLogin = async (credentials) => {
    try {
      const data = await apiClient("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });

      setToken(data.token);
      localStorage.setItem("auth_token", data.token);
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  if (!token) {
    return <LoginForm onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading agents...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-4 z-50 flex justify-between">
          <p>{error}</p>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}
      <AgentApp
        customAgentCategories={agentCategories}
        onAgentChange={handleAgentChange}
        userName={user?.name || "User"}
        userAvatar={user?.avatar}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        apiClient={apiClient}
      />
    </>
  );
}

// Simple login form component
function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin({ email, password });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            SolnAI Agents
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Sign in to your account
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
```

## Next Steps

1. **Create API Endpoints**: Implement the necessary API endpoints on your backend to support the UI components
2. **Set Up Authentication**: Configure authentication for your backend services
3. **Implement WebSockets**: For real-time communication with agents
4. **Add File Storage**: For handling file uploads and downloads
5. **Configure CORS**: Ensure your backend allows requests from your frontend application
6. **Add Logging**: Implement logging for debugging and monitoring
7. **Set Up Error Handling**: Create a robust error handling system

By following this guide, you should be able to successfully integrate the SolnAI Agent UI components with your backend services to create a fully functional agent application.
