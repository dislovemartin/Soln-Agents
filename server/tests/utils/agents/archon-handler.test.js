/**
 * Tests for the Archon handler
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { ArchonHandler } = require('../../../utils/agents/archon-handler');
const { ArchonAdapter } = require('../../../utils/agents/archon-adapter');

describe('ArchonHandler', () => {
  let handler;
  let adapterStub;
  
  beforeEach(() => {
    // Create stubs for the adapter methods
    adapterStub = {
      executeAgent: sinon.stub(),
      getAvailableAgents: sinon.stub(),
      getTaskStatus: sinon.stub()
    };
    
    // Stub the ArchonAdapter constructor
    sinon.stub(ArchonAdapter.prototype, 'constructor').returns(adapterStub);
    
    // Create a new handler instance
    handler = new ArchonHandler();
    
    // Replace the adapter with our stub
    handler.adapter = adapterStub;
  });
  
  afterEach(() => {
    // Restore the constructor stub
    ArchonAdapter.prototype.constructor.restore();
  });
  
  describe('executeAgentTask', () => {
    it('should execute an agent task successfully', async () => {
      // Mock successful response
      const mockResponse = {
        success: true,
        taskId: 'task-123',
        output: 'Task submitted successfully'
      };
      
      adapterStub.executeAgent.resolves(mockResponse);
      
      const result = await handler.executeAgentTask({
        agentName: 'test-agent',
        taskDescription: 'Test task',
        parameters: { key: 'value' }
      });
      
      expect(result).to.deep.equal(mockResponse);
      
      // Verify adapter method was called with the right arguments
      expect(adapterStub.executeAgent.calledOnce).to.be.true;
      const args = adapterStub.executeAgent.firstCall.args[0];
      expect(args.agentName).to.equal('test-agent');
      expect(args.taskDescription).to.equal('Test task');
      expect(args.parameters).to.deep.equal({ key: 'value' });
    });
    
    it('should handle errors gracefully', async () => {
      // Mock error response
      adapterStub.executeAgent.rejects(new Error('Execution failed'));
      
      try {
        await handler.executeAgentTask({
          agentName: 'test-agent',
          taskDescription: 'Test task',
          parameters: { key: 'value' }
        });
        
        // If we reach here, the test has failed
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Execution failed');
      }
    });
  });
  
  describe('listAgents', () => {
    it('should list available agents successfully', async () => {
      // Mock successful response
      const mockAgents = [
        { name: 'agent1', description: 'First agent' },
        { name: 'agent2', description: 'Second agent' }
      ];
      
      adapterStub.getAvailableAgents.resolves(mockAgents);
      
      const result = await handler.listAgents();
      
      expect(result).to.deep.equal(mockAgents);
      expect(adapterStub.getAvailableAgents.calledOnce).to.be.true;
    });
    
    it('should handle errors gracefully', async () => {
      // Mock error response
      adapterStub.getAvailableAgents.rejects(new Error('Failed to list agents'));
      
      try {
        await handler.listAgents();
        
        // If we reach here, the test has failed
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to list agents');
      }
    });
  });
  
  describe('getTaskResult', () => {
    it('should get task result successfully', async () => {
      // Mock successful response
      const mockResult = {
        status: 'completed',
        result: 'Task completed successfully',
        details: { timestamp: '2025-03-06T18:30:00Z' }
      };
      
      adapterStub.getTaskStatus.resolves(mockResult);
      
      const result = await handler.getTaskResult('task-123');
      
      expect(result).to.deep.equal(mockResult);
      expect(adapterStub.getTaskStatus.calledOnce).to.be.true;
      expect(adapterStub.getTaskStatus.firstCall.args[0]).to.equal('task-123');
    });
    
    it('should handle errors gracefully', async () => {
      // Mock error response
      adapterStub.getTaskStatus.rejects(new Error('Failed to get task result'));
      
      try {
        await handler.getTaskResult('task-123');
        
        // If we reach here, the test has failed
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to get task result');
      }
    });
  });
  
  describe('validateAgentRequest', () => {
    it('should validate a valid request', () => {
      const validRequest = {
        agentName: 'test-agent',
        taskDescription: 'Test task',
        parameters: { key: 'value' }
      };
      
      const result = handler.validateAgentRequest(validRequest);
      
      expect(result.valid).to.be.true;
      expect(result.errors).to.be.empty;
    });
    
    it('should reject a request with missing required fields', () => {
      const invalidRequest = {
        // Missing agentName
        taskDescription: 'Test task',
        parameters: { key: 'value' }
      };
      
      const result = handler.validateAgentRequest(invalidRequest);
      
      expect(result.valid).to.be.false;
      expect(result.errors).to.include('agentName is required');
    });
    
    it('should reject a request with invalid field types', () => {
      const invalidRequest = {
        agentName: 123, // Should be a string
        taskDescription: 'Test task',
        parameters: { key: 'value' }
      };
      
      const result = handler.validateAgentRequest(invalidRequest);
      
      expect(result.valid).to.be.false;
      expect(result.errors).to.include('agentName must be a string');
    });
  });
});