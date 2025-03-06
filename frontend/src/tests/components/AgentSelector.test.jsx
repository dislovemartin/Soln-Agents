import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AgentSelector from '../../components/AgentSelector';
import * as agentService from '../../utils/agents';

// Mock the agent service
jest.mock('../../utils/agents', () => ({
  getAvailableAgents: jest.fn(),
}));

describe('AgentSelector Component', () => {
  const mockAgents = [
    { id: 'agent1', name: 'Test Agent 1', description: 'First test agent' },
    { id: 'agent2', name: 'Test Agent 2', description: 'Second test agent' },
    { id: 'agent3', name: 'Test Agent 3', description: 'Third test agent' },
  ];
  
  beforeEach(() => {
    // Reset the mock implementation before each test
    agentService.getAvailableAgents.mockReset();
  });
  
  it('renders a loading state initially', () => {
    // Mock the getAvailableAgents to return a pending promise
    agentService.getAvailableAgents.mockReturnValue(new Promise(() => {}));
    
    render(<AgentSelector onSelect={jest.fn()} />);
    
    // Check if loading state is displayed
    expect(screen.getByText(/loading agents/i)).toBeInTheDocument();
  });
  
  it('renders the list of agents when loaded', async () => {
    // Mock the getAvailableAgents to return the mock agents
    agentService.getAvailableAgents.mockResolvedValue(mockAgents);
    
    render(<AgentSelector onSelect={jest.fn()} />);
    
    // Wait for the agents to load
    await waitFor(() => {
      // Check if all agents are rendered
      mockAgents.forEach(agent => {
        expect(screen.getByText(agent.name)).toBeInTheDocument();
      });
    });
  });
  
  it('calls onSelect when an agent is selected', async () => {
    // Mock the getAvailableAgents to return the mock agents
    agentService.getAvailableAgents.mockResolvedValue(mockAgents);
    
    const handleSelect = jest.fn();
    render(<AgentSelector onSelect={handleSelect} />);
    
    // Wait for the agents to load
    await waitFor(() => {
      expect(screen.getByText(mockAgents[0].name)).toBeInTheDocument();
    });
    
    // Click on an agent
    fireEvent.click(screen.getByText(mockAgents[0].name));
    
    // Check if onSelect was called with the correct agent
    expect(handleSelect).toHaveBeenCalledWith(mockAgents[0]);
  });
  
  it('filters agents based on search input', async () => {
    // Mock the getAvailableAgents to return the mock agents
    agentService.getAvailableAgents.mockResolvedValue(mockAgents);
    
    render(<AgentSelector onSelect={jest.fn()} />);
    
    // Wait for the agents to load
    await waitFor(() => {
      expect(screen.getByText(mockAgents[0].name)).toBeInTheDocument();
    });
    
    // Type in the search box
    const searchInput = screen.getByPlaceholderText(/search agents/i);
    fireEvent.change(searchInput, { target: { value: 'Test Agent 1' } });
    
    // Check if only the matching agent is displayed
    expect(screen.getByText(mockAgents[0].name)).toBeInTheDocument();
    expect(screen.queryByText(mockAgents[1].name)).not.toBeInTheDocument();
    expect(screen.queryByText(mockAgents[2].name)).not.toBeInTheDocument();
  });
  
  it('displays an error message when loading agents fails', async () => {
    // Mock the getAvailableAgents to return an error
    const errorMessage = 'Failed to load agents';
    agentService.getAvailableAgents.mockRejectedValue(new Error(errorMessage));
    
    render(<AgentSelector onSelect={jest.fn()} />);
    
    // Wait for the error to be displayed
    await waitFor(() => {
      expect(screen.getByText(/failed to load agents/i)).toBeInTheDocument();
    });
  });
  
  it('allows selecting a different agent', async () => {
    // Mock the getAvailableAgents to return the mock agents
    agentService.getAvailableAgents.mockResolvedValue(mockAgents);
    
    const handleSelect = jest.fn();
    render(<AgentSelector onSelect={handleSelect} />);
    
    // Wait for the agents to load
    await waitFor(() => {
      expect(screen.getByText(mockAgents[0].name)).toBeInTheDocument();
    });
    
    // Click on the first agent
    fireEvent.click(screen.getByText(mockAgents[0].name));
    
    // Check if onSelect was called with the first agent
    expect(handleSelect).toHaveBeenCalledWith(mockAgents[0]);
    
    // Click on the second agent
    fireEvent.click(screen.getByText(mockAgents[1].name));
    
    // Check if onSelect was called with the second agent
    expect(handleSelect).toHaveBeenCalledWith(mockAgents[1]);
  });
});