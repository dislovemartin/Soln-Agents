import React, { useState } from 'react';
import { useAgentContext } from './context/AgentContext';
import AgentChat from './AgentChat';
import AgentResults from './AgentResults';
import AgentSettings from './AgentSettings';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../shadcn/tabs';
import { Spinner } from '../shadcn/spinner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../shadcn/card';

/**
 * Component that displays the content for the current agent
 * Includes tabs for chat, results, and settings
 */
const AgentContent: React.FC = () => {
  const { currentAgent, messages, results, settings, isLoading, error, sendMessage, saveSettings } = useAgentContext();
  const [activeTab, setActiveTab] = useState<string>('chat');

  // Handle message sending
  const handleSendMessage = async (message: string) => {
    await sendMessage(message);
  };

  // Handle saving settings
  const handleSaveSettings = async (newSettings: Record<string, any>) => {
    return await saveSettings(newSettings);
  };

  // Handle copying result
  const handleCopyResult = (resultId: string) => {
    const result = results.find(r => r.id === resultId);
    if (result) {
      navigator.clipboard.writeText(result.content);
      // You could add a toast notification here
      console.log('Result copied to clipboard');
    }
  };

  // Handle saving result
  const handleSaveResult = (resultId: string) => {
    // This would typically save to a database or local storage
    console.log('Saving result', resultId);
    // You could add a toast notification here
  };

  // Handle downloading result
  const handleDownloadResult = (resultId: string) => {
    const result = results.find(r => r.id === resultId);
    if (result) {
      // Create a blob and download it
      const blob = new Blob([result.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `result-${resultId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('Result downloaded');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-[450px]">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
            <CardDescription>There was a problem loading the agent</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentAgent) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-[450px]">
          <CardHeader>
            <CardTitle>No Agent Selected</CardTitle>
            <CardDescription>Please select an agent from the sidebar</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center mb-4">
          <div className="text-4xl mr-3">{currentAgent.icon}</div>
          <div>
            <h1 className="text-2xl font-bold">{currentAgent.name}</h1>
            <p className="text-gray-500 dark:text-gray-400">{currentAgent.description}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-[400px]">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-auto">
        <TabsContent value="chat" className="h-full m-0">
          <AgentChat
            messages={messages}
            onSendMessage={handleSendMessage}
          />
        </TabsContent>

        <TabsContent value="results" className="h-full m-0">
          <AgentResults
            results={results}
            onCopyResult={handleCopyResult}
            onSaveResult={handleSaveResult}
            onDownloadResult={handleDownloadResult}
          />
        </TabsContent>

        <TabsContent value="settings" className="h-full m-0">
          <AgentSettings
            settings={settings}
            onSaveSettings={handleSaveSettings}
          />
        </TabsContent>
      </div>
    </div>
  );
};

export default AgentContent;
