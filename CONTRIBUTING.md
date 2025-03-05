# Contributing to SolnAI

Thank you for your interest in contributing to SolnAI! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Environment](#development-environment)
- [Coding Standards](#coding-standards)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

Please read and follow our [Code of Conduct](./CODE_OF_CONDUCT.md) to foster an inclusive and respectful community.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/SolnAI.git`
3. Set up the development environment (see below)
4. Create a new branch for your feature or bug fix: `git checkout -b feature/your-feature-name`
5. Make your changes
6. Commit your changes following our commit conventions
7. Push to your branch: `git push origin feature/your-feature-name`
8. Submit a pull request to the main repository

## Development Environment

### Prerequisites

- Node.js (see [.nvmrc](./.nvmrc) for version)
- npm or yarn
- Docker (for containerized development)

### Setup

1. Copy `.env.example` to `.env` and configure as needed
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   # For frontend
   cd frontend && npm run dev
   
   # For backend
   cd server && npm run dev
   ```

### Using Docker

For containerized development:

```bash
docker-compose up
```

## Coding Standards

### General Guidelines

- Write clean, readable, and maintainable code
- Follow the principle of least surprise
- Keep functions and methods small and focused
- Use meaningful variable and function names
- Add comments for complex logic, but prefer self-documenting code

### TypeScript

- Use TypeScript for all new code
- Define explicit types for function parameters and return values
- Use interfaces for complex object shapes
- Avoid using `any` type unless absolutely necessary
- Use type guards for runtime type checking

### JavaScript/TypeScript Style

- Use 2 spaces for indentation
- Use semicolons at the end of statements
- Use single quotes for strings
- Use template literals for string interpolation
- Use camelCase for variables and functions
- Use PascalCase for classes and interfaces
- Use UPPER_SNAKE_CASE for constants

### React

- Use functional components with hooks
- Keep components small and focused
- Use React.memo for performance optimization when appropriate
- Follow the React hooks rules
- Use custom hooks to extract reusable logic

### CSS/Styling

- Use Tailwind CSS for styling
- Follow the utility-first approach
- Extract common patterns to components

## Commit Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Changes that do not affect the meaning of the code (formatting, etc.)
- `refactor`: Code changes that neither fix a bug nor add a feature
- `perf`: Performance improvements
- `test`: Adding or correcting tests
- `chore`: Changes to the build process or auxiliary tools

Examples:
```
feat(frontend): add user profile page
fix(server): correct authentication token validation
docs: update README with new deployment instructions
```

## Pull Request Process

1. Ensure your code follows our coding standards
2. Update documentation as necessary
3. Add or update tests as necessary
4. Ensure all tests pass
5. Fill out the pull request template completely
6. Request a review from maintainers
7. Address any feedback from reviewers

## Testing

- Write tests for all new features and bug fixes
- Ensure existing tests pass before submitting a pull request
- Follow the testing patterns established in the codebase
- Run tests before committing:
  ```bash
  npm test
  ```

## Documentation

- Update documentation for any changes to APIs, features, or behavior
- Use JSDoc comments for functions and classes
- Keep README and other documentation up to date
- Document complex algorithms and design decisions

---

Thank you for contributing to SolnAI! Your efforts help make this project better for everyone.
