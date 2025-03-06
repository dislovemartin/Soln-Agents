import React, { useState, useEffect } from 'react';
import { useAgent } from '../hooks/useAgent';
import { useAutoGenStudio } from '../hooks/useAutoGenStudio';
import AutoGenStudioPanel from '../AutoGenStudioPanel';
import { Button } from '../shadcn/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../shadcn/tabs';

/**
 * Specialized UI for AutoGen Studio integration
 * This component combines SolnAI Agent capabilities with AutoGen Studio
 */
const AutoGenIntegrationUI: React.FC = () => {
  const { agent, sendMessage, messages, results } = useAgent();
  const { agents, fetchAgents } = useAutoGenStudio();
  const [activeTab, setActiveTab] = useState<string>('soln-agent');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Fetch AutoGen agents on component mount
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Export SolnAI agent results to AutoGen agent
  const handleExportToAutoGen = async () => {
    setIsLoading(true);
    try {
      // Send the results from SolnAI agent to AutoGen
      // This is just a simple example - you would implement the actual logic
      // to convert SolnAI results to a format that AutoGen can use
      const resultsText = results
        .map(result => `${result.title}:\n${result.content}`)
        .join('\n\n');
        
      await sendMessage(`Export the following results to AutoGen: ${resultsText}`);
      
      // Switch to AutoGen tab after export
      setActiveTab('autogen');
    } catch (error) {
      console.error('Failed to export to AutoGen:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="soln-agent">SolnAI Agent</TabsTrigger>
            <TabsTrigger value="autogen">AutoGen Studio</TabsTrigger>
          </TabsList>
          
          {activeTab === 'soln-agent' && results.length > 0 && (
            <Button 
              onClick={handleExportToAutoGen}
              disabled={isLoading}
            >
              Export to AutoGen
            </Button>
          )}
        </div>
        
        <TabsContent value="soln-agent" className="flex-1">
          {/* 
            This is a placeholder for SolnAI agent UI
            In a real implementation, you would include your 
            AgentChat component or similar here
          */}
          <div className="h-full bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Agent: {agent?.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {agent?.description}
            </p>
            
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 h-[calc(100%-120px)] overflow-auto">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`mb-4 p-3 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-blue-50 dark:bg-blue-900/20 ml-12' 
                      : 'bg-gray-50 dark:bg-gray-800 mr-12'
                  }`}
                >
                  <p className="font-semibold">{msg.role === 'user' ? 'You' : agent?.name}</p>
                  <p>{msg.content}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="autogen" className="flex-1">
          <AutoGenStudioPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutoGenIntegrationUI;