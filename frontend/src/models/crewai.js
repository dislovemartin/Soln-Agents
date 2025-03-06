import { baseHeaders, handleResponse } from "../utils/request";

export class CrewAI {
  static async executeWorkflow(workflowData) {
    const response = await fetch("/api/v1/crewai/execute", {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify(workflowData),
    });
    return handleResponse(response);
  }

  static async getExecutionHistory(filters = {}) {
    const queryParams = new URLSearchParams();
    
    if (filters.agent_id) queryParams.append("agent_id", filters.agent_id);
    if (filters.agent_type) queryParams.append("agent_type", filters.agent_type);
    if (filters.status) queryParams.append("status", filters.status);
    if (filters.limit) queryParams.append("limit", filters.limit);
    if (filters.offset) queryParams.append("offset", filters.offset);
    
    const url = `/api/v1/crewai/history?${queryParams.toString()}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: baseHeaders(),
    });
    return handleResponse(response);
  }
}