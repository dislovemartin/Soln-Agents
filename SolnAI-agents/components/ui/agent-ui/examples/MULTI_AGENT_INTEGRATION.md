# Multi-Agent Team Integration with SolnAI

This document explains how the SolnAI-AutoGen integration, particularly our data exchange service, can handle complex multi-agent team structures like the 20-agent team configuration provided in `autogen-team-config.json`.

## Overview of Multi-Agent Teams

AutoGen Studio allows users to create complex teams of AI agents with specialized roles and capabilities. The `RoundRobinGroupChat` team type enables multiple agents to take turns contributing to a conversation, with each agent bringing their specific expertise to the task.

Our integration needs to handle:
- Team configuration importation and management
- Data exchange between SolnAI and multi-agent teams
- Results synthesis and presentation
- Dynamic agent selection and invocation

## How Our Data Exchange Service Handles Multi-Agent Teams

### 1. Team Configuration Import

The data exchange service can process complex team configurations like our 20-agent example through a new function we've added:

```typescript
/**
 * Import an AutoGen Studio team configuration
 * @param {string} configData - JSON string or object containing team configuration
 * @returns {Promise<string>} - Team ID if successful
 */
async importAutoGenTeamConfig(configData: string | object): Promise<string | null> {
  try {
    // Parse the configuration if it's a string
    const config = typeof configData === 'string' ? JSON.parse(configData) : configData;
    
    // Validate that it's a team configuration
    if (config.component_type !== 'team' || !config.config?.participants) {
      throw new Error('Invalid team configuration: missing required fields');
    }
    
    // Send the configuration to AutoGen Studio
    const response = await fetch(`${this.autogenApiUrl}/teams/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to import team: ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    return data.id || null;
  } catch (error) {
    console.error('Error importing team configuration:', error);
    return null;
  }
}
```

### 2. Multi-Agent Data Exchange

Our exchange format has been extended to support multi-agent conversations:

```typescript
interface MultiAgentExchangeFormat extends ExchangeFormat {
  targetAgents?: string[];  // Specific agents to address
  teamContext?: {
    teamId: string;
    conversationId: string;
    previousContributions?: {
      agentName: string;
      content: string;
      timestamp: string;
    }[];
  };
}
```

### 3. Creating Sessions with Multi-Agent Teams

We've implemented a method to create sessions with entire teams rather than individual agents:

```typescript
/**
 * Create a session with an AutoGen Studio team
 * @param {string} teamId - Team ID 
 * @param {string} task - Initial task description
 * @param {ResultItem[]} results - Optional SolnAI results to include
 * @returns {Promise<string>} - Session ID if successful
 */
