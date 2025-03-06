import React, { useState } from 'react';
import { Button } from '../../button';
import { Card, CardContent, CardHeader, CardTitle } from '../../card';
import { AgentChat } from '../AgentChat';
import { AgentResults } from '../AgentResults';

interface DataAnalysisUIProps {
  agentId: string;
  agentName: string;
  agentIcon?: string;
}

export function DataAnalysisUI({
  agentId,
  agentName,
  agentIcon = '📊'
}: DataAnalysisUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [analysisType, setAnalysisType] = useState<'exploratory' | 'statistical' | 'predictive'>('exploratory');
  const [visualizationType, setVisualizationType] = useState<'auto' | 'bar' | 'line' | 'scatter' | 'pie'>('auto');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [fileDetails, setFileDetails] = useState<{
    name: string;
    size: string;
    type: string;
    preview?: string;
  } | null>(null);

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      // Set file details
      setFileDetails({
        name: selectedFile.name,
        size: `${(selectedFile.size / 1024).toFixed(2)} KB`,
        type: selectedFile.type,
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsAnalyzing(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Sample results
      const newResults = [
        {
          id: '1',
          title: 'Data Analysis Summary',
          content: `Analysis of file: "${fileDetails?.name}".\n\nThis is an ${analysisType} analysis of the data. Visualization type: ${visualizationType}.`,
          type: 'text' as const,
          metadata: {
            fileName: fileDetails?.name,
            fileSize: fileDetails?.size,
            fileType: fileDetails?.type,
            analysisType,
            visualizationType,
            timestamp: new Date().toISOString(),
          },
        },
        {
          id: '2',
          title: 'Data Visualization',
          content: 'https://via.placeholder.com/800x500?text=Data+Visualization',
          type: 'image' as const,
          metadata: {
            type: visualizationType,
            dataPoints: '120',
          },
        },
        {
          id: '3',
          title: 'Statistical Summary',
          content: `
Mean: 42.5
Median: 38.2
Mode: 35.0
Standard Deviation: 12.3
Min: 10.2
Max: 95.7
          `,
          type: 'text' as const,
          metadata: {
            type: 'statistics',
          },
        },
        {
          id: '4',
          title: 'Data Insights',
          content: `
1. There is a strong positive correlation between variables X and Y (r=0.85)
2. The data shows a bimodal distribution, suggesting two distinct groups
3. Outliers were detected in the upper quartile, potentially skewing results
4. Time series analysis reveals a cyclical pattern with period of approximately 7 days
          `,
          type: 'text' as const,
          metadata: {
            type: 'insights',
          },
        },
      ];

      setResults(newResults);
    } catch (error) {
      console.error('Error analyzing data:', error);
    } finally {
      setIsAnalyzing(false);
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
      {/* Data Analysis Form */}
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
              <label htmlFor="dataFile" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Upload Data File
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600 dark:text-gray-400">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-primary hover:text-primary/90 focus-within:outline-none"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                        accept=".csv,.xlsx,.json,.txt"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    CSV, Excel, JSON, or TXT up to 10MB
                  </p>
                </div>
              </div>
            </div>

            {fileDetails && (
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
                <p className="text-sm font-medium">Selected file:</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{fileDetails.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Size: {fileDetails.size}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Type: {fileDetails.type}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Analysis Type
              </label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant={analysisType === 'exploratory' ? 'default' : 'outline'}
                  onClick={() => setAnalysisType('exploratory')}
                  className="flex-1"
                >
                  Exploratory
                </Button>
                <Button
                  type="button"
                  variant={analysisType === 'statistical' ? 'default' : 'outline'}
                  onClick={() => setAnalysisType('statistical')}
                  className="flex-1"
                >
                  Statistical
                </Button>
                <Button
                  type="button"
                  variant={analysisType === 'predictive' ? 'default' : 'outline'}
                  onClick={() => setAnalysisType('predictive')}
                  className="flex-1"
                >
                  Predictive
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Visualization Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={visualizationType === 'auto' ? 'default' : 'outline'}
                  onClick={() => setVisualizationType('auto')}
                  size="sm"
                >
                  Auto
                </Button>
                <Button
                  type="button"
                  variant={visualizationType === 'bar' ? 'default' : 'outline'}
                  onClick={() => setVisualizationType('bar')}
                  size="sm"
                >
                  Bar Chart
                </Button>
                <Button
                  type="button"
                  variant={visualizationType === 'line' ? 'default' : 'outline'}
                  onClick={() => setVisualizationType('line')}
                  size="sm"
                >
                  Line Chart
                </Button>
                <Button
                  type="button"
                  variant={visualizationType === 'scatter' ? 'default' : 'outline'}
                  onClick={() => setVisualizationType('scatter')}
                  size="sm"
                >
                  Scatter Plot
                </Button>
                <Button
                  type="button"
                  variant={visualizationType === 'pie' ? 'default' : 'outline'}
                  onClick={() => setVisualizationType('pie')}
                  size="sm"
                >
                  Pie Chart
                </Button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full"
                disabled={isAnalyzing || !file}
              >
                {isAnalyzing ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Analyzing Data...
                  </>
                ) : (
                  <>Analyze Data</>
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
            <CardTitle>Analysis Results</CardTitle>
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

export default DataAnalysisUI;
