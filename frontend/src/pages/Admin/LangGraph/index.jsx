import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "../../../hooks/useToast.js";
import paths from "../../../utils/paths.js";
import System from "../../../models/system.js";
import LangGraphService from "../../../models/langgraph.js";
import Workspace from "../../../models/workspace.js";
import WorkspaceHeader from "../../Workspace/Header/index.jsx";
import FlowsList from "./FlowsList/index.jsx";
import FlowBuilder from "./FlowBuilder/index.jsx";
import LangSmithIntegration from "../LangSmith/index.jsx";

export default function LangGraphManager() {
  const { slug } = useParams();
  const { createToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [flows, setFlows] = useState([]);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [tab, setTab] = useState("flows"); // flows, builder, langsmith

  useEffect(() => {
    async function fetchWorkspaceAndPermissions() {
      try {
        const { admin } = await System.getAdminStatus();
        setIsAdmin(admin);
  
        const _workspace = await Workspace.get({ slug });
        if (!_workspace) {
          createToast({
            title: "Workspace not found",
            type: "error",
            description: "The workspace you're looking for doesn't exist or you don't have access to it.",
          });
          navigate(paths.home());
          return;
        }
  
        setWorkspace(_workspace);
        await fetchFlows(_workspace.id);
      } catch (error) {
        console.error("Failed to fetch workspace information:", error);
        createToast({
          title: "Something went wrong",
          type: "error",
          description: "Failed to load workspace information. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    }
  
    fetchWorkspaceAndPermissions();
  }, [slug, navigate, createToast]);

  const fetchFlows = async (workspaceId) => {
    try {
      const result = await LangGraphService.listFlows(workspaceId);
      setFlows(result.flows || []);
    } catch (error) {
      console.error("Failed to fetch LangGraph flows:", error);
      createToast({
        title: "Failed to load flows",
        type: "error",
        description: "Could not load LangGraph flows. Please try again.",
      });
    }
  };

  const handleCreateFlow = async (flowData) => {
    try {
      await LangGraphService.createFlow({
        ...flowData,
        workspace_id: workspace.id,
      });
      createToast({
        title: "Flow created",
        type: "success",
        description: "Your LangGraph flow has been created successfully.",
      });
      await fetchFlows(workspace.id);
      setTab("flows");
    } catch (error) {
      console.error("Failed to create LangGraph flow:", error);
      createToast({
        title: "Failed to create flow",
        type: "error",
        description: "Could not create LangGraph flow. Please try again.",
      });
    }
  };

  const handleEditFlow = async (flowId, flowData) => {
    try {
      await LangGraphService.updateFlow(flowId, flowData);
      createToast({
        title: "Flow updated",
        type: "success",
        description: "Your LangGraph flow has been updated successfully.",
      });
      await fetchFlows(workspace.id);
      setSelectedFlow(null);
      setTab("flows");
    } catch (error) {
      console.error("Failed to update LangGraph flow:", error);
      createToast({
        title: "Failed to update flow",
        type: "error",
        description: "Could not update LangGraph flow. Please try again.",
      });
    }
  };

  const handleDeleteFlow = async (flowId) => {
    try {
      await LangGraphService.deleteFlow(flowId);
      createToast({
        title: "Flow deleted",
        type: "success",
        description: "Your LangGraph flow has been deleted successfully.",
      });
      await fetchFlows(workspace.id);
    } catch (error) {
      console.error("Failed to delete LangGraph flow:", error);
      createToast({
        title: "Failed to delete flow",
        type: "error",
        description: "Could not delete LangGraph flow. Please try again.",
      });
    }
  };

  const handleToggleFlow = async (flowId, enabled) => {
    try {
      await LangGraphService.toggleFlow(flowId, enabled);
      createToast({
        title: enabled ? "Flow enabled" : "Flow disabled",
        type: "success",
        description: `Your LangGraph flow has been ${enabled ? "enabled" : "disabled"} successfully.`,
      });
      await fetchFlows(workspace.id);
    } catch (error) {
      console.error("Failed to toggle LangGraph flow:", error);
      createToast({
        title: "Failed to update flow",
        type: "error",
        description: `Could not ${enabled ? "enable" : "disable"} LangGraph flow. Please try again.`,
      });
    }
  };

  const handleEditClick = (flow) => {
    setSelectedFlow(flow);
    setTab("builder");
  };

  const handleNewFlow = () => {
    setSelectedFlow(null);
    setTab("builder");
  };

  if (loading) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <WorkspaceHeader
        name={workspace?.name}
        namespace={workspace?.slug}
        isWorkspace={true}
        canConfigure={isAdmin}
        displayWorkspaceMenu={true}
      />

      <div className="w-full h-full overflow-auto">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              LangGraph Manager
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Create and manage LangGraph flows for your workspace
            </p>
          </div>

          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
              <li className="mr-2">
                <button
                  className={`inline-block p-4 ${
                    tab === "flows"
                      ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500"
                      : "hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
                  }`}
                  onClick={() => setTab("flows")}
                >
                  Flows
                </button>
              </li>
              <li className="mr-2">
                <button
                  className={`inline-block p-4 ${
                    tab === "builder"
                      ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500"
                      : "hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
                  }`}
                  onClick={handleNewFlow}
                >
                  {selectedFlow ? "Edit Flow" : "Create Flow"}
                </button>
              </li>
              <li className="mr-2">
                <button
                  className={`inline-block p-4 ${
                    tab === "langsmith"
                      ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500"
                      : "hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
                  }`}
                  onClick={() => setTab("langsmith")}
                >
                  LangSmith Integration
                </button>
              </li>
            </ul>
          </div>

          {tab === "flows" && (
            <FlowsList
              flows={flows}
              onEdit={handleEditClick}
              onDelete={handleDeleteFlow}
              onToggle={handleToggleFlow}
              onCreateNew={handleNewFlow}
            />
          )}

          {tab === "builder" && (
            <FlowBuilder
              flow={selectedFlow}
              onSave={selectedFlow ? handleEditFlow : handleCreateFlow}
              onCancel={() => {
                setSelectedFlow(null);
                setTab("flows");
              }}
            />
          )}

          {tab === "langsmith" && (
            <LangSmithIntegration
              workspaceId={workspace.id}
            />
          )}
        </div>
      </div>
    </div>
  );
}