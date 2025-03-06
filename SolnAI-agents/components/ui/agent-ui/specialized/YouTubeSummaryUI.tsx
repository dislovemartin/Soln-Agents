import React, { useState } from 'react';
import { Button } from '../../button';
import { Card, CardContent, CardHeader, CardTitle } from '../../card';
import { AgentChat } from '../AgentChat';
import { AgentResults } from '../AgentResults';

interface YouTubeSummaryUIProps {
  agentId: string;
  agentName: string;
  agentIcon?: string;
}

export function YouTubeSummaryUI({
  agentId,
  agentName,
  agentIcon = '📹'
}: YouTubeSummaryUIProps) {
  const [videoUrl, setVideoUrl] = useState('');
  const [summaryType, setSummaryType] = useState<'concise' | 'detailed' | 'transcript'>('concise');
  const [includeTimestamps, setIncludeTimestamps] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [videoDetails, setVideoDetails] = useState<{
    title?: string;
    channel?: string;
    thumbnail?: string;
    duration?: string;
  } | null>(null);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;

    setIsProcessing(true);

    try {
      // Simulate API call to get video details
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Sample video details
      setVideoDetails({
        title: 'Sample YouTube Video',
        channel: 'Sample Channel',
        thumbnail: 'https://via.placeholder.com/480x360?text=YouTube+Thumbnail',
        duration: '10:30',
      });

      // Simulate API call for summary
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Sample results
      const newResults = [
        {
          id: '1',
          title: 'Video Summary',
          content: `Summary of video: "${videoDetails?.title || 'Sample Video'}".\n\nThis is a ${summaryType} summary of the video content. ${includeTimestamps ? 'Key timestamps are included.' : ''}`,
          type: 'text' as const,
          metadata: {
            videoUrl,
            summaryType,
            includeTimestamps,
            timestamp: new Date().toISOString(),
          },
        },
        {
          id: '2',
          title: 'Key Points',
          content: '1. First key point from the video\n2. Second key point from the video\n3. Third key point from the video',
          type: 'text' as const,
          metadata: {
            type: 'key-points',
          },
        },
        {
          id: '3',
          title: 'Video Thumbnail',
          content: videoDetails?.thumbnail || 'https://via.placeholder.com/480x360?text=YouTube+Thumbnail',
          type: 'image' as const,
          metadata: {
            source: 'YouTube',
          },
        },
      ];

      setResults(newResults);
    } catch (error) {
      console.error('Error processing video:', error);
    } finally {
      setIsProcessing(false);
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
      {/* YouTube Summary Form */}
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
              <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                YouTube Video URL
              </label>
              <input
                id="videoUrl"
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-800 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Summary Type
              </label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant={summaryType === 'concise' ? 'default' : 'outline'}
                  onClick={() => setSummaryType('concise')}
                  className="flex-1"
                >
                  Concise
                </Button>
                <Button
                  type="button"
                  variant={summaryType === 'detailed' ? 'default' : 'outline'}
                  onClick={() => setSummaryType('detailed')}
                  className="flex-1"
                >
                  Detailed
                </Button>
                <Button
                  type="button"
                  variant={summaryType === 'transcript' ? 'default' : 'outline'}
                  onClick={() => setSummaryType('transcript')}
                  className="flex-1"
                >
                  Transcript
                </Button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="includeTimestamps"
                type="checkbox"
                checked={includeTimestamps}
                onChange={(e) => setIncludeTimestamps(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="includeTimestamps" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Include timestamps in summary
              </label>
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full" disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Processing Video...
                  </>
                ) : (
                  <>Summarize Video</>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Video Details */}
      {videoDetails && (
        <Card>
          <CardHeader>
            <CardTitle>Video Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-shrink-0">
                <img
                  src={videoDetails.thumbnail}
                  alt={videoDetails.title}
                  className="w-full md:w-64 rounded-md"
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{videoDetails.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{videoDetails.channel}</p>
                <p className="text-gray-600 dark:text-gray-400">Duration: {videoDetails.duration}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
            <CardTitle>Summary Results</CardTitle>
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

export default YouTubeSummaryUI;
