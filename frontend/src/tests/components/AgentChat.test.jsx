import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AgentChat from '../../components/AgentChat';
import * as agentService from '../../utils/agents';

// Mock the agent service
jest.mock('../../utils/agents', () => ({
  sendMessageToAgent: jest.fn(),
  getAgentChatHistory: jest.fn(),
}));

describe('AgentChat Component', () => {
  const mockAgent = {
    id: 'agent1',
    name: 'Test Agent',
    description: 'A test agent for chatting',
  };
  
  const mockChatHistory = [
    { id: 'msg1', role: 'user', content: 'Hello', timestamp: new Date().toISOString() },
    { id: 'msg2', role: 'agent', content: 'Hi there!', timestamp: new Date().toISOString() },
  ];
  
  beforeEach(() => {
    // Reset the mock implementations before each test
    agentService.sendMessageToAgent.mockReset();
    agentService.getAgentChatHistory.mockReset();
    
    // Default mock implementation for chat history
    agentService.getAgentChatHistory.mockResolvedValue(mockChatHistory);
  });
  
  it('renders the chat interface with agent name', () => {
    render(<AgentChat agent={mockAgent} />);
    
    // Check if agent name is displayed
    expect(screen.getByText(mockAgent.name)).toBeInTheDocument();
    
    // Check if message input is present
    expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
    
    // Check if send button is present
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });
  
  it('loads and displays chat history', async () => {
    render(<AgentChat agent={mockAgent} />);
    
    // Wait for chat history to load
    await waitFor(() => {
      // Check if messages from history are displayed
      expect(screen.getByText(mockChatHistory[0].content)).toBeInTheDocument();
      expect(screen.getByText(mockChatHistory[1].content)).toBeInTheDocument();
    });
    
    // Verify the service was called with the correct agent ID
    expect(agentService.getAgentChatHistory).toHaveBeenCalledWith(mockAgent.id);
  });
  
  it('sends a message when user submits the form', async () => {
    // Mock the sendMessageToAgent to return a successful response
    const mockResponse = { id: 'msg3', role: 'agent', content: 'I received your message', timestamp: new Date().toISOString() };
    agentService.sendMessageToAgent.mockResolvedValue(mockResponse);
    
    render(<AgentChat agent={mockAgent} />);
    
    // Type a message in the input
    const messageInput = screen.getByPlaceholderText(/type a message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(messageInput, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);
    
    // Check if the message was sent to the agent
    expect(agentService.sendMessageToAgent).toHaveBeenCalledWith(
      mockAgent.id,
      'Test message',
      expect.any(Object) // Options object
    );
    
    // Wait for the response to appear
    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
      expect(screen.getByText(mockResponse.content)).toBeInTheDocument();
    });
    
    // Verify the input was cleared
    expect(messageInput.value).toBe('');
  });
  
  it('displays a loading indicator while sending a message', async () => {
    // Mock sendMessageToAgent with a delayed response
    agentService.sendMessageToAgent.mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ id: 'msg3', role: 'agent', content: 'Response', timestamp: new Date().toISOString() });
        }, 100);
      });
    });
    
    render(<AgentChat agent={mockAgent} />);
    
    // Type and send a message
    const messageInput = screen.getByPlaceholderText(/type a message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(messageInput, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);
    
    // Check for loading indicator
    expect(screen.getByText(/sending/i)).toBeInTheDocument();
    
    // Wait for response
    await waitFor(() => {
      expect(screen.getByText('Response')).toBeInTheDocument();
    });
  });
  
  it('handles errors when sending a message fails', async () => {
    // Mock sendMessageToAgent to reject with an error
    const errorMessage = 'Failed to send message';
    agentService.sendMessageToAgent.mockRejectedValue(new Error(errorMessage));
    
    render(<AgentChat agent={mockAgent} />);
    
    // Type and send a message
    const messageInput = screen.getByPlaceholderText(/type a message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(messageInput, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/error sending message/i)).toBeInTheDocument();
    });
  });
  
  it('handles errors when loading chat history fails', async () => {
    // Mock getAgentChatHistory to reject with an error
    const errorMessage = 'Failed to load chat history';
    agentService.getAgentChatHistory.mockRejectedValue(new Error(errorMessage));
    
    render(<AgentChat agent={mockAgent} />);
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/could not load chat history/i)).toBeInTheDocument();
    });
  });
});