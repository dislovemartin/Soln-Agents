import { Loader2, Plus, RefreshCw, Send } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAutoGenStudio } from './hooks/useAutoGenStudio';
import { Badge } from './shadcn/badge';
import { Button } from './shadcn/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './shadcn/card';
import { ScrollArea } from './shadcn/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './shadcn/tabs';
import { Textarea } from './shadcn/textarea';

interface AutoGenStudioPanelProps {
  className?: string;
}

/**
 * Component for displaying and interacting with AutoGen Studio agents
 */
const AutoGenStudioPanel: React.FC<AutoGenStudioPanelProps> = ({ className }) => {
  const {
    agents,
    currentAgent,
    currentSession,
    messages,
    skills,
    loading,
    error,
    fetchAgents,
    fetchAgent,
    createSession,
    sendMessage,
    fetchMessages,
    fetchSkills,
    addSkillToAgent,
    setCurrentAgent
  } = useAutoGenStudio();

  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [taskInput, setTaskInput] = useState<string>('');
  const [messageInput, setMessageInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('chat');
  const [selectedSkillId, setSelectedSkillId] = useState<string>('');

  // Fetch agents and skills on component mount
  useEffect(() => {
    fetchAgents();
    fetchSkills();
  }, [fetchAgents, fetchSkills]);

  // Handle agent selection
  const handleAgentSelect = async (agentId: string) => {
    setSelectedAgentId(agentId);
    await fetchAgent(agentId);
  };

  // Handle session creation
  const handleCreateSession = async () => {
    if (!selectedAgentId || !taskInput) return;

    const session = await createSession(selectedAgentId, taskInput);
    if (session) {
      setTaskInput('');
      setActiveTab('chat');
      await fetchMessages(session.id);
    }
  };

  // Handle message sending
  const handleSendMessage = async () => {
    if (!messageInput || !currentSession) return;

    const userMessage = messageInput;
    setMessageInput('');
    await sendMessage(userMessage);
  };

  // Handle adding a skill to an agent
  const handleAddSkill = async () => {
    if (!selectedSkillId || !currentAgent) return;

    await addSkillToAgent(currentAgent.id, selectedSkillId);
    setSelectedSkillId('');
  };

  // Render message based on role
  const renderMessage = (message: any) => {
    const isUser = message.role === 'user';

    return (
      <div
        key={message.id}
        className={`flex flex-col mb-4 ${isUser ? 'items-end' : 'items-start'}`}
      >
        <div className={`max-w-[80%] p-3 rounded-lg ${isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
          <div className="font-semibold mb-1">{isUser ? 'You' : currentAgent?.name || 'Assistant'}</div>
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
          </TabsList>

          {loading && <Loader2 className="animate-spin h-5 w-5 text-muted-foreground" />}
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <TabsContent value="agents" className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map(agent => (
              <Card
                key={agent.id}
                className={`cursor-pointer transition-all ${selectedAgentId === agent.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => handleAgentSelect(agent.id)}
              >
                <CardHeader>
                  <CardTitle>{agent.name}</CardTitle>
                  <CardDescription>{agent.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {agent.skills.map(skill => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAgentSelect(agent.id);
                      setActiveTab('chat');
                    }}
                  >
                    Select
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <Button
            variant="outline"
            className="mt-4"
            onClick={fetchAgents}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Agents
          </Button>
        </TabsContent>

        <TabsContent value="chat" className="flex flex-col flex-1 overflow-hidden">
          {currentAgent ? (
            <>
              <div className="mb-4">
                <h3 className="text-lg font-semibold">{currentAgent.name}</h3>
                <p className="text-muted-foreground">{currentAgent.description}</p>
              </div>

              {!currentSession && (
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle>Start a new session</CardTitle>
                    <CardDescription>Describe the task you want to accomplish</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={taskInput}
                      onChange={(e) => setTaskInput(e.target.value)}
                      placeholder="Describe your task..."
                      className="min-h-[100px]"
                    />
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={handleCreateSession}
                      disabled={!taskInput || loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Create Session
                    </Button>
                  </CardFooter>
                </Card>
              )}

              {currentSession && (
                <>
                  <div className="flex-1 overflow-hidden mb-4">
                    <ScrollArea className="h-full pr-4">
                      <div className="space-y-4">
                        {messages.length === 0 ? (
                          <div className="text-center text-muted-foreground py-8">
                            No messages yet. Start the conversation!
                          </div>
                        ) : (
                          messages.map(renderMessage)
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  <div className="flex items-end gap-2">
                    <Textarea
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 min-h-[80px]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageInput || loading}
                      className="mb-[3px]"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Select an agent to start chatting
            </div>
          )}
        </TabsContent>

        <TabsContent value="skills" className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skills.map(skill => (
              <Card key={skill.id}>
                <CardHeader>
                  <CardTitle>{skill.name}</CardTitle>
                  <CardDescription>{skill.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    <strong>Parameters:</strong>
                    <pre className="bg-muted p-2 rounded-md mt-2 overflow-x-auto">
                      {JSON.stringify(skill.parameters, null, 2)}
                    </pre>
                  </div>
                </CardContent>
                <CardFooter>
                  {currentAgent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addSkillToAgent(currentAgent.id, skill.id)}
                      disabled={loading || currentAgent.skills.includes(skill.id)}
                    >
                      {currentAgent.skills.includes(skill.id) ? 'Already Added' : 'Add to Agent'}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>

          <Button
            variant="outline"
            className="mt-4"
            onClick={fetchSkills}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Skills
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutoGenStudioPanel;
