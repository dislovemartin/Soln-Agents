import { baseHeaders, handleResponse } from "../utils/request";

// Message history persistence helper functions
const STORAGE_PREFIX = 'solnai_agent_history_';

const saveMessageHistory = (sessionId, messages) => {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${sessionId}`, JSON.stringify(messages));
  } catch (error) {
    console.warn('Failed to save message history to localStorage:', error);
  }
};

const loadMessageHistory = (sessionId) => {
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${sessionId}`);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Failed to load message history from localStorage:', error);
    return [];
  }
};

const clearMessageHistory = (sessionId) => {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${sessionId}`);
  } catch (error) {
    console.warn('Failed to clear message history from localStorage:', error);
  }
};

export class SolnAgents {
  static async listAvailableAgents() {
    const response = await fetch(`/api/solnAgents`, {
      method: "GET",
      headers: baseHeaders(),
    });
    return handleResponse(response);
  }

  static async createSession(agentId, config = {}) {
    const response = await fetch(`/api/solnAgents/sessions`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify({ agentId, config }),
    });
    
    const result = await handleResponse(response);
    
    // Initialize empty message history for new session
    if (result.success && result.sessionId) {
      saveMessageHistory(result.sessionId, []);
    }
    
    return result;
  }

  static async sendMessage(sessionId, message) {
    try {
      // Add user message to history before sending to server
      const messages = loadMessageHistory(sessionId);
      const userMessage = { role: 'user', content: message, timestamp: new Date().toISOString() };
      messages.push(userMessage);
      saveMessageHistory(sessionId, messages);
      
      const response = await fetch(`/api/solnAgents/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: baseHeaders(),
        body: JSON.stringify({ message }),
      });
      
      const result = await handleResponse(response);
      
      // Add agent response to history
      if (result.success) {
        let content = '';
        if (result.data && result.data.response) {
          content = result.data.response;
        } else if (result.data && result.data.text) {
          content = result.data.text;
        } else {
          content = JSON.stringify(result.data);
        }
        
        const assistantMessage = { 
          role: 'assistant', 
          content,
          timestamp: new Date().toISOString() 
        };
        
        messages.push(assistantMessage);
        saveMessageHistory(sessionId, messages);
      }
      
      return result;
    } catch (error) {
      console.error("Error sending message to agent:", error);
      
      // Add error message to history
      const messages = loadMessageHistory(sessionId);
      messages.push({
        role: 'system',
        content: `Error: ${error.message}`,
        isError: true,
        timestamp: new Date().toISOString()
      });
      saveMessageHistory(sessionId, messages);
      
      return { success: false, error: error.message };
    }
  }

  static async endSession(sessionId) {
    const response = await fetch(`/api/solnAgents/sessions/${sessionId}`, {
      method: "DELETE",
      headers: baseHeaders(),
    });
    return handleResponse(response);
  }

  static async listSessions() {
    const response = await fetch(`/api/solnAgents/sessions`, {
      method: "GET",
      headers: baseHeaders(),
    });
    return handleResponse(response);
  }

  static async getSessionInfo(sessionId) {
    const response = await fetch(`/api/solnAgents/sessions/${sessionId}`, {
      method: "GET",
      headers: baseHeaders(),
    });
    return handleResponse(response);
  }

  static async cleanupSessions() {
    const response = await fetch(`/api/solnAgents/cleanup`, {
      method: "POST",
      headers: baseHeaders(),
    });
    return handleResponse(response);
  }
  
  // Get metrics and analytics data
  static async getMetrics(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });
    
    const url = `/api/solnAgents/metrics${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, {
      method: "GET",
      headers: baseHeaders(),
    });
    return handleResponse(response);
  }
  
  // Get metrics for a specific agent
  static async getAgentMetrics(agentId, limit = 100) {
    const response = await fetch(`/api/solnAgents/metrics/${agentId}?limit=${limit}`, {
      method: "GET",
      headers: baseHeaders(),
    });
    return handleResponse(response);
  }
  
  // Get message history for a session
  static getMessageHistory(sessionId) {
    return loadMessageHistory(sessionId);
  }
  
  // Clear message history for a session
  static clearMessageHistory(sessionId) {
    clearMessageHistory(sessionId);
  }
  
  // Export chat history to JSON
  static exportChatHistory(sessionId) {
    const messages = loadMessageHistory(sessionId);
    const json = JSON.stringify(messages, null, 2);
    
    // Create download link
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-chat-history-${sessionId.substring(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}