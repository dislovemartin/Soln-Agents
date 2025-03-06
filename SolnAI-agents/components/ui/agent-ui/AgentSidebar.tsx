import { Menu, Search, X } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '../shadcn/button';
import { Input } from '../shadcn/input';
import { ScrollArea } from '../shadcn/scroll-area';
import { useAgentContext } from './context/AgentContext';

/**
 * Sidebar component for displaying and selecting agents
 */
const AgentSidebar: React.FC = () => {
  const { agents, currentAgent, changeAgent } = useAgentContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Group agents by type
  const agentsByType = agents.reduce((acc, agent) => {
    const type = agent.type || 'Other';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(agent);
    return acc;
  }, {} as Record<string, typeof agents>);

  // Filter agents based on search query
  const filteredAgentTypes = Object.keys(agentsByType).filter(type => {
    return agentsByType[type].some(agent =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Toggle sidebar on mobile
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Mobile toggle button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={toggleSidebar}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:z-0
        `}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-bold mb-4">Agents</h2>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                placeholder="Search agents..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1.5 h-6 w-6"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4">
              {filteredAgentTypes.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No agents found
                </p>
              ) : (
                filteredAgentTypes.map((type) => (
                  <div key={type} className="mb-6">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      {type}
                    </h3>
                    <div className="space-y-1">
                      {agentsByType[type]
                        .filter(agent =>
                          agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          agent.description.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((agent) => (
                          <Button
                            key={agent.id}
                            variant={currentAgent?.id === agent.id ? "default" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => {
                              changeAgent(agent.id);
                              setIsOpen(false); // Close sidebar on mobile after selection
                            }}
                          >
                            <span className="mr-2">{agent.icon}</span>
                            {agent.name}
                          </Button>
                        ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

export default AgentSidebar;
