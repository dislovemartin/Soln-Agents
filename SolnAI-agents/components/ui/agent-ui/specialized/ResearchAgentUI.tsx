import React, { useState } from 'react';
import { Button } from '../../button';
import { Card, CardContent, CardHeader, CardTitle } from '../../card';
import { AgentChat } from '../AgentChat';
import { AgentResults } from '../AgentResults';

interface ResearchAgentUIProps {
  agentId: string;
  agentName: string;
  agentIcon?: string;
}

export function ResearchAgentUI({
  agentId,
  agentName,
  agentIcon = '🔍'
}: ResearchAgentUIProps) {
  const [query, setQuery] = useState('');
  const [searchDepth, setSearchDepth] = useState<'basic' | 'deep' | 'comprehensive'>('basic');
  const [sources, setSources] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Sample results
      const newResults = [
        {
          id: '1',
          title: 'Research Summary',
          content: `Research findings for: "${query}".\n\nThis is a comprehensive analysis based on multiple sources. The search depth was set to ${searchDepth}.`,
          type: 'text' as const,
          metadata: {
            sources: sources.length ? sources : ['Web search', 'Academic databases'],
            timestamp: new Date().toISOString(),
            searchDepth
          },
        },
        {
          id: '2',
          title: 'Key Insights',
          content: 'https://via.placeholder.com/800x400?text=Research+Visualization',
          type: 'image' as const,
          metadata: {
            type: 'visualization',
            query,
          },
        },
        {
          id: '3',
          title: 'Primary Source',
          content: 'https://example.com/research-paper',
          type: 'link' as const,
          metadata: {
            source: 'Academic Journal',
            relevance: 'High',
          },
        },
      ];

      setResults(newResults);
    } catch (error) {
      console.error('Error performing research:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCopyResult = (result: any) => {
    console.log('Copying result:', result);
    // In a real app, this would copy the result to the clipboard
    alert('Result copied to clipboard!');
  };

  const handleSaveResult = (result: any) => {
    console.log('Saving result:', result);
    // In a real app, this would save the result to the user's saved items
    alert('Result saved!');
  };

  const handleDownloadResult = (result: any) => {
    console.log('Downloading result:', result);
    // In a real app, this would download the result
    alert('Download started!');
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Research Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <span className="mr-2 text-2xl">{agentIcon}</span>
            {agentName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="query" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Research Query
              </label>
              <input
                id="query"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your research question or topic"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-800 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search Depth
              </label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant={searchDepth === 'basic' ? 'default' : 'outline'}
                  onClick={() => setSearchDepth('basic')}
                  className="flex-1"
                >
                  Basic
                </Button>
                <Button
                  type="button"
                  variant={searchDepth === 'deep' ? 'default' : 'outline'}
                  onClick={() => setSearchDepth('deep')}
                  className="flex-1"
                >
                  Deep
                </Button>
                <Button
                  type="button"
                  variant={searchDepth === 'comprehensive' ? 'default' : 'outline'}
                  onClick={() => setSearchDepth('comprehensive')}
                  className="flex-1"
                >
                  Comprehensive
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sources (Optional)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {['Academic', 'News', 'Books', 'Social Media'].map((source) => (
                  <Button
                    key={source}
                    type="button"
                    variant={sources.includes(source) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      if (sources.includes(source)) {
                        setSources(sources.filter(s => s !== source));
                      } else {
                        setSources([...sources, source]);
                      }
                    }}
                  >
                    {source}
                  </Button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full" disabled={isSearching}>
                {isSearching ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Researching...
                  </>
                ) : (
                  <>Research</>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Chat with {agentName}</CardTitle>
        </CardHeader>
        <CardContent>
          <AgentChat
            agentId={agentId}
            agentName={agentName}
            agentIcon={agentIcon}
          />
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Research Results</CardTitle>
          </CardHeader>
          <CardContent>
            <AgentResults
              results={results}
              onCopy={handleCopyResult}
              onSave={handleSaveResult}
              onDownload={handleDownloadResult}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ResearchAgentUI;
