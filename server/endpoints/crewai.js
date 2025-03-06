const express = require("express");
const router = express.Router();
const { validatedRequest, flexUserRoleValid } = require("../utils/middleware");
const { CrewAIServiceIntegration } = require("../../crewai-service/crewai_service_integration");
const { AgentInterface } = require("../models/agentInterface");
const { AgentExecutionHistory } = require("../models/agentExecutionHistory");

// Initialize CrewAI service client
const crewaiService = new CrewAIServiceIntegration({
  execution_mode: "sequential",
  service_url: process.env.CREWAI_SERVICE_URL || "http://localhost:8001",
  enable_performance_monitoring: true
});

// Execute a crew workflow using stored agents
router.post("/v1/execute", [validatedRequest, flexUserRoleValid], async (req, res) => {
  try {
    const { name, agents: agentIds, tasks, execution_mode = "sequential" } = req.body;
    
    if (!name || !agentIds || !tasks || agentIds.length === 0 || tasks.length === 0) {
      return res.status(400).json({ 
        error: "Missing required parameters. Please provide name, agents, and tasks." 
      });
    }

    // Fetch agent configurations from database
    const agentObjs = [];
    for (const agentId of agentIds) {
      const agent = await AgentInterface.get(agentId);
      if (!agent) {
        return res.status(404).json({ error: `Agent with ID ${agentId} not found.` });
      }
      agentObjs.push(agent);
    }
    
    // Convert agent objects to CrewAI format
    const crewAgents = agentObjs.map(agent => {
      const config = typeof agent.configuration === 'string' 
        ? JSON.parse(agent.configuration) 
        : agent.configuration;
      
      return crewaiService.create_agent(
        name: agent.name,
        role: config.role || "Assistant",
        goal: config.goal || `To help with tasks related to ${agent.name}`,
        backstory: config.backstory || `Expert in ${agent.name} tasks`,
        llm_config: config.llm_config || null
      );
    });
    
    // Set up tasks
    const crewTasks = tasks.map((task, idx) => {
      return crewaiService.create_task(
        id: idx + 1,
        description: task.description,
        expected_output: task.expected_output || "Comprehensive response",
        agent_name: agentObjs[task.agent_index]?.name || agentObjs[0].name,
        priority: task.priority || 5,
        dependencies: task.dependencies || []
      );
    });
    
    // Execute workflow and track performance
    const startTime = Date.now();
    const result = await crewaiService.execute_crew(
      crew_name: name,
      agents: crewAgents,
      tasks: crewTasks,
      llm_config: req.body.llm_config || null
    );
    const executionTime = (Date.now() - startTime) / 1000; // Convert to seconds
    
    // Log execution in history
    await AgentExecutionHistory.create({
      agent_id: `crew_${name.toLowerCase().replace(/\s+/g, '_')}`,
      agent_type: "crewai",
      agent_name: name,
      workspace_id: req.body.workspace_id || null,
      user_id: req.user.id,
      execution_time: executionTime,
      prompt: JSON.stringify(tasks.map(t => t.description)),
      result: result.success ? JSON.stringify(result.result) : null,
      status: result.success ? "success" : "error",
      error: result.error || null,
      metadata: JSON.stringify({
        agent_count: agentObjs.length,
        task_count: tasks.length,
        execution_mode: execution_mode,
        token_usage: result.result?.token_usage || null
      })
    });
    
    return res.status(200).json({
      success: result.success,
      result: result.result,
      execution_time: executionTime,
      agents: agentObjs.map(a => ({ id: a.id, name: a.name }))
    });
    
  } catch (error) {
    console.error("Error executing CrewAI workflow:", error);
    return res.status(500).json({ 
      error: "Failed to execute CrewAI workflow",
      details: error.message 
    });
  }
});

// Get agent execution history with filtering options
router.get("/v1/history", [validatedRequest, flexUserRoleValid], async (req, res) => {
  try {
    const { agent_id, agent_type, status, limit = 20, offset = 0 } = req.query;
    
    const filters = {};
    if (agent_id) filters.agent_id = agent_id;
    if (agent_type) filters.agent_type = agent_type;
    if (status) filters.status = status;
    
    // Always filter by user if not admin
    if (req.user.role !== 'admin') {
      filters.user_id = req.user.id;
    }
    
    const history = await AgentExecutionHistory.getAll(filters, limit, offset);
    const total = await AgentExecutionHistory.count(filters);
    
    return res.status(200).json({
      history,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
    
  } catch (error) {
    console.error("Error fetching agent execution history:", error);
    return res.status(500).json({ error: "Failed to fetch execution history" });
  }
});

module.exports = router;