import { StagehandOptions } from '@browserbasehq/stagehand';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Default configuration for Stagehand tests
const config: StagehandOptions = {
  headless: process.env.HEADLESS === 'true',
  extensionPaths: [path.join(__dirname, '../../dist')],
  useCache: false,
  showBrowser: true,
  defaultTimeout: 60000,
  browserOptions: {
    args: [
      '--disable-extensions-except=${path.join(__dirname, "../../dist")}',
      '--load-extension=${path.join(__dirname, "../../dist")}',
    ],
  },
  apiKey: process.env.OPENAI_API_KEY, // Optional: For AI-powered testing
};

export default config;