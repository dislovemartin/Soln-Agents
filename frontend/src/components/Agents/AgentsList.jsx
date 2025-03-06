import React, { useState, useEffect } from "react";
import { Agent } from "../../models/agent";
import { PlusCircleIcon, TrashIcon, PencilIcon } from "@heroicons/react/24/outline";

export const AgentsList = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: "", description: "", configuration: "{}" });

  const loadAgents = async () => {
    try {
      setLoading(true);
      const response = await Agent.getAll();
      if (response.agents) {
        setAgents(response.agents);
      }
    } catch (err) {
      console.error("Failed to load agents:", err);
      setError("Failed to load agents. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    try {
      await Agent.create(newAgent);
      setNewAgent({ name: "", description: "", configuration: "{}" });
      setShowCreateForm(false);
      loadAgents();
    } catch (err) {
      console.error("Failed to create agent:", err);
      setError("Failed to create agent. Please try again.");
    }
  };

  const handleDeleteAgent = async (agentId) => {
    if (confirm("Are you sure you want to delete this agent?")) {
      try {
        await Agent.delete(agentId);
        loadAgents();
      } catch (err) {
        console.error("Failed to delete agent:", err);
        setError("Failed to delete agent. Please try again.");
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Agents</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusCircleIcon className="w-5 h-5" />
          Create Agent
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-800 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className="bg-gray-100 p-4 rounded-md mb-6">
          <h2 className="text-lg font-semibold mb-4">Create New Agent</h2>
          <form onSubmit={handleCreateAgent}>
            <div className="mb-4">
              <label className="block mb-1">Name</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={newAgent.name}
                onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Description</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={newAgent.description}
                onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Configuration (JSON)</label>
              <textarea
                className="w-full p-2 border rounded"
                rows="5"
                value={newAgent.configuration}
                onChange={(e) => setNewAgent({ ...newAgent, configuration: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10">Loading agents...</div>
      ) : agents.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-md">
          <p>No agents found. Create your first agent to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <div key={agent.id} className="border rounded-md p-4 bg-white shadow-sm">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold">{agent.name}</h3>
                <div className="flex gap-2">
                  <button className="text-gray-500 hover:text-blue-600">
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button 
                    className="text-gray-500 hover:text-red-600"
                    onClick={() => handleDeleteAgent(agent.id)}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <p className="text-gray-600 mt-2">{agent.description || "No description"}</p>
              <div className="mt-4">
                <span className="text-xs text-gray-500">
                  Created: {new Date(agent.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};