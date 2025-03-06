/**
 * Tests for the Archon adapter
 */

const { expect } = require('chai');
const sinon = require('sinon');
const fetch = require('node-fetch');
const { Response } = jest.requireActual('node-fetch');
const { ArchonAdapter } = require('../../../utils/agents/archon-adapter');

// Mock environment variables
process.env.ARCHON_API_URL = 'http://localhost:8002';
process.env.ARCHON_API_KEY = 'test-api-key';

describe('ArchonAdapter', () => {
  let adapter;
  let fetchStub;
  
  beforeEach(() => {
    // Create a new adapter instance
    adapter = new ArchonAdapter();
    
    // Stub the fetch function
    fetchStub = sinon.stub(global, 'fetch');
  });
  
  afterEach(() => {
    // Restore the original fetch function
    fetchStub.restore();
  });
  
  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(adapter.baseUrl).to.equal('http://localhost:8002');
      expect(adapter.apiKey).to.equal('test-api-key');
    });
    
    it('should use custom values when provided', () => {
      const customAdapter = new ArchonAdapter({
        baseUrl: 'http://custom-url',
        apiKey: 'custom-api-key'
      });
      
      expect(customAdapter.baseUrl).to.equal('http://custom-url');
      expect(customAdapter.apiKey).to.equal('custom-api-key');
    });
  });
  
  describe('executeAgent', () => {
    it('should execute an agent successfully', async () => {
      // Mock successful response
      const mockResponse = {
        success: true,
        output: 'Agent executed successfully',
        data: { action: 'completed' }
      };
      
      fetchStub.resolves(new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
      
      const result = await adapter.executeAgent({
        agentName: 'test-agent',
        taskDescription: 'Test task',
        parameters: { key: 'value' }
      });
      
      expect(result.success).to.be.true;
      expect(result.output).to.equal('Agent executed successfully');
      expect(result.data).to.deep.equal({ action: 'completed' });
      
      // Verify fetch was called with the right arguments
      expect(fetchStub.calledOnce).to.be.true;
      const [url, options] = fetchStub.firstCall.args;
      expect(url).to.include('/agents/execute');
      expect(options.method).to.equal('POST');
      expect(options.headers['X-API-Key']).to.equal('test-api-key');
      
      const body = JSON.parse(options.body);
      expect(body.agentName).to.equal('test-agent');
      expect(body.taskDescription).to.equal('Test task');
      expect(body.parameters).to.deep.equal({ key: 'value' });
    });
    
    it('should handle errors gracefully', async () => {
      // Mock error response
      fetchStub.rejects(new Error('Network error'));
      
      try {
        await adapter.executeAgent({
          agentName: 'test-agent',
          taskDescription: 'Test task',
          parameters: { key: 'value' }
        });
        
        // If we reach here, the test has failed
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to execute agent');
      }
    });
  });
  
  describe('getAvailableAgents', () => {
    it('should retrieve available agents successfully', async () => {
      // Mock successful response
      const mockResponse = {
        agents: [
          { name: 'agent1', description: 'First agent' },
          { name: 'agent2', description: 'Second agent' }
        ]
      };
      
      fetchStub.resolves(new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
      
      const result = await adapter.getAvailableAgents();
      
      expect(result).to.deep.equal(mockResponse.agents);
      
      // Verify fetch was called with the right arguments
      expect(fetchStub.calledOnce).to.be.true;
      const [url, options] = fetchStub.firstCall.args;
      expect(url).to.include('/agents');
      expect(options.headers['X-API-Key']).to.equal('test-api-key');
    });
    
    it('should handle errors gracefully', async () => {
      // Mock error response
      fetchStub.rejects(new Error('Network error'));
      
      try {
        await adapter.getAvailableAgents();
        
        // If we reach here, the test has failed
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to get available agents');
      }
    });
  });
  
  describe('getTaskStatus', () => {
    it('should retrieve task status successfully', async () => {
      // Mock successful response
      const mockResponse = {
        status: 'completed',
        result: 'Task completed successfully',
        details: { timestamp: '2025-03-06T18:30:00Z' }
      };
      
      fetchStub.resolves(new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
      
      const result = await adapter.getTaskStatus('task-123');
      
      expect(result).to.deep.equal(mockResponse);
      
      // Verify fetch was called with the right arguments
      expect(fetchStub.calledOnce).to.be.true;
      const [url, options] = fetchStub.firstCall.args;
      expect(url).to.include('/tasks/task-123');
      expect(options.headers['X-API-Key']).to.equal('test-api-key');
    });
    
    it('should handle errors gracefully', async () => {
      // Mock error response
      fetchStub.rejects(new Error('Network error'));
      
      try {
        await adapter.getTaskStatus('task-123');
        
        // If we reach here, the test has failed
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to get task status');
      }
    });
  });
});