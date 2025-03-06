/**
 * WebSocket Service for SolnAI Agent UI
 *
 * This service provides real-time communication with agents.
 */

import { ChatMessage } from './api';

export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (message: ChatMessage) => void;
}

export interface WebSocketMessage {
  type: string;
  payload: any;
}

/**
 * WebSocket Service class
 */
export class WebSocketService {
  private url: string;
  private socket: WebSocket | null = null;
  private reconnectInterval: number;
  private maxReconnectAttempts: number;
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private messageListeners: Map<string, ((payload: any) => void)[]> = new Map();

  // Callbacks
  private onOpenCallback?: (event: Event) => void;
  private onCloseCallback?: (event: CloseEvent) => void;
  private onErrorCallback?: (event: Event) => void;
  private onMessageCallback?: (message: ChatMessage) => void;

  constructor(config: WebSocketConfig) {
    this.url = config.url;
    this.reconnectInterval = config.reconnectInterval || 5000; // Default: 5 seconds
    this.maxReconnectAttempts = config.maxReconnectAttempts || 5; // Default: 5 attempts

    // Set callbacks
    this.onOpenCallback = config.onOpen;
    this.onCloseCallback = config.onClose;
    this.onErrorCallback = config.onError;
    this.onMessageCallback = config.onMessage;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket is already connected or connecting');
      return;
    }

    this.socket = new WebSocket(this.url);

    this.socket.onopen = (event: Event) => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      if (this.onOpenCallback) {
        this.onOpenCallback(event);
      }
    };

    this.socket.onclose = (event: CloseEvent) => {
      console.log('WebSocket disconnected');
      if (this.onCloseCallback) {
        this.onCloseCallback(event);
      }

      // Attempt to reconnect if not closed cleanly
      if (!event.wasClean) {
        this.attemptReconnect();
      }
    };

    this.socket.onerror = (event: Event) => {
      console.error('WebSocket error:', event);
      if (this.onErrorCallback) {
        this.onErrorCallback(event);
      }
    };

    this.socket.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        // Handle different message types
        if (data.type && this.messageListeners.has(data.type)) {
          const listeners = this.messageListeners.get(data.type) || [];
          listeners.forEach(listener => listener(data.payload));
        }

        // If it's a chat message, call the onMessage callback
        if (data.type === 'chat_message' && this.onMessageCallback) {
          this.onMessageCallback(data.payload);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.reconnectAttempts = 0;
  }

  /**
   * Send message to WebSocket server
   */
  send(type: string, payload: any): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return false;
    }

    try {
      const message: WebSocketMessage = {
        type,
        payload
      };

      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }

  /**
   * Send chat message to agent
   */
  sendChatMessage(agentId: string, message: string): boolean {
    return this.send('chat_message', {
      agentId,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Add message listener for specific message type
   */
  addMessageListener(type: string, listener: (payload: any) => void): void {
    if (!this.messageListeners.has(type)) {
      this.messageListeners.set(type, []);
    }

    const listeners = this.messageListeners.get(type) || [];
    listeners.push(listener);
    this.messageListeners.set(type, listeners);
  }

  /**
   * Remove message listener
   */
  removeMessageListener(type: string, listener: (payload: any) => void): void {
    if (!this.messageListeners.has(type)) {
      return;
    }

    const listeners = this.messageListeners.get(type) || [];
    const index = listeners.indexOf(listener);

    if (index !== -1) {
      listeners.splice(index, 1);
      this.messageListeners.set(type, listeners);
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  /**
   * Attempt to reconnect to WebSocket server
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;

    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }
}

/**
 * Create WebSocket service instance
 */
export function createWebSocketService(config: WebSocketConfig): WebSocketService {
  return new WebSocketService(config);
}

export default WebSocketService;
