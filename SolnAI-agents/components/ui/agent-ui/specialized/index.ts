export { default as ResearchAgentUI } from './ResearchAgentUI';
export { default as YouTubeSummaryUI } from './YouTubeSummaryUI';
export { default as DataAnalysisUI } from './DataAnalysisUI';
export { default as AutoGenIntegrationUI } from './AutoGenIntegrationUI';
export { default as AutoGenTeamPage } from './AutoGenTeamPage';
export { default as TeamChat } from './TeamChatComponent';
export { default as TeamSelector } from './TeamSelectorComponent';

// Map of agent IDs to their specialized UI components
export const AGENT_UI_MAP = {
  'research-agent': 'ResearchAgentUI',
  'advanced-web-researcher': 'ResearchAgentUI',
  'youtube-summary': 'YouTubeSummaryUI',
  'youtube-summary-agent': 'YouTubeSummaryUI',
  'data-analysis': 'DataAnalysisUI',
  'data-analysis-agent': 'DataAnalysisUI',
  'autogen-agent': 'AutoGenIntegrationUI',
  'autogen-studio-agent': 'AutoGenIntegrationUI',
  'autogen-team': 'AutoGenTeamPage',
  'multi-agent-team': 'AutoGenTeamPage',
};
