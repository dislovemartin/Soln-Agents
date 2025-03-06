/**
 * Context providers for SolnAI Agent UI
 */

// Service context
export { default as ServiceContext, ServiceProvider, useServices } from './ServiceContext';

// Agent context
export { default as AgentContext, AgentProvider, useAgentContext } from './AgentContext';

// File context
export { default as FileContext, FileProvider, useFileContext } from './FileContext';

// Combined provider for all contexts
import React, { ReactNode } from 'react';

interface AppProvidersProps {
  children: ReactNode;
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
}

/**
 * Combined provider for all contexts
 */
export const AppProviders: React.FC<AppProvidersProps> = ({
  children,
  apiConfig,
  webSocketConfig,
  authToken,
  initialAgentId
}) => {
  return (
    <ServiceProvider
      apiConfig={apiConfig}
      webSocketConfig={webSocketConfig}
      authToken={authToken}
    >
      <AgentProvider initialAgentId={initialAgentId}>
        <FileProvider>{children}</FileProvider>
      </AgentProvider>
    </ServiceProvider>
  );
};

export default AppProviders;
