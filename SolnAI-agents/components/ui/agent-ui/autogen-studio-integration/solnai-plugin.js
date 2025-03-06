/**
 * SolnAI Plugin for AutoGen Studio
 * 
 * This file is the entry point for integrating SolnAI components into AutoGen Studio.
 * It loads our React components and registers them with the AutoGen Studio UI.
 * 
 * Updated with WebSocket bridge for real-time communication between SolnAI and AutoGen Studio.
 */

// Import the AutoGen Studio plugin API
import { AutoGenStudioPlugin } from '@autogenstudio/sdk';

// Import SolnAI components
import { 
  SolnAIChatComponent, 
  SolnAIResultsComponent, 
  SolnAIBridgeComponent,
  registerSolnAIComponents
} from './SolnAIComponents';

// Import styling
import './solnai-styles.css';

/**
 * SolnAI Plugin definition
 */
const SolnAIPlugin = {
  name: 'solnai-integration',
  displayName: 'SolnAI Integration',
  description: 'Integrates SolnAI agent components with AutoGen Studio',
  version: '1.0.0',
  author: 'SolnAI Team',
  
  // Initialize the plugin
  initialize: async (api) => {
    console.log('Initializing SolnAI plugin for AutoGen Studio');
    
    // Register our components with AutoGen Studio
    registerSolnAIComponents(api);
    
    // Add menu items to AutoGen Studio
    api.addMenuItem({
      id: 'solnai-agents',
      label: 'SolnAI Agents',
      icon: 'Robot', // Use AutoGen Studio's icon system
      onClick: () => {
        // Open a dialog showing our SolnAI agents
        api.showDialog({
          title: 'SolnAI Agents',
          content: SolnAIBridgeComponent,
          props: {
            sessionId: api.getCurrentSessionId(),
          },
          width: 'large',
        });
      }
    });
    
    // Register workflow templates
    api.registerWorkflowTemplate({
      id: 'solnai-research-workflow',
      name: 'SolnAI Research Workflow',
      description: 'Research workflow using SolnAI and AutoGen Studio together',
      template: {
        nodes: [
          {
            id: 'research-node',
            type: 'solnai-chat',
            position: { x: 100, y: 100 },
            data: {
              agentId: 'research-agent',
              name: 'SolnAI Research',
            }
          },
          {
            id: 'results-node',
            type: 'solnai-results',
            position: { x: 500, y: 100 },
            data: {}
          },
          {
            id: 'autogen-summarize',
            type: 'autogen-agent',
            position: { x: 500, y: 300 },
            data: {
              agentType: 'assistant',
              name: 'AutoGen Summarizer',
            }
          },
          {
            id: 'bridge-node',
            type: 'solnai-bridge',
            position: { x: 300, y: 200 },
            data: {}
          }
        ],
        edges: [
          {
            id: 'e1',
            source: 'research-node',
            target: 'results-node',
          },
          {
            id: 'e2',
            source: 'results-node',
            target: 'bridge-node',
          },
          {
            id: 'e3',
            source: 'bridge-node',
            target: 'autogen-summarize',
          }
        ]
      }
    });
    
    // Register node types for workflow editor
    api.registerNodeTypes([
      {
        type: 'solnai-chat',
        label: 'SolnAI Chat',
        description: 'SolnAI agent chat interface',
        component: SolnAIChatComponent,
        defaultProps: {
          agentId: 'default-agent'
        },
        category: 'SolnAI',
        inputs: ['trigger'],
        outputs: ['results']
      },
      {
        type: 'solnai-results',
        label: 'SolnAI Results',
        description: 'Display SolnAI agent results',
        component: SolnAIResultsComponent,
        category: 'SolnAI',
        inputs: ['results'],
        outputs: ['data']
      },
      {
        type: 'solnai-bridge',
        label: 'SolnAI Bridge',
        description: 'Connect SolnAI with AutoGen',
        component: SolnAIBridgeComponent,
        category: 'SolnAI',
        inputs: ['input'],
        outputs: ['output']
      }
    ]);
    
    return {
      success: true,
      message: 'SolnAI plugin initialized successfully'
    };
  },
  
  // Clean up when the plugin is unloaded
  cleanup: async (api) => {
    console.log('Cleaning up SolnAI plugin');
    // Remove any event listeners or clean up resources
    
    return {
      success: true,
      message: 'SolnAI plugin cleaned up successfully'
    };
  }
};

// Export the plugin
export default SolnAIPlugin;