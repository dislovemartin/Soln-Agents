import { Loader2, Mic, Paperclip, Send } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../shadcn/button';
import { ScrollArea } from '../shadcn/scroll-area';
import { Textarea } from '../shadcn/textarea';
import { useAgentContext } from './context/AgentContext';
import { useFileContext } from './context/FileContext';
import { ChatMessage } from './hooks/useAgent';

interface AgentChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<ChatMessage | null>;
}

/**
 * Chat component for interacting with agents
 */
const AgentChat: React.FC<AgentChatProps> = ({ messages, onSendMessage }) => {
  const { currentAgent, isTyping } = useAgentContext();
  const { uploadFile, isUploading } = useFileContext();
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(inputValue);
      setInputValue('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const file = files[0];
      const result = await uploadFile(file);
      if (result) {
        await onSendMessage(`I've uploaded a file: ${file.name}`);
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
    } finally {
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="text-4xl mb-4">{currentAgent?.icon || '🤖'}</div>
              <h3 className="text-xl font-medium mb-2">Start a conversation</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">
                Send a message to begin chatting with {currentAgent?.name || 'the agent'}.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="flex items-start">
                    {message.role !== 'user' && (
                      <div className="text-xl mr-2">{currentAgent?.icon || '🤖'}</div>
                    )}
                    <div>
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      <div
                        className={`text-xs mt-1 ${
                          message.role === 'user'
                            ? 'text-primary-foreground/70'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {formatTimestamp(message.timestamp)}
                        {message.status === 'sending' && ' • Sending...'}
                        {message.status === 'error' && ' • Failed to send'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                <div className="flex items-center">
                  <div className="text-xl mr-2">{currentAgent?.icon || '🤖'}</div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <div className="flex items-end space-x-2">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${currentAgent?.name || 'the agent'}...`}
            className="min-h-[80px] flex-1"
          />
          <div className="flex flex-col space-y-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleFileUpload}
              disabled={isUploading}
              title="Upload file"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Paperclip className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              title="Voice input"
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              size="icon"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isSending}
              title="Send message"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default AgentChat;
