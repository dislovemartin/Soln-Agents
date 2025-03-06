const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

/**
 * ArchonAdapter provides an interface between the Soln-Agents system
 * and the Archon AI agent builder
 */
class ArchonAdapter {
  constructor(config = {}) {
    this.config = config;
    this.archonPath = path.join(process.cwd(), 'SolnAI-agents', 'Archon');
    this.processMap = new Map(); // Map to track running Archon processes
  }

  /**
   * Checks if Archon is properly installed
   */
  async checkInstallation() {
    try {
      return fs.existsSync(this.archonPath) && 
             fs.existsSync(path.join(this.archonPath, 'archon', 'archon_graph.py'));
    } catch (error) {
      console.error('Error checking Archon installation:', error);
      return false;
    }
  }

  /**
   * Starts an Archon agent session
   */
  async startSession(requestData) {
    const sessionId = uuidv4();
    
    return new Promise((resolve, reject) => {
      try {
        // Create a detached process for Archon
        const archonProcess = spawn('python', [
          path.join(this.archonPath, 'graph_service.py'),
          '--session-id', sessionId,
          '--api-mode'
        ], {
          cwd: this.archonPath,
          env: {
            ...process.env,
            ARCHON_API_KEY: this.config.apiKey || '',
            LLM_API_KEY: this.config.llmApiKey || '',
            PRIMARY_MODEL: this.config.primaryModel || 'gpt-4o-mini',
            REASONER_MODEL: this.config.reasonerModel || 'o3-mini',
            EMBEDDING_MODEL: this.config.embeddingModel || 'text-embedding-3-small',
            SUPABASE_URL: this.config.supabaseUrl || '',
            SUPABASE_SERVICE_KEY: this.config.supabaseServiceKey || '',
            BASE_URL: this.config.baseUrl || 'https://api.openai.com/v1'
          },
          detached: true
        });

        let outputData = '';
        let errorData = '';

        archonProcess.stdout.on('data', (data) => {
          outputData += data.toString();
          if (outputData.includes('Archon API server started')) {
            // Extract the port from the output
            const portMatch = outputData.match(/port (\d+)/);
            if (portMatch && portMatch[1]) {
              const port = portMatch[1];
              this.processMap.set(sessionId, {
                process: archonProcess,
                port: port,
                startTime: Date.now()
              });
              resolve({ 
                success: true, 
                sessionId, 
                port,
                message: 'Archon session started successfully' 
              });
            }
          }
        });

        archonProcess.stderr.on('data', (data) => {
          errorData += data.toString();
          console.error(`Archon stderr: ${data}`);
        });

        archonProcess.on('error', (error) => {
          console.error('Failed to start Archon process:', error);
          reject({ success: false, error: 'Failed to start Archon process' });
        });

        archonProcess.on('close', (code) => {
          if (code !== 0 && !this.processMap.has(sessionId)) {
            console.error(`Archon process exited with code ${code}`);
            reject({ 
              success: false, 
              error: `Archon process exited with code ${code}. Error: ${errorData}` 
            });
          }
        });

        // Reject if we don't get success within 30 seconds
        setTimeout(() => {
          if (!this.processMap.has(sessionId)) {
            archonProcess.kill();
            reject({ 
              success: false, 
              error: 'Timeout starting Archon session'
            });
          }
        }, 30000);
      } catch (error) {
        console.error('Error starting Archon session:', error);
        reject({ success: false, error: error.message });
      }
    });
  }

  /**
   * Sends a message to an Archon session
   */
  async sendMessage(sessionId, message) {
    const sessionData = this.processMap.get(sessionId);
    
    if (!sessionData) {
      return { success: false, error: 'Archon session not found' };
    }

    try {
      const response = await fetch(`http://localhost:${sessionData.port}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error sending message to Archon:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Ends an Archon session
   */
  async endSession(sessionId) {
    const sessionData = this.processMap.get(sessionId);
    
    if (!sessionData) {
      return { success: false, error: 'Archon session not found' };
    }

    try {
      // Terminate the process
      sessionData.process.kill();
      this.processMap.delete(sessionId);
      return { success: true, message: 'Archon session terminated' };
    } catch (error) {
      console.error('Error ending Archon session:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Lists active Archon sessions
   */
  async listSessions() {
    try {
      const sessions = [];
      
      for (const [sessionId, sessionData] of this.processMap.entries()) {
        sessions.push({
          sessionId,
          port: sessionData.port,
          startTime: sessionData.startTime,
          uptime: Date.now() - sessionData.startTime
        });
      }
      
      return { success: true, sessions };
    } catch (error) {
      console.error('Error listing Archon sessions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cleans up all Archon sessions
   */
  async cleanup() {
    try {
      for (const [sessionId, sessionData] of this.processMap.entries()) {
        try {
          sessionData.process.kill();
        } catch (error) {
          console.error(`Error killing Archon session ${sessionId}:`, error);
        }
      }
      
      this.processMap.clear();
      return { success: true, message: 'All Archon sessions terminated' };
    } catch (error) {
      console.error('Error cleaning up Archon sessions:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = ArchonAdapter;