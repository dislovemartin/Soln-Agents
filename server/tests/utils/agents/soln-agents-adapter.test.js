/**
 * Tests for the SolnAI Agents adapter
 */

import { expect } from 'chai';
import sinon from 'sinon';
import fetch from 'node-fetch';
import { SolnAgentsAdapter } from '../../../utils/agents/soln-agents-adapter.js';

// Mock environment variables
process.env.AGENT_API_URL = 'http://localhost:8001';

describe('SolnAgentsAdapter', () => {
  let adapter;
  let fetchStub;
  
  beforeEach(() => {
    // Create a new adapter instance
    adapter = new SolnAgentsAdapter();
    
    // Stub the fetch function
    fetchStub = sinon.stub(global, 'fetch');
  });
  
  afterEach(() => {
    // Restore the original fetch function
    fetchStub.restore();
  });
  
  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(adapter.baseUrl).to.equal('http://localhost:8001');
      expect(adapter.timeout).to.equal(60000);
    });
    
    it('should use custom values when provided', () => {
      const customAdapter = new SolnAgentsAdapter({
        baseUrl: 'http://custom-url',
        timeout: 30000
      });
      
      expect(customAdapter.baseUrl).to.equal('http://custom-url');
      expect(customAdapter.timeout).to.equal(30000);
    });
  });
  
  describe('processMessage', () => {
    it('should process a message successfully', async () => {
      // Mock successful response
      const mockResponse = {
        success: true,
        output: 'Processed message',
        data: { some: 'data' }
      };
      
      fetchStub.resolves({
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => mockResponse
      });
      
      const result = await adapter.processMessage({
        message: 'Test message',
        agentId: 'test-agent',
        options: {}
      });
      
      expect(result.success).to.be.true;
      expect(result.output).to.equal('Processed message');
      expect(result.data).to.deep.equal({ some: 'data' });
      
      // Verify fetch was called with the right arguments
      expect(fetchStub.calledOnce).to.be.true;
      const [url, options] = fetchStub.firstCall.args;
      expect(url).to.include('/process');
      expect(options.method).to.equal('POST');
      expect(JSON.parse(options.body)).to.have.property('query', 'Test message');
    });
    
    it('should handle errors gracefully', async () => {
      // Mock error response
      fetchStub.rejects(new Error('Network error'));
      
      try {
        await adapter.processMessage({
          message: 'Test message',
          agentId: 'test-agent',
          options: {}
        });
        
        // If we reach here, the test has failed
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to process message');
      }
    });
  });
  
  describe('getAgentInfo', () => {
    it('should retrieve agent information successfully', async () => {
      // Mock successful response
      const mockResponse = {
        name: 'Test Agent',
        description: 'A test agent',
        version: '1.0.0',
        status: 'running'
      };
      
      fetchStub.resolves({
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => mockResponse
      });
      
      const result = await adapter.getAgentInfo('test-agent');
      
      expect(result).to.deep.equal(mockResponse);
      
      // Verify fetch was called with the right arguments
      expect(fetchStub.calledOnce).to.be.true;
      const [url] = fetchStub.firstCall.args;
      expect(url).to.include('test-agent');
    });
    
    it('should handle errors gracefully', async () => {
      // Mock error response
      fetchStub.rejects(new Error('Network error'));
      
      try {
        await adapter.getAgentInfo('test-agent');
        
        // If we reach here, the test has failed
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to get agent info');
      }
    });
  });
});