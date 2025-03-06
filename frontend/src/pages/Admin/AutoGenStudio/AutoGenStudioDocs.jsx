import React from "react";
import { useEffect } from "react";
import paths from "../../../utils/paths";
import { Link } from "react-router-dom";

export const AutoGenStudioDocs = () => {
  useEffect(() => {
    // Scroll to top on component mount
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full flex flex-col">
      <div className="flex flex-col gap-y-4 overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              AutoGen Studio Integration Guide
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Learn how to integrate SolnAI with Microsoft's AutoGen Studio
            </p>
          </div>
          <Link 
            to={paths.admin.autogenStudioSettings} 
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            AutoGen Studio Settings
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg overflow-auto">
          <div className="prose dark:prose-invert max-w-full">
            <h2>What is AutoGen Studio?</h2>
            <p>
              <a href="https://microsoft.github.io/autogen/docs/studio/" target="_blank" rel="noopener noreferrer">AutoGen Studio</a> is a low-code interface built on top of Microsoft's AutoGen framework that helps you:
            </p>
            <ul>
              <li>Rapidly prototype AI agents</li>
              <li>Enhance agents with skills</li>
              <li>Compose agents into workflows</li>
              <li>Interact with agents to accomplish tasks</li>
            </ul>

            <h2>Integration Features</h2>
            <p>
              The SolnAI integration with AutoGen Studio provides:
            </p>
            <ul>
              <li><strong>Bidirectional Agent Communication:</strong> SolnAI agents can communicate with AutoGen agents and vice versa</li>
              <li><strong>Shared Workflows:</strong> Create workflows that combine SolnAI and AutoGen agents</li>
              <li><strong>UI Components:</strong> Use SolnAI UI components in AutoGen Studio</li>
              <li><strong>Data Exchange:</strong> Share data between SolnAI and AutoGen agents</li>
            </ul>

            <h2>Getting Started</h2>
            <h3>1. Install AutoGen Studio</h3>
            <p>
              First, you need to install and run AutoGen Studio:
            </p>
            <pre>
              <code>
                # Install AutoGen Studio
                pip install autogenstudio
                
                # Run AutoGen Studio server
                autogenstudio ui --port 8081 --host 0.0.0.0
              </code>
            </pre>

            <h3>2. Configure SolnAI Integration</h3>
            <p>
              In the <Link to={paths.admin.autogenStudioSettings}>AutoGen Studio Settings</Link> page:
            </p>
            <ol>
              <li>Enable the AutoGen Studio integration</li>
              <li>Set the URL to your AutoGen Studio instance (default: <code>http://localhost:8081</code>)</li>
              <li>Click "Save Settings"</li>
            </ol>

            <h3>3. Install SolnAI Plugin</h3>
            <p>
              After saving the settings, click the "Install Plugin" button to install the SolnAI plugin to AutoGen Studio.
            </p>

            <h3>4. Access AutoGen Studio</h3>
            <p>
              Open AutoGen Studio in your browser:
            </p>
            <ol>
              <li>Go to <code>http://localhost:8081</code> (or the URL you configured)</li>
              <li>You should see SolnAI components in the AutoGen Studio UI</li>
            </ol>

            <h2>Using SolnAI Components in AutoGen Studio</h2>
            <p>
              Once the integration is set up, you can use SolnAI components in AutoGen Studio:
            </p>

            <h3>Available Components</h3>
            <ul>
              <li><strong>SolnAI Chat:</strong> A chat interface for interacting with SolnAI agents</li>
              <li><strong>SolnAI Results:</strong> Display results from SolnAI agents</li>
              <li><strong>SolnAI Bridge:</strong> Connect SolnAI agents with AutoGen agents</li>
            </ul>

            <h3>Adding Components to a Workflow</h3>
            <p>
              In AutoGen Studio:
            </p>
            <ol>
              <li>Create a new workflow or open an existing one</li>
              <li>In the sidebar, look for the "SolnAI" category</li>
              <li>Drag and drop SolnAI components onto the workflow canvas</li>
              <li>Connect the components with other AutoGen components</li>
            </ol>

            <h3>Predefined Workflows</h3>
            <p>
              The SolnAI plugin includes predefined workflows:
            </p>
            <ul>
              <li><strong>SolnAI Research Workflow:</strong> Use SolnAI's research agent and AutoGen Studio's analysis capabilities</li>
              <li><strong>SolnAI Content Generation:</strong> Extract information with SolnAI and generate content with AutoGen Studio</li>
            </ul>

            <h2>Using AutoGen Studio Agents in SolnAI</h2>
            <p>
              You can also use AutoGen Studio agents in SolnAI:
            </p>
            <ol>
              <li>Create and configure agents in AutoGen Studio</li>
              <li>In SolnAI, use the AutoGen integration to access those agents</li>
              <li>Create workflows that incorporate both SolnAI and AutoGen agents</li>
            </ol>

            <h2>Troubleshooting</h2>
            <h3>Common Issues</h3>
            <ul>
              <li>
                <strong>Connection Error:</strong> Make sure AutoGen Studio is running and accessible at the configured URL
              </li>
              <li>
                <strong>Plugin Installation Failed:</strong> Check the AutoGen Studio logs for errors
              </li>
              <li>
                <strong>Components Not Appearing:</strong> Restart AutoGen Studio after installing the plugin
              </li>
            </ul>

            <h3>Logs and Debugging</h3>
            <p>
              For debugging:
            </p>
            <ul>
              <li>Check the SolnAI server logs for connection issues</li>
              <li>Check the AutoGen Studio logs for plugin loading issues</li>
              <li>Check the browser console for JavaScript errors</li>
            </ul>

            <h2>Additional Resources</h2>
            <ul>
              <li><a href="https://microsoft.github.io/autogen/docs/studio/" target="_blank" rel="noopener noreferrer">AutoGen Studio Documentation</a></li>
              <li><a href="https://microsoft.github.io/autogen/docs/Use-Cases/agent_chat" target="_blank" rel="noopener noreferrer">AutoGen Agent Chat Documentation</a></li>
              <li><a href="https://microsoft.github.io/autogen/docs/topics/llm_configuration" target="_blank" rel="noopener noreferrer">AutoGen LLM Configuration</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoGenStudioDocs;