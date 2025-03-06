import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { 
  ArrowUpDown, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Filter, 
  RefreshCcw,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  BarChart2 as BarChartIcon,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AgentAnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [executionHistory, setExecutionHistory] = useState([]);
  const [filters, setFilters] = useState({
    agentType: '',
    startDate: null,
    endDate: null,
    interval: 'day',
  });

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // Build query parameters from filters
      const params = new URLSearchParams();
      if (filters.agentType) params.append('agentType', filters.agentType);
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());

      const response = await fetch(`/api/experimental/agent-analytics/stats?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Failed to fetch agent stats');
      }
    } catch (error) {
      console.error('Error fetching agent stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTimeSeriesData = async () => {
    setIsLoading(true);
    try {
      // Build query parameters from filters
      const params = new URLSearchParams();
      if (filters.agentType) params.append('agentType', filters.agentType);
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
      params.append('interval', filters.interval);

      const response = await fetch(`/api/experimental/agent-analytics/time-series?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setTimeSeriesData(data);
      } else {
        console.error('Failed to fetch time series data');
      }
    } catch (error) {
      console.error('Error fetching time series data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExecutionHistory = async () => {
    setIsLoading(true);
    try {
      // Build query parameters from filters
      const params = new URLSearchParams();
      if (filters.agentType) params.append('agentType', filters.agentType);
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
      params.append('limit', '50'); // Limit to 50 records

      const response = await fetch(`/api/experimental/agent-analytics/history?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setExecutionHistory(data);
      } else {
        console.error('Failed to fetch execution history');
      }
    } catch (error) {
      console.error('Error fetching execution history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({
      ...filters,
      [key]: value,
    });
  };

  const applyFilters = () => {
    fetchStats();
    fetchTimeSeriesData();
    fetchExecutionHistory();
  };

  const resetFilters = () => {
    setFilters({
      agentType: '',
      startDate: null,
      endDate: null,
      interval: 'day',
    });
  };

  useEffect(() => {
    fetchStats();
    fetchTimeSeriesData();
    fetchExecutionHistory();
  }, []);

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Success
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
            <XCircle className="mr-1 h-3 w-3" />
            Error
          </span>
        );
      case 'timeout':
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            Timeout
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
            {status}
          </span>
        );
    }
  };

  const renderAgentTypeBadge = (type) => {
    switch (type) {
      case 'solnai':
        return (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
            SolnAI
          </span>
        );
      case 'autogen':
        return (
          <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
            AutoGen
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
            {type}
          </span>
        );
    }
  };

  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) return `${seconds}s`;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Agent Analytics Dashboard</h1>
      
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agent Type</label>
            <Select
              value={filters.agentType}
              onValueChange={(value) => handleFilterChange('agentType', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Agent Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Agent Types</SelectItem>
                <SelectItem value="solnai">SolnAI</SelectItem>
                <SelectItem value="autogen">AutoGen</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.startDate ? format(filters.startDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.startDate}
                  onSelect={(date) => handleFilterChange('startDate', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.endDate ? format(filters.endDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.endDate}
                  onSelect={(date) => handleFilterChange('endDate', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Interval</label>
            <Select
              value={filters.interval}
              onValueChange={(value) => handleFilterChange('interval', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hour">Hourly</SelectItem>
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-end mt-4 space-x-2">
          <Button 
            variant="outline" 
            onClick={resetFilters}
            className="flex items-center"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Reset Filters
          </Button>
          <Button 
            onClick={applyFilters}
            className="flex items-center"
          >
            <Filter className="mr-2 h-4 w-4" />
            Apply Filters
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="history">Execution History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <div className="text-3xl font-bold">{stats?.totalExecutions || 0}</div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <div className="text-3xl font-bold">
                    {stats?.successRate ? `${stats.successRate.toFixed(1)}%` : '0%'}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg. Execution Time</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <div className="text-3xl font-bold">
                    {stats?.avgExecutionTime ? formatDuration(stats.avgExecutionTime) : 'N/A'}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Failed Executions</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <div className="text-3xl font-bold">{stats?.failedExecutions || 0}</div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Agents</CardTitle>
                <CardDescription>Most frequently used agents</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : stats?.topAgents?.length > 0 ? (
                  <div className="space-y-4">
                    {stats.topAgents.map((agent, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                          {index + 1}
                        </div>
                        <div className="ml-4 flex-1">
                          <p className="text-sm font-semibold">{agent.agentName}</p>
                          <p className="text-xs text-muted-foreground">{agent.agentId}</p>
                        </div>
                        <div className="text-sm font-semibold">{agent.count} executions</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    No agent execution data available
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Execution Status</CardTitle>
                <CardDescription>Breakdown by execution outcome</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : stats?.totalExecutions > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Success', value: stats.successfulExecutions, color: '#10b981' },
                          { name: 'Failed', value: stats.failedExecutions, color: '#ef4444' },
                          { name: 'Timeout', value: stats.timeoutExecutions, color: '#f59e0b' },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {[
                          { name: 'Success', value: stats.successfulExecutions, color: '#10b981' },
                          { name: 'Failed', value: stats.failedExecutions, color: '#ef4444' },
                          { name: 'Timeout', value: stats.timeoutExecutions, color: '#f59e0b' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No execution data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="charts">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Agent Executions Over Time</CardTitle>
                <CardDescription>
                  Number of executions over {filters.interval === 'hour' ? 'hours' : 
                                            filters.interval === 'day' ? 'days' : 
                                            filters.interval === 'week' ? 'weeks' : 'months'}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                {isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : timeSeriesData?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={timeSeriesData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time_period" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="total" stroke="#8884d8" name="Total" />
                      <Line type="monotone" dataKey="success" stroke="#10b981" name="Success" />
                      <Line type="monotone" dataKey="error" stroke="#ef4444" name="Error" />
                      <Line type="monotone" dataKey="timeout" stroke="#f59e0b" name="Timeout" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No time series data available
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Average Execution Time</CardTitle>
                <CardDescription>
                  Average execution time over {filters.interval === 'hour' ? 'hours' : 
                                              filters.interval === 'day' ? 'days' : 
                                              filters.interval === 'week' ? 'weeks' : 'months'}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                {isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : timeSeriesData?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={timeSeriesData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time_period" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${formatDuration(value)}`, 'Avg. Time']} />
                      <Legend />
                      <Bar dataKey="avg_time" fill="#8884d8" name="Avg. Execution Time" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No time series data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Execution History</CardTitle>
              <CardDescription>Recent agent executions</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : executionHistory?.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agent</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Execution Time</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {executionHistory.map((execution) => (
                        <TableRow key={execution.id}>
                          <TableCell className="font-medium">{execution.agent_name}</TableCell>
                          <TableCell>{renderAgentTypeBadge(execution.agent_type)}</TableCell>
                          <TableCell>{renderStatusBadge(execution.status)}</TableCell>
                          <TableCell>{formatDuration(execution.execution_time)}</TableCell>
                          <TableCell>
                            {new Date(execution.created_at).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  No execution history available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentAnalyticsDashboard;