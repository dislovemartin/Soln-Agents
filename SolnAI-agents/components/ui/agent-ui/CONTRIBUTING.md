# Contributing to SolnAI Agent UI

Thank you for your interest in contributing to the SolnAI Agent UI components! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please read and follow our [Code of Conduct](./CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Bugs

If you find a bug, please report it by creating an issue. When filing an issue, make sure to answer these questions:

1. What version of the library are you using?
2. What did you do?
3. What did you expect to see?
4. What did you see instead?

### Suggesting Enhancements

If you want to suggest an enhancement or new feature, please create an issue with the following information:

1. A clear and descriptive title
2. A detailed description of the proposed enhancement
3. Examples of how the enhancement would be used
4. Any relevant screenshots or mockups

### Pull Requests

We welcome pull requests! To submit a pull request:

1. Fork the repository
2. Create a new branch for your changes
3. Make your changes
4. Write tests for your changes
5. Run the tests to make sure they pass
6. Submit a pull request

#### Pull Request Guidelines

- Follow the coding style of the project
- Write clear, descriptive commit messages
- Include tests for new features or bug fixes
- Update documentation as needed
- Keep pull requests focused on a single change
- Link to any relevant issues

## Development Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/SolnAI-agents.git
   cd SolnAI-agents/components/ui/agent-ui
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

- `AgentApp.tsx`: Main container component
- `AgentLayout.tsx`: Layout component
- `AgentHeader.tsx`: Header component
- `AgentSidebar.tsx`: Sidebar component
- `AgentContent.tsx`: Content component
- `AgentChat.tsx`: Chat component
- `AgentResults.tsx`: Results component
- `AgentSettings.tsx`: Settings component
- `context/`: Context providers
- `hooks/`: Custom hooks
- `services/`: API and WebSocket services
- `demo/`: Demo components

## Testing

Run tests with:

```bash
npm test
```

## Building

Build the project with:

```bash
npm run build
```

## Documentation

Please update the documentation when making changes:

- Update the README.md file as needed
- Update or add JSDoc comments to components and functions
- Update the demo if necessary

## License

By contributing to this project, you agree that your contributions will be licensed under the project's [MIT License](./LICENSE).
