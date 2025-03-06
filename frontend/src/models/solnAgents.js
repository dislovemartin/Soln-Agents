import { baseHeaders, handleResponse } from "../utils/request";

export class SolnAgents {
  static async listAvailableAgents() {
    const response = await fetch(`/api/solnAgents`, {
      method: "GET",
      headers: baseHeaders(),
    });
    return handleResponse(response);
  }

  static async createSession(agentId, config = {}) {
    const response = await fetch(`/api/solnAgents/sessions`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify({ agentId, config }),
    });
    return handleResponse(response);
  }

  static async sendMessage(sessionId, message) {
    const response = await fetch(`/api/solnAgents/sessions/${sessionId}/messages`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify({ message }),
    });
    return handleResponse(response);
  }

  static async endSession(sessionId) {
    const response = await fetch(`/api/solnAgents/sessions/${sessionId}`, {
      method: "DELETE",
      headers: baseHeaders(),
    });
    return handleResponse(response);
  }

  static async listSessions() {
    const response = await fetch(`/api/solnAgents/sessions`, {
      method: "GET",
      headers: baseHeaders(),
    });
    return handleResponse(response);
  }

  static async getSessionInfo(sessionId) {
    const response = await fetch(`/api/solnAgents/sessions/${sessionId}`, {
      method: "GET",
      headers: baseHeaders(),
    });
    return handleResponse(response);
  }

  static async cleanupSessions() {
    const response = await fetch(`/api/solnAgents/cleanup`, {
      method: "POST",
      headers: baseHeaders(),
    });
    return handleResponse(response);
  }
}