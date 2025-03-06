import React, { useState } from "react";
import { FiEdit, FiTrash2, FiPlayCircle, FiPauseCircle, FiBarChart2 } from "react-icons/fi";

export default function FlowsList({
  flows,
  onEdit,
  onDelete,
  onToggle,
  onCreateNew,
}) {
  const [selectedFlowId, setSelectedFlowId] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  const handleDeleteClick = (flowId) => {
    setSelectedFlowId(flowId);
    setShowConfirmDelete(true);
  };

  const confirmDelete = () => {
    if (selectedFlowId) {
      onDelete(selectedFlowId);
      setShowConfirmDelete(false);
      setSelectedFlowId(null);
    }
  };

  const handleToggleClick = (flowId, currentEnabled) => {
    onToggle(flowId, !currentEnabled);
  };

  const handleRunClick = (flowId) => {
    setSelectedFlowId(flowId);
    setShowRunModal(true);
  };

  const handleAnalyticsClick = (flowId) => {
    setSelectedFlowId(flowId);
    setShowAnalyticsModal(true);
  };

  const selectedFlow = flows.find((flow) => flow.id === selectedFlowId);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          LangGraph Flows
        </h2>
        <button
          onClick={onCreateNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Create New Flow
        </button>
      </div>

      {flows.length === 0 ? (
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No LangGraph flows have been created yet.
          </p>
          <button
            onClick={onCreateNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create Your First Flow
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-zinc-700">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Description
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Last Updated
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
              {flows.map((flow) => (
                <tr key={flow.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {flow.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {flow.description || "No description"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        flow.enabled
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {flow.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(flow.updated_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleToggleClick(flow.id, flow.enabled)}
                        className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 focus:outline-none ${
                          flow.enabled ? "text-green-600" : "text-red-600"
                        }`}
                        title={flow.enabled ? "Disable flow" : "Enable flow"}
                      >
                        {flow.enabled ? <FiPauseCircle size={18} /> : <FiPlayCircle size={18} />}
                      </button>
                      <button
                        onClick={() => onEdit(flow)}
                        className="p-1 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full focus:outline-none"
                        title="Edit flow"
                      >
                        <FiEdit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(flow.id)}
                        className="p-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full focus:outline-none"
                        title="Delete flow"
                      >
                        <FiTrash2 size={18} />
                      </button>
                      <button
                        onClick={() => handleAnalyticsClick(flow.id)}
                        className="p-1 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full focus:outline-none"
                        title="View analytics"
                      >
                        <FiBarChart2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Confirm Deletion
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to delete the flow "{selectedFlow?.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal (placeholder) */}
      {showAnalyticsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl p-6 max-w-4xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Analytics for "{selectedFlow?.name}"
              </h3>
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
              >
                ×
              </button>
            </div>
            <div className="mb-6">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Analytics data will be displayed here. Integration with LangSmith provides detailed insights into flow performance.
              </p>
              {/* This would be replaced with actual analytics components */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-100 dark:bg-zinc-700 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Total Runs</h4>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">0</p>
                </div>
                <div className="bg-gray-100 dark:bg-zinc-700 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Success Rate</h4>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">0%</p>
                </div>
                <div className="bg-gray-100 dark:bg-zinc-700 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Avg. Response Time</h4>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">0ms</p>
                </div>
              </div>
              <div className="h-64 bg-gray-100 dark:bg-zinc-700 rounded-lg flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">Run history chart will be displayed here</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}