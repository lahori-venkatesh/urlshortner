import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Database, 
  Server, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  BarChart3,
  Cpu,
  HardDrive
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PerformanceData {
  cache: {
    cacheEntries: number;
    cacheHits: number;
    cacheMisses: number;
    hitRatio: number;
    avgCacheOpTime: number;
    estimatedMemoryUsage: number;
  };
  database: {
    totalQueries: number;
    avgQueryTime: number;
    slowQueries: Record<string, number>;
  };
  api: {
    totalRequests: number;
    avgResponseTime: number;
    slowEndpoints: Record<string, number>;
    errorRate: number;
  };
  system: {
    maxMemory: number;
    totalMemory: number;
    usedMemory: number;
    freeMemory: number;
    memoryUsagePercent: number;
    availableProcessors: number;
  };
}

interface HealthData {
  healthy: boolean;
  status: string;
  systemStats: any;
  recommendations: Record<string, string>;
}

const PerformanceMonitoring: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  useEffect(() => {
    loadPerformanceData();
    loadHealthData();

    if (autoRefresh) {
      const interval = setInterval(() => {
        loadPerformanceData();
        loadHealthData();
      }, refreshInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const loadPerformanceData = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
      const response = await fetch(`${apiUrl}/v1/monitoring/performance`);
      const result = await response.json();

      if (result.success) {
        setPerformanceData(result.data);
      } else {
        setError(result.message || 'Failed to load performance data');
      }
    } catch (err) {
      console.error('Error loading performance data:', err);
      setError('Failed to connect to monitoring service');
    } finally {
      setLoading(false);
    }
  };

  const loadHealthData = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
      const response = await fetch(`${apiUrl}/v1/monitoring/health`);
      const result = await response.json();

      if (result.success) {
        setHealthData(result.data);
      }
    } catch (err) {
      console.error('Error loading health data:', err);
    }
  };

  const clearAllCaches = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
      const response = await fetch(`${apiUrl}/v1/monitoring/cache/clear-all`, {
        method: 'POST'
      });
      const result = await response.json();

      if (result.success) {
        alert('All caches cleared successfully');
        loadPerformanceData();
      } else {
        alert('Failed to clear caches: ' + result.message);
      }
    } catch (err) {
      console.error('Error clearing caches:', err);
      alert('Failed to clear caches');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading performance data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="w-6 h-6 text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
        <button 
          onClick={() => {
            setError(null);
            setLoading(true);
            loadPerformanceData();
          }}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Monitoring</h2>
          <p className="text-gray-600">Real-time system performance and health metrics</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Auto-refresh:</label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded px-2 py-1"
              disabled={!autoRefresh}
            >
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>1m</option>
              <option value={300}>5m</option>
            </select>
          </div>
          
          <button
            onClick={() => {
              loadPerformanceData();
              loadHealthData();
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={clearAllCaches}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
          >
            <Zap className="w-4 h-4" />
            <span>Clear Caches</span>
          </button>
        </div>
      </div>

      {/* Health Status */}
      {healthData && (
        <div className={`rounded-lg p-6 ${healthData.healthy ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {healthData.healthy ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
                <p className={`text-sm ${healthData.healthy ? 'text-green-700' : 'text-yellow-700'}`}>
                  Status: {healthData.status}
                </p>
              </div>
            </div>
            
            {Object.keys(healthData.recommendations).length > 0 && (
              <div className="bg-white rounded-lg p-4 max-w-md">
                <h4 className="font-medium text-gray-900 mb-2">Recommendations:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {Object.entries(healthData.recommendations).map(([key, value]) => (
                    <li key={key}>• {value}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Performance Metrics Grid */}
      {performanceData && (
        <>
          {/* Cache Performance */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Database className="w-5 h-5 mr-2 text-blue-600" />
                Cache Performance
              </h3>
              <div className="text-sm text-gray-500">
                Hit Ratio: {performanceData.cache.hitRatio.toFixed(1)}%
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {formatNumber(performanceData.cache.cacheEntries)}
                </div>
                <div className="text-sm text-blue-700">Cache Entries</div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">
                  {formatNumber(performanceData.cache.cacheHits)}
                </div>
                <div className="text-sm text-green-700">Cache Hits</div>
              </div>
              
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">
                  {formatNumber(performanceData.cache.cacheMisses)}
                </div>
                <div className="text-sm text-red-700">Cache Misses</div>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-lg font-semibold text-gray-900">
                  {performanceData.cache.avgCacheOpTime.toFixed(1)}ms
                </div>
                <div className="text-sm text-gray-600">Avg Cache Operation Time</div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-lg font-semibold text-gray-900">
                  {formatBytes(performanceData.cache.estimatedMemoryUsage)}
                </div>
                <div className="text-sm text-gray-600">Estimated Memory Usage</div>
              </div>
            </div>
          </div>

          {/* API Performance */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-green-600" />
                API Performance
              </h3>
              <div className="text-sm text-gray-500">
                Error Rate: {performanceData.api.errorRate.toFixed(2)}%
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">
                  {formatNumber(performanceData.api.totalRequests)}
                </div>
                <div className="text-sm text-green-700">Total Requests</div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {performanceData.api.avgResponseTime.toFixed(0)}ms
                </div>
                <div className="text-sm text-blue-700">Avg Response Time</div>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-600">
                  {Object.keys(performanceData.api.slowEndpoints).length}
                </div>
                <div className="text-sm text-yellow-700">Slow Endpoints</div>
              </div>
            </div>
          </div>

          {/* Database Performance */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Server className="w-5 h-5 mr-2 text-purple-600" />
                Database Performance
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {formatNumber(performanceData.database.totalQueries)}
                </div>
                <div className="text-sm text-purple-700">Total Queries</div>
              </div>
              
              <div className="bg-indigo-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-indigo-600">
                  {performanceData.database.avgQueryTime.toFixed(0)}ms
                </div>
                <div className="text-sm text-indigo-700">Avg Query Time</div>
              </div>
              
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">
                  {Object.keys(performanceData.database.slowQueries).length}
                </div>
                <div className="text-sm text-red-700">Slow Queries</div>
              </div>
            </div>
          </div>

          {/* System Resources */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Cpu className="w-5 h-5 mr-2 text-orange-600" />
                System Resources
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Memory Usage</span>
                    <span>{performanceData.system.memoryUsagePercent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        performanceData.system.memoryUsagePercent > 85 ? 'bg-red-600' :
                        performanceData.system.memoryUsagePercent > 70 ? 'bg-yellow-600' : 'bg-green-600'
                      }`}
                      style={{ width: `${performanceData.system.memoryUsagePercent}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Used Memory</div>
                    <div className="font-semibold">{formatBytes(performanceData.system.usedMemory)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Free Memory</div>
                    <div className="font-semibold">{formatBytes(performanceData.system.freeMemory)}</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-lg font-semibold text-gray-900">
                    {performanceData.system.availableProcessors}
                  </div>
                  <div className="text-sm text-gray-600">Available Processors</div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-lg font-semibold text-gray-900">
                    {formatBytes(performanceData.system.maxMemory)}
                  </div>
                  <div className="text-sm text-gray-600">Max Memory</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PerformanceMonitoring;