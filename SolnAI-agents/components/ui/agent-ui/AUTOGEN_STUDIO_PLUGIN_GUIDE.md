# SolnAI Components in AutoGen Studio - Integration Guide

This guide explains how to use SolnAI components within AutoGen Studio through our plugin system.

## Why Use SolnAI Components in AutoGen Studio?

By integrating SolnAI components into AutoGen Studio, you can:

1. **Leverage Both Platforms**: Combine SolnAI's specialized agent UI with AutoGen Studio's agent orchestration
2. **Create Hybrid Workflows**: Build workflows that use both SolnAI and AutoGen agents
3. **Enhance User Experience**: Add SolnAI's polished UI components to AutoGen Studio
4. **Exchange Data**: Pass data seamlessly between SolnAI and AutoGen agents

## Installation

### 1. Install the Plugin

```bash
# From npm
npm install @solnai/autogen-studio-plugin

# Or from the local directory
cd /path/to/SolnAI-agents/components/ui/agent-ui/autogen-studio-integration
npm install
npm run build
```

### 2. Configure AutoGen Studio

Add the SolnAI plugin to your AutoGen Studio configuration:

```javascript
// In your autogenstudio.config.js or equivalent
module.exports = {
  plugins: [
    // other plugins...
    require('@solnai/autogen-studio-plugin')
  ]
};
```

## Usage

### Adding SolnAI Components to AutoGen Studio

Once the plugin is installed, you'll have access to several new components in AutoGen Studio:

1. **SolnAI Chat Component**: A full-featured chat interface for SolnAI agents
2. **SolnAI Results Component**: Displays results from SolnAI agents
3. **SolnAI Bridge Component**: Transfers data between SolnAI and AutoGen

You can add these components:

- Through the Components Panel in the AutoGen Studio UI
- By adding them to workflow templates
- By adding them programmatically through the AutoGen Studio API

### Example: Creating a Research Workflow

Here's how to create a research workflow combining SolnAI and AutoGen Studio:

1. In AutoGen Studio, go to "Templates" > "SolnAI Research Workflow"
2. This template includes:
   - A SolnAI Research agent for gathering information
   - A results display component 
   - A bridge component for transferring data to AutoGen
   - An AutoGen agent for summarizing the results

### Manual Workflow Creation

You can also build a custom workflow:

1. Create a new workflow in AutoGen Studio
2. Add a "SolnAI Chat" node from the Components panel
3. Configure it to use a specific SolnAI agent type (e.g., "research-agent")
4. Add a "SolnAI Results" node and connect it to the Chat node
5. Add a "SolnAI Bridge" node to transfer data to AutoGen
6. Add AutoGen agents as needed and connect them to the bridge

## Component Reference

### SolnAI Chat Component

```javascript
{
  type: 'solnai-chat',
  props: {
    agentId: 'research-agent', // The SolnAI agent ID to use
    initialMessages: [], // Optional initial messages
    onResultsGenerated: (results) => {
      // Handle results
    }
  }
}
```

### SolnAI Results Component

```javascript
{
  type: 'solnai-results',
  props: {
    agentId: 'research-agent' // Should match the Chat component
  }
}
```

### SolnAI Bridge Component

```javascript
{
  type: 'solnai-bridge',
  props: {
    sessionId: 'autogen-session-id' // AutoGen Studio session ID
  }
}
```

## API Integration

You can also access SolnAI components programmatically:

```javascript
import { AutoGenStudio } from '@autogenstudio/sdk';
import { SolnAIChatComponent, registerSolnAIComponents } from '@solnai/autogen-studio-plugin';

// Initialize AutoGen Studio
const studio = AutoGenStudio.init();

// Register SolnAI components
registerSolnAIComponents(studio);

// Create a workflow with SolnAI components
studio.createWorkflow({
  nodes: [
    {
      id: 'solnai-research',
      type: 'solnai-chat',
      position: { x: 100, y: 100 },
      data: {
        agentId: 'research-agent',
        name: 'Research Agent'
      }
    },
    // More nodes...
  ],
  // Edges...
});
```

## Troubleshooting

### Common Issues

1. **Plugin Not Loading**: Make sure the plugin is correctly installed and registered in your AutoGen Studio configuration.

2. **Components Not Appearing**: Check the AutoGen Studio console for errors. If you see "SolnAI plugin initialized successfully", the plugin is loaded but there might be an issue with the components.

3. **Data Exchange Failing**: Ensure that both SolnAI and AutoGen Studio are properly configured and that the bridge component has the correct session ID.

### Debugging

The plugin logs various messages to the console to help with debugging:

- "Initializing SolnAI plugin for AutoGen Studio" - The plugin is starting to load
- "SolnAI plugin initialized successfully" - The plugin loaded successfully
- "Error registering SolnAI components" - There was an error registering components

## Example Applications

### 1. Advanced Research Assistant

Use SolnAI's research agent to gather information, then use AutoGen Studio's agents to analyze and summarize the findings.

### 2. Content Generation Pipeline

Use SolnAI to extract key points from documents or web pages, then use AutoGen Studio to generate content based on those points.

### 3. Data Analysis Workflow

Use SolnAI for data extraction and preprocessing, then use AutoGen Studio for advanced analysis and visualization.

## Resources

- [SolnAI Documentation](https://docs.solnai.com/)
- [AutoGen Studio Documentation](https://microsoft.github.io/autogen/docs/studio/)
- [Plugin GitHub Repository](https://github.com/your-org/solnai-autogen-plugin)