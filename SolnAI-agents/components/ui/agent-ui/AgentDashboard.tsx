import React, { useState } from 'react';
import AgentContent from './AgentContent';
import AgentLayout from './AgentLayout';
import AgentSidebar from './AgentSidebar';

interface AgentCategory {
  name: string;
  agents: {
    id: string;
    name: string;
    description: string;
    icon: string;
  }[];
}

interface AgentDashboardProps {
  initialAgentId?: string;
  agentCategories?: AgentCategory[];
}

export function AgentDashboard({
  initialAgentId = 'research-agent',
  agentCategories
}: AgentDashboardProps) {
  const [activeAgentId, setActiveAgentId] = useState(initialAgentId);
  const [isLoading, setIsLoading] = useState(false);

  // Default agent categories if none provided
  const defaultAgentCategories: AgentCategory[] = [
    {
      name: 'Research',
      agents: [
        {
          id: 'research-agent',
          name: 'Research Agent',
          description: 'General purpose research assistant',
          icon: '🔍',
        },
        {
          id: 'advanced-web-researcher',
          name: 'Advanced Web Researcher',
          description: 'Performs deep web research with advanced filtering',
          icon: '🌐',
        }
      ]
    },
    {
      name: 'Media',
      agents: [
        {
          id: 'youtube-summary',
          name: 'YouTube Summarizer',
          description: 'Summarize YouTube videos',
          icon: '📹',
        }
      ]
    },
    {
      name: 'Analysis',
      agents: [
        {
          id: 'data-analysis',
          name: 'Data Analysis',
          description: 'Analyze data and generate insights',
          icon: '📊',
        }
      ]
    }
  ];

  const effectiveAgentCategories = agentCategories || defaultAgentCategories;

  // Flatten all agents into a single map for easy lookup
  const allAgents = effectiveAgentCategories.flatMap(category =>
    category.agents
  ).reduce((acc, agent) => {
    acc[agent.id] = agent;
    return acc;
  }, {} as Record<string, any>);

  // Get the current agent
  const currentAgent = allAgents[activeAgentId] || Object.values(allAgents)[0];

  const handleAgentChange = (agentId: string) => {
    setIsLoading(true);
    setActiveAgentId(agentId);

    // Simulate loading delay
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  return (
    <AgentLayout>
      <AgentSidebar
        isOpen={true}
        agentCategories={effectiveAgentCategories}
        activeAgentId={activeAgentId}
        onSelectAgent={handleAgentChange}
      />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading agent...</p>
              </div>
            </div>
          ) : (
            <AgentContent
              agentId={currentAgent.id}
              agentName={currentAgent.name}
              agentIcon={currentAgent.icon}
              agentDescription={currentAgent.description}
            />
          )}
        </div>
      </div>
    </AgentLayout>
  );
}

export default AgentDashboard;
