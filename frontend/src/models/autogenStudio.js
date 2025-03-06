import { baseUrl, handleRequest } from "../utils/request";

/**
 * AutoGen Studio API Integration
 * 
 * This module provides API methods for integrating with AutoGen Studio
 */

// Get AutoGen Studio configuration
export const getAutoGenStudioConfig = async () => {
  try {
    const response = await fetch(
      `${baseUrl}/api/experimental/autogen-studio/config`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );
    return await handleRequest(response);
  } catch (error) {
    console.error("Error getting AutoGen Studio config:", error);
    return { error: "Failed to get AutoGen Studio configuration" };
  }
};

// Update AutoGen Studio configuration
export const updateAutoGenStudioConfig = async (config) => {
  try {
    const response = await fetch(
      `${baseUrl}/api/experimental/autogen-studio/config`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(config),
      }
    );
    return await handleRequest(response);
  } catch (error) {
    console.error("Error updating AutoGen Studio config:", error);
    return { error: "Failed to update AutoGen Studio configuration" };
  }
};

// Get available SolnAI agents for AutoGen Studio
export const getAutoGenAgents = async () => {
  try {
    const response = await fetch(
      `${baseUrl}/api/experimental/autogen-studio/agents`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );
    return await handleRequest(response);
  } catch (error) {
    console.error("Error getting AutoGen agents:", error);
    return { error: "Failed to get AutoGen agents" };
  }
};

// Install AutoGen Studio plugin
export const installAutoGenStudioPlugin = async () => {
  try {
    const response = await fetch(
      `${baseUrl}/api/experimental/autogen-studio/install-plugin`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );
    return await handleRequest(response);
  } catch (error) {
    console.error("Error installing AutoGen Studio plugin:", error);
    return { error: "Failed to install AutoGen Studio plugin" };
  }
};