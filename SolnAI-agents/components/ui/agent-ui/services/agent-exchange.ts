/**
 * Agent Exchange Service
 * 
 * This service facilitates comprehensive data exchange between SolnAI agents and AutoGen Studio agents.
 * It handles format conversion, content parsing, metadata enrichment, and data validation.
 */

import { ApiService, ResultItem, ChatMessage } from './api';

// Common exchange format used for data transfer between platforms
export interface ExchangeFormat {
  content: string;
  contentType: ContentType;
  metadata: ExchangeMetadata;
  blocks?: ContentBlock[];
}

// Extended format for multi-agent team conversations
export interface MultiAgentExchangeFormat extends ExchangeFormat {
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

// Supported content types for exchange
export type ContentType = 'text' | 'markdown' | 'code' | 'structured' | 'mixed';

// Metadata structure for exchange
export interface ExchangeMetadata {
  source: string;
  timestamp: string;
  sourceAgent?: string;
  resultCount?: number;
  messageCount?: number;
  contentTypes?: string[];
  sessionId?: string;
  tags?: string[];
  [key: string]: any;
}

// Content block structure for structured content
export interface ContentBlock {
  type: 'text' | 'code' | 'image' | 'link' | 'file' | 'table';
  content: string;
  language?: string; // For code blocks
  title?: string;
  metadata?: Record<string, any>;
}

// AutoGen message format
export interface AutoGenMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Configuration for the exchange service
export interface AgentExchangeConfig {
  apiService: ApiService;
  autogenApiUrl?: string;
  defaultModel?: string;
  defaultTemperature?: number;
  preserveFormatting?: boolean;
  enableStructuredData?: boolean;
}

/**
 * Agent Exchange Service for bidirectional data conversion between SolnAI and AutoGen
 */
export class AgentExchangeService {
  private api: ApiService;
  private autogenApiUrl: string;
  private defaultModel: string;
  private defaultTemperature: number;
  private preserveFormatting: boolean;
  private enableStructuredData: boolean;

  constructor(config: AgentExchangeConfig) {
    this.api = config.apiService;
    this.autogenApiUrl = config.autogenApiUrl || 'http://localhost:8081/api';
    this.defaultModel = config.defaultModel || 'gpt-4';
    this.defaultTemperature = config.defaultTemperature || 0.7;
    this.preserveFormatting = config.preserveFormatting || true;
    this.enableStructuredData = config.enableStructuredData || false;
  }
  
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

  /**
   * Converts SolnAI agent results to the exchange format
   */
  convertSolnResultsToExchange(results: ResultItem[], options?: { 
    includeBlocks?: boolean;
    customMetadata?: Record<string, any>;
  }): ExchangeFormat {
    // Validate input
    if (!Array.isArray(results) || results.length === 0) {
      throw new Error('Invalid results: expected non-empty array of ResultItem objects');
    }

    // Create content blocks if requested
    const blocks = options?.includeBlocks ? this.createContentBlocksFromResults(results) : undefined;
    
    // Determine the content type based on results
    const contentType = this.determineContentTypeFromResults(results);
    
    // Format the content based on content type and preservation settings
    let content: string;
    if (contentType === 'markdown' || this.preserveFormatting) {
      content = this.formatResultsAsMarkdown(results);
    } else {
      content = results.map(r => `${r.title}: ${r.content}`).join('\n\n');
    }

    // Build comprehensive metadata
    const metadata: ExchangeMetadata = {
      source: 'solnai',
      timestamp: new Date().toISOString(),
      resultCount: results.length,
      contentTypes: [...new Set(results.map(r => r.type))],
      ...options?.customMetadata
    };

    return {
      content,
      contentType,
      metadata,
      blocks
    };
  }

  /**
   * Converts SolnAI chat messages to the exchange format
   */
  convertSolnMessagesToExchange(messages: ChatMessage[], options?: {
    includeBlocks?: boolean;
    customMetadata?: Record<string, any>;
    formatAsMarkdown?: boolean;
  }): ExchangeFormat {
    // Validate input
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('Invalid messages: expected non-empty array of ChatMessage objects');
    }

