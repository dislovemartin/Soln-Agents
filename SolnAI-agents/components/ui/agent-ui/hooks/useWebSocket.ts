import { useState, useEffect, useCallback, useRef } from 'react';
import { WebSocketService, WebSocketMessage } from '../services/websocket';

/**
 * Hook for using the WebSocket service in React components
 * 
 * Updated to support direct URL connection for AutoGen Studio integration
 */
export function useWebSocket(
  webSocketServiceOrUrl: WebSocketService | string,
  messageTypesOrOptions: string[] | {
    onOpen?: () => void;
    onClose?: () => void;
    onError?: (error: any) => void;
    messageTypes?: string[];
  } = []
) {
  // Determine if we're using a WebSocketService or a direct URL
  const isDirectUrl = typeof webSocketServiceOrUrl === 'string';
  const webSocketService = isDirectUrl ? null : webSocketServiceOrUrl as WebSocketService;
  
  // Parse options
  const isOptions = !Array.isArray(messageTypesOrOptions);
  const messageTypes = isOptions ? (messageTypesOrOptions as any).messageTypes || [] : messageTypesOrOptions;
  const options = isOptions ? messageTypesOrOptions : {};
  
  const [isConnected, setIsConnected] = useState<boolean>(isDirectUrl ? false : webSocketService!.isConnected());
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // Use a ref to store the current message types to avoid dependency issues in useEffect
  const messageTypesRef = useRef(messageTypes);
  useEffect(() => {
    messageTypesRef.current = messageTypes;
  }, [messageTypes]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (isDirectUrl) {
      // Direct URL connection mode (for AutoGen Studio integration)
      try {
        const url = webSocketServiceOrUrl as string;
        const socket = new WebSocket(url);
        
        socket.onopen = () => {
          setIsConnected(true);
          if (isOptions && (options as any).onOpen) {
            (options as any).onOpen();
          }
        };
        
        socket.onclose = () => {
          setIsConnected(false);
          if (isOptions && (options as any).onClose) {
            (options as any).onClose();
          }
        };
        
        socket.onerror = (err) => {
          setError('WebSocket error');
          if (isOptions && (options as any).onError) {
            (options as any).onError(err);
          }
        };
        
        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            setLastMessage(message);
            setMessages((prev) => [...prev, message]);
          } catch (err) {
            setError('Failed to parse WebSocket message');
          }
        };
        
        socketRef.current = socket;
      } catch (err) {
        setError('Failed to connect to WebSocket');
        if (isOptions && (options as any).onError) {
          (options as any).onError(err);
        }
      }
    } else {
      // WebSocketService mode (standard mode)
      try {
        webSocketService!.connect({
          onOpen: () => {
            setIsConnected(true);
            if (isOptions && (options as any).onOpen) {
              (options as any).onOpen();
            }
          },
          onClose: () => {
            setIsConnected(false);
            if (isOptions && (options as any).onClose) {
              (options as any).onClose();
            }
          },
          onError: (err) => {
            setError(err.message || 'WebSocket error');
            if (isOptions && (options as any).onError) {
              (options as any).onError(err);
            }
          },
          onMessage: (message) => {
            // Only process messages of the specified types, or all if no types specified
            if (
              messageTypesRef.current.length === 0 ||
              messageTypesRef.current.includes(message.type)
            ) {
              setLastMessage(message);
              setMessages((prev) => [...prev, message]);
            }
          }
        });
      } catch (err) {
        setError('Failed to connect to WebSocket');
        if (isOptions && (options as any).onError) {
          (options as any).onError(err);
        }
      }
    }
  }, [webSocketServiceOrUrl, isDirectUrl, isOptions, options]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (isDirectUrl) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setIsConnected(false);
    } else {
      webSocketService!.disconnect();
      setIsConnected(false);
    }
  }, [webSocketService, isDirectUrl]);

  // Send a message through WebSocket
  const sendMessage = useCallback(
    (message: WebSocketMessage | any) => {
      if (!isConnected) {
        setError('Cannot send message: WebSocket is not connected');
        return false;
      }

      try {
        if (isDirectUrl) {
          if (socketRef.current) {
            // For direct URL connection
            const messageString = typeof message === 'string' 
              ? message 
              : JSON.stringify(message);
            socketRef.current.send(messageString);
          } else {
            throw new Error('WebSocket not initialized');
          }
        } else {
          // For WebSocketService
          webSocketService!.sendMessage(message as WebSocketMessage);
        }
        return true;
      } catch (err) {
        setError(err.message || 'Failed to send message');
        return false;
      }
    },
    [webSocketService, isConnected, isDirectUrl]
  );

  // Clear message history
  const clearMessages = useCallback(() => {
    setMessages([]);
    setLastMessage(null);
  }, []);

  // Connect on mount and disconnect on unmount
  useEffect(() => {
    if (isDirectUrl) {
      // For direct URL, always connect on mount
      connect();
    } else {
      // For WebSocketService
      if (!webSocketService!.isConnected()) {
        connect();
      } else {
        setIsConnected(true);
      }
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, webSocketService, isDirectUrl]);

  return {
    isConnected,
    lastMessage,
    messages,
    error,
    sendMessage,
    connect,
    disconnect,
    clearMessages
  };
}

export default useWebSocket;
