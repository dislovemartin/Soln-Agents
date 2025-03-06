/**
 * Unit tests for the Agent Exchange Service
 */

// Using Jest as the testing framework
// Run with: npm test

// Mock fetch API
global.fetch = jest.fn();

// Import the Agent Exchange Service
const { 
  AgentExchangeService, 
  createAgentExchangeService 
} = require('../services/agent-exchange');

describe('AgentExchangeService', () => {
  let exchangeService;
  let mockApiService;
  
  // Sample data for testing
  const sampleResultItems = [
    {
      id: 'result1',
      title: 'Sample Text Result',
      content: 'This is a sample text result.',
      type: 'text',
      metadata: {
        source: 'test',
        timestamp: '2023-01-01T00:00:00Z'
      }
    },
    {
      id: 'result2',
      title: 'Sample Code Result',
      content: 'function test() { return "Hello World"; }',
      type: 'code',
      metadata: {
        source: 'test',
        language: 'javascript',
        timestamp: '2023-01-01T00:01:00Z'
      }
    },
    {
      id: 'result3',
      title: 'Sample Link Result',
      content: 'https://example.com',
      type: 'link',
      metadata: {
        source: 'test',
        timestamp: '2023-01-01T00:02:00Z'
      }
    }
  ];
  
  const sampleChatMessages = [
    {
      id: 'msg1',
      role: 'user',
      content: 'Hello, this is a test message.',
      timestamp: '2023-01-01T00:00:00Z'
    },
    {
      id: 'msg2',
      role: 'assistant',
      content: 'I am responding to your test message.',
      timestamp: '2023-01-01T00:01:00Z'
    },
    {
      id: 'msg3',
      role: 'user',
      content: 'Thank you for your response.',
      timestamp: '2023-01-01T00:02:00Z'
    }
  ];
  
  const sampleAutoGenMessages = [
    {
      id: 'autogen1',
      session_id: 'session123',
      role: 'user',
      content: 'What can you tell me about quantum computing?',
      timestamp: '2023-01-01T00:00:00Z'
    },
    {
      id: 'autogen2',
      session_id: 'session123',
      role: 'assistant',
      content: 'Quantum computing is a type of computing that uses quantum phenomena such as superposition and entanglement.\n\n```python\n# Example quantum algorithm\ndef quantum_algo():\n    # Initialize qubits\n    return "result"\n```\n\nThis is a simplified explanation.',
      timestamp: '2023-01-01T00:01:00Z'
    }
  ];
  
  // Setup before each test
  beforeEach(() => {
    // Reset fetch mock
    fetch.mockClear();
    
    // Create mock API service
    mockApiService = {
      request: jest.fn()
    };
    
    // Create Agent Exchange Service instance with test configuration
    exchangeService = createAgentExchangeService({
      apiService: mockApiService,
      autogenApiUrl: 'http://test-autogen-api.com/api',
      defaultModel: 'test-model',
      defaultTemperature: 0.5,
      preserveFormatting: true,
      enableStructuredData: true
    });
  });

  // Test service creation
  test('createAgentExchangeService should create a valid service instance', () => {
    expect(exchangeService).toBeInstanceOf(AgentExchangeService);
    expect(exchangeService.autogenApiUrl).toBe('http://test-autogen-api.com/api');
    expect(exchangeService.defaultModel).toBe('test-model');
    expect(exchangeService.defaultTemperature).toBe(0.5);
    expect(exchangeService.preserveFormatting).toBe(true);
    expect(exchangeService.enableStructuredData).toBe(true);
  });

  // Test converting SolnAI results to exchange format
  test('convertSolnResultsToExchange should create valid exchange format', () => {
    const result = exchangeService.convertSolnResultsToExchange(sampleResultItems);
    
    expect(result).toHaveProperty('content');
    expect(result).toHaveProperty('contentType');
    expect(result).toHaveProperty('metadata');
    
    expect(result.contentType).toBe('markdown');
    expect(result.metadata.source).toBe('solnai');
    expect(result.metadata.resultCount).toBe(3);
    expect(result.metadata.contentTypes).toContain('text');
    expect(result.metadata.contentTypes).toContain('code');
    expect(result.metadata.contentTypes).toContain('link');
    
    // Content should contain markdown formatting for code blocks
    expect(result.content).toContain('```javascript');
    expect(result.content).toContain('function test()');
    
    // Content should contain markdown formatting for links
    expect(result.content).toContain('[Sample Link Result](https://example.com)');
  });

  // Test converting SolnAI chat messages to exchange format
  test('convertSolnMessagesToExchange should create valid exchange format', () => {
    const result = exchangeService.convertSolnMessagesToExchange(sampleChatMessages, {
      formatAsMarkdown: true
    });
    
    expect(result).toHaveProperty('content');
    expect(result).toHaveProperty('contentType');
    expect(result).toHaveProperty('metadata');
    
    expect(result.contentType).toBe('markdown');
    expect(result.metadata.source).toBe('solnai-chat');
    expect(result.metadata.messageCount).toBe(3);
    expect(result.metadata.roles).toContain('user');
    expect(result.metadata.roles).toContain('assistant');
    
    // Content should contain role headers
    expect(result.content).toContain('### USER');
    expect(result.content).toContain('### ASSISTANT');
  });

  // Test converting AutoGen messages to SolnAI chat messages
  test('convertAutoGenMessagesToSolnMessages should convert messages correctly', () => {
    const result = exchangeService.convertAutoGenMessagesToSolnMessages(sampleAutoGenMessages);
    
    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty('id', 'autogen1');
    expect(result[0]).toHaveProperty('role', 'user');
    expect(result[0]).toHaveProperty('content', 'What can you tell me about quantum computing?');
    expect(result[0]).toHaveProperty('timestamp', '2023-01-01T00:00:00Z');
    
    expect(result[1]).toHaveProperty('id', 'autogen2');
    expect(result[1]).toHaveProperty('role', 'assistant');
  });

  // Test converting AutoGen messages to SolnAI result items
  test('convertAutoGenMessagesToResultItems should parse content blocks correctly', () => {
    const result = exchangeService.convertAutoGenMessagesToResultItems(sampleAutoGenMessages);
    
    // Should only convert assistant messages to results
    expect(result.length).toBeGreaterThan(0);
    
    // Should identify code blocks and separate them
    const codeBlocks = result.filter(item => item.type === 'code');
    expect(codeBlocks.length).toBeGreaterThan(0);
    expect(codeBlocks[0].content).toContain('def quantum_algo()');
    
    // Should maintain text content
    const textBlocks = result.filter(item => item.type === 'text');
    expect(textBlocks.length).toBeGreaterThan(0);
    expect(textBlocks[0].content).toContain('Quantum computing');
  });

  // Test sending data to AutoGen
  test('sendToAutoGen should make correct API call', async () => {
    // Mock successful fetch response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'msg123' })
    });
    
    const exchangeData = {
      content: 'Test content',
      contentType: 'text',
      metadata: {
        source: 'test',
        timestamp: '2023-01-01T00:00:00Z'
      }
    };
    
    const result = await exchangeService.sendToAutoGen('session123', exchangeData);
    
    // Assert result is successful
    expect(result).toBe(true);
    
    // Assert fetch was called correctly
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'http://test-autogen-api.com/api/sessions/session123/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: expect.stringContaining('Test content')
      })
    );
  });

  // Test error handling for sendToAutoGen
  test('sendToAutoGen should handle errors', async () => {
    // Mock failed fetch response
    fetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Bad Request',
      text: async () => 'Invalid data format'
    });
    
    const exchangeData = {
      content: 'Test content',
      contentType: 'text',
      metadata: {
        source: 'test',
        timestamp: '2023-01-01T00:00:00Z'
      }
    };
    
    const result = await exchangeService.sendToAutoGen('session123', exchangeData);
    
    // Assert result shows failure
    expect(result).toBe(false);
  });

  // Test creating AutoGen agent from SolnAI results
  test('createAutoGenAgentFromResults should make correct API call', async () => {
    // Mock successful fetch response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'agent123' })
    });
    
    const result = await exchangeService.createAutoGenAgentFromResults(
      sampleResultItems,
      'Test Agent',
      'A test agent with sample results'
    );
    
    // Assert result is the agent ID
    expect(result).toBe('agent123');
    
    // Assert fetch was called correctly
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'http://test-autogen-api.com/api/agents',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: expect.stringContaining('Test Agent')
      })
    );
    
    // System message should contain the results
    const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
    expect(requestBody.system_message).toContain('Sample Text Result');
    expect(requestBody.system_message).toContain('Sample Code Result');
    expect(requestBody.system_message).toContain('function test()');
    expect(requestBody.model).toBe('test-model');
    expect(requestBody.temperature).toBe(0.5);
  });

  // Test creating AutoGen session with SolnAI results
  test('createAutoGenSessionWithResults should create session and send data', async () => {
    // Mock session creation response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'session456' })
    });
    
    // Mock send message response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'msg789' })
    });
    
    const result = await exchangeService.createAutoGenSessionWithResults(
      'agent123',
      'Test task',
      sampleResultItems
    );
    
    // Assert result is the session ID
    expect(result).toBe('session456');
    
    // Assert fetch was called twice (create session + send message)
    expect(fetch).toHaveBeenCalledTimes(2);
    
    // Check session creation call
    expect(fetch.mock.calls[0][0]).toBe('http://test-autogen-api.com/api/sessions');
    const sessionRequestBody = JSON.parse(fetch.mock.calls[0][1].body);
    expect(sessionRequestBody.agent_id).toBe('agent123');
    expect(sessionRequestBody.task).toBe('Test task');
    
    // Check send message call
    expect(fetch.mock.calls[1][0]).toBe('http://test-autogen-api.com/api/sessions/session456/messages');
    const messageRequestBody = JSON.parse(fetch.mock.calls[1][1].body);
    expect(messageRequestBody.content).toContain('Sample Text Result');
    expect(messageRequestBody.metadata.task).toBe('Test task');
    expect(messageRequestBody.metadata.agentId).toBe('agent123');
  });

  // Test content block parsing
  test('parseContentBlocks should correctly identify code blocks', () => {
    // This test accesses a private method, so we need to expose it temporarily
    const parseContentBlocks = exchangeService['parseContentBlocks'].bind(exchangeService);
    
    const mixedContent = `
      Here's some regular text.
      
      \`\`\`javascript
      function example() {
        return "Hello, world!";
      }
      \`\`\`
      
      More text after the code block.
    `;
    
    const blocks = parseContentBlocks(mixedContent);
    
    // Should identify three blocks (text, code, text)
    expect(blocks).toHaveLength(3);
    
    // Check the code block
    const codeBlock = blocks.find(block => block.type === 'code');
    expect(codeBlock).toBeDefined();
    expect(codeBlock.language).toBe('javascript');
    expect(codeBlock.content).toContain('function example()');
    
    // Check text blocks
    const textBlocks = blocks.filter(block => block.type === 'text');
    expect(textBlocks).toHaveLength(2);
    expect(textBlocks[0].content).toContain('regular text');
    expect(textBlocks[1].content).toContain('More text after');
  });

  // Test input validation
  test('service methods should validate input parameters', () => {
    // Test convertSolnResultsToExchange validation
    expect(() => {
      exchangeService.convertSolnResultsToExchange(null);
    }).toThrow('Invalid results');
    
    expect(() => {
      exchangeService.convertSolnResultsToExchange([]);
    }).toThrow('expected non-empty array');
    
    // Test convertSolnMessagesToExchange validation
    expect(() => {
      exchangeService.convertSolnMessagesToExchange(null);
    }).toThrow('Invalid messages');
    
    expect(() => {
      exchangeService.convertSolnMessagesToExchange([]);
    }).toThrow('expected non-empty array');
  });
});