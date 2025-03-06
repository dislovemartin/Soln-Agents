import { baseHeaders, handleResponse } from "../utils/request";

export class Agent {
  static async getAll() {
    const response = await fetch("/api/v1/agents", {
      method: "GET",
      headers: baseHeaders(),
    });
    return handleResponse(response);
  }

  static async get(agentId) {
    const response = await fetch(`/api/v1/agents/${agentId}`, {
      method: "GET",
      headers: baseHeaders(),
    });
    return handleResponse(response);
  }

  static async create(agentData) {
    const response = await fetch("/api/v1/agents", {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify(agentData),
    });
    return handleResponse(response);
  }

  static async update(agentId, agentData) {
    const response = await fetch(`/api/v1/agents/${agentId}`, {
      method: "PUT",
      headers: baseHeaders(),
      body: JSON.stringify(agentData),
    });
    return handleResponse(response);
  }

  static async delete(agentId) {
    const response = await fetch(`/api/v1/agents/${agentId}`, {
      method: "DELETE",
      headers: baseHeaders(),
    });
    return handleResponse(response);
  }
}