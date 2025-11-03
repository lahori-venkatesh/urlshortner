import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ServerIcon,
  CpuChipIcon,
  CircleStackIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  TrashIcon,
  PlayIcon,
  StopIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import { adminApiEndpoints } from '../../services/api';
import { useSystemMetrics, useSystemHealth } from '../../services/websocket';
import MetricCard from '../../components/charts/MetricCard';
import LineChart from '../../components/charts/LineChart';
import DataTable, { Column } from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';

interface SystemJob {
  id: string;
  name: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PENDING' | 'CANCELLED';
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  type: string;
}

const SystemPage: React.FC = () => {
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);
  const [cacheKey, setCacheKey] = useState('');
  
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  // Real-time system data
  const { data: systemMetrics } = useSystemMetrics();
  const { data: systemHealth } = useSystemHealth();

  // Fetch system data
  const { data: healthData } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => adminApiEndpoints.system.health(),
    refetchInterval: 30000,
  });

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['system-jobs'],
    queryFn: () => adminApiEndpoints.system.jobs.list(),
    refetchInterval: 5000,
  });

  const { data: cacheStats } = useQuery({
    queryKey: ['cache-stats'],
    queryFn: () => adminApiEndpoints.system.cache.stats(),
    refetchInterval: 10000,
  });

  // Mutations
  const retryJobMutation = useMutation({
    mutationFn: (jobId: string) => adminApiEndpoints.system.jobs.retry(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries(['system-jobs']);
      toast.success('Job retry initiated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to retry job');
    },
  });

  const cancelJobMutation = useMutation({
    mutationFn: (jobId: string) => adminApiEndpoints.system.jobs.cancel(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries(['system-jobs']);
      toast.success('Job cancelled');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel job');
    },
  });

  const clearCacheMutation = useMutation({
    mutationFn: (key?: string) => adminApiEndpoints.system.cache.clear(key),
    onSuccess: () => {
      queryClient.invalidateQueries(['cache-stats']);
      toast.success('Cache cleared successfully');
      setShowClearCacheModal(false);
      setCacheKey('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to clear cache');
    },
  });

  const jobs: SystemJob[] = jobsData?.data?.data || [];
  const health = healthData?.data?.data || {};
  const cache = cacheStats?.data?.data || {};

  // Sample metrics data
  const systemMetricsData = [
    {
      name: 'CPU Usage',
      data: [
        { x: '2024-01-01T00:00:00Z', y: systemMetrics?.cpuUsage || 45 },
        { x: '2024-01-01T01:00:00Z', y: 52 },
        { x: '2024-01-01T02:00:00Z', y: 48 },
        { x: '2024-01-01T03:00:00Z', y: 55 },
        { x: '2024-01-01T04:00:00Z', y: 42 },
        { x: '2024-01-01T05:00:00Z', y: systemMetrics?.cpuUsage || 38 },
      ],
    },
  ];

  const memoryMetricsData = [
    {
      name: 'Memory Usage',
      data: [
        { x: '2024-01-01T00:00:00Z', y: systemMetrics?.memoryUsage || 65 },
        { x: '2024-01-01T01:00:00Z', y: 68 },
        { x: '2024-01-01T02:00:00Z', y: 72 },
        { x: '2024-01-01T03:00:00Z', y: 70 },
        { x: '2024-01-01T04:00:00Z', y: 66 },
        { x: '2024-01-01T05:00:00Z', y: systemMetrics?.memoryUsage || 63 },
      ],
    },
  ];

  const getJobStatusBadge = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return <Badge variant="info">Running</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'FAILED':
        return <Badge variant="error">Failed</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>;
      case 'CANCELLED':
        return <Badge variant="default">Cancelled</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const jobColumns: Column<SystemJob>[] = [
    {
      key: 'name',
      label: 'Job Name',
      render: (_, job) => (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {job.name}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {job.type}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (status) => getJobStatusBadge(status),
    },
    {
      key: 'progress',
      label: 'Progress',
      render: (progress) => (
        <div className="w-full">
          <div className="flex justify-between text-sm mb-1">
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'startedAt',
      label: 'Started',
      render: (date) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(date).toLocaleString()}
        </div>
      ),
    },
    {
      key: 'completedAt',
      label: 'Completed',
      render: (date) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {date ? new Date(date).toLocaleString() : '-'}
        </div>
      ),
    },
  ];

  const renderJobActions = (job: SystemJob) => (
    <div className="flex items-center gap-2">
      {hasPermission('system', 'jobs') && job.status === 'FAILED' && (
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowPathIcon className="w-4 h-4" />}
          onClick={() => retryJobMutation.mutate(job.id)}
          loading={retryJobMutation.isLoading}
        />
      )}
      
      {hasPermission('system', 'jobs') && job.status === 'RUNNING' && (
        <Button
          variant="ghost"
          size="sm"
          icon={<StopIcon className="w-4 h-4" />}
          onClick={() => cancelJobMutation.mutate(job.id)}
          loading={cancelJobMutation.isLoading}
        />
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            System Management
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monitor system health, manage jobs, and control cache
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasPermission('system', 'cache') && (
            <Button
              variant="secondary"
              icon={<TrashIcon className="w-4 h-4" />}
              onClick={() => setShowClearCacheModal(true)}
            >
              Clear Cache
            </Button>
          )}
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="CPU Usage"
          value={`${systemMetrics?.cpuUsage?.toFixed(1) || '0'}%`}
          change={{
            value: 2.1,
            type: 'increase',
            period: 'vs last hour',
          }}
          icon={<CpuChipIcon className="w-6 h-6" />}
        />
        <MetricCard
          title="Memory Usage"
          value={`${systemMetrics?.memoryUsage?.toFixed(1) || '0'}%`}
          change={{
            value: 1.5,
            type: 'decrease',
            period: 'vs last hour',
          }}
          icon={<CircleStackIcon className="w-6 h-6" />}
        />
        <MetricCard
          title="Active Connections"
          value={systemMetrics?.activeConnections || 0}
          icon={<ServerIcon className="w-6 h-6" />}
        />
        <MetricCard
          title="Response Time"
          value={`${systemMetrics?.responseTime?.toFixed(0) || '0'}ms`}
          change={{
            value: 5.2,
            type: 'decrease',
            period: 'vs last hour',
          }}
          icon={<ClockIcon className="w-6 h-6" />}
        />
      </div>

      {/* System Health Status */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            System Health
          </h3>
          <Badge variant="success" size="sm">
            All Systems Operational
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-success-100 dark:bg-success-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircleIcon className="w-8 h-8 text-success-600 dark:text-success-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Database</p>
            <p className="text-xs text-success-600 dark:text-success-400">Operational</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {health.database?.responseTime || 0}ms
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-success-100 dark:bg-success-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircleIcon className="w-8 h-8 text-success-600 dark:text-success-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Redis Cache</p>
            <p className="text-xs text-success-600 dark:text-success-400">Operational</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {cache.hitRate || 0}% hit rate
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-success-100 dark:bg-success-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircleIcon className="w-8 h-8 text-success-600 dark:text-success-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">API Gateway</p>
            <p className="text-xs text-success-600 dark:text-success-400">Operational</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {systemMetrics?.requestsPerSecond || 0} req/s
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-success-100 dark:bg-success-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircleIcon className="w-8 h-8 text-success-600 dark:text-success-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">File Storage</p>
            <p className="text-xs text-success-600 dark:text-success-400">Operational</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {health.storage?.usage || 0}% used
            </p>
          </div>
        </div>
      </Card>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChart
          title="CPU Usage (Last 6 Hours)"
          data={systemMetricsData}
          height={300}
        />
        <LineChart
          title="Memory Usage (Last 6 Hours)"
          data={memoryMetricsData}
          height={300}
        />
      </div>

      {/* Cache Statistics */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Cache Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {cache.totalKeys || 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total Keys
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {cache.hitRate || 0}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Hit Rate
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {cache.memoryUsage || 0}MB
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Memory Usage
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {cache.evictions || 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Evictions
            </div>
          </div>
        </div>
      </Card>

      {/* Background Jobs */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Background Jobs
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="info" size="sm">
              {jobs.filter(job => job.status === 'RUNNING').length} Running
            </Badge>
            <Badge variant="error" size="sm">
              {jobs.filter(job => job.status === 'FAILED').length} Failed
            </Badge>
          </div>
        </div>
        
        <DataTable
          columns={jobColumns}
          data={jobs}
          loading={jobsLoading}
          actions={{
            row: renderJobActions,
          }}
          emptyState={
            <div className="text-center py-8">
              <ServerIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No background jobs
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Background jobs will appear here when they are running.
              </p>
            </div>
          }
        />
      </Card>

      {/* Clear Cache Modal */}
      <Modal
        isOpen={showClearCacheModal}
        onClose={() => setShowClearCacheModal(false)}
        title="Clear Cache"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center p-4 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
            <ExclamationTriangleIcon className="w-5 h-5 text-warning-600 dark:text-warning-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-warning-800 dark:text-warning-200">
                Clear System Cache
              </p>
              <p className="text-sm text-warning-700 dark:text-warning-300">
                This action will clear cached data and may temporarily impact performance.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cache Key (optional)
            </label>
            <input
              type="text"
              value={cacheKey}
              onChange={(e) => setCacheKey(e.target.value)}
              placeholder="Leave empty to clear all cache"
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-primary-500"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Specify a cache key pattern to clear specific entries, or leave empty to clear all cache.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowClearCacheModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => clearCacheMutation.mutate(cacheKey || undefined)}
              loading={clearCacheMutation.isLoading}
            >
              Clear Cache
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SystemPage;