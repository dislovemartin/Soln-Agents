# SolnAI Plugin for AutoGen Studio

This plugin integrates SolnAI Agent UI components with Microsoft's AutoGen Studio, allowing you to use SolnAI's powerful agent UI capabilities within the AutoGen Studio environment. It now includes a WebSocket bridge for real-time communication between platforms.

## Features

- **SolnAI Chat Component**: Embed SolnAI agent chat interfaces directly in AutoGen Studio
- **SolnAI Results Component**: Display results from SolnAI agents in AutoGen Studio
- **SolnAI Bridge Component**: Facilitate data exchange between SolnAI agents and AutoGen agents
- **Real-time WebSocket Communication**: Enable bidirectional real-time updates between platforms
- **Workflow Integration**: Use SolnAI components in AutoGen Studio workflow templates
- **Custom Node Types**: Add SolnAI node types to AutoGen Studio's workflow editor
- **Analytics Dashboard**: Track and analyze agent execution statistics across both platforms

## Installation

### Option 1: NPM Package

```bash
npm install @solnai/autogen-studio-plugin
```

### Option 2: Manual Installation

1. Download the latest release from the GitHub repository
2. Extract the files to your AutoGen Studio plugins directory
3. Register the plugin in your AutoGen Studio configuration

## Usage

### Adding the Plugin to AutoGen Studio

In your AutoGen Studio configuration file, add:

```javascript
// autogenstudio.config.js
module.exports = {
  plugins: [
    // other plugins...
    require('@solnai/autogen-studio-plugin')
  ]
};
```

Or load it dynamically:

```javascript
import { loadPlugin } from '@autogenstudio/sdk';
import SolnAIPlugin from '@solnai/autogen-studio-plugin';

// Load the plugin
loadPlugin(SolnAIPlugin);
```

### Using SolnAI Components

Once installed, SolnAI components will be available in AutoGen Studio:

1. In the AutoGen Studio UI, look for the "SolnAI" section in the components panel
2. Drag and drop SolnAI components into your workflow
3. Configure the components through the properties panel

### Creating a SolnAI + AutoGen Workflow

The plugin includes a pre-configured workflow template:

1. In AutoGen Studio, go to "Templates" > "SolnAI Research Workflow"
2. This template includes:
   - A SolnAI Research agent for gathering information
   - A results display component
   - A bridge component for transferring data to AutoGen
   - An AutoGen agent for summarizing or processing the results

## Component Reference

### SolnAI Chat Component

Props:
- `agentId` (string): The ID of the SolnAI agent to use
- `initialMessages` (array): Initial messages to populate the chat
- `onResultsGenerated` (function): Callback when new results are generated
- `className` (string): Additional CSS classes

### SolnAI Results Component

Props:
- `agentId` (string): The ID of the SolnAI agent to display results for
- `className` (string): Additional CSS classes

### SolnAI Bridge Component

Props:
- `sessionId` (string): The ID of the AutoGen Studio session to connect with
- `className` (string): Additional CSS classes

## Development

### Building from Source

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the plugin:
   ```bash
   npm run build
   ```
4. The compiled plugin will be in the `dist` directory

### Local Development

For local development with hot reloading:

```bash
npm run dev
```

## License

MIT License

## Acknowledgements

This plugin was developed by the SolnAI Team for integration with Microsoft's AutoGen Studio platform.