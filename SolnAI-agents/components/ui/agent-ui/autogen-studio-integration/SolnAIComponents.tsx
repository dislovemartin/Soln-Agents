/**
 * SolnAI Components for AutoGen Studio
 * 
 * This file contains the React components that can be embedded directly into 
 * AutoGen Studio interfaces.
 * 
 * Updated with WebSocket bridge for real-time communication between SolnAI and AutoGen Studio.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  AgentChat,
  AgentResults,
  useAgent,
  useAutoGenStudio,
  AgentExchangeService,
  useWebSocket
} from '../';

// Create an instance of the exchange service
const exchangeService = new AgentExchangeService({
  apiService: null, // This will be initialized later
  autogenApiUrl: process.env.AUTOGEN_STUDIO_URL || 'http://localhost:8081/api'
});

interface SolnAIComponentProps {
  agentId?: string;
  sessionId?: string;
  onResultsGenerated?: (results: any[]) => void;
  initialMessages?: any[];
  className?: string;
}

/**
 * SolnAI Chat Component
 * 
 * Embeddable chat interface for AutoGen Studio
 */
export const SolnAIChatComponent: React.FC<SolnAIComponentProps> = ({
  agentId = 'default-agent',
  initialMessages = [],
  onResultsGenerated,
  className = ''
}) => {
  const { agent, messages, results, sendMessage, isTyping } = useAgent();
  const [initialized, setInitialized] = useState(false);

  // Initialize the agent
  useEffect(() => {
    if (!initialized && agentId) {
      // In a real implementation, this would connect to your SolnAI backend
      console.log(`Initializing SolnAI agent: ${agentId}`);
      setInitialized(true);
    }
  }, [agentId, initialized]);

  // Notify parent when results change
  useEffect(() => {
    if (results.length > 0 && onResultsGenerated) {
      onResultsGenerated(results);
    }
  }, [results, onResultsGenerated]);

  return (
    <div className={`solnai-chat-component ${className}`}>
      <div className="component-header">
        <h3>SolnAI Agent: {agent?.name || agentId}</h3>
      </div>
      <div className="component-body">
        <AgentChat
          messages={messages}
          onSendMessage={sendMessage}
          isTyping={isTyping}
          showAttachments={true}
          maxHeight="400px"
        />
      </div>
    </div>
  );
};

/**
 * SolnAI Results Component
 * 
 * Embeddable results display for AutoGen Studio
 */
export const SolnAIResultsComponent: React.FC<SolnAIComponentProps> = ({
  agentId = 'default-agent',
  className = ''
}) => {
  const { results } = useAgent();

  return (
    <div className={`solnai-results-component ${className}`}>
      <div className="component-header">
        <h3>SolnAI Results</h3>
      </div>
      <div className="component-body">
        <AgentResults
          results={results}
          maxHeight="400px"
        />
      </div>
    </div>
  );
};

/**
 * SolnAI Bridge Component
 * 
 * Connects AutoGen Studio with SolnAI agents using WebSocket for real-time communication
 */
