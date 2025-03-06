import { useState, useCallback, useEffect } from 'react';
import { ApiService } from '../services/api';
import { WebSocketService, WebSocketMessage } from '../services/websocket';
import useApi from './useApi';
import useWebSocket from './useWebSocket';

export interface Agent {
  id: string;
  name: string;
  description: string;
  type: string;
  icon: string;
  isActive?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  agentId: string;
  status?: 'sending' | 'sent' | 'received' | 'error';
}

export interface AgentResult {
  id: string;
  agentId: string;
  type: 'text' | 'image' | 'file' | 'link' | 'data';
  content: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface AgentSettings {
  id: string;
  agentId: string;
  settings: Record<string, any>;
}

/**
 * Hook for managing agent state and interactions
 */
export function useAgent(
  apiService: ApiService,
  webSocketService: WebSocketService,
  agentId?: string
) {
  // Agent state
  const [currentAgentId, setCurrentAgentId] = useState<string | undefined>(agentId);
  const [agent, setAgent] = useState<Agent | null>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  // Results state
  const [results, setResults] = useState<AgentResult[]>([]);

  // Settings state
  const [settings, setSettings] = useState<Record<string, any>>({});

  // Loading states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // API hooks
  const agentApi = useApi<Agent>(apiService, 'getAgent', currentAgentId);
  const chatHistoryApi = useApi<ChatMessage[]>(apiService, 'getChatHistory', currentAgentId);
  const resultsApi = useApi<AgentResult[]>(apiService, 'getAgentResults', currentAgentId);
  const settingsApi = useApi<AgentSettings>(apiService, 'getAgentSettings', currentAgentId);
  const sendMessageApi = useApi<ChatMessage>(apiService, 'sendMessage');
  const saveSettingsApi = useApi<AgentSettings>(apiService, 'saveAgentSettings');

  // WebSocket hook for real-time updates
  const {
    lastMessage,
    sendMessage: sendWsMessage
  } = useWebSocket(webSocketService, ['agent_message', 'agent_typing', 'agent_result']);

  // Load agent data when agent ID changes
  useEffect(() => {
    if (currentAgentId) {
      setIsLoading(true);
      setError(null);

      // Load agent data
      Promise.all([
        agentApi.execute(currentAgentId),
        chatHistoryApi.execute(currentAgentId),
        resultsApi.execute(currentAgentId),
        settingsApi.execute(currentAgentId)
      ]).then(([agentRes, chatRes, resultsRes, settingsRes]) => {
        if (agentRes.data) {
          setAgent(agentRes.data);
        }

        if (chatRes.data) {
          setMessages(chatRes.data);
        }

        if (resultsRes.data) {
          setResults(resultsRes.data);
        }

        if (settingsRes.data) {
          setSettings(settingsRes.data.settings);
        }

        setIsLoading(false);
      }).catch(err => {
        setError(err.message || 'Failed to load agent data');
        setIsLoading(false);
      });
    }
  }, [currentAgentId]);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage && currentAgentId) {
      switch (lastMessage.type) {
        case 'agent_message':
          if (lastMessage.data.agentId === currentAgentId) {
            const newMessage: ChatMessage = lastMessage.data;
            setMessages(prev => [...prev, newMessage]);
          }
          break;

        case 'agent_typing':
          if (lastMessage.data.agentId === currentAgentId) {
            setIsTyping(lastMessage.data.isTyping);
          }
          break;

        case 'agent_result':
          if (lastMessage.data.agentId === currentAgentId) {
            const newResult: AgentResult = lastMessage.data;
            setResults(prev => [...prev, newResult]);
          }
          break;
      }
    }
  }, [lastMessage, currentAgentId]);

  // Change current agent
  const changeAgent = useCallback((newAgentId: string) => {
    setCurrentAgentId(newAgentId);
  }, []);

  // Send a message to the agent
  const sendMessage = useCallback(async (content: string) => {
    if (!currentAgentId) {
      setError('No agent selected');
      return null;
    }

    // Create a temporary message with pending status
    const tempId = `temp-${Date.now()}`;
    const tempMessage: ChatMessage = {
      id: tempId,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      agentId: currentAgentId,
      status: 'sending'
    };

    // Add to messages immediately for UI feedback
    setMessages(prev => [...prev, tempMessage]);

    // Send via API
    const response = await sendMessageApi.execute(currentAgentId, content);

    if (response.error) {
      // Update the temporary message with error status
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempId
            ? { ...msg, status: 'error' }
            : msg
        )
      );
      return null;
    }

    // Replace temp message with the real one from the server
    if (response.data) {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempId
            ? { ...response.data, status: 'sent' }
            : msg
        )
      );

      // Notify via WebSocket that we sent a message
      sendWsMessage({
        type: 'user_message_sent',
        data: {
          agentId: currentAgentId,
          messageId: response.data.id
        }
      });

      return response.data;
    }

    return null;
  }, [currentAgentId, sendMessageApi, sendWsMessage]);

  // Save agent settings
  const saveSettings = useCallback(async (newSettings: Record<string, any>) => {
    if (!currentAgentId) {
      setError('No agent selected');
      return false;
    }

    const response = await saveSettingsApi.execute(currentAgentId, newSettings);

    if (response.error) {
      setError(response.error);
      return false;
    }

    if (response.data) {
      setSettings(response.data.settings);
      return true;
    }

    return false;
  }, [currentAgentId, saveSettingsApi]);

  // Clear chat history
  const clearChat = useCallback(() => {
    setMessages([]);
    // You might want to add an API call here to clear chat on the server
  }, []);

  return {
    agent,
    messages,
    results,
    settings,
    isTyping,
    isLoading,
    error,
    changeAgent,
    sendMessage,
    saveSettings,
    clearChat
  };
}

export default useAgent;
