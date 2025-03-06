import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ApiService } from '../services/api';
import { WebSocketService } from '../services/websocket';

interface ServiceContextType {
  apiService: ApiService;
  webSocketService: WebSocketService;
  isApiReady: boolean;
  isWebSocketReady: boolean;
  apiError: string | null;
  webSocketError: string | null;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

interface ServiceProviderProps {
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
}

/**
 * Provider component for API and WebSocket services
 */
export const ServiceProvider: React.FC<ServiceProviderProps> = ({
  children,
  apiConfig,
  webSocketConfig,
  authToken
}) => {
  const [apiService] = useState<ApiService>(() => new ApiService(apiConfig));
  const [webSocketService] = useState<WebSocketService>(() => new WebSocketService());

  const [isApiReady, setIsApiReady] = useState<boolean>(false);
  const [isWebSocketReady, setIsWebSocketReady] = useState<boolean>(false);

  const [apiError, setApiError] = useState<string | null>(null);
  const [webSocketError, setWebSocketError] = useState<string | null>(null);

  // Initialize API service
  useEffect(() => {
    try {
      // Set auth token if provided
      if (authToken) {
        apiService.setAuthToken(authToken);
      }

      setIsApiReady(true);
    } catch (err) {
      setApiError(err.message || 'Failed to initialize API service');
      setIsApiReady(false);
    }
  }, [apiService, authToken]);

  // Initialize WebSocket service
  useEffect(() => {
    try {
      // Connect to WebSocket
      webSocketService.connect({
        ...webSocketConfig,
        onOpen: () => {
          setIsWebSocketReady(true);
          setWebSocketError(null);
        },
        onClose: () => {
          setIsWebSocketReady(false);
        },
        onError: (err) => {
          setWebSocketError(err.message || 'WebSocket error');
          setIsWebSocketReady(false);
        }
      });

      // Cleanup on unmount
      return () => {
        webSocketService.disconnect();
      };
    } catch (err) {
      setWebSocketError(err.message || 'Failed to initialize WebSocket service');
      setIsWebSocketReady(false);
    }
  }, [webSocketService, webSocketConfig]);

  const value = {
    apiService,
    webSocketService,
    isApiReady,
    isWebSocketReady,
    apiError,
    webSocketError
  };

  return <ServiceContext.Provider value={value}>{children}</ServiceContext.Provider>;
};

/**
 * Hook to use the service context
 */
export const useServices = (): ServiceContextType => {
  const context = useContext(ServiceContext);

  if (context === undefined) {
    throw new Error('useServices must be used within a ServiceProvider');
  }

  return context;
};

export default ServiceContext;
