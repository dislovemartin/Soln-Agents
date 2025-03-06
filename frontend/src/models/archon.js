import { baseHeaders, handleResponse } from "../utils/request";

export class Archon {
  static async getStatus() {
    const response = await fetch(`/api/archon/status`, {
      method: "GET",
      headers: baseHeaders(),
    });
    return handleResponse(response);
  }

  static async createSession(config = {}) {
    const response = await fetch(`/api/archon/sessions`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify({ config }),
    });
    return handleResponse(response);
  }

  static async sendMessage(sessionId, message) {
    const response = await fetch(`/api/archon/sessions/${sessionId}/messages`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify({ message }),
    });
    return handleResponse(response);
  }

  static async endSession(sessionId) {
    const response = await fetch(`/api/archon/sessions/${sessionId}`, {
      method: "DELETE",
      headers: baseHeaders(),
    });
    return handleResponse(response);
  }

  static async listSessions() {
    const response = await fetch(`/api/archon/sessions`, {
      method: "GET",
      headers: baseHeaders(),
    });
    return handleResponse(response);
  }

  static async getSessionInfo(sessionId) {
    const response = await fetch(`/api/archon/sessions/${sessionId}`, {
      method: "GET",
      headers: baseHeaders(),
    });
    return handleResponse(response);
  }

  static async cleanupSessions() {
    const response = await fetch(`/api/archon/cleanup`, {
      method: "POST",
      headers: baseHeaders(),
    });
    return handleResponse(response);
  }
}