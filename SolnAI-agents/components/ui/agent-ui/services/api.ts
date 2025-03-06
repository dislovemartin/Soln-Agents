/**
 * API Service for SolnAI Agent UI
 *
 * This service provides methods for interacting with the backend API.
 */

// Types
import { Agent, AgentCategory } from '../AgentApp';

export interface ApiConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface ResultItem {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'image' | 'link' | 'code' | 'file';
  metadata?: Record<string, any>;
}

export interface AgentSettings {
  [key: string]: any;
}

/**
 * API Service class
 */
export class ApiService {
  private baseUrl: string;
  private headers: Record<string, string>;
  private timeout: number;

  constructor(config: ApiConfig) {
    this.baseUrl = config.baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
      ...config.headers
    };
    this.timeout = config.timeout || 30000; // Default timeout: 30 seconds
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    this.headers['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    delete this.headers['Authorization'];
  }

  /**
   * Make API request with timeout
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          error: errorData.message || `Request failed with status ${response.status}`,
          status: response.status
        };
      }

      const data = await response.json();
      return {
        data,
        status: response.status
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        return {
          error: 'Request timeout',
          status: 408
        };
      }

      return {
        error: error.message || 'Unknown error',
        status: 500
      };
    }
  }

  /**
   * Get all agents
   */
  async getAgents(): Promise<ApiResponse<AgentCategory[]>> {
    const response = await this.request<any[]>('/agents');

    if (response.error || !response.data) {
      return response as ApiResponse<AgentCategory[]>;
    }

    // Transform API response to AgentCategory format
    const agentsByCategory = response.data.reduce((acc, agent) => {
      if (!acc[agent.category]) {
        acc[agent.category] = [];
      }
      acc[agent.category].push(agent);
      return acc;
    }, {});

    const agentCategories = Object.entries(agentsByCategory).map(([name, agents]) => ({
      name,
      agents: (agents as any[]).map(({ id, name, description, icon }) => ({
        id,
        name,
        description,
        icon: icon || this.getDefaultIcon(id)
      }))
    }));

    return {
      data: agentCategories,
      status: response.status
    };
  }

  /**
   * Get agent by ID
   */
  async getAgent(agentId: string): Promise<ApiResponse<Agent>> {
    return this.request<Agent>(`/agents/${agentId}`);
  }

  /**
   * Send message to agent
   */
  async sendMessage(
    agentId: string,
    message: string
  ): Promise<ApiResponse<ChatMessage>> {
    return this.request<ChatMessage>(`/agents/${agentId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }

  /**
   * Get chat history for agent
   */
  async getChatHistory(agentId: string): Promise<ApiResponse<ChatMessage[]>> {
    return this.request<ChatMessage[]>(`/agents/${agentId}/chat`);
  }

  /**
   * Get agent settings
   */
  async getAgentSettings(agentId: string): Promise<ApiResponse<AgentSettings>> {
    return this.request<AgentSettings>(`/agents/${agentId}/settings`);
  }

  /**
   * Save agent settings
   */
  async saveAgentSettings(
    agentId: string,
    settings: AgentSettings
  ): Promise<ApiResponse<AgentSettings>> {
    return this.request<AgentSettings>(`/agents/${agentId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  /**
   * Get agent results
   */
  async getAgentResults(agentId: string): Promise<ApiResponse<ResultItem[]>> {
    return this.request<ResultItem[]>(`/agents/${agentId}/results`);
  }

  /**
   * Save result
   */
  async saveResult(
    agentId: string,
    result: ResultItem
  ): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>(`/agents/${agentId}/results`, {
      method: 'POST',
      body: JSON.stringify(result)
    });
  }

  /**
   * Upload file for data analysis
   */
  async uploadFile(
    agentId: string,
    file: File,
    options: Record<string, any> = {}
  ): Promise<ApiResponse<{ fileId: string }>> {
    const formData = new FormData();
    formData.append('file', file);

    // Add any additional options
    Object.entries(options).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });

    // Remove Content-Type header to let the browser set it with the boundary
    const headers = { ...this.headers };
    delete headers['Content-Type'];

    return this.request<{ fileId: string }>(`/agents/${agentId}/upload`, {
      method: 'POST',
      headers,
      body: formData
    });
  }

  /**
   * Download result file
   */
  async downloadFile(resultId: string): Promise<Blob> {
    const url = `${this.baseUrl}/results/download/${resultId}`;

    const response = await fetch(url, {
      headers: this.headers
    });

    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`);
    }

    return response.blob();
  }

  /**
   * Helper function to get default icon based on agent type
   */
  private getDefaultIcon(agentId: string): string {
    if (agentId.includes('research')) return '🔍';
    if (agentId.includes('youtube')) return '📺';
    if (agentId.includes('data')) return '📊';
    return '🤖';
  }

  // AutoGen Studio Integration

  /**
   * Get all agents from AutoGen Studio
   */
  async getAutoGenAgents(): Promise<any[]> {
    try {
      const response = await this.request<any[]>('/autogenstudio/agents');
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to fetch AutoGen agents');
      return [];
    }
  }

  /**
   * Get a specific AutoGen Studio agent by ID
   */
  async getAutoGenAgent(agentId: string): Promise<any> {
    try {
      const response = await this.request<any>(`/autogenstudio/agents/${agentId}`);
      return response.data;
    } catch (error) {
      this.handleError(error, `Failed to fetch AutoGen agent ${agentId}`);
      return null;
    }
  }

  /**
   * Create a new chat session with an AutoGen Studio agent
   */
  async createAutoGenSession(agentId: string, task: string): Promise<any> {
    try {
      const response = await this.request<any>(`/autogenstudio/sessions`, {
        method: 'POST',
        body: JSON.stringify({
          agent_id: agentId,
          task: task
        })
      });
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to create AutoGen session');
      return null;
    }
  }

  /**
   * Send a message to an AutoGen Studio session
   */
  async sendAutoGenMessage(sessionId: string, message: string): Promise<any> {
    try {
      const response = await this.request<any>(`/autogenstudio/sessions/${sessionId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          content: message
        })
      });
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to send message to AutoGen session');
      return null;
    }
  }

  /**
   * Get messages from an AutoGen Studio session
   */
  async getAutoGenMessages(sessionId: string): Promise<any[]> {
    try {
      const response = await this.request<any[]>(`/autogenstudio/sessions/${sessionId}/messages`);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to fetch AutoGen messages');
      return [];
    }
  }

  /**
   * Get all skills available in AutoGen Studio
   */
  async getAutoGenSkills(): Promise<any[]> {
    try {
      const response = await this.request<any[]>('/autogenstudio/skills');
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to fetch AutoGen skills');
      return [];
    }
  }

  /**
   * Add a skill to an AutoGen Studio agent
   */
  async addSkillToAgent(agentId: string, skillId: string): Promise<boolean> {
    try {
      await this.request<void>(`/autogenstudio/agents/${agentId}/skills`, {
        method: 'POST',
        body: JSON.stringify({
          skill_id: skillId
        })
      });
      return true;
    } catch (error) {
      this.handleError(error, 'Failed to add skill to agent');
      return false;
    }
  }
}

/**
 * Create API service instance
 */
export function createApiService(config: ApiConfig): ApiService {
  return new ApiService(config);
}

export default ApiService;