export const SolnAIBridgeComponent: React.FC<SolnAIComponentProps> = ({
  sessionId,
  className = ''
}) => {
  const { agents: autoGenAgents, currentSession, messages: autoGenMessages } = useAutoGenStudio();
  const { agent: solnAgent, results: solnResults, sendMessage } = useAgent();
  const [bridgeStatus, setBridgeStatus] = useState<'idle' | 'syncing' | 'error' | 'connected'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string>('Never');
  const [autoSync, setAutoSync] = useState<boolean>(false);
  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  
  // Create WebSocket connection to the bridge
  const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/experimental/autogen-studio/ws`;
  const { connected, messages: wsMessages, sendMessage: wsSendMessage } = useWebSocket(wsUrl, {
    onOpen: () => {
      console.log('WebSocket connection established');
      setWsStatus('connected');
      
      // Send initial connection message with session ID
      wsSendMessage({
        type: 'connect',
        sessionId,
        source: 'solnai'
      });
    },
    onClose: () => {
      console.log('WebSocket connection closed');
      setWsStatus('disconnected');
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      setWsStatus('error');
    }
  });
  
  // Handle WebSocket messages
  useEffect(() => {
    if (wsMessages.length > 0) {
      const latestMessage = wsMessages[wsMessages.length - 1];
      
      if (latestMessage.type === 'connect_success') {
        setBridgeStatus('connected');
        setLastSyncTime(new Date().toLocaleTimeString());
      } else if (latestMessage.type === 'autogen_message') {
        // Process message from AutoGen Studio
        if (autoSync) {
          handleAutoGenMessage(latestMessage.data);
        }
      }
    }
  }, [wsMessages, autoSync]);
  
  // Handle messages from AutoGen
  const handleAutoGenMessage = async (data: any) => {
    if (!data) return;
    
    try {
      // Format the data from AutoGen Studio
      const processedData = exchangeService.processAutoGenMessage(data);
      
      // Send to SolnAI agent
      await sendMessage(processedData);
    } catch (error) {
      console.error('Error processing AutoGen message:', error);
    }
  };

  // Sync data from AutoGen to SolnAI
  const syncFromAutoGen = async () => {
    if (!currentSession || !sessionId) {
      return;
    }

    setBridgeStatus('syncing');
    try {
      // Get the latest messages from AutoGen Studio
      const autoGenData = autoGenMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Send them to SolnAI
      const prompt = `Process this information from AutoGen Studio: 
        ${JSON.stringify(autoGenData)}`;
      
      await sendMessage(prompt);
      
      if (wsStatus === 'connected') {
        wsSendMessage({
          type: 'sync_status',
          status: 'success',
          direction: 'from_autogen',
          sessionId,
          timestamp: new Date().toISOString()
        });
      }
      
      setBridgeStatus('idle');
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error syncing from AutoGen:', error);
      setBridgeStatus('error');
    }
  };

  // Sync data from SolnAI to AutoGen
  const syncToAutoGen = async () => {
    if (!sessionId || solnResults.length === 0) {
      return;
    }

    setBridgeStatus('syncing');
    try {
      // Format SolnAI results for AutoGen
      const formattedData = exchangeService.convertSolnResultsToAutoGen(solnResults);
      
      // Send through WebSocket if available
      if (wsStatus === 'connected') {
        wsSendMessage({
          type: 'results',
          data: formattedData,
          sessionId,
          source: 'solnai',
          timestamp: new Date().toISOString()
        });
        
        setBridgeStatus('connected');
      } else {
        // Fall back to HTTP API
        await exchangeService.sendToAutoGen(sessionId, formattedData);
        setBridgeStatus('idle');
      }
      
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error syncing to AutoGen:', error);
      setBridgeStatus('error');
    }
  };

  return (
    <div className={`solnai-bridge-component ${className}`}>
      <div className="component-header">
        <h3>SolnAI ↔ AutoGen Bridge</h3>
        <div className="bridge-status">
          Status: {
            bridgeStatus === 'idle' ? '✅ Ready' : 
            bridgeStatus === 'syncing' ? '🔄 Syncing' : 
            bridgeStatus === 'connected' ? '🟢 Connected' : 
            '❌ Error'
          }
        </div>
        <div className="websocket-status">
          WebSocket: {
            wsStatus === 'disconnected' ? '⚪ Disconnected' : 
            wsStatus === 'connecting' ? '🔄 Connecting' : 
            wsStatus === 'connected' ? '🟢 Connected' : 
            '🔴 Error'
          }
        </div>
        <div className="last-sync">
          Last Sync: {lastSyncTime}
        </div>
      </div>
      <div className="component-body">
        <div className="bridge-controls">
          <button 
            onClick={syncFromAutoGen}
            disabled={bridgeStatus === 'syncing' || !sessionId}
            className="bridge-button"
          >
            Import from AutoGen
          </button>
          <button 
            onClick={syncToAutoGen}
            disabled={bridgeStatus === 'syncing' || !sessionId || solnResults.length === 0}
            className="bridge-button"
          >
            Export to AutoGen
          </button>
          <div className="auto-sync-control">
            <label>
              <input 
                type="checkbox" 
                checked={autoSync} 
                onChange={() => setAutoSync(!autoSync)} 
              />
              Auto-sync (real-time)
            </label>
          </div>
        </div>
        <div className="bridge-info">
          <div>AutoGen Session: {sessionId || 'None'}</div>
          <div>SolnAI Agent: {solnAgent?.name || 'None'}</div>
          <div>Available Results: {solnResults.length}</div>
          <div>Available AutoGen Agents: {autoGenAgents.length}</div>
        </div>
        {wsMessages.length > 0 && (
          <div className="message-log">
            <h4>Message Log</h4>
            <div className="messages-container">
              {wsMessages.slice(-5).map((msg, index) => (
                <div key={index} className="message-item">
                  <span className="message-time">{new Date().toLocaleTimeString()}</span>
                  <span className="message-type">{msg.type}</span>
                  <span className="message-source">{msg.source || 'unknown'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Register SolnAI components with AutoGen Studio
 * 
 * This function should be called when initializing AutoGen Studio
 */
export const registerSolnAIComponents = (autogenStudio: any) => {
  if (!autogenStudio || !autogenStudio.registerComponent) {
    console.error('AutoGen Studio API not available');
    return false;
  }

  try {
    // Register the SolnAI Chat component
    autogenStudio.registerComponent('solnai-chat', SolnAIChatComponent, {
      displayName: 'SolnAI Chat',
      description: 'Chat interface for SolnAI agents',
      category: 'Agent Interfaces',
      defaultProps: {
        agentId: 'default-agent'
      }
    });

    // Register the SolnAI Results component
    autogenStudio.registerComponent('solnai-results', SolnAIResultsComponent, {
      displayName: 'SolnAI Results',
      description: 'Display results from SolnAI agents',
      category: 'Agent Interfaces',
      defaultProps: {}
    });

    // Register the SolnAI Bridge component
    autogenStudio.registerComponent('solnai-bridge', SolnAIBridgeComponent, {
      displayName: 'SolnAI Bridge',
      description: 'Connect AutoGen Studio with SolnAI agents',
      category: 'Integration',
      defaultProps: {}
    });

    return true;
  } catch (error) {
    console.error('Error registering SolnAI components:', error);
    return false;
  }
};

export default {
  SolnAIChatComponent,
  SolnAIResultsComponent,
  SolnAIBridgeComponent,
  registerSolnAIComponents
};