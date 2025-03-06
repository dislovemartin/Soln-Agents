/**
 * Type definitions for SolnAI AutoGen Studio plugin
 */

import { FC } from 'react';

/**
 * Props for SolnAI components
 */
export interface SolnAIComponentProps {
  agentId?: string;
  sessionId?: string;
  onResultsGenerated?: (results: any[]) => void;
  initialMessages?: any[];
  className?: string;
}

/**
 * SolnAI Chat Component
 */
export const SolnAIChatComponent: FC<SolnAIComponentProps>;

/**
 * SolnAI Results Component
 */
export const SolnAIResultsComponent: FC<SolnAIComponentProps>;

/**
 * SolnAI Bridge Component
 */
export const SolnAIBridgeComponent: FC<SolnAIComponentProps>;

/**
 * Register SolnAI components with AutoGen Studio
 */
export function registerSolnAIComponents(autogenStudio: any): boolean;

/**
 * AutoGen Studio Plugin interface
 */
export interface AutoGenStudioPlugin {
  name: string;
  displayName: string;
  description: string;
  version: string;
  author: string;
  initialize: (api: any) => Promise<{
    success: boolean;
    message: string;
  }>;
  cleanup: (api: any) => Promise<{
    success: boolean;
    message: string;
  }>;
}

/**
 * SolnAI Plugin for AutoGen Studio
 */
declare const SolnAIPlugin: AutoGenStudioPlugin;

export default SolnAIPlugin;