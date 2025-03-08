const express = require('express');
const router = express.Router();
const { validatedRequest } = require('../../utils/middleware');
const { AgentExecutionHistory } = require('../../models/agentExecutionHistory');
const logger = require('../../utils/logger')();

/**
 * Agent Analytics API
 * 
 * This endpoint provides analytics and history for agent executions,
 * including both SolnAI agents and AutoGen Studio agents.
 */

// Get execution history with optional filters
router.get('/history', [validatedRequest], async (req, res) => {
  try {
    const { 
      agentId, 
      agentType, 
      workspaceId, 
      userId, 
      status, 
      startDate, 
      endDate, 
      limit = 100 
    } = req.query;
    
    let executions;
    
    if (agentId) {
      executions = await AgentExecutionHistory.findByAgentId(agentId, parseInt(limit));
    } else if (workspaceId) {
      executions = await AgentExecutionHistory.findByWorkspaceId(workspaceId, parseInt(limit));
    } else if (userId) {
      executions = await AgentExecutionHistory.findByUserId(userId, parseInt(limit));
    } else {
      // Apply filters
      const filters = {};
      if (agentType) filters.agentType = agentType;
      if (status) filters.status = status;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      
      // Get time series data with filters
      executions = await AgentExecutionHistory.getTimeSeriesData(filters);
    }
    
    res.status(200).json(executions);
  } catch (error) {
    logger.error('[Agent Analytics] Error getting execution history:', error);
    res.status(500).json({ error: 'Failed to get execution history' });
  }
});

// Get agent execution statistics
router.get('/stats', [validatedRequest], async (req, res) => {
  try {
    const { 
      agentId, 
      agentType, 
      workspaceId, 
      userId, 
      status, 
      startDate, 
      endDate 
    } = req.query;
    
    // Apply filters
    const filters = {};
    if (agentId) filters.agentId = agentId;
    if (agentType) filters.agentType = agentType;
    if (workspaceId) filters.workspaceId = workspaceId;
    if (userId) filters.userId = userId;
    if (status) filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    
    const stats = await AgentExecutionHistory.getAgentStats(filters);
    
    res.status(200).json(stats);
  } catch (error) {
    logger.error('[Agent Analytics] Error getting agent statistics:', error);
    res.status(500).json({ error: 'Failed to get agent statistics' });
  }
});

// Get time series data for agent executions
router.get('/time-series', [validatedRequest], async (req, res) => {
  try {
    const { 
      agentId, 
      agentType, 
      workspaceId, 
      userId, 
      startDate, 
      endDate, 
      interval = 'day' 
    } = req.query;
    
    // Apply filters
    const filters = {};
    if (agentId) filters.agentId = agentId;
    if (agentType) filters.agentType = agentType;
    if (workspaceId) filters.workspaceId = workspaceId;
    if (userId) filters.userId = userId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    
    const timeSeriesData = await AgentExecutionHistory.getTimeSeriesData(filters, interval);
    
    res.status(200).json(timeSeriesData);
  } catch (error) {
    logger.error('[Agent Analytics] Error getting time series data:', error);
    res.status(500).json({ error: 'Failed to get time series data' });
  }
});

// Create a new execution history record
router.post('/record', [validatedRequest], async (req, res) => {
  try {
    const {
      agentId,
      agentType,
      agentName,
      workspaceId,
      userId,
      executionTime,
      prompt,
      result,
      status,
      error,
      metadata
    } = req.body;
    
    // Validate required fields
    if (!agentId || !agentType || !agentName) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['agentId', 'agentType', 'agentName'],
        received: Object.keys(req.body)
      });
    }
    
    // Status validation
    const validStatuses = ['success', 'error', 'timeout', 'in_progress'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status value: ${status}`,
        validOptions: validStatuses
      });
    }
    
    // Process metadata to ensure it's stored as a string
    let processedMetadata = metadata;
    if (metadata && typeof metadata === 'object') {
      try {
        processedMetadata = JSON.stringify(metadata);
      } catch (err) {
        logger.warn('[Agent Analytics] Error stringifying metadata:', err);
        processedMetadata = JSON.stringify({ error: 'Failed to process metadata' });
      }
    }
    
    // Create the record
    const executionRecord = await AgentExecutionHistory.create({
      agentId,
      agentType,
      agentName,
      workspaceId: workspaceId || null,
      userId: userId || null,
      executionTime: executionTime || null,
      prompt: prompt || null,
      result: result || null,
      status: status || 'success', // Default to success if not provided
      error: error || null,
      metadata: processedMetadata
    });
    
    logger.info(`[Agent Analytics] Recorded execution for agent: ${agentName} (${agentId}), status: ${status || 'success'}`);
    res.status(201).json(executionRecord);
  } catch (error) {
    logger.error('[Agent Analytics] Error creating execution record:', error);
    res.status(500).json({ 
      error: 'Failed to create execution record',
      message: error.message
    });
  }
});

// Delete execution history record
router.delete('/:id', [validatedRequest], async (req, res) => {
  try {
    const { id } = req.params;
    
    await AgentExecutionHistory.deleteById(id);
    
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('[Agent Analytics] Error deleting execution record:', error);
    res.status(500).json({ error: 'Failed to delete execution record' });
  }
});

// Delete old execution history records
router.delete('/cleanup/:days', [validatedRequest], async (req, res) => {
  try {
    const { days } = req.params;
    
    const result = await AgentExecutionHistory.deleteOlderThan(parseInt(days));
    
    res.status(200).json({ 
      success: true, 
      deletedCount: result.count
    });
  } catch (error) {
    logger.error('[Agent Analytics] Error cleaning up execution records:', error);
    res.status(500).json({ error: 'Failed to clean up execution records' });
  }
});

module.exports = router;