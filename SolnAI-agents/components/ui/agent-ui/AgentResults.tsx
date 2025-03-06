import { Copy, Download, ExternalLink, Save, Search, X } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '../shadcn/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../shadcn/card';
import { Input } from '../shadcn/input';
import { ScrollArea } from '../shadcn/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '../shadcn/tabs';
import { AgentResult } from './hooks/useAgent';

interface AgentResultsProps {
  results: AgentResult[];
  onCopyResult: (resultId: string) => void;
  onSaveResult: (resultId: string) => void;
  onDownloadResult: (resultId: string) => void;
}

/**
 * Component for displaying agent results
 */
const AgentResults: React.FC<AgentResultsProps> = ({
  results,
  onCopyResult,
  onSaveResult,
  onDownloadResult
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');

  // Filter results based on search query and active tab
  const filteredResults = results.filter(result => {
    const matchesSearch = result.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || result.type === activeTab;
    return matchesSearch && matchesTab;
  });

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Render result content based on type
  const renderResultContent = (result: AgentResult) => {
    switch (result.type) {
      case 'image':
        return (
          <div className="flex justify-center">
            <img
              src={result.content}
              alt="Result"
              className="max-w-full max-h-[300px] object-contain rounded-md"
            />
          </div>
        );
      case 'link':
        return (
          <div className="flex items-center">
            <a
              href={result.content}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline flex items-center"
            >
              {result.content}
              <ExternalLink className="ml-1 h-4 w-4" />
            </a>
          </div>
        );
      case 'file':
        return (
          <div className="flex items-center">
            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md flex items-center">
              <span className="mr-2">📄</span>
              <span>{result.metadata?.fileName || 'File'}</span>
            </div>
          </div>
        );
      case 'data':
        return (
          <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-x-auto">
            {typeof result.content === 'string'
              ? result.content
              : JSON.stringify(result.content, null, 2)}
          </pre>
        );
      case 'text':
      default:
        return (
          <div className="whitespace-pre-wrap">
            {result.content}
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Results</h2>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              placeholder="Search results..."
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="image">Images</TabsTrigger>
            <TabsTrigger value="link">Links</TabsTrigger>
            <TabsTrigger value="file">Files</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {filteredResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <h3 className="text-xl font-medium mb-2">No results found</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">
                {results.length === 0
                  ? "The agent hasn't generated any results yet."
                  : "No results match your current filters."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredResults.map((result) => (
                <Card key={result.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center text-base font-medium">
                      {result.type === 'text' && '📝'}
                      {result.type === 'image' && '🖼️'}
                      {result.type === 'link' && '🔗'}
                      {result.type === 'file' && '📄'}
                      {result.type === 'data' && '📊'}
                      <span className="ml-2">
                        {result.metadata?.title || `${result.type.charAt(0).toUpperCase() + result.type.slice(1)} Result`}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderResultContent(result)}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatTimestamp(result.timestamp)}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onCopyResult(result.id)}
                        title="Copy to clipboard"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSaveResult(result.id)}
                        title="Save result"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDownloadResult(result.id)}
                        title="Download result"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default AgentResults;
