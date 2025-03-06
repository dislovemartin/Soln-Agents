import React, { useState, useEffect } from "react";
import { FiSave, FiX, FiPlus, FiTrash2 } from "react-icons/fi";

// Node types available in LangGraph
const NODE_TYPES = [
  { id: "start", label: "Start", description: "Entry point for your flow" },
  { id: "llm", label: "LLM", description: "Language model processing" },
  { id: "conditional", label: "Conditional", description: "Branch based on conditions" },
  { id: "tool", label: "Tool", description: "Execute a tool or function" },
  { id: "end", label: "End", description: "Exit point for your flow" },
];

export default function FlowBuilder({ flow, onSave, onCancel }) {
  const [flowData, setFlowData] = useState({
    name: "",
    description: "",
    definition: JSON.stringify(
      {
        nodes: [],
        edges: [],
      },
      null,
      2
    ),
  });
  const [currentView, setCurrentView] = useState("visual"); // visual or json
  const [nodes, setNodes] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [edges, setEdges] = useState([]);
  const [nodeFormData, setNodeFormData] = useState({
    id: "",
    type: "start",
    label: "",
    config: "",
  });
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // add or edit

  // Load flow data when editing an existing flow
  useEffect(() => {
    if (flow) {
      setFlowData({
        name: flow.name,
        description: flow.description || "",
        definition: flow.definition,
      });

      try {
        const parsedDefinition = JSON.parse(flow.definition);
        setNodes(parsedDefinition.nodes || []);
        setEdges(parsedDefinition.edges || []);
      } catch (error) {
        console.error("Error parsing flow definition:", error);
        // Set default empty arrays if parsing fails
        setNodes([]);
        setEdges([]);
      }
    }
  }, [flow]);

  // Update the definition JSON when nodes or edges change
  useEffect(() => {
    const definition = JSON.stringify(
      {
        nodes,
        edges,
      },
      null,
      2
    );
    setFlowData((prev) => ({ ...prev, definition }));
  }, [nodes, edges]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFlowData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDefinitionChange = (e) => {
    const { value } = e.target;
    setFlowData((prev) => ({ ...prev, definition: value }));

    // Try to parse and update nodes and edges
    try {
      const parsed = JSON.parse(value);
      setNodes(parsed.nodes || []);
      setEdges(parsed.edges || []);
    } catch (error) {
      // Don't update nodes and edges if JSON is invalid
      console.error("Invalid JSON:", error);
    }
  };

  const handleSave = () => {
    // Validate required fields
    if (!flowData.name.trim()) {
      alert("Flow name is required");
      return;
    }

    try {
      // Validate JSON structure
      JSON.parse(flowData.definition);

      // If editing an existing flow, call onSave with the flow ID
      if (flow?.id) {
        onSave(flow.id, flowData);
      } else {
        // Otherwise, create a new flow
        onSave(flowData);
      }
    } catch (error) {
      alert("Invalid flow definition JSON");
      console.error("JSON parsing error:", error);
    }
  };

  const handleAddNode = () => {
    setModalMode("add");
    setNodeFormData({
      id: `node_${Date.now()}`,
      type: "start",
      label: "New Node",
      config: JSON.stringify({ properties: {} }, null, 2),
    });
    setShowNodeModal(true);
  };

  const handleEditNode = (node) => {
    setModalMode("edit");
    setNodeFormData({
      id: node.id,
      type: node.type,
      label: node.label,
      config: JSON.stringify(node.config || { properties: {} }, null, 2),
    });
    setSelectedNodeId(node.id);
    setShowNodeModal(true);
  };

  const handleNodeFormChange = (e) => {
    const { name, value } = e.target;
    setNodeFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveNode = () => {
    try {
      const configObj = JSON.parse(nodeFormData.config);
      const nodeObj = {
        id: nodeFormData.id,
        type: nodeFormData.type,
        label: nodeFormData.label,
        config: configObj,
      };

      if (modalMode === "add") {
        setNodes((prev) => [...prev, nodeObj]);
      } else {
        setNodes((prev) =>
          prev.map((node) => (node.id === selectedNodeId ? nodeObj : node))
        );
      }
      setShowNodeModal(false);
    } catch (error) {
      alert("Invalid node configuration JSON");
      console.error("JSON parsing error:", error);
    }
  };

  const handleDeleteNode = (nodeId) => {
    // Remove the node
    setNodes((prev) => prev.filter((node) => node.id !== nodeId));
    
    // Remove any edges connected to this node
    setEdges((prev) => 
      prev.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      )
    );
  };

  const handleAddEdge = (source, target) => {
    // Check if edge already exists
    const edgeExists = edges.some(
      (edge) => edge.source === source && edge.target === target
    );

    if (!edgeExists && source !== target) {
      const newEdge = {
        id: `edge_${source}_${target}`,
        source,
        target,
      };
      setEdges((prev) => [...prev, newEdge]);
    }
  };

  const handleDeleteEdge = (edgeId) => {
    setEdges((prev) => prev.filter((edge) => edge.id !== edgeId));
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {flow ? "Edit Flow" : "Create New Flow"}
          </h2>
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex items-center px-4 py-2 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <FiX className="mr-2" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <FiSave className="mr-2" />
              Save Flow
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Flow Name*
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={flowData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
              placeholder="Enter flow name"
              required
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={flowData.description}
              onChange={handleInputChange}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
              placeholder="Enter flow description"
            />
          </div>
        </div>

        <div className="mb-4">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              className={`py-2 px-4 border-b-2 ${
                currentView === "visual"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
              onClick={() => setCurrentView("visual")}
            >
              Visual Editor
            </button>
            <button
              className={`py-2 px-4 border-b-2 ${
                currentView === "json"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
              onClick={() => setCurrentView("json")}
            >
              JSON Editor
            </button>
          </div>
        </div>

        {currentView === "visual" ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Flow Nodes
              </h3>
              <button
                onClick={handleAddNode}
                className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <FiPlus className="mr-1" />
                Add Node
              </button>
            </div>

            {nodes.length === 0 ? (
              <div className="text-center py-8 bg-gray-100 dark:bg-zinc-700 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">
                  No nodes have been added yet. Click "Add Node" to create your first node.
                </p>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-zinc-700">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        ID
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Type
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Label
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-zinc-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {nodes.map((node) => (
                      <tr key={node.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {node.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {node.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {node.label}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEditNode(node)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 focus:outline-none"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteNode(node.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 focus:outline-none"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Flow Edges
              </h3>
              {edges.length === 0 ? (
                <div className="text-center py-8 bg-gray-100 dark:bg-zinc-700 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">
                    No edges have been created yet. Add nodes first, then create connections between them.
                  </p>
                </div>
              ) : (
                <div className="overflow-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-zinc-700">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          ID
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          Source → Target
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-zinc-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {edges.map((edge) => (
                        <tr key={edge.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {edge.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {edge.source} → {edge.target}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleDeleteEdge(edge.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 focus:outline-none"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {nodes.length > 1 && (
                <div className="mt-6 p-4 bg-gray-100 dark:bg-zinc-700 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Create New Edge
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Source Node
                      </label>
                      <select
                        id="source-node"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Select source node
                        </option>
                        {nodes.map((node) => (
                          <option key={`source-${node.id}`} value={node.id}>
                            {node.label} ({node.id})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Target Node
                      </label>
                      <select
                        id="target-node"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Select target node
                        </option>
                        {nodes.map((node) => (
                          <option key={`target-${node.id}`} value={node.id}>
                            {node.label} ({node.id})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          const source = document.getElementById("source-node").value;
                          const target = document.getElementById("target-node").value;
                          if (source && target) {
                            handleAddEdge(source, target);
                          } else {
                            alert("Please select both source and target nodes");
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Add Edge
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <label
              htmlFor="definition"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Flow Definition (JSON)
            </label>
            <textarea
              id="definition"
              name="definition"
              value={flowData.definition}
              onChange={handleDefinitionChange}
              rows="20"
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm dark:bg-zinc-700 dark:text-white"
            />
          </div>
        )}
      </div>

      {/* Node Modal */}
      {showNodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl p-6 max-w-xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {modalMode === "add" ? "Add Node" : "Edit Node"}
              </h3>
              <button
                onClick={() => setShowNodeModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label
                  htmlFor="id"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Node ID
                </label>
                <input
                  type="text"
                  id="id"
                  name="id"
                  value={nodeFormData.id}
                  onChange={handleNodeFormChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
                  placeholder="Enter node ID"
                  required
                  readOnly={modalMode === "edit"} // Don't allow editing IDs for existing nodes
                />
              </div>
              <div>
                <label
                  htmlFor="type"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Node Type
                </label>
                <select
                  id="type"
                  name="type"
                  value={nodeFormData.type}
                  onChange={handleNodeFormChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
                >
                  {NODE_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.label} - {type.description}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="label"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Node Label
                </label>
                <input
                  type="text"
                  id="label"
                  name="label"
                  value={nodeFormData.label}
                  onChange={handleNodeFormChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
                  placeholder="Enter node label"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="config"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Configuration (JSON)
                </label>
                <textarea
                  id="config"
                  name="config"
                  value={nodeFormData.config}
                  onChange={handleNodeFormChange}
                  rows="8"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm dark:bg-zinc-700 dark:text-white"
                  placeholder='{"properties": {}}'
                  required
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowNodeModal(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNode}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {modalMode === "add" ? "Add Node" : "Update Node"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}