import { AlertCircle, RotateCcw, Save } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from '../shadcn/button';
import { Input } from '../shadcn/input';
import { Label } from '../shadcn/label';
import { ScrollArea } from '../shadcn/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../shadcn/select';
import { Switch } from '../shadcn/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../shadcn/tabs';
import { Textarea } from '../shadcn/textarea';
import { useAgentContext } from './context/AgentContext';

interface AgentSettingsProps {
  onSave?: (settings: Record<string, any>) => Promise<boolean>;
}

interface SettingField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'toggle' | 'textarea' | 'api-key';
  description?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  defaultValue?: any;
  category?: string;
}

/**
 * Component for displaying and editing agent settings
 */
const AgentSettings: React.FC<AgentSettingsProps> = ({ onSave }) => {
  const { currentAgent, settings: initialSettings, saveSettings, isLoading, error } = useAgentContext();
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize settings when agent changes or initial settings are loaded
  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings, currentAgent?.id]);

  // Get settings fields based on agent type
  const getSettingsFields = (): SettingField[] => {
    if (!currentAgent) return [];

    // Common settings for all agents
    const commonSettings: SettingField[] = [
      {
        id: 'name',
        label: 'Agent Name',
        type: 'text',
        description: 'Custom name for this agent instance',
        placeholder: 'My Custom Agent',
        defaultValue: currentAgent.name,
        category: 'general'
      },
      {
        id: 'description',
        label: 'Description',
        type: 'textarea',
        description: 'Custom description for this agent',
        placeholder: 'Describe what this agent does...',
        defaultValue: currentAgent.description,
        category: 'general'
      },
      {
        id: 'temperature',
        label: 'Temperature',
        type: 'number',
        description: 'Controls randomness in responses (0.0-1.0)',
        defaultValue: 0.7,
        category: 'advanced'
      },
      {
        id: 'maxTokens',
        label: 'Max Tokens',
        type: 'number',
        description: 'Maximum tokens to generate in responses',
        defaultValue: 1000,
        category: 'advanced'
      }
    ];

    // Add agent-specific settings based on agent type
    let agentSpecificSettings: SettingField[] = [];

    switch (currentAgent.type) {
      case 'research':
        agentSpecificSettings = [
          {
            id: 'searchDepth',
            label: 'Search Depth',
            type: 'select',
            description: 'How deep the agent should search for information',
            options: [
              { value: 'basic', label: 'Basic' },
              { value: 'standard', label: 'Standard' },
              { value: 'deep', label: 'Deep' }
            ],
            defaultValue: 'standard',
            category: 'general'
          },
          {
            id: 'sourcesCount',
            label: 'Number of Sources',
            type: 'number',
            description: 'Maximum number of sources to include',
            defaultValue: 5,
            category: 'general'
          },
          {
            id: 'includeCitations',
            label: 'Include Citations',
            type: 'toggle',
            description: 'Include source citations in responses',
            defaultValue: true,
            category: 'general'
          }
        ];
        break;
      case 'data':
        agentSpecificSettings = [
          {
            id: 'dataFormat',
            label: 'Data Format',
            type: 'select',
            description: 'Preferred format for data outputs',
            options: [
              { value: 'table', label: 'Table' },
              { value: 'json', label: 'JSON' },
              { value: 'csv', label: 'CSV' }
            ],
            defaultValue: 'table',
            category: 'general'
          },
          {
            id: 'visualizationEnabled',
            label: 'Enable Visualizations',
            type: 'toggle',
            description: 'Generate visualizations for data when possible',
            defaultValue: true,
            category: 'general'
          }
        ];
        break;
      case 'code':
        agentSpecificSettings = [
          {
            id: 'language',
            label: 'Primary Language',
            type: 'select',
            description: 'Preferred programming language',
            options: [
              { value: 'javascript', label: 'JavaScript' },
              { value: 'python', label: 'Python' },
              { value: 'rust', label: 'Rust' },
              { value: 'go', label: 'Go' },
              { value: 'java', label: 'Java' }
            ],
            defaultValue: 'javascript',
            category: 'general'
          },
          {
            id: 'includeTests',
            label: 'Include Tests',
            type: 'toggle',
            description: 'Generate tests for code when possible',
            defaultValue: true,
            category: 'general'
          },
          {
            id: 'codeStyle',
            label: 'Code Style',
            type: 'select',
            description: 'Preferred code style',
            options: [
              { value: 'standard', label: 'Standard' },
              { value: 'functional', label: 'Functional' },
              { value: 'oop', label: 'Object-Oriented' }
            ],
            defaultValue: 'standard',
            category: 'advanced'
          }
        ];
        break;
      // Add more agent types as needed
    }

    // Add API key settings if needed
    const apiSettings: SettingField[] = [
      {
        id: 'apiKey',
        label: 'API Key',
        type: 'api-key',
        description: 'API key for external services (stored securely)',
        placeholder: 'Enter API key...',
        category: 'api'
      }
    ];

    return [...commonSettings, ...agentSpecificSettings, ...apiSettings];
  };

  // Group settings by category
  const getSettingsByCategory = () => {
    const fields = getSettingsFields();
    return fields.reduce((acc, field) => {
      const category = field.category || 'general';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(field);
      return acc;
    }, {} as Record<string, SettingField[]>);
  };

  const handleChange = (id: string, value: any) => {
    setSettings(prev => ({ ...prev, [id]: value }));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Use the provided onSave prop if available, otherwise use the context saveSettings
      const success = onSave
        ? await onSave(settings)
        : await saveSettings(settings);

      if (success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError('Failed to save settings');
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'An error occurred while saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
    setSaveSuccess(false);
  };

  const renderField = (field: SettingField) => {
    const value = settings[field.id] !== undefined
      ? settings[field.id]
      : field.defaultValue;

    switch (field.type) {
      case 'text':
        return (
          <div className="space-y-2" key={field.id}>
            <Label htmlFor={field.id}>{field.label}</Label>
            {field.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{field.description}</p>
            )}
            <Input
              id={field.id}
              value={value || ''}
              placeholder={field.placeholder}
              onChange={(e) => handleChange(field.id, e.target.value)}
            />
          </div>
        );
      case 'number':
        return (
          <div className="space-y-2" key={field.id}>
            <Label htmlFor={field.id}>{field.label}</Label>
            {field.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{field.description}</p>
            )}
            <Input
              id={field.id}
              type="number"
              value={value || 0}
              onChange={(e) => handleChange(field.id, parseFloat(e.target.value))}
            />
          </div>
        );
      case 'select':
        return (
          <div className="space-y-2" key={field.id}>
            <Label htmlFor={field.id}>{field.label}</Label>
            {field.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{field.description}</p>
            )}
            <Select
              value={value || field.defaultValue}
              onValueChange={(val) => handleChange(field.id, val)}
            >
              <SelectTrigger id={field.id}>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case 'toggle':
        return (
          <div className="flex items-center justify-between space-y-0 rounded-lg border p-4" key={field.id}>
            <div className="space-y-0.5">
              <Label htmlFor={field.id}>{field.label}</Label>
              {field.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{field.description}</p>
              )}
            </div>
            <Switch
              id={field.id}
              checked={value || false}
              onCheckedChange={(checked) => handleChange(field.id, checked)}
            />
          </div>
        );
      case 'textarea':
        return (
          <div className="space-y-2" key={field.id}>
            <Label htmlFor={field.id}>{field.label}</Label>
            {field.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{field.description}</p>
            )}
            <Textarea
              id={field.id}
              value={value || ''}
              placeholder={field.placeholder}
              onChange={(e) => handleChange(field.id, e.target.value)}
              rows={4}
            />
          </div>
        );
      case 'api-key':
        return (
          <div className="space-y-2" key={field.id}>
            <Label htmlFor={field.id}>{field.label}</Label>
            {field.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{field.description}</p>
            )}
            <Input
              id={field.id}
              type="password"
              value={value || ''}
              placeholder={field.placeholder}
              onChange={(e) => handleChange(field.id, e.target.value)}
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (!currentAgent) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <h2 className="text-xl font-semibold mb-2">No Agent Selected</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center">
          Please select an agent to view and edit settings.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400">Loading settings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Loading Settings</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center">{error}</p>
      </div>
    );
  }

  const settingsByCategory = getSettingsByCategory();
  const categories = Object.keys(settingsByCategory);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">Agent Settings</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Configure settings for {currentAgent.name}
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              {categories.map((category) => (
                <TabsTrigger key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((category) => (
              <TabsContent key={category} value={category} className="space-y-4">
                {settingsByCategory[category].map((field) => renderField(field))}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </ScrollArea>

      <div className="p-4 border-t flex justify-between items-center">
        {saveError && (
          <div className="text-red-500 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {saveError}
          </div>
        )}
        {saveSuccess && (
          <div className="text-green-500">Settings saved successfully!</div>
        )}
        <div className="flex space-x-2 ml-auto">
          <Button variant="outline" onClick={handleReset} disabled={isSaving}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AgentSettings;
