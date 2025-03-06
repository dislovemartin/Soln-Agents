import React, { useState, useEffect } from 'react';
import { SolnAgents } from '../../models/solnAgents';
import showToast from '../../utils/toast';
import { 
  Robot, 
  ArrowsClockwise, 
  Trash, 
  CheckCircle, 
  XCircle,
  MagnifyingGlass,
  Spinner,
  List,
  ChatCircle
} from '@phosphor-icons/react';

const AgentCatalog = () => {
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSession, setActiveSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionMessages, setSessionMessages] = useState({});
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [createSessionLoading, setCreateSessionLoading] = useState(false);
  const [refreshingSessions, setRefreshingSessions] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [view, setView] = useState('catalog'); // 'catalog', 'chat'
  
  // Load agents on component mount
  useEffect(() => {
    loadAgents();
    loadSessions();
  }, []);
  
  // Filter agents based on search query
  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (agent.description && agent.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const loadAgents = async () => {
    try {
      setLoading(true);
      const response = await SolnAgents.listAvailableAgents();
      if (response.success) {
        setAgents(response.agents || []);
      } else {
        console.error('Failed to load agents:', response.error);
        showToast('Failed to load agents', 'error');
      }
    } catch (error) {
      console.error('Error loading agents:', error);
      showToast('Error loading agents', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const loadSessions = async () => {
    try {
      setRefreshingSessions(true);
      const response = await SolnAgents.listSessions();
      if (response.success) {
        setSessions(response.sessions || []);
      } else {
        console.error('Failed to load sessions:', response.error);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setRefreshingSessions(false);
    }
  };
  
  const createSession = async (agentId) => {
    try {
      setCreateSessionLoading(true);
      setSelectedAgent(agentId);
      const response = await SolnAgents.createSession(agentId);
      if (response.success) {
        showToast('Agent session created', 'success');
        setActiveSession(response.sessionId);
        await loadSessions();
        // Initialize empty message array for this session
        setSessionMessages(prev => ({
          ...prev,
          [response.sessionId]: []
        }));
        // Switch to chat view
        setView('chat');
      } else {
        console.error('Failed to create session:', response.error);
        showToast(response.error || 'Failed to create session', 'error');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      showToast('Error creating session', 'error');
    } finally {
      setCreateSessionLoading(false);
    }
  };
  
  const sendMessage = async () => {
    if (!activeSession || !messageInput.trim()) return;
    
    try {
      setSendingMessage(true);
      
      // Add user message to the conversation
      const userMessage = { role: 'user', content: messageInput };
      setSessionMessages(prev => ({
        ...prev,
        [activeSession]: [...(prev[activeSession] || []), userMessage]
      }));
      
      const response = await SolnAgents.sendMessage(activeSession, messageInput);
      
      if (response.success) {
        // Extract response content
        let content = '';
        if (response.data && response.data.response) {
          content = response.data.response;
        } else if (response.data && response.data.text) {
          content = response.data.text;
        } else {
          content = JSON.stringify(response.data);
        }
        
        // Add AI response to the conversation
        const aiMessage = { role: 'assistant', content };
        setSessionMessages(prev => ({
          ...prev,
          [activeSession]: [...(prev[activeSession] || []), aiMessage]
        }));
        
        setMessageInput('');
      } else {
        showToast(response.error || 'Failed to send message', 'error');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Error sending message', 'error');
    } finally {
      setSendingMessage(false);
    }
  };
  
  const endSession = async (sessionId) => {
    try {
      const response = await SolnAgents.endSession(sessionId);
      if (response.success) {
        showToast('Session ended', 'success');
        if (activeSession === sessionId) {
          setActiveSession(null);
          setView('catalog');
        }
        await loadSessions();
      } else {
        console.error('Failed to end session:', response.error);
        showToast(response.error || 'Failed to end session', 'error');
      }
    } catch (error) {
      console.error('Error ending session:', error);
      showToast('Error ending session', 'error');
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  const getAgentById = (agentId) => {
    return agents.find(agent => agent.id === agentId) || { name: 'Unknown Agent' };
  };
  
  const getActiveSessionDetails = () => {
    if (!activeSession) return null;
    
    const session = sessions.find(s => s.sessionId === activeSession);
    if (!session) return null;
    
    const agent = getAgentById(selectedAgent);
    
    return {
      sessionId: session.sessionId,
      startTime: new Date(session.startTime).toLocaleString(),
      uptime: Math.floor(session.uptime / 60000), // Convert to minutes
      agentName: agent.name,
      type: session.type
    };
  };
  
  // Render the component based on the view
  if (view === 'chat' && activeSession) {
    const sessionDetails = getActiveSessionDetails();
    
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between py-3 px-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setView('catalog')} 
              className="p-1 rounded-md hover:bg-gray-700"
            >
              <List size={20} />
            </button>
            <h2 className="text-lg font-medium">
              {sessionDetails?.agentName || 'Chat with Agent'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-gray-700 px-2 py-1 rounded-full">
              Session: {activeSession.substring(0, 8)}...
            </span>
            {sessionDetails && (
              <span className="text-xs bg-gray-700 px-2 py-1 rounded-full">
                Uptime: {sessionDetails.uptime} min
              </span>
            )}
            <button 
              onClick={() => endSession(activeSession)}
              className="p-1 text-red-400 hover:text-red-300 rounded-md"
            >
              <Trash size={20} />
            </button>
          </div>
        </div>
        
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {(sessionMessages[activeSession] || []).map((message, index) => (
            <div 
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-3/4 rounded-lg px-4 py-2 ${
                  message.role === 'user' 
                    ? 'bg-primary-button text-white' 
                    : 'bg-gray-700 text-white'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {sendingMessage && (
            <div className="flex justify-start">
              <div className="max-w-3/4 rounded-lg px-4 py-2 bg-gray-700 text-white">
                <Spinner size={20} className="animate-spin" />
              </div>
            </div>
          )}
        </div>
        
        {/* Message Input */}
        <div className="px-4 py-3 border-t border-gray-700">
          <div className="flex items-center gap-2">
            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 bg-gray-700 border-none rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-button resize-none"
              rows={1}
            />
            <button
              onClick={sendMessage}
              disabled={!messageInput.trim() || sendingMessage}
              className="px-4 py-2 bg-primary-button hover:bg-primary-button/90 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="py-3 px-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Robot size={24} />
            SolnAI Agents
          </h1>
          <button
            onClick={loadAgents}
            className="p-2 rounded-md hover:bg-gray-700"
          >
            <ArrowsClockwise size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-700 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-button"
          />
          <MagnifyingGlass size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>
      
      {/* Active Sessions */}
      {sessions.length > 0 && (
        <div className="px-4 py-3 border-b border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-400">Active Sessions</h2>
            <button
              onClick={loadSessions}
              className="p-1 rounded-md hover:bg-gray-700 text-gray-400"
            >
              <ArrowsClockwise size={16} className={refreshingSessions ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {sessions.map((session) => {
              const agent = getAgentById(selectedAgent);
              return (
                <div
                  key={session.sessionId}
                  className="bg-gray-700 rounded-lg p-2 text-sm"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <Robot size={16} className="text-primary-button" />
                      <span>{agent.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setActiveSession(session.sessionId);
                          setView('chat');
                        }}
                        className="p-1 rounded-md hover:bg-gray-600 text-primary-button"
                      >
                        <ChatCircle size={16} />
                      </button>
                      <button
                        onClick={() => endSession(session.sessionId)}
                        className="p-1 rounded-md hover:bg-gray-600 text-red-400"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    <span>Uptime: {Math.floor(session.uptime / 60000)} min</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Agents Catalog */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Spinner size={32} className="animate-spin text-primary-button" />
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No agents found matching your search.</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-primary-button hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgents.map((agent) => (
              <div
                key={agent.id}
                className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-medium">{agent.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    agent.type === 'python' ? 'bg-blue-500/20 text-blue-300' :
                    agent.type === 'n8n' ? 'bg-green-500/20 text-green-300' :
                    agent.type === 'voiceflow' ? 'bg-purple-500/20 text-purple-300' :
                    'bg-gray-600 text-gray-300'
                  }`}>
                    {agent.type}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  {agent.description || 'No description provided.'}
                </p>
                <button
                  onClick={() => createSession(agent.id)}
                  disabled={createSessionLoading && selectedAgent === agent.id}
                  className="w-full px-4 py-2 bg-primary-button hover:bg-primary-button/90 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {createSessionLoading && selectedAgent === agent.id ? (
                    <Spinner size={20} className="animate-spin" />
                  ) : (
                    <>Start Session</>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentCatalog;