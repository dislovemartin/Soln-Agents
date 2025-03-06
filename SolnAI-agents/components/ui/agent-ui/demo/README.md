# SolnAI Agent UI Demo

This directory contains demo components and examples for the SolnAI Agent UI system.

## Overview

The demo components showcase how to use the SolnAI Agent UI components in a real application. They provide examples of:

- Setting up the `AgentApp` component with proper configuration
- Integrating with API and WebSocket services
- Handling user authentication
- Managing dark mode
- Implementing responsive layouts

## Components

- `DemoPage.tsx`: A complete example page that demonstrates the full Agent UI system

## Running the Demo

To run the demo:

1. Make sure you have all dependencies installed:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Navigate to the demo page in your browser (typically at `http://localhost:3000/demo`)

## Customizing the Demo

You can customize the demo by:

1. Modifying the `apiConfig` and `webSocketConfig` in `DemoPage.tsx` to point to your actual backend services
2. Updating the mock user data with real authentication
3. Implementing actual API calls instead of the mock implementations

## Using as a Reference

The demo components are designed to be used as a reference for implementing the SolnAI Agent UI in your own applications. Feel free to copy and adapt the code as needed.

## Notes

- The demo uses mock data and services. In a real application, you would connect to actual backend services.
- For production use, make sure to implement proper error handling and loading states.
- The demo is designed to work with the SolnAI Agent UI components and may require adjustments for other environments.
