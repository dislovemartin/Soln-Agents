# SolnAI AutoGen Studio API Integration Documentation

This document provides comprehensive documentation for the API service extensions that enable communication between SolnAI and AutoGen Studio.

## Base Configuration

Before using the API, configure the connection settings:

```typescript
// Configuration for direct connection
const autogenConfig = {
  baseUrl: 'http://localhost:8081/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Or using the proxy server (recommended for production)
const autogenConfigWithProxy = {
  baseUrl: 'http://localhost:3001/api/autogenstudio',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Create API service instance
import { createApiService } from './services/api';
const api = createApiService(autogenConfig);
```

## API Endpoints

### 1. Get All AutoGen Agents

Retrieves a list of all available agents from AutoGen Studio.

```typescript
/**
 * @returns {Promise<Array>} List of AutoGen agents
 */
async function getAutoGenAgents(): Promise<any[]>
```

**Example:**

```typescript
// Get all available agents from AutoGen Studio
const agents = await api.getAutoGenAgents();
console.log(`Found ${agents.length} agents`);

// Display agent names
agents.forEach(agent => {
  console.log(`Agent: ${agent.name} (${agent.id})`);
});
```

**Response Format:**

```json
[
  {
    "id": "agent-123",
    "name": "Research Assistant",
    "description": "An agent that helps with research tasks",
    "skills": ["web_search", "summarization"],
    "config": {
      "model": "gpt-4",
      "temperature": 0.7
    }
  },
  {
    "id": "agent-456",
    "name": "Code Helper",
    "description": "An agent that assists with coding tasks",
    "skills": ["code_generation", "debugging"],
    "config": {
      "model": "claude-3-opus",
      "temperature": 0.2
    }
  }
]
```

### 2. Get Specific AutoGen Agent

Retrieves details about a specific agent by ID.

```typescript
/**
 * @param {string} agentId - The ID of the agent to retrieve
 * @returns {Promise<Object>} Agent details
 */
async function getAutoGenAgent(agentId: string): Promise<any>
```

**Example:**

```typescript
// Get a specific agent by ID
const agent = await api.getAutoGenAgent('agent-123');
if (agent) {
  console.log(`Agent: ${agent.name}`);
  console.log(`Description: ${agent.description}`);
  console.log(`Skills: ${agent.skills.join(', ')}`);
}
```

**Response Format:**

```json
{
  "id": "agent-123",
  "name": "Research Assistant",
  "description": "An agent that helps with research tasks",
  "skills": ["web_search", "summarization"],
  "config": {
    "model": "gpt-4",
    "temperature": 0.7,
    "system_message": "You are a helpful research assistant..."
  }
}
```

### 3. Create AutoGen Session

Creates a new chat session with an AutoGen agent.

```typescript
/**
 * @param {string} agentId - The ID of the agent to create a session with
 * @param {string} task - The initial task or description for the session
 * @returns {Promise<Object>} Session details
 */
async function createAutoGenSession(agentId: string, task: string): Promise<any>
```

**Example:**

```typescript
// Create a new session with an agent
const session = await api.createAutoGenSession(
  'agent-123',
  'Research the latest advances in quantum computing'
);

if (session) {
  console.log(`Session created: ${session.id}`);
  // Store session ID for later use
  const sessionId = session.id;
}
```

**Response Format:**

```json
{
  "id": "session-789",
  "agent_id": "agent-123",
  "task": "Research the latest advances in quantum computing",
  "status": "active",
  "created_at": "2023-01-01T12:34:56Z"
}
```

### 4. Send Message to AutoGen Session

Sends a user message to an active AutoGen session.

```typescript
/**
 * @param {string} sessionId - The ID of the session to send a message to
 * @param {string} message - The message content
 * @returns {Promise<Object>} Message details with response
 */
async function sendAutoGenMessage(sessionId: string, message: string): Promise<any>
```

**Example:**

```typescript
// Send a message to an existing session
const response = await api.sendAutoGenMessage(
  'session-789',
  'What are the most recent breakthroughs in quantum computing?'
);

if (response) {
  console.log(`Message sent with ID: ${response.id}`);
  console.log(`Response: ${response.content}`);
}
```

**Response Format:**

```json
{
  "id": "msg-456",
  "session_id": "session-789",
  "role": "assistant",
  "content": "Recent breakthroughs in quantum computing include...",
  "timestamp": "2023-01-01T12:35:10Z"
}
```

### 5. Get Session Messages

Retrieves all messages from a specific session.

```typescript
/**
 * @param {string} sessionId - The ID of the session to get messages from
 * @returns {Promise<Array>} List of messages in the session
 */
async function getAutoGenMessages(sessionId: string): Promise<any[]>
```

**Example:**

