import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';
import { useServices } from '../context/ServiceContext';

interface AutoGenAgent {
  id: string;
  name: string;
  description: string;
  skills: string[];
  config: Record<string, any>;
}

interface AutoGenSession {
  id: string;
  agent_id: string;
  task: string;
  status: 'active' | 'completed' | 'error';
  created_at: string;
}

interface AutoGenMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

interface AutoGenSkill {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export function useAutoGenStudio() {
  const { api } = useServices();
  const [agents, setAgents] = useState<AutoGenAgent[]>([]);
  const [currentAgent, setCurrentAgent] = useState<AutoGenAgent | null>(null);
  const [sessions, setSessions] = useState<AutoGenSession[]>([]);
  const [currentSession, setCurrentSession] = useState<AutoGenSession | null>(null);
  const [messages, setMessages] = useState<AutoGenMessage[]>([]);
  const [skills, setSkills] = useState<AutoGenSkill[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all AutoGen agents
  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const agentsData = await api.getAutoGenAgents();
      setAgents(agentsData);
    } catch (err) {
      setError('Failed to fetch AutoGen agents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Fetch a specific AutoGen agent
  const fetchAgent = useCallback(async (agentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const agentData = await api.getAutoGenAgent(agentId);
      setCurrentAgent(agentData);
      return agentData;
    } catch (err) {
      setError(`Failed to fetch AutoGen agent ${agentId}`);
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Create a new session with an AutoGen agent
  const createSession = useCallback(async (agentId: string, task: string) => {
    setLoading(true);
    setError(null);
    try {
      const sessionData = await api.createAutoGenSession(agentId, task);
      setCurrentSession(sessionData);
      return sessionData;
    } catch (err) {
      setError('Failed to create AutoGen session');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Send a message to the current session
  const sendMessage = useCallback(async (message: string) => {
    if (!currentSession) {
      setError('No active session');
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const messageData = await api.sendAutoGenMessage(currentSession.id, message);
      // Update messages with the new message
      setMessages(prev => [...prev, messageData]);
      return messageData;
    } catch (err) {
      setError('Failed to send message');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, currentSession]);

  // Fetch messages for the current session
  const fetchMessages = useCallback(async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const messagesData = await api.getAutoGenMessages(sessionId);
      setMessages(messagesData);
      return messagesData;
    } catch (err) {
      setError('Failed to fetch messages');
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Fetch all available skills
  const fetchSkills = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const skillsData = await api.getAutoGenSkills();
      setSkills(skillsData);
      return skillsData;
    } catch (err) {
      setError('Failed to fetch skills');
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Add a skill to an agent
  const addSkillToAgent = useCallback(async (agentId: string, skillId: string) => {
    setLoading(true);
    setError(null);
    try {
      const success = await api.addSkillToAgent(agentId, skillId);
      if (success && currentAgent && currentAgent.id === agentId) {
        // Update the current agent with the new skill
        const updatedAgent = await api.getAutoGenAgent(agentId);
        setCurrentAgent(updatedAgent);
      }
      return success;
    } catch (err) {
      setError('Failed to add skill to agent');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [api, currentAgent]);

  return {
    agents,
    currentAgent,
    sessions,
    currentSession,
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
    addSkillToAgent,
    setCurrentAgent,
    setCurrentSession
  };
}
