const ArchonAdapter = require('./archon-adapter');
const EventEmitter = require('events');

/**
 * ArchonAgentHandler manages Archon agent sessions
 */
class ArchonAgentHandler {
  constructor() {
    this.adapter = new ArchonAdapter();
    this.events = new EventEmitter();
    this.sessions = new Map();
  }

  /**
   * Verifies if Archon is properly installed
   */
  async isInstalled() {
    return await this.adapter.checkInstallation();
  }

  /**
   * Creates a new Archon session
   */
  async createSession(config = {}) {
    try {
      const result = await this.adapter.startSession(config);
      
      if (result.success) {
        this.sessions.set(result.sessionId, {
          startTime: Date.now(),
          config,
          ...result
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error creating Archon session:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sends a message to an Archon session
   */
  async sendMessage(sessionId, message) {
    try {
      if (!this.sessions.has(sessionId)) {
        return { success: false, error: 'Session not found' };
      }
      
      return await this.adapter.sendMessage(sessionId, message);
    } catch (error) {
      console.error('Error sending message to Archon:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Ends an Archon session
   */
  async endSession(sessionId) {
    try {
      if (!this.sessions.has(sessionId)) {
        return { success: false, error: 'Session not found' };
      }
      
      const result = await this.adapter.endSession(sessionId);
      
      if (result.success) {
        this.sessions.delete(sessionId);
      }
      
      return result;
    } catch (error) {
      console.error('Error ending Archon session:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Lists all active Archon sessions
   */
  async listSessions() {
    try {
      const sessions = [];
      
      for (const [sessionId, session] of this.sessions.entries()) {
        sessions.push({
          sessionId,
          startTime: session.startTime,
          uptime: Date.now() - session.startTime
        });
      }
      
      return { success: true, sessions };
    } catch (error) {
      console.error('Error listing Archon sessions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Gets information about a specific Archon session
   */
  async getSessionInfo(sessionId) {
    try {
      const session = this.sessions.get(sessionId);
      
      if (!session) {
        return { success: false, error: 'Session not found' };
      }
      
      return { 
        success: true, 
        session: {
          sessionId,
          startTime: session.startTime,
          uptime: Date.now() - session.startTime
        }
      };
    } catch (error) {
      console.error('Error getting Archon session info:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cleans up all Archon sessions
   */
  async cleanup() {
    try {
      const result = await this.adapter.cleanup();
      this.sessions.clear();
      return result;
    } catch (error) {
      console.error('Error cleaning up Archon sessions:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
module.exports = new ArchonAgentHandler();