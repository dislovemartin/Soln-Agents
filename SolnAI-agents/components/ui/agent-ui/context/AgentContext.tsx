import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useServices } from './ServiceContext';
import { useAgent, Agent, ChatMessage, AgentResult } from '../hooks/useAgent';

interface AgentContextType {
  agents: Agent[];
  currentAgent: Agent | null;
  messages: ChatMessage[];
  results: AgentResult[];
  settings: Record<string, any>;
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  changeAgent: (agentId: string) => void;
  sendMessage: (content: string) => Promise<ChatMessage | null>;
  saveSettings: (settings: Record<string, any>) => Promise<boolean>;
  clearChat: () => void;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

interface AgentProviderProps {
  children: ReactNode;
  initialAgentId?: string;
}

/**
 * Provider component for agent state
 */
export const AgentProvider: React.FC<AgentProviderProps> = ({
  children,
  initialAgentId
}) => {
  const { apiService, webSocketService, isApiReady } = useServices();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState<boolean>(true);
  const [agentsError, setAgentsError] = useState<string | null>(null);

  // Use the agent hook for the current agent
  const {
    agent: currentAgent,
    messages,
    results,
    settings,
    isTyping,
    isLoading: isLoadingAgent,
    error: agentError,
    changeAgent,
    sendMessage,
    saveSettings,
    clearChat
  } = useAgent(apiService, webSocketService, initialAgentId);

  // Fetch all available agents
  useEffect(() => {
    if (isApiReady) {
      setIsLoadingAgents(true);
      setAgentsError(null);

      apiService
        .getAgents()
        .then((response) => {
          if (response.error) {
            setAgentsError(response.error);
          } else if (response.data) {
            setAgents(response.data);

            // If no initial agent is set, select the first one
            if (!initialAgentId && response.data.length > 0) {
              changeAgent(response.data[0].id);
            }
          }
        })
        .catch((err) => {
          setAgentsError(err.message || 'Failed to fetch agents');
        })
        .finally(() => {
          setIsLoadingAgents(false);
        });
    }
  }, [apiService, isApiReady, initialAgentId, changeAgent]);

  // Combine loading states and errors
  const isLoading = isLoadingAgents || isLoadingAgent;
  const error = agentsError || agentError;

  const value = {
    agents,
    currentAgent,
    messages,
    results,
    settings,
    isLoading,
    isTyping,
    error,
    changeAgent,
    sendMessage,
    saveSettings,
    clearChat
  };

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
};

/**
 * Hook to use the agent context
 */
export const useAgentContext = (): AgentContextType => {
  const context = useContext(AgentContext);

  if (context === undefined) {
    throw new Error('useAgentContext must be used within an AgentProvider');
  }

  return context;
};

export default AgentContext;
