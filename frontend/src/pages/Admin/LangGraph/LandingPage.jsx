import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../hooks/useToast.js";
import paths from "../../../utils/paths.js";
import System from "../../../models/system.js";
import Workspace from "../../../models/workspace.js";

export default function LangGraphLanding() {
  const { createToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function fetchWorkspacesAndPermissions() {
      try {
        const { admin } = await System.getAdminStatus();
        setIsAdmin(admin);
  
        if (!admin) {
          createToast({
            title: "Access Denied",
            type: "error",
            description: "You do not have permission to access this page.",
          });
          navigate(paths.home());
          return;
        }
  
        const _workspaces = await Workspace.all();
        setWorkspaces(_workspaces || []);
      } catch (error) {
        console.error("Failed to fetch workspaces:", error);
        createToast({
          title: "Something went wrong",
          type: "error",
          description: "Failed to load workspaces. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    }
  
    fetchWorkspacesAndPermissions();
  }, [navigate, createToast]);

  const handleWorkspaceSelect = (slug) => {
    navigate(paths.admin.langgraph.manager(slug));
  };

  if (loading) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          LangGraph Manager
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
          Select a workspace to manage its LangGraph flows.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workspaces.map((workspace) => (
          <div
            key={workspace.id}
            onClick={() => handleWorkspaceSelect(workspace.slug)}
            className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center space-x-4">
              {workspace.pfpFilename ? (
                <img
                  src={`/api/workspaces/pfp/${workspace.pfpFilename}`}
                  alt={workspace.name}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {workspace.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {workspace.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {workspace.slug}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {workspaces.length === 0 && (
        <div className="text-center py-12 bg-gray-100 dark:bg-zinc-800 rounded-lg mt-4">
          <p className="text-gray-600 dark:text-gray-400">
            No workspaces available. Create a workspace to start using LangGraph.
          </p>
        </div>
      )}
    </div>
  );
}