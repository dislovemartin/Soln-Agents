import React, { useState, useEffect } from 'react';
import { Agent } from '../../models/agent';
import { CrewAI } from '../../models/crewai';
import { 
  PlusCircleIcon, 
  ArrowPathIcon, 
  TrashIcon, 
  PlayIcon
} from '@heroicons/react/24/outline';

export const CrewWorkflowBuilder = () => {
  const [agents, setAgents] = useState([]);
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [workflowName, setWorkflowName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [executionMode, setExecutionMode] = useState("sequential");
  
  // Load available agents
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await Agent.getAll();
        if (response.agents) {
          setAgents(response.agents);
        }
      } catch (err) {
        console.error("Failed to load agents:", err);
        setError("Failed to load agents. Please check your connection.");
      }
    };
    
    fetchAgents();
  }, []);
  
  const handleAddTask = () => {
    const newTask = {
      id: tasks.length + 1,
      description: "",
      expected_output: "",
      agent_index: 0,
      dependencies: []
    };
    setTasks([...tasks, newTask]);
  };
  
  const handleTaskChange = (index, field, value) => {
    const updatedTasks = [...tasks];
    updatedTasks[index][field] = value;
    setTasks(updatedTasks);
  };
  
  const handleRemoveTask = (index) => {
    const updatedTasks = tasks.filter((_, i) => i !== index);
    
    // Update indices in any dependencies
    const remappedTasks = updatedTasks.map(task => {
      const newDeps = task.dependencies
        .filter(dep => dep !== index + 1) // Remove the deleted task from dependencies
        .map(dep => dep > index + 1 ? dep - 1 : dep); // Adjust indices for tasks after the deleted one
      
      return { ...task, dependencies: newDeps };
    });
    
    setTasks(remappedTasks);
  };
  
  const handleToggleAgent = (agent) => {
    if (selectedAgents.find(a => a.id === agent.id)) {
      setSelectedAgents(selectedAgents.filter(a => a.id !== agent.id));
    } else {
      setSelectedAgents([...selectedAgents, agent]);
    }
  };
  
  const executeWorkflow = async () => {
    if (!workflowName) {
      setError("Please provide a workflow name.");
      return;
    }
    
    if (selectedAgents.length === 0) {
      setError("Please select at least one agent.");
      return;
    }
    
    if (tasks.length === 0) {
      setError("Please add at least one task.");
      return;
    }
    
    // Validate tasks have required fields
    const invalidTasks = tasks.filter(
      task => !task.description || !task.expected_output
    );
    
    if (invalidTasks.length > 0) {
      setError(`Tasks ${invalidTasks.map(t => t.id).join(", ")} are missing required fields.`);
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const workflowData = {
        name: workflowName,
        agents: selectedAgents.map(agent => agent.id),
        tasks: tasks.map(task => ({
          ...task,
          agent_index: Math.min(task.agent_index, selectedAgents.length - 1) // Ensure valid agent index
        })),
        execution_mode: executionMode
      };
      
      const result = await CrewAI.executeWorkflow(workflowData);
      setResult(result);
    } catch (err) {
      console.error("Workflow execution failed:", err);
      setError("Workflow execution failed. Please check the console for details.");
    } finally {
      setLoading(false);
    }
  };
  
  const resetWorkflow = () => {
    setWorkflowName("");
    setSelectedAgents([]);
    setTasks([]);
    setResult(null);
    setError(null);
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">CrewAI Workflow Builder</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Configuration */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-3">Workflow Settings</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Workflow Name
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="My Workflow"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Execution Mode
              </label>
              <select
                className="w-full p-2 border rounded"
                value={executionMode}
                onChange={(e) => setExecutionMode(e.target.value)}
              >
                <option value="sequential">Sequential</option>
                <option value="parallel">Parallel</option>
              </select>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-3">Available Agents</h2>
            {agents.length === 0 ? (
              <p className="text-gray-500">No agents available. Please create some agents first.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {agents.map((agent) => (
                  <div 
                    key={agent.id}
                    className={`p-2 border rounded cursor-pointer flex items-center ${
                      selectedAgents.find(a => a.id === agent.id) 
                        ? 'bg-blue-50 border-blue-300' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleToggleAgent(agent)}
                  >
                    <input
                      type="checkbox"
                      checked={!!selectedAgents.find(a => a.id === agent.id)}
                      onChange={() => {}} // Handled by the parent div click
                      className="mr-2"
                    />
                    <div>
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {agent.description || "No description"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Center column: Tasks */}
        <div className="md:col-span-1">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Tasks</h2>
              <button
                onClick={handleAddTask}
                className="text-blue-600 hover:text-blue-800 flex items-center"
                disabled={selectedAgents.length === 0}
              >
                <PlusCircleIcon className="w-5 h-5 mr-1" />
                Add Task
              </button>
            </div>
            
            {selectedAgents.length === 0 ? (
              <p className="text-gray-500">Select at least one agent to create tasks.</p>
            ) : tasks.length === 0 ? (
              <p className="text-gray-500">No tasks defined. Click "Add Task" to create one.</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {tasks.map((task, index) => (
                  <div key={index} className="border rounded p-3 bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Task {task.id}</h3>
                      <button
                        onClick={() => handleRemoveTask(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="mb-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        className="w-full p-2 border rounded text-sm"
                        rows="2"
                        value={task.description}
                        onChange={(e) => handleTaskChange(index, "description", e.target.value)}
                        placeholder="Describe the task in detail"
                      />
                    </div>
                    
                    <div className="mb-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Expected Output
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded text-sm"
                        value={task.expected_output}
                        onChange={(e) => handleTaskChange(index, "expected_output", e.target.value)}
                        placeholder="Describe what the task should produce"
                      />
                    </div>
                    
                    <div className="mb-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Agent
                      </label>
                      <select
                        className="w-full p-2 border rounded text-sm"
                        value={task.agent_index}
                        onChange={(e) => handleTaskChange(index, "agent_index", parseInt(e.target.value))}
                      >
                        {selectedAgents.map((agent, idx) => (
                          <option key={agent.id} value={idx}>
                            {agent.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Dependencies
                      </label>
                      <div className="flex flex-wrap gap-1">
                        {tasks
                          .filter((_, i) => i !== index) // Can't depend on itself
                          .map((otherTask) => (
                            <label key={otherTask.id} className="flex items-center text-xs">
                              <input
                                type="checkbox"
                                className="mr-1"
                                checked={task.dependencies.includes(otherTask.id)}
                                onChange={(e) => {
                                  const newDeps = e.target.checked
                                    ? [...task.dependencies, otherTask.id]
                                    : task.dependencies.filter(id => id !== otherTask.id);
                                  handleTaskChange(index, "dependencies", newDeps);
                                }}
                              />
                              Task {otherTask.id}
                            </label>
                          ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Right column: Actions and Results */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-3">Actions</h2>
            <div className="flex gap-2">
              <button
                onClick={executeWorkflow}
                disabled={loading || selectedAgents.length === 0 || tasks.length === 0}
                className={`flex items-center px-4 py-2 rounded ${
                  loading || selectedAgents.length === 0 || tasks.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 mr-1 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <PlayIcon className="w-5 h-5 mr-1" />
                    Execute
                  </>
                )}
              </button>
              
              <button
                onClick={resetWorkflow}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Reset
              </button>
            </div>
          </div>
          
          {result && (
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-3">Result</h2>
              <div className="bg-gray-50 p-3 rounded border">
                <div className="mb-2">
                  <span className="font-medium">Execution Time:</span>{" "}
                  {result.execution_time.toFixed(2)} seconds
                </div>
                
                <div className="mb-3">
                  <h3 className="font-medium mb-1">Output:</h3>
                  <pre className="whitespace-pre-wrap text-sm bg-white p-2 rounded border">
                    {typeof result.result === 'object' 
                      ? JSON.stringify(result.result, null, 2)
                      : result.result}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};