const childProcess = require('child_process');
const { spawn } = childProcess;
const { exec } = childProcess;
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const Docker = require('dockerode');
const yaml = require('js-yaml');

/**
 * Universal adapter for SolnAI agents
 * Supports Python-based, N8N, and Voiceflow agents
 */
class SolnAgentsAdapter {
  constructor() {
    this.docker = new Docker({ socketPath: '/var/run/docker.sock' });
    this.agentsDirectory = path.join(process.cwd(), 'SolnAI-agents');
    this.containerMap = new Map(); // Maps sessionId to container info
    this.processMap = new Map(); // Maps sessionId to process info
    this.n8nBaseUrl = process.env.N8N_BASE_URL || 'http://localhost:5678';
    this.n8nApiKey = process.env.N8N_API_KEY || '';
    this.vfRuntimeUrl = process.env.VOICEFLOW_RUNTIME_URL || 'https://general-runtime.voiceflow.com';
    this.vfApiKey = process.env.VOICEFLOW_API_KEY || '';
  }

  /**
   * Lists all available agents in the SolnAI-agents directory
   */
  async listAvailableAgents() {
    try {
      const agents = [];
      const directories = await fs.readdir(this.agentsDirectory);
      
      for (const dir of directories) {
        // Skip non-directory items and hidden directories
        if (dir.startsWith('.') || dir.startsWith('~') || 
            dir === 'shared' || dir === 'docs' || dir === 'components' || 
            dir === 'html_docs' || dir === 'nodes') {
          continue;
        }
        
        const dirPath = path.join(this.agentsDirectory, dir);
        const stats = await fs.stat(dirPath);
        
        if (stats.isDirectory()) {
          const files = await fs.readdir(dirPath);
          let agentType = await this.determineAgentType(dirPath, files);
          
          // Read README.md to get description
          let description = '';
          if (files.includes('README.md')) {
            const readmePath = path.join(dirPath, 'README.md');
            const readmeContent = await fs.readFile(readmePath, 'utf8');
            // Extract the first paragraph or description
            const descriptionMatch = readmeContent.match(/^#[^#].*?\n\n(.*?)(\n\n|\n#|$)/s);
            description = descriptionMatch ? descriptionMatch[1].trim() : '';
          }
          
          agents.push({
            id: dir,
            name: dir.replace(/-/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2'),
            type: agentType,
            description: description,
            path: dirPath,
            files: files
          });
        }
      }
      
      return { success: true, agents };
    } catch (error) {
      console.error('Error listing available agents:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Determines the type of agent based on its files
   */
  async determineAgentType(dirPath, files) {
    // Check for Python agent (Dockerfile + main.py or *_agent.py)
    if ((files.includes('Dockerfile') && (files.includes('main.py') || files.some(f => f.endsWith('_agent.py')))) ||
        files.some(f => f.endsWith('_agent.py') || f.endsWith('agent.py'))) {
      return 'python';
    }
    
    // Check for N8N agent (JSON file with N8N format)
    if (files.some(f => f.endsWith('.json'))) {
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      for (const jsonFile of jsonFiles) {
        const filePath = path.join(dirPath, jsonFile);
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const json = JSON.parse(content);
          // Check if this is likely an n8n workflow
          if (json.nodes && json.connections) {
            return 'n8n';
          }
        } catch (error) {
          // Not an N8N file, continue checking
        }
      }
    }
    
    // Check for Voiceflow agent (.vf files)
    if (files.some(f => f.endsWith('.vf'))) {
      return 'voiceflow';
    }
    
    // Default to Python if we have Python files
    if (files.some(f => f.endsWith('.py'))) {
      return 'python';
    }
    
    return 'unknown';
  }

  /**
   * Creates an agent session
   */
  async createSession(agentId, config = {}) {
    try {
      const sessionId = uuidv4();
      const agentPath = path.join(this.agentsDirectory, agentId);
      
      // Check if agent exists
      try {
        await fs.access(agentPath);
      } catch (error) {
        return { success: false, error: `Agent '${agentId}' not found` };
      }
      
      // Get agent files
      const files = await fs.readdir(agentPath);
      
      // Determine agent type
      const agentType = await this.determineAgentType(agentPath, files);
      
      // Create session based on agent type
      let result;
      
      switch (agentType) {
        case 'python':
          result = await this.createPythonAgentSession(agentId, agentPath, files, sessionId, config);
          break;
        case 'n8n':
          result = await this.createN8nAgentSession(agentId, agentPath, files, sessionId, config);
          break;
        case 'voiceflow':
          result = await this.createVoiceflowAgentSession(agentId, agentPath, files, sessionId, config);
          break;
        default:
          return { success: false, error: `Unsupported agent type: ${agentType}` };
      }
      
      if (result.success) {
        return {
          success: true,
          sessionId,
          agentId,
          agentType,
          ...result
        };
      } else {
        return result;
      }
    } catch (error) {
      console.error(`Error creating session for agent ${agentId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Creates a session for a Python-based agent
   * Either runs it directly or in a Docker container
   */
  async createPythonAgentSession(agentId, agentPath, files, sessionId, config) {
    // Determine if we can use Docker
    const hasDockerfile = files.includes('Dockerfile');
    
    if (hasDockerfile && config.useDocker !== false) {
      // Use Docker to run the agent
      return await this.createDockerSession(agentId, agentPath, sessionId, config);
    } else {
      // Run the agent directly
      return await this.createDirectPythonSession(agentId, agentPath, files, sessionId, config);
    }
  }

  /**
   * Creates a Docker container for a Python agent
   */
  async createDockerSession(agentId, agentPath, sessionId, config) {
    try {
      // Build image name with special handling for spaces and symbols
      const imageName = `solnai-${agentId.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      
      console.log(`Building Docker image: ${imageName} from ${agentPath}`);
      
      // Build the Docker image
      await new Promise((resolve, reject) => {
        exec(`docker build -t ${imageName} ${agentPath}`, (error, stdout, stderr) => {
          if (error) {
            console.error(`Docker build error: ${error.message}`);
            reject(error);
            return;
          }
          
          if (stderr) {
            console.log(`Docker build stderr: ${stderr}`);
          }
          
          resolve(stdout);
        });
      });
      
      // Create a container from the image
      const container = await this.docker.createContainer({
        Image: imageName,
        Env: [
          // Set environment variables from config
          `SESSION_ID=${sessionId}`,
          `PORT=${config.port || 3000}`,
          ...Object.entries(config).map(([key, value]) => `${key.toUpperCase()}=${value}`),
          // Add any API keys from environment
          `OPENAI_API_KEY=${process.env.OPENAI_API_KEY || ''}`,
          `ANTHROPIC_API_KEY=${process.env.ANTHROPIC_API_KEY || ''}`,
          `SUPABASE_URL=${process.env.SUPABASE_URL || ''}`,
          `SUPABASE_KEY=${process.env.SUPABASE_KEY || ''}`
        ],
        ExposedPorts: {
          '3000/tcp': {}
        },
        HostConfig: {
          PortBindings: {
            '3000/tcp': [{ HostPort: '0' }] // Bind to random port
          }
        }
      });
      
      // Start the container
      await container.start();
      
      // Get the port that was assigned
      const containerInfo = await container.inspect();
      const port = containerInfo.NetworkSettings.Ports['3000/tcp'][0].HostPort;
      
      // Store container info
      this.containerMap.set(sessionId, {
        container,
        imageName,
        port,
        containerId: containerInfo.Id,
        startTime: Date.now()
      });
      
      // Wait for the server to become available
      let serverReady = false;
      for (let i = 0; i < 10; i++) {
        try {
          await axios.get(`http://localhost:${port}/health`);
          serverReady = true;
          break;
        } catch (error) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (!serverReady) {
        // Try one more check without the /health endpoint
        try {
          await axios.get(`http://localhost:${port}/`);
          serverReady = true;
        } catch (error) {
          // Assume the server is running anyway
          serverReady = true;
        }
      }
      
      return {
        success: true,
        message: 'Docker container started successfully',
        port,
        containerId: containerInfo.Id
      };
    } catch (error) {
      console.error('Error creating Docker session:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Creates a direct Python process for an agent
   */
  async createDirectPythonSession(agentId, agentPath, files, sessionId, config) {
    try {
      // Determine the entry point file
      let entryPoint;
      
      if (files.includes('main.py')) {
        entryPoint = 'main.py';
      } else {
        // Look for *_agent.py files
        const agentFiles = files.filter(f => f.endsWith('_agent.py') || f === 'agent.py');
        if (agentFiles.length > 0) {
          entryPoint = agentFiles[0];
        } else {
          return { success: false, error: 'Could not determine Python entry point' };
        }
      }
      
      // Determine PORT
      const port = config.port || Math.floor(3000 + Math.random() * 7000);
      
      // Install requirements if available
      if (files.includes('requirements.txt')) {
        await new Promise((resolve, reject) => {
          exec(`cd ${agentPath} && pip install -r requirements.txt`, (error, stdout, stderr) => {
            if (error) {
              console.error(`Error installing requirements: ${error.message}`);
              reject(error);
              return;
            }
            resolve();
          });
        });
      }
      
      // Start the Python process
      const pythonProcess = spawn('python', [entryPoint], {
        cwd: agentPath,
        env: {
          ...process.env,
          // Pass config as environment variables
          SESSION_ID: sessionId,
          PORT: port.toString(),
          ...Object.entries(config).reduce((acc, [key, value]) => {
            acc[key.toUpperCase()] = value;
            return acc;
          }, {})
        }
      });
      
      // Collect output
      let output = '';
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
        console.log(`[${agentId}] ${data.toString()}`);
      });
      
      pythonProcess.stderr.on('data', (data) => {
        console.error(`[${agentId}] Error: ${data.toString()}`);
      });
      
      pythonProcess.on('error', (error) => {
        console.error(`[${agentId}] Process error: ${error.message}`);
      });
      
      pythonProcess.on('close', (code) => {
        console.log(`[${agentId}] Process exited with code ${code}`);
        this.processMap.delete(sessionId);
      });
      
      // Store process info
      this.processMap.set(sessionId, {
        process: pythonProcess,
        port,
        startTime: Date.now(),
        agentPath,
        entryPoint
      });
      
      // Wait for a moment to let the server start
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      return {
        success: true,
        message: 'Python agent started successfully',
        port
      };
    } catch (error) {
      console.error('Error creating direct Python session:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Creates a session for an N8N workflow agent
   */
  async createN8nAgentSession(agentId, agentPath, files, sessionId, config) {
    try {
      // Find the JSON workflow file
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      if (jsonFiles.length === 0) {
        return { success: false, error: 'No workflow JSON file found' };
      }
      
      // Use the first JSON file or the one that matches the agent name
      let workflowFile = jsonFiles.find(f => f.toLowerCase().includes(agentId.toLowerCase())) || jsonFiles[0];
      
      // Read the workflow file
      const workflowPath = path.join(agentPath, workflowFile);
      const workflowContent = await fs.readFile(workflowPath, 'utf8');
      const workflow = JSON.parse(workflowContent);
      
      // Store the N8N workflow info
      this.processMap.set(sessionId, {
        type: 'n8n',
        workflowPath,
        workflow,
        startTime: Date.now()
      });
      
      return {
        success: true,
        message: 'N8N workflow agent loaded successfully',
        workflowName: workflow.name || workflowFile
      };
    } catch (error) {
      console.error('Error creating N8N session:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Creates a session for a Voiceflow agent
   */
  async createVoiceflowAgentSession(agentId, agentPath, files, sessionId, config) {
    try {
      // Find the .vf file
      const vfFiles = files.filter(f => f.endsWith('.vf'));
      if (vfFiles.length === 0) {
        return { success: false, error: 'No Voiceflow (.vf) file found' };
      }
      
      // Use the first VF file or the one that matches the agent name
      let vfFile = vfFiles.find(f => f.toLowerCase().includes(agentId.toLowerCase())) || vfFiles[0];
      
      // Read the VF file
      const vfPath = path.join(agentPath, vfFile);
      const vfContent = await fs.readFile(vfPath, 'utf8');
      
      // Store the Voiceflow agent info
      this.processMap.set(sessionId, {
        type: 'voiceflow',
        vfPath,
        vfContent,
        startTime: Date.now(),
        state: {}
      });
      
      return {
        success: true,
        message: 'Voiceflow agent loaded successfully',
        vfFile
      };
    } catch (error) {
      console.error('Error creating Voiceflow session:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sends a message to an agent session
   * Includes automatic session recovery if session is broken
   */
  async sendMessage(sessionId, message) {
    try {
      // Check if session exists
      const containerInfo = this.containerMap.get(sessionId);
      const processInfo = this.processMap.get(sessionId);
      
      if (!containerInfo && !processInfo) {
        return { success: false, error: 'Session not found' };
      }
      
      // Add retry mechanism
      let retryCount = 0;
      const maxRetries = 2;
      let lastError = null;
      
      // Handle based on session type
      if (containerInfo) {
        // Docker container session
        return await this.sendMessageToContainer(sessionId, containerInfo, message);
      } else if (processInfo) {
        // Process session
        if (processInfo.type === 'n8n') {
          return await this.sendMessageToN8n(sessionId, processInfo, message);
        } else if (processInfo.type === 'voiceflow') {
          return await this.sendMessageToVoiceflow(sessionId, processInfo, message);
        } else {
          // Python process
          return await this.sendMessageToProcess(sessionId, processInfo, message);
        }
      }
    } catch (error) {
      console.error(`Error sending message to session ${sessionId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sends a message to a Docker container
   * Includes health check and container restart on failure
   */
  async sendMessageToContainer(sessionId, containerInfo, message, retryAttempt = 0) {
    try {
      const { port, container, imageName } = containerInfo;
      
      // Check container health before sending message
      const containerState = await container.inspect();
      if (!containerState.State.Running) {
        console.warn(`Container for session ${sessionId} is not running, attempting to restart...`);
        
        // Try to restart the container
        await container.start();
        
        // Wait a moment for the container to initialize
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // If this is the first retry, attempt again
        if (retryAttempt < 2) {
          console.info(`Retrying message after container restart (attempt ${retryAttempt + 1})...`);
          return this.sendMessageToContainer(sessionId, containerInfo, message, retryAttempt + 1);
        }
      }
      
      // Send message to the container's API with timeout
      const response = await axios.post(`http://localhost:${port}/process`, {
        message,
        sessionId
      }, { timeout: 30000 });  // 30 second timeout
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error sending message to container:', error);
      
      // If this is the first failure, try to restart the container
      if (retryAttempt < 2) {
        console.warn(`Attempting container restart for session ${sessionId} after error...`);
        try {
          // Stop the container if it's still running
          await containerInfo.container.stop().catch(() => {});
          
          // Start it again
          await containerInfo.container.start();
          
          // Wait a moment for initialization
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Retry the message
          return this.sendMessageToContainer(sessionId, containerInfo, message, retryAttempt + 1);
        } catch (restartError) {
          console.error(`Failed to restart container for session ${sessionId}:`, restartError);
          return { 
            success: false, 
            error: `Container failed and could not be restarted: ${error.message}`,
            details: error.response?.data || null
          };
        }
      }
      
      return { 
        success: false, 
        error: error.message,
        details: error.response?.data || null
      };
    }
  }

  /**
   * Sends a message to a Python process
   * Includes health check and process restart on failure
   */
  async sendMessageToProcess(sessionId, processInfo, message, retryAttempt = 0) {
    try {
      const { port, process: pythonProcess, agentPath, entryPoint } = processInfo;
      
      // Check if process is still running
      if (pythonProcess && pythonProcess.exitCode !== null) {
        console.warn(`Process for session ${sessionId} has exited with code ${pythonProcess.exitCode}, attempting to restart...`);
        
        if (retryAttempt < 2) {
          // Try to restart the process
          const newProcess = spawn('python', [entryPoint], {
            cwd: agentPath,
            env: {
              ...process.env,
              SESSION_ID: sessionId,
              PORT: port.toString()
            }
          });
          
          // Update process info in map
          processInfo.process = newProcess;
          this.processMap.set(sessionId, processInfo);
          
          // Set up event handlers
          newProcess.stderr.on('data', (data) => {
            console.error(`[Restarted ${sessionId}] Error: ${data.toString()}`);
          });
          
          newProcess.on('close', (code) => {
            console.log(`[Restarted ${sessionId}] Process exited with code ${code}`);
          });
          
          // Wait for process to start
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Retry the message
          return this.sendMessageToProcess(sessionId, processInfo, message, retryAttempt + 1);
        }
      }
      
      // Send message to the process's API with timeout
      try {
        const response = await axios.post(`http://localhost:${port}/process`, {
          message,
          sessionId
        }, { timeout: 30000 }); // 30 second timeout
        
        return { success: true, data: response.data };
      } catch (requestError) {
        // If we get a connection error and haven't retried yet, try to restart the process
        if (retryAttempt < 2) {
          console.warn(`Failed to connect to process for session ${sessionId}, attempting to restart...`);
          
          // Kill old process if it exists
          if (pythonProcess && pythonProcess.exitCode === null) {
            try {
              pythonProcess.kill();
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (killError) {
              console.error(`Failed to kill process for session ${sessionId}:`, killError);
            }
          }
          
          // Start a new process
          const newProcess = spawn('python', [entryPoint], {
            cwd: agentPath,
            env: {
              ...process.env,
              SESSION_ID: sessionId,
              PORT: port.toString()
            }
          });
          
          // Update process info
          processInfo.process = newProcess;
          this.processMap.set(sessionId, processInfo);
          
          // Wait for process to start
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Retry the message
          return this.sendMessageToProcess(sessionId, processInfo, message, retryAttempt + 1);
        }
        
        throw requestError;
      }
    } catch (error) {
      console.error('Error sending message to process:', error);
      return { 
        success: false, 
        error: error.message,
        details: error.response?.data || null 
      };
    }
  }

  /**
   * Sends a message to an N8N workflow
   */
  async sendMessageToN8n(sessionId, processInfo, message) {
    try {
      // Find webhook nodes in the workflow to determine the entry point
      const { workflow } = processInfo;
      const webhookNodes = (workflow.nodes || []).filter(node => 
        node.type === 'n8n-nodes-base.webhook');
      
      if (webhookNodes.length === 0) {
        return { 
          success: false, 
          error: 'No webhook entry point found in the workflow' 
        };
      }
      
      // Use the first webhook node
      const webhookNode = webhookNodes[0];
      const webhookPath = webhookNode.parameters?.path || '';
      
      // Send message to the webhook
      const response = await axios.post(`${this.n8nBaseUrl}/webhook/${webhookPath}`, {
        message,
        sessionId
      }, {
        headers: {
          'Authorization': `Bearer ${this.n8nApiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error sending message to N8N workflow:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sends a message to a Voiceflow agent
   */
  async sendMessageToVoiceflow(sessionId, processInfo, message) {
    try {
      // Get or initialize state
      const state = processInfo.state || {};
      
      // Send to Voiceflow runtime
      const response = await axios.post(`${this.vfRuntimeUrl}/interact`, {
        action: {
          type: 'text',
          payload: message
        },
        sessionID: sessionId,
        state
      }, {
        headers: {
          'Authorization': `Bearer ${this.vfApiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Update state
      processInfo.state = response.data.state;
      this.processMap.set(sessionId, processInfo);
      
      // Process Voiceflow response into a standard format
      const vfResponse = response.data;
      const formattedResponse = {
        response: vfResponse.trace
          .filter(item => item.type === 'speak' || item.type === 'text')
          .map(item => item.payload?.message || item.payload?.text || '')
          .join(' ')
      };
      
      return { success: true, data: formattedResponse };
    } catch (error) {
      console.error('Error sending message to Voiceflow agent:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Ends a session
   */
  async endSession(sessionId) {
    try {
      // Check if session exists
      const containerInfo = this.containerMap.get(sessionId);
      const processInfo = this.processMap.get(sessionId);
      
      if (!containerInfo && !processInfo) {
        return { success: false, error: 'Session not found' };
      }
      
      // End session based on type
      if (containerInfo) {
        // Docker container session
        const { container } = containerInfo;
        await container.stop();
        await container.remove();
        this.containerMap.delete(sessionId);
        return { success: true, message: 'Container stopped and removed' };
      } else if (processInfo) {
        // Process session
        if (processInfo.type === 'n8n' || processInfo.type === 'voiceflow') {
          // Just remove the session info for n8n and voiceflow
          this.processMap.delete(sessionId);
          return { success: true, message: `${processInfo.type} session ended` };
        } else {
          // Python process
          processInfo.process.kill();
          this.processMap.delete(sessionId);
          return { success: true, message: 'Process terminated' };
        }
      }
    } catch (error) {
      console.error(`Error ending session ${sessionId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Lists all active sessions
   */
  async listSessions() {
    try {
      const sessions = [];
      
      // Add container sessions
      for (const [sessionId, containerInfo] of this.containerMap.entries()) {
        sessions.push({
          sessionId,
          type: 'docker',
          startTime: containerInfo.startTime,
          uptime: Date.now() - containerInfo.startTime,
          containerId: containerInfo.containerId
        });
      }
      
      // Add process sessions
      for (const [sessionId, processInfo] of this.processMap.entries()) {
        sessions.push({
          sessionId,
          type: processInfo.type || 'process',
          startTime: processInfo.startTime,
          uptime: Date.now() - processInfo.startTime,
          ...(processInfo.type === 'n8n' ? { workflowName: processInfo.workflow.name } : {}),
          ...(processInfo.type === 'voiceflow' ? { vfPath: processInfo.vfPath } : {})
        });
      }
      
      return { success: true, sessions };
    } catch (error) {
      console.error('Error listing sessions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Gets information about a specific session
   */
  async getSessionInfo(sessionId) {
    try {
      // Check if session exists
      const containerInfo = this.containerMap.get(sessionId);
      const processInfo = this.processMap.get(sessionId);
      
      if (!containerInfo && !processInfo) {
        return { success: false, error: 'Session not found' };
      }
      
      // Return session info
      if (containerInfo) {
        return {
          success: true,
          sessionId,
          type: 'docker',
          startTime: containerInfo.startTime,
          uptime: Date.now() - containerInfo.startTime,
          containerId: containerInfo.containerId,
          port: containerInfo.port
        };
      } else {
        return {
          success: true,
          sessionId,
          type: processInfo.type || 'process',
          startTime: processInfo.startTime,
          uptime: Date.now() - processInfo.startTime,
          ...(processInfo.port ? { port: processInfo.port } : {}),
          ...(processInfo.type === 'n8n' ? { workflowName: processInfo.workflow.name } : {}),
          ...(processInfo.type === 'voiceflow' ? { vfPath: processInfo.vfPath } : {})
        };
      }
    } catch (error) {
      console.error(`Error getting session info for ${sessionId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cleans up all sessions
   */
  async cleanup() {
    try {
      // Clean up container sessions
      for (const [sessionId, containerInfo] of this.containerMap.entries()) {
        try {
          const { container } = containerInfo;
          await container.stop();
          await container.remove();
        } catch (error) {
          console.error(`Error cleaning up container session ${sessionId}:`, error);
        }
      }
      this.containerMap.clear();
      
      // Clean up process sessions
      for (const [sessionId, processInfo] of this.processMap.entries()) {
        try {
          if (processInfo.process) {
            processInfo.process.kill();
          }
        } catch (error) {
          console.error(`Error cleaning up process session ${sessionId}:`, error);
        }
      }
      this.processMap.clear();
      
      return { success: true, message: 'All sessions cleaned up' };
    } catch (error) {
      console.error('Error cleaning up sessions:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new SolnAgentsAdapter();