async createAutoGenTeamSession(
  teamId: string,
  task: string,
  results?: ResultItem[]
): Promise<string | null> {
  try {
    // Create team session
    const sessionResponse = await fetch(`${this.autogenApiUrl}/teams/${teamId}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task: task
      })
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      throw new Error(`Failed to create team session: ${sessionResponse.statusText} - ${errorText}`);
    }

    const sessionData = await sessionResponse.json();
    const sessionId = sessionData.id;

    // If results are provided, convert and send them
    if (results && results.length > 0) {
      const exchangeData = this.convertSolnResultsToExchange(results, {
        includeBlocks: true,
        customMetadata: {
          task: task,
          teamId: teamId
        }
      });

      // Send to the session
      await this.sendToAutoGen(sessionId, exchangeData);
    }

    return sessionId;
  } catch (error) {
    console.error('Error creating team session:', error);
    return null;
  }
}
```

### 4. Processing Multi-Agent Responses

Our data exchange service needs to handle responses from multiple agents:

```typescript
/**
 * Process multi-agent responses from a team session
 * @param {string} sessionId - Session ID
 * @returns {Promise<AgentResponse[]>} - Processed responses from agents
 */
async processTeamResponses(sessionId: string): Promise<any[]> {
  const messages = await this.getAutoGenMessagesForSolnAI(sessionId);
  
  // Group messages by agent
  const agentResponses = messages
    .filter(msg => msg.role === 'assistant')
    .map(msg => {
      // Extract agent name from message metadata if available
      const agentName = msg.metadata?.agentName || 'Unknown Agent';
      
      return {
        agentName,
        content: msg.content,
        timestamp: msg.timestamp,
        // Parse the content to extract any structured data
        structuredContent: this.parseContentBlocks(msg.content)
      };
    });
    
  return agentResponses;
}
```

### 5. Exporting Team Results to SolnAI

We've added a method to export team conversation results back to SolnAI:

```typescript
/**
 * Exports team conversation results to SolnAI format
 * @param {string} sessionId - Session ID to export
 * @param {object} options - Export options
 * @returns {Promise<ResultItem[]>} - Exported results in SolnAI format
 */
async exportTeamResultsToSolnAI(
  sessionId: string, 
  options?: {
    includeAgents?: string[];
    includeAllAgents?: boolean;
    format?: 'combined' | 'individual' | 'raw';
    title?: string;
  }
): Promise<ResultItem[]> {
  try {
    // Get all messages from the session
    const messages = await this.getAutoGenMessagesForSolnAI(sessionId);
    
    if (messages.length === 0) {
      return [];
    }
    
    // Filter messages based on options
    let filteredMessages = messages.filter(msg => msg.role === 'assistant');
    
    // Filter by specific agents if requested
    if (options?.includeAgents && options.includeAgents.length > 0) {
      filteredMessages = filteredMessages.filter(msg => 
        options.includeAgents.includes(msg.metadata?.agentName)
      );
    }
    
    // Return empty array if no messages match the filter
    if (filteredMessages.length === 0) {
      return [];
    }
    
    // Format based on specified format
    if (options?.format === 'individual') {
      // Return individual results for each message
      return filteredMessages.map(msg => ({
        id: `autogen-${msg.id}`,
        title: `${msg.metadata?.agentName || 'Agent'} Response`,
        content: msg.content,
        type: 'text',
        metadata: {
          source: 'autogen-team',
          timestamp: msg.timestamp,
          agentName: msg.metadata?.agentName,
          sessionId
        }
      }));
    } else if (options?.format === 'raw') {
      // Return raw transcript
      return [{
        id: `autogen-team-${sessionId}`,
        title: options?.title || 'Team Conversation Transcript',
        content: messages.map(msg => 
          `${msg.role === 'user' ? 'User' : (msg.metadata?.agentName || 'Agent')}: ${msg.content}`
        ).join('\n\n'),
        type: 'text',
        metadata: {
          source: 'autogen-team-transcript',
          messageCount: messages.length,
          sessionId
        }
      }];
    } else {
      // Default: Combined summary format
      // Group responses by agent
      const agentResponses: Record<string, string[]> = {};
      
      filteredMessages.forEach(msg => {
        const agentName = msg.metadata?.agentName || 'Unknown Agent';
        if (!agentResponses[agentName]) {
          agentResponses[agentName] = [];
        }
        agentResponses[agentName].push(msg.content);
      });
      
      // Create combined content
      let combinedContent = '';
      Object.entries(agentResponses).forEach(([agent, contents]) => {
        combinedContent += `## ${agent}\n\n${contents.join('\n\n')}\n\n`;
      });
      
      return [{
        id: `autogen-team-summary-${sessionId}`,
        title: options?.title || 'Team Analysis Summary',
        content: combinedContent,
        type: 'markdown',
        metadata: {
          source: 'autogen-team-summary',
          agentCount: Object.keys(agentResponses).length,
          agents: Object.keys(agentResponses),
          sessionId
        }
      }];
    }
  } catch (error) {
    console.error('Error exporting team results:', error);
    return [];
  }
}
```

## Integration with UI Components

For Story-3 (React components for integrated UI), we've implemented specialized components to handle multi-agent teams:

### 1. TeamSelector Component

Allows users to select from available teams or import new team configurations:

```jsx
<TeamSelector 
  onTeamSelect={(teamId) => handleTeamSelection(teamId)}
  onTeamImport={(config) => exchangeService.importAutoGenTeamConfig(config)}
/>
```

### 2. TeamChat Component

Displays messages from multiple agents with clear attribution:

```jsx
<TeamChat
  sessionId={currentSessionId}
  teamId={selectedTeamId}
  onSendMessage={(message) => sendMessageToTeam(message)}
  onExportResults={(results) => handleExportResults(results)}
/>
```

### 3. AutoGenTeamPage Component

Serves as the main container for the multi-agent team interface:

```jsx
<AutoGenTeamPage
  onExportToSolnAI={(results) => importResultsToSolnAI(results)}
/>
```

## Data Flow Scenario

Here's how our data exchange service handles a typical multi-agent scenario:

1. **Import Team Configuration**:
   - User uploads or selects a 20-agent team configuration
   - `importAutoGenTeamConfig()` processes and registers the team

2. **Create Team Session**:
   - User provides a task: "Develop a marketing strategy for a new sustainable product"
   - `createAutoGenTeamSession()` initiates a session with the team
   - The TeamLead agent receives the task first

3. **First Round of Responses**:
   - TeamLead analyzes the task and delegates subtasks
   - Our data exchange service processes these messages and presents them in the UI
   - The specialized agents (Marketing Strategist, Sustainability Expert, etc.) respond in turn

4. **Result Synthesis**:
   - The data exchange service collects and processes all agent contributions
   - UI components display the contributions in a structured manner
   - TeamLead synthesizes a final response

5. **Export to SolnAI**:
   - User exports the multi-agent results back to SolnAI
   - Our exchange service converts the results to SolnAI format

## Challenges and Solutions

### 1. Message Volume and Context Management

**Challenge**: 20 agents generate a large volume of messages that may exceed context limits

**Solution**: Our exchange format includes metadata for context windowing, allowing the UI to display a scrollable history while maintaining agent continuity

### 2. Result Attribution

**Challenge**: Understanding which results came from which agents

**Solution**: Our exchange service maintains agent attribution in metadata and provides filtering capabilities in the UI

### 3. Complex Tool Usage

**Challenge**: Some agents (like the Software Engineer or Data Scientist) use specialized tools

**Solution**: The exchange service preserves tool outputs and renders them appropriately in the UI

## Implementation Status

Our implementation of the multi-agent team functionality is now complete with:

1. Extended Data Exchange Service with multi-agent support
2. Fully implemented React UI components for multi-agent interactions
3. Integrated styling with AutoGenTeam.module.css
4. Comprehensive documentation for architecture and usage

This infrastructure now provides a foundation for users to interact with complex multi-agent teams through the SolnAI interface, leveraging the power of AutoGen Studio's declarative agent specifications.