    // Create content blocks if requested 
    const blocks = options?.includeBlocks ? this.createContentBlocksFromMessages(messages) : undefined;

    // Format messages, preserving role structure
    let content: string;
    const contentType: ContentType = options?.formatAsMarkdown ? 'markdown' : 'text';
    
    if (contentType === 'markdown') {
      content = messages.map(m => `### ${m.role.toUpperCase()}\n\n${m.content}`).join('\n\n');
    } else {
      content = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
    }

    // Build comprehensive metadata
    const metadata: ExchangeMetadata = {
      source: 'solnai-chat',
      timestamp: new Date().toISOString(),
      messageCount: messages.length,
      roles: [...new Set(messages.map(m => m.role))],
      ...options?.customMetadata
    };

    return {
      content,
      contentType,
      metadata,
      blocks
    };
  }

  /**
   * Converts AutoGen messages to SolnAI chat messages
   */
  convertAutoGenMessagesToSolnMessages(messages: AutoGenMessage[]): ChatMessage[] {
    // Validate input
    if (!Array.isArray(messages)) {
      throw new Error('Invalid messages: expected array of AutoGenMessage objects');
    }

    // If no messages, return empty array
    if (messages.length === 0) {
      return [];
    }

    // Convert AutoGen messages to SolnAI messages
    return messages.map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      timestamp: msg.timestamp,
    }));
  }

  /**
   * Converts AutoGen messages to SolnAI result items
   */
  convertAutoGenMessagesToResultItems(messages: AutoGenMessage[]): ResultItem[] {
    // Validate input
    if (!Array.isArray(messages)) {
      throw new Error('Invalid messages: expected array of AutoGenMessage objects');
    }

    // If no messages, return empty array
    if (messages.length === 0) {
      return [];
    }

    // Only include assistant messages in results
    return messages
      .filter(msg => msg.role === 'assistant')
      .map((msg, index) => {
        const contentBlocks = this.parseContentBlocks(msg.content);
        
        // If we successfully parsed content blocks, create multiple result items
        if (contentBlocks.length > 1) {
          return contentBlocks.map((block, blockIndex) => ({
            id: `autogen-${msg.id}-${blockIndex}`,
            title: block.title || `AutoGen Result ${index + 1} - ${blockIndex + 1}`,
            content: block.content,
            type: this.mapContentBlockTypeToResultType(block.type),
            metadata: {
              source: 'autogen',
              timestamp: msg.timestamp,
              sessionId: msg.session_id,
              originalId: msg.id,
              blockIndex: blockIndex,
              ...(block.metadata || {})
            }
          }));
        }
        
        // Default to a single result item
        return {
          id: `autogen-${msg.id}`,
          title: `AutoGen Result ${index + 1}`,
          content: msg.content,
          type: 'text',
          metadata: {
            source: 'autogen',
            timestamp: msg.timestamp,
            sessionId: msg.session_id,
            originalId: msg.id
          }
        };
      })
      .flat(); // Flatten nested arrays from content blocks
  }

  /**
   * Sends data to an AutoGen Studio session
   */
  async sendToAutoGen(sessionId: string, data: ExchangeFormat | MultiAgentExchangeFormat): Promise<boolean> {
    try {
      // Validate input
      if (!sessionId) {
        throw new Error('Invalid sessionId: expected non-empty string');
      }
      
      if (!data || !data.content) {
        throw new Error('Invalid data: missing content');
      }

      // Prepare payload
      const payload: any = {
        content: data.content,
        metadata: data.metadata,
        blocks: data.blocks
      };
      
      // Add multi-agent specific data if it exists
      const multiAgentData = data as MultiAgentExchangeFormat;
      if (multiAgentData.targetAgents) {
        payload.targetAgents = multiAgentData.targetAgents;
      }
      
      if (multiAgentData.teamContext) {
        payload.teamContext = multiAgentData.teamContext;
      }

      // Send request
      const response = await fetch(`${this.autogenApiUrl}/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send data to AutoGen: ${response.statusText} - ${errorText}`);
      }

      return true;
    } catch (error) {
      console.error('Error sending data to AutoGen:', error);
      return false;
    }
  }
  
  /**
   * Send a message to specific agents in a team session
   * @param sessionId - The session ID
   * @param content - The message content
   * @param targetAgents - Optional list of agent names to target
   */
  async sendToAutoGenTeamSession(
    sessionId: string,
    content: string,
    targetAgents?: string[]
  ): Promise<boolean> {
    try {
      const exchangeData: MultiAgentExchangeFormat = {
        content,
        contentType: 'text',
        metadata: {
          source: 'solnai',
          timestamp: new Date().toISOString()
        }
      };
      
      // Add target agents if specified
      if (targetAgents && targetAgents.length > 0) {
        exchangeData.targetAgents = targetAgents;
      }
      
      return await this.sendToAutoGen(sessionId, exchangeData);
    } catch (error) {
      console.error('Error sending to team session:', error);
      return false;
    }
  }

  /**
   * Creates an AutoGen agent from SolnAI agent results
   */
  async createAutoGenAgentFromResults(
    results: ResultItem[],
    name: string,
    description: string,
    options?: {
      model?: string;
      temperature?: number;
      skillIds?: string[];
    }
  ): Promise<string | null> {
    try {
      // Validate input
      if (!Array.isArray(results) || results.length === 0) {
        throw new Error('Invalid results: expected non-empty array of ResultItem objects');
      }
      
      if (!name || !description) {
        throw new Error('Invalid agent details: name and description are required');
      }

      // Format results as rich markdown for system prompt
      const systemPrompt = this.formatResultsAsEnhancedMarkdown(results);

      // Prepare agent configuration
      const agentConfig = {
        name: name,
        description: description,
        system_message: systemPrompt,
        model: options?.model || this.defaultModel,
        temperature: options?.temperature || this.defaultTemperature,
        skills: options?.skillIds || []
      };

      // Create the agent in AutoGen Studio
      const response = await fetch(`${this.autogenApiUrl}/agents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentConfig)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create AutoGen agent: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return data.id || null;
    } catch (error) {
      console.error('Error creating AutoGen agent:', error);
      return null;
    }
  }

  /**
   * Retrieves messages from an AutoGen Studio session and converts them for SolnAI
   */
  async getAutoGenMessagesForSolnAI(sessionId: string): Promise<ChatMessage[]> {
    try {
      // Validate input
      if (!sessionId) {
        throw new Error('Invalid sessionId: expected non-empty string');
      }

      // Fetch messages from AutoGen
      const response = await fetch(`${this.autogenApiUrl}/sessions/${sessionId}/messages`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get AutoGen messages: ${response.statusText} - ${errorText}`);
      }

      const messages = await response.json();
      
      // Verify response is an array
      if (!Array.isArray(messages)) {
        throw new Error('Invalid response from AutoGen: expected array of messages');
      }
      
      // Convert to SolnAI message format
      return this.convertAutoGenMessagesToSolnMessages(messages);
    } catch (error) {
      console.error('Error getting AutoGen messages:', error);
      return [];
    }
  }
  
  /**
   * Retrieves team information from AutoGen Studio
   * @param {string} teamId - Team ID to fetch
   * @returns {Promise<any>} - Team information including agents
   */
  async getAutoGenTeamInfo(teamId: string): Promise<any> {
    try {
      // Validate input
      if (!teamId) {
        throw new Error('Invalid teamId: expected non-empty string');
      }

      // Fetch team from AutoGen
      const response = await fetch(`${this.autogenApiUrl}/teams/${teamId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get team info: ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting team info:', error);
      return null;
    }
  }
  
  /**
   * Fetches all teams available in AutoGen Studio
   * @returns {Promise<any[]>} - List of team configurations
   */
  async getAutoGenTeams(): Promise<any[]> {
    try {
      // Fetch teams from AutoGen
      const response = await fetch(`${this.autogenApiUrl}/teams`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get teams: ${response.statusText} - ${errorText}`);
      }

      const teams = await response.json();
      
      // Verify response is an array
      if (!Array.isArray(teams)) {
        throw new Error('Invalid response from AutoGen: expected array of teams');
      }
      
      return teams;
    } catch (error) {
      console.error('Error getting teams:', error);
      return [];
    }
  }

  /**
   * Retrieves results from an AutoGen Studio session and converts them for SolnAI
   */
  async getAutoGenResultsForSolnAI(sessionId: string): Promise<ResultItem[]> {
    try {
      // Validate input
      if (!sessionId) {
        throw new Error('Invalid sessionId: expected non-empty string');
      }

      // Fetch messages from AutoGen
      const response = await fetch(`${this.autogenApiUrl}/sessions/${sessionId}/messages`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get AutoGen messages: ${response.statusText} - ${errorText}`);
      }

      const messages = await response.json();
      
      // Verify response is an array
      if (!Array.isArray(messages)) {
        throw new Error('Invalid response from AutoGen: expected array of messages');
      }
      
      // Convert to SolnAI result format
      return this.convertAutoGenMessagesToResultItems(messages);
    } catch (error) {
      console.error('Error getting AutoGen results:', error);
      return [];
    }
  }
  
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

  /**
   * Creates a session in AutoGen Studio with results from SolnAI
   */
  async createAutoGenSessionWithResults(
    agentId: string,
    task: string,
    results: ResultItem[]
  ): Promise<string | null> {
    try {
      // Validate input
      if (!agentId || !task) {
        throw new Error('Invalid parameters: agentId and task are required');
      }
      
      if (!Array.isArray(results) || results.length === 0) {
        throw new Error('Invalid results: expected non-empty array of ResultItem objects');
      }

      // Create session
      const sessionResponse = await fetch(`${this.autogenApiUrl}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: agentId,
          task: task
        })
      });

      if (!sessionResponse.ok) {
        const errorText = await sessionResponse.text();
        throw new Error(`Failed to create AutoGen session: ${sessionResponse.statusText} - ${errorText}`);
      }

      const sessionData = await sessionResponse.json();
      const sessionId = sessionData.id;

      if (!sessionId) {
        throw new Error('No session ID returned from AutoGen');
      }

      // Convert results to exchange format
      const exchangeData = this.convertSolnResultsToExchange(results, {
        includeBlocks: true,
        customMetadata: {
          task: task,
          agentId: agentId
        }
      });

      // Send results to the session
      const success = await this.sendToAutoGen(sessionId, exchangeData);

      if (!success) {
        throw new Error('Failed to send data to AutoGen session');
      }

      return sessionId;
    } catch (error) {
      console.error('Error creating AutoGen session with results:', error);
      return null;
    }
  }

  // === Helper methods ===

  /**
   * Creates content blocks from SolnAI results
   */
  private createContentBlocksFromResults(results: ResultItem[]): ContentBlock[] {
    return results.map(result => ({
      type: this.mapResultTypeToContentBlockType(result.type),
      content: result.content,
      title: result.title,
      metadata: result.metadata
    }));
  }

  /**
   * Creates content blocks from SolnAI chat messages
   */
  private createContentBlocksFromMessages(messages: ChatMessage[]): ContentBlock[] {
    return messages.map(message => ({
      type: 'text',
      content: message.content,
      title: `${message.role.charAt(0).toUpperCase() + message.role.slice(1)} Message`,
      metadata: {
        role: message.role,
        timestamp: message.timestamp,
        id: message.id
      }
    }));
  }

  /**
   * Parses content blocks from a message string
   * This attempts to identify code blocks, links, etc. in a markdown-style message
   */
  private parseContentBlocks(content: string): ContentBlock[] {
    if (!content) return [];
    
    const blocks: ContentBlock[] = [];
    
    // Try to parse markdown code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match: RegExpExecArray | null;
    let lastIndex = 0;
    
    // Extract code blocks
    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block if there is any
      if (match.index > lastIndex) {
        const textBefore = content.substring(lastIndex, match.index).trim();
        if (textBefore) {
          blocks.push({
            type: 'text',
            content: textBefore,
            title: 'Text'
          });
        }
      }
      
      // Add code block
      blocks.push({
        type: 'code',
        content: match[2],
        language: match[1] || undefined,
        title: `Code Block (${match[1] || 'no language'})`
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text after last code block if any
    if (lastIndex < content.length) {
      const remaining = content.substring(lastIndex).trim();
      if (remaining) {
        blocks.push({
          type: 'text',
          content: remaining,
          title: 'Text'
        });
      }
    }
    
    // If no blocks were created, treat the whole content as a single text block
    if (blocks.length === 0 && content.trim()) {
      blocks.push({
        type: 'text',
        content: content,
        title: 'Text'
      });
    }
    
    return blocks;
  }

  /**
   * Maps SolnAI result types to content block types
   */
  private mapResultTypeToContentBlockType(resultType: string): ContentBlock['type'] {
    switch (resultType) {
      case 'text': return 'text';
      case 'code': return 'code';
      case 'image': return 'image';
      case 'link': return 'link';
      case 'file': return 'file';
      default: return 'text';
    }
  }

  /**
   * Maps content block types to result item types
   */
  private mapContentBlockTypeToResultType(blockType: ContentBlock['type']): string {
    switch (blockType) {
      case 'text': return 'text';
      case 'code': return 'code';
      case 'image': return 'image';
      case 'link': return 'link';
      case 'file': return 'file';
      case 'table': return 'text'; // Default to text for tables
      default: return 'text';
    }
  }

  /**
   * Determines the overall content type from a set of results
   */
  private determineContentTypeFromResults(results: ResultItem[]): ContentType {
    const types = results.map(r => r.type);
    
    // If all are the same type
    if (types.every(t => t === types[0])) {
      if (types[0] === 'code') return 'code';
      return 'text';
    }
    
    // If there's a mix of content types
    return 'markdown';
  }

  /**
   * Formats results as markdown content
   */
  private formatResultsAsMarkdown(results: ResultItem[]): string {
    return results.map(result => {
      let content = result.content;
      
      // Format code results with markdown code blocks
      if (result.type === 'code') {
        // Detect language from metadata if available
        const language = result.metadata?.language || '';
        content = `\`\`\`${language}\n${content}\n\`\`\``;
      }
      
      // Format links
      if (result.type === 'link') {
        content = `[${result.title}](${result.content})`;
      }
      
      // Format images
      if (result.type === 'image') {
        content = `![${result.title}](${result.content})`;
      }
      
      return `## ${result.title}\n\n${content}`;
    }).join('\n\n');
  }

  /**
   * Formats results as enhanced markdown with rich formatting
   * Used for creating system messages with proper context
   */
  private formatResultsAsEnhancedMarkdown(results: ResultItem[]): string {
    const content = this.formatResultsAsMarkdown(results);
    
    return `
You are an agent created from SolnAI's extracted knowledge. Your task is to use the following information to help answer user questions.

# Knowledge Base

${content}

# Instructions

- Always base your responses on the knowledge provided above
- If you don't know something or if the information isn't in your knowledge base, say so instead of making up an answer
- Prefer to cite specific sections when providing information
- Format your responses in a clear, organized manner using markdown
    `.trim();
  }
}

/**
 * Create Agent Exchange Service
 */
export function createAgentExchangeService(config: AgentExchangeConfig): AgentExchangeService {
  return new AgentExchangeService(config);
}

export default AgentExchangeService;