```typescript
// Get all messages from a session
const messages = await api.getAutoGenMessages('session-789');

console.log(`Session has ${messages.length} messages`);

// Display the conversation
messages.forEach(msg => {
  console.log(`[${msg.role}]: ${msg.content}`);
});
```

**Response Format:**

```json
[
  {
    "id": "msg-123",
    "session_id": "session-789",
    "role": "user",
    "content": "What are the most recent breakthroughs in quantum computing?",
    "timestamp": "2023-01-01T12:35:00Z"
  },
  {
    "id": "msg-456",
    "session_id": "session-789",
    "role": "assistant",
    "content": "Recent breakthroughs in quantum computing include...",
    "timestamp": "2023-01-01T12:35:10Z"
  }
]
```

### 6. Get Available Skills

Retrieves all available skills that can be added to agents.

```typescript
/**
 * @returns {Promise<Array>} List of available skills
 */
async function getAutoGenSkills(): Promise<any[]>
```

**Example:**

```typescript
// Get all available skills
const skills = await api.getAutoGenSkills();

console.log(`Available skills: ${skills.length}`);

// Display skill information
skills.forEach(skill => {
  console.log(`Skill: ${skill.name} (${skill.id})`);
  console.log(`Description: ${skill.description}`);
  console.log('---');
});
```

**Response Format:**

```json
[
  {
    "id": "web_search",
    "name": "Web Search",
    "description": "Search the web for information",
    "parameters": {
      "num_results": 5,
      "search_engine": "google"
    }
  },
  {
    "id": "code_generation",
    "name": "Code Generation",
    "description": "Generate code in various languages",
    "parameters": {
      "languages": ["python", "javascript", "rust"]
    }
  }
]
```

### 7. Add Skill to Agent

Adds a specific skill to an agent.

```typescript
/**
 * @param {string} agentId - The ID of the agent to add the skill to
 * @param {string} skillId - The ID of the skill to add
 * @returns {Promise<boolean>} Success status
 */
async function addSkillToAgent(agentId: string, skillId: string): Promise<boolean>
```

**Example:**

```typescript
// Add a skill to an agent
const success = await api.addSkillToAgent('agent-123', 'web_search');

if (success) {
  console.log('Skill successfully added to agent!');
  
  // Reload the agent to see updated skills
  const updatedAgent = await api.getAutoGenAgent('agent-123');
  console.log(`Updated skills: ${updatedAgent.skills.join(', ')}`);
} else {
  console.error('Failed to add skill to agent');
}
```

**Response Format:**

Simply returns `true` for success or `false` for failure.

## Error Handling

The API service includes comprehensive error handling:

```typescript
try {
  const agents = await api.getAutoGenAgents();
  // Process agents
} catch (error) {
  console.error('Error fetching agents:', error.message);
  
  // Check for specific error types
  if (error.status === 401) {
    // Handle authentication error
  } else if (error.status === 404) {
    // Handle not found error
  } else {
    // Handle other errors
  }
}
```

## Using with React Hooks

The `useAutoGenStudio` hook provides a convenient way to use these API methods in React components:

```typescript
import { useAutoGenStudio } from './hooks/useAutoGenStudio';

function AutoGenComponent() {
  const {
    agents,
    currentAgent,
    sessions,
    messages,
    skills,
    loading,
    error,
    fetchAgents,
    fetchAgent,
    createSession,
    sendMessage,
    fetchMessages,
    fetchSkills,
    addSkillToAgent
  } = useAutoGenStudio();

  useEffect(() => {
    // Load agents when component mounts
    fetchAgents();
  }, [fetchAgents]);

  const handleSendMessage = async (message) => {
    if (!currentSession) return;
    await sendMessage(message);
  };

  // Render component with loaded data
  return (
    <div>
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      
      {/* Agent selection */}
      <select onChange={(e) => fetchAgent(e.target.value)}>
        {agents.map(agent => (
          <option key={agent.id} value={agent.id}>{agent.name}</option>
        ))}
      </select>
      
      {/* Message display */}
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>
      
      {/* Message input */}
      <form onSubmit={(e) => {
        e.preventDefault();
        handleSendMessage(inputValue);
      }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```

## Proxy Server Configuration

For production deployments, it's recommended to use the proxy server to handle CORS issues and add additional security:

1. Set up the proxy server as described in `AUTOGEN_PROXY_SETUP.md`
2. Configure your API service to use the proxy:

```typescript
const apiWithProxy = createApiService({
  baseUrl: 'http://localhost:3001/api/autogenstudio',
  timeout: 30000
});
```

3. Configure WebSocket connections:

```typescript
const webSocketConfig = {
  url: 'ws://localhost:3001/ws/autogenstudio',
  reconnectInterval: 3000,
  maxReconnectAttempts: 5
};
```