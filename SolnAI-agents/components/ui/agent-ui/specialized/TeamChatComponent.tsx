import React, { useState, useEffect, useRef } from 'react';
import { useAutoGenStudio } from '../hooks/useAutoGenStudio';
import { createAgentExchangeService } from '../services/agent-exchange';

// Types
interface AgentMessage {
  id: string;
  agentName: string;
  agentRole: string;
  content: string;
  timestamp: string;
  structuredContent?: ContentBlock[];
}

interface ContentBlock {
  type: 'text' | 'code' | 'image' | 'link' | 'file' | 'table';
  content: string;
  language?: string;
  title?: string;
}

interface TeamChatProps {
  teamId: string;
  sessionId?: string;
  onExportResults?: (results: any[]) => void;
  onSessionCreated?: (sessionId: string) => void;
  initialPrompt?: string;
}

/**
 * TeamChat Component
 * 
 * Displays conversations from a multi-agent team and allows interaction
 * with the team through messages.
 */
const TeamChat: React.FC<TeamChatProps> = ({
  teamId,
  sessionId: initialSessionId,
  onExportResults,
  onSessionCreated,
  initialPrompt
}) => {
  // State
  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [userInput, setUserInput] = useState<string>(initialPrompt || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Services
  const { 
    agents,
    sendMessage,
    createSession,
    fetchMessages
  } = useAutoGenStudio();
  
  const exchangeService = React.useMemo(() => createAgentExchangeService({
    apiService: { /* api instance would be passed here */ } as any, // Simplified for example
    autogenApiUrl: 'http://localhost:8081/api'
  }), []);

  // Get team agents - this would be extended to work with the full 20-agent team
  const teamAgents = React.useMemo(() => {
    return agents.filter(agent => agent.metadata?.teamId === teamId);
  }, [agents, teamId]);
  
  // Initialize session if needed
  useEffect(() => {
    if (!sessionId && teamId) {
      const initSession = async () => {
        setLoading(true);
        try {
          // This would call our extended method for team sessions
          const newSessionId = await createSession(teamId, "New team conversation");
          if (newSessionId) {
            setSessionId(newSessionId);
            if (onSessionCreated) {
              onSessionCreated(newSessionId);
            }
          } else {
            setError("Failed to create session");
          }
        } catch (err) {
          setError(`Error creating session: ${err.message}`);
        } finally {
          setLoading(false);
        }
      };
      
      initSession();
    }
  }, [sessionId, teamId, createSession, onSessionCreated]);
  
  // Load messages when session is available
  useEffect(() => {
    if (sessionId) {
      const loadMessages = async () => {
        setLoading(true);
        try {
          // This would use our processTeamResponses method
          const teamMessages = await fetchMessages(sessionId);
          
          // Transform to our display format - this would be enhanced with agent metadata
          const formattedMessages = teamMessages.map(msg => ({
            id: msg.id,
            agentName: msg.metadata?.agentName || (msg.role === 'user' ? 'You' : 'Assistant'),
            agentRole: msg.metadata?.agentRole || msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            structuredContent: msg.metadata?.structuredContent
          }));
          
          setMessages(formattedMessages);
        } catch (err) {
          setError(`Error loading messages: ${err.message}`);
        } finally {
          setLoading(false);
        }
      };
      
      loadMessages();
      
      // Set up polling or websocket for updates
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [sessionId, fetchMessages]);
  
  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!sessionId || !userInput.trim()) return;
    
    // Add user message to UI immediately
    const userMessage: AgentMessage = {
      id: `user-${Date.now()}`,
      agentName: 'You',
      agentRole: 'user',
      content: userInput,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setLoading(true);
    
    try {
      // Send to specific agent if selected, otherwise to all
      const target = selectedAgent ? { agentName: selectedAgent } : undefined;
      await sendMessage(sessionId, userInput, target);
      
      // The new responses will be picked up by the polling/websocket
    } catch (err) {
      setError(`Error sending message: ${err.message}`);
      setLoading(false);
    }
  };
  
  // Handle exporting results
  const handleExportResults = () => {
    if (onExportResults && messages.length > 0) {
      // Filter out user messages and prepare for export
      const results = messages
        .filter(msg => msg.agentRole !== 'user')
        .map(msg => ({
          id: msg.id,
          title: `${msg.agentName} Response`,
          content: msg.content,
          type: 'text',
          metadata: {
            agentName: msg.agentName,
            agentRole: msg.agentRole,
            timestamp: msg.timestamp,
            teamId,
            sessionId
          }
        }));
      
      onExportResults(results);
    }
  };
  
  return (
    <div className="team-chat-container">
      {/* Header */}
      <div className="team-chat-header">
        <h2>Team Conversation</h2>
        {sessionId && (
          <div className="team-chat-actions">
            <button 
              onClick={handleExportResults}
              disabled={messages.length === 0 || loading}
            >
              Export Results
            </button>
          </div>
        )}
      </div>
      
      {/* Error display */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      
      {/* Messages area */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            {loading ? 'Loading...' : 'No messages yet. Start the conversation!'}
          </div>
        ) : (
          messages.map(message => (
            <MessageBubble 
              key={message.id} 
              message={message} 
              isUser={message.agentRole === 'user'}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <div className="input-container">
        <div className="agent-selector">
          <select
            value={selectedAgent || ''}
            onChange={(e) => setSelectedAgent(e.target.value || null)}
          >
            <option value="">All Agents</option>
            {teamAgents.map(agent => (
              <option key={agent.id} value={agent.name}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>
        
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your message..."
          disabled={loading || !sessionId}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        
        <button
          onClick={handleSendMessage}
          disabled={loading || !sessionId || !userInput.trim()}
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

// Helper component for message bubbles
const MessageBubble: React.FC<{ 
  message: AgentMessage;
  isUser: boolean;
}> = ({ message, isUser }) => {
  // Format timestamp
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return (
    <div className={`message-bubble ${isUser ? 'user-message' : 'agent-message'}`}>
      {!isUser && (
        <div className="agent-info">
          <span className="agent-name">{message.agentName}</span>
          <span className="message-time">{formattedTime}</span>
        </div>
      )}
      
      <div className="message-content">
        {/* Render structured content if available */}
        {message.structuredContent ? (
          message.structuredContent.map((block, index) => (
            <ContentBlockRenderer key={index} block={block} />
          ))
        ) : (
          // Otherwise render as simple text with basic markdown
          <div 
            className="text-content"
            dangerouslySetInnerHTML={{ 
              __html: formatMessageContent(message.content) 
            }}
          />
        )}
      </div>
      
      {isUser && (
        <div className="message-time user-time">{formattedTime}</div>
      )}
    </div>
  );
};

// Helper component for content blocks
const ContentBlockRenderer: React.FC<{ block: ContentBlock }> = ({ block }) => {
  switch (block.type) {
    case 'code':
      return (
        <div className="code-block">
          {block.language && <div className="code-language">{block.language}</div>}
          <pre>
            <code>{block.content}</code>
          </pre>
        </div>
      );
    
    case 'image':
      return (
        <div className="image-block">
          {block.title && <div className="image-title">{block.title}</div>}
          <img src={block.content} alt={block.title || 'Image'} />
        </div>
      );
    
    case 'link':
      return (
        <div className="link-block">
          <a href={block.content} target="_blank" rel="noopener noreferrer">
            {block.title || block.content}
          </a>
        </div>
      );
      
    default:
      return <div className="text-block">{block.content}</div>;
  }
};

// Helper function to format message content with basic markdown
const formatMessageContent = (content: string): string => {
  // This is a simplified version - would use a proper markdown renderer in production
  let formatted = content;
  
  // Convert URLs to links
  formatted = formatted.replace(
    /(https?:\/\/[^\s]+)/g, 
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  
  // Convert bullet points
  formatted = formatted.replace(/^• (.+)$/gm, '<li>$1</li>');
  formatted = formatted.replace(/<li>(.+)<\/li>/g, '<ul><li>$1</li></ul>');
  
  // Convert line breaks
  formatted = formatted.replace(/\n/g, '<br />');
  
  return formatted;
};

export default TeamChat;