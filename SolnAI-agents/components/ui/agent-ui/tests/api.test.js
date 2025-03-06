/**
 * Unit tests for the API service for AutoGen Studio integration
 */

// Using Jest as the testing framework
// Run with: npm test

// Mock fetch API
global.fetch = jest.fn();

// Import the API service
const { ApiService } = require('../services/api');

describe('ApiService - AutoGen Studio Integration', () => {
  let apiService;
  
  // Setup before each test
  beforeEach(() => {
    // Reset fetch mock
    fetch.mockClear();
    
    // Create API service instance with test configuration
    apiService = new ApiService({
      baseUrl: 'http://localhost:3001',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 1000,
    });
  });

  // Test fetching AutoGen agents
  test('getAutoGenAgents should return a list of agents', async () => {
    // Mock response data
    const mockAgents = [
      { id: 'agent1', name: 'Test Agent 1', description: 'A test agent' },
      { id: 'agent2', name: 'Test Agent 2', description: 'Another test agent' }
    ];
    
    // Mock fetch response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockAgents, status: 200 }),
      status: 200
    });
    
    // Call the method
    const agents = await apiService.getAutoGenAgents();
    
    // Assertions
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/autogenstudio/agents',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    );
    expect(agents).toEqual(mockAgents);
  });

  // Test fetching a specific AutoGen agent
  test('getAutoGenAgent should return a specific agent', async () => {
    // Mock response data
    const mockAgent = { 
      id: 'agent1', 
      name: 'Test Agent 1', 
      description: 'A test agent',
      skills: ['skill1', 'skill2']
    };
    
    // Mock fetch response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockAgent, status: 200 }),
      status: 200
    });
    
    // Call the method
    const agent = await apiService.getAutoGenAgent('agent1');
    
    // Assertions
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/autogenstudio/agents/agent1',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    );
    expect(agent).toEqual(mockAgent);
  });

  // Test creating a session
  test('createAutoGenSession should create a new session', async () => {
    // Mock response data
    const mockSession = { 
      id: 'session1', 
      agent_id: 'agent1',
      task: 'Test task',
      status: 'active',
      created_at: '2023-01-01T00:00:00Z'
    };
    
    // Mock fetch response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockSession, status: 200 }),
      status: 200
    });
    
    // Call the method
    const session = await apiService.createAutoGenSession('agent1', 'Test task');
    
    // Assertions
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/autogenstudio/sessions',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          agent_id: 'agent1',
          task: 'Test task'
        }),
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    );
    expect(session).toEqual(mockSession);
  });

  // Test sending a message
  test('sendAutoGenMessage should send a message and return response', async () => {
    // Mock response data
    const mockMessage = { 
      id: 'msg1',
      session_id: 'session1',
      role: 'assistant',
      content: 'Hello, I am an assistant',
      timestamp: '2023-01-01T00:00:10Z'
    };
    
    // Mock fetch response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockMessage, status: 200 }),
      status: 200
    });
    
    // Call the method
    const message = await apiService.sendAutoGenMessage('session1', 'Hello');
    
    // Assertions
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/autogenstudio/sessions/session1/messages',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          content: 'Hello'
        }),
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    );
    expect(message).toEqual(mockMessage);
  });

  // Test fetching messages
  test('getAutoGenMessages should return messages for a session', async () => {
    // Mock response data
    const mockMessages = [
      { 
        id: 'msg1', 
        session_id: 'session1',
        role: 'user',
        content: 'Hello',
        timestamp: '2023-01-01T00:00:00Z'
      },
      { 
        id: 'msg2', 
        session_id: 'session1',
        role: 'assistant',
        content: 'How can I help you?',
        timestamp: '2023-01-01T00:00:10Z'
      }
    ];
    
    // Mock fetch response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockMessages, status: 200 }),
      status: 200
    });
    
    // Call the method
    const messages = await apiService.getAutoGenMessages('session1');
    
    // Assertions
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/autogenstudio/sessions/session1/messages',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    );
    expect(messages).toEqual(mockMessages);
  });

  // Test fetching skills
  test('getAutoGenSkills should return available skills', async () => {
    // Mock response data
    const mockSkills = [
      { 
        id: 'skill1', 
        name: 'Test Skill 1',
        description: 'A test skill',
        parameters: { param1: 'value1' }
      },
      { 
        id: 'skill2', 
        name: 'Test Skill 2',
        description: 'Another test skill',
        parameters: { param2: 'value2' }
      }
    ];
    
    // Mock fetch response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockSkills, status: 200 }),
      status: 200
    });
    
    // Call the method
    const skills = await apiService.getAutoGenSkills();
    
    // Assertions
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/autogenstudio/skills',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    );
    expect(skills).toEqual(mockSkills);
  });

  // Test adding a skill to an agent
  test('addSkillToAgent should add a skill to an agent', async () => {
    // Mock fetch response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 200 }),
      status: 200
    });
    
    // Call the method
    const result = await apiService.addSkillToAgent('agent1', 'skill1');
    
    // Assertions
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/autogenstudio/agents/agent1/skills',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          skill_id: 'skill1'
        }),
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    );
    expect(result).toBe(true);
  });

  // Test error handling
  test('API service should handle errors gracefully', async () => {
    // Mock fetch response with error
    fetch.mockRejectedValueOnce(new Error('Network error'));
    
    // Call the method
    const result = await apiService.getAutoGenAgents();
    
    // Assertions
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result).toEqual([]); // Should return empty array on error
  });

  // Test timeout handling
  test('API service should handle timeouts', async () => {
    // Create an abort error to simulate timeout
    const abortError = new Error('Request timeout');
    abortError.name = 'AbortError';
    
    // Mock fetch to throw abort error
    fetch.mockRejectedValueOnce(abortError);
    
    // Call the method
    const result = await apiService.getAutoGenAgents();
    
    // Assertions
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result).toEqual([]); // Should return empty array on timeout
  });
});