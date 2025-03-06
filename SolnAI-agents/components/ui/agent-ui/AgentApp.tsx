import React from 'react';
import { AppProviders } from './context';
import AgentLayout from './AgentLayout';
import AgentSidebar from './AgentSidebar';
import AgentHeader from './AgentHeader';
import AgentContent from './AgentContent';

// Define the agent category structure
export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface AgentCategory {
  name: string;
  agents: Agent[];
}

export interface AgentAppProps {
  apiConfig: {
    baseUrl: string;
    timeout?: number;
    headers?: Record<string, string>;
  };
  webSocketConfig: {
    url: string;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
  };
  authToken?: string;
  initialAgentId?: string;
  onLogout?: () => void;
  userName?: string;
  userAvatar?: string;
}

/**
 * Main component for the Agent UI application
 * Provides context providers and layout for the agent interface
 */
const AgentApp: React.FC<AgentAppProps> = ({
  apiConfig,
  webSocketConfig,
  authToken,
  initialAgentId,
  onLogout,
  userName,
  userAvatar
}) => {
  return (
    <AppProviders
      apiConfig={apiConfig}
      webSocketConfig={webSocketConfig}
      authToken={authToken}
      initialAgentId={initialAgentId}
    >
      <AgentLayout
        sidebar={<AgentSidebar />}
        header={
          <AgentHeader
            onLogout={onLogout}
            userName={userName}
            userAvatar={userAvatar}
          />
        }
      >
        <AgentContent />
      </AgentLayout>
    </AppProviders>
  );
};

export default AgentApp;
