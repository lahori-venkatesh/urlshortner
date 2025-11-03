import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  UsersIcon,
  LinkIcon,
  CursorArrowRaysIcon,
  CurrencyDollarIcon,
  ServerIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

import { adminApiEndpoints } from '../../services/api';
import { useSystemMetrics, useUserActivity } from '../../services/websocket';
import MetricCard from '../../components/charts/MetricCard';
import LineChart from '../../components/charts/LineChart';
import AreaChart from '../../components/charts/AreaChart';
import DonutChart from '../../components/charts/DonutChart';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';

const DashboardPage: React.FC = () => {
  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => adminApiEndpoints.analytics.dashboard(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Real-time WebSocket data
  const { data: systemMetrics } = useSystemMetrics();
  const { data: userActivity } = useUserActivity();

  const metrics = dashboardData?.data?.data || {};

  // Sample data for charts (replace with real data)
  const userGrowthData = [
    {
      name: 'Users',
      data: [
        { x: '2024-01-01', y: 1200 },
        { x: '2024-01-02', y: 1350 },
        { x: '2024-01-03', y: 1400 },
        { x: '2024-01-04', y: 1600 },
        { x: '2024-01-05', y: 1800 },
        { x: '2024-01-06', y: 2000 },
        { x: '2024-01-07', y: 2200 },
      ],
    },
  ];

  const revenueData = [
    {
      name: 'Revenue',
      data: [
        { x: '2024-01-01', y: 5000 },
        { x: '2024-01-02', y: 5500 },
        { x: '2024-01-03', y: 6000 },
        { x: '2024-01-04', y: 6800 },
        { x: '2024-01-05', y: 7200 },
        { x: '2024-01-06', y: 8000 },
        { x: '2024-01-07', y: 8500 },
      ],
    },
  ];

  const planDistributionData = {
    labels: ['Free', 'Pro', 'Business', 'Enterprise'],
    series: [65, 25, 8, 2],
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Real-time overview of your Pebly platform
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="success" size="sm">
            Live
          </Badge>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Users"
          value={metrics.totalUsers || 0}
          change={{
            value: 12.5,
            type: 'increase',
            period: 'last month',
          }}
          icon={<UsersIcon className="h-6 w-6" />}
          loading={isLoading}
        />
        <MetricCard
          title="Active Links"
          value={metrics.totalLinks || 0}
          change={{
            value: 8.2,
            type: 'increase',
            period: 'last week',
          }}
          icon={<LinkIcon className="h-6 w-6" />}
          loading={isLoading}
        />
        <MetricCard
          title="Total Clicks"
          value={metrics.totalClicks || 0}
          change={{
            value: 15.3,
            type: 'increase',
            period: 'last week',
          }}
          icon={<CursorArrowRaysIcon className="h-6 w-6" />}
          loading={isLoading}
        />
        <MetricCard
          title="Monthly Revenue"
          value={`$${(metrics.monthlyRevenue || 0).toLocaleString()}`}
          change={{
            value: 23.1,
            type: 'increase',
            period: 'last month',
          }}
          icon={<CurrencyDollarIcon className="h-6 w-6" />}
          loading={isLoading}
        />
      </div>

      {/* Real-time System Metrics */}
      {systemMetrics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-3"
        >
          <MetricCard
            title="CPU Usage"
            value={`${systemMetrics.cpuUsage?.toFixed(1)}%`}
            icon={<ServerIcon className="h-6 w-6" />}
          />
          <MetricCard
            title="Memory Usage"
            value={`${systemMetrics.memoryUsage?.toFixed(1)}%`}
            icon={<ServerIcon className="h-6 w-6" />}
          />
          <MetricCard
            title="Response Time"
            value={`${systemMetrics.responseTime?.toFixed(0)}ms`}
            icon={<ClockIcon className="h-6 w-6" />}
          />
        </motion.div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LineChart
          title="User Growth"
          data={userGrowthData}
          height={300}
        />
        <AreaChart
          title="Revenue Trend"
          data={revenueData}
          height={300}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Activity
            </h3>
            <div className="space-y-4">
              {userActivity?.slice(0, 5).map((activity: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.description || 'User activity'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Just now'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="info" size="sm">
                    {activity.type || 'Activity'}
                  </Badge>
                </motion.div>
              )) || (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <DonutChart
          title="Plan Distribution"
          data={planDistributionData}
          height={300}
        />
      </div>

      {/* System Health Status */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            System Health
          </h3>
          <Badge variant="success" size="sm">
            All Systems Operational
          </Badge>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900 rounded-full flex items-center justify-center mx-auto mb-2">
              <div className="w-3 h-3 bg-success-500 rounded-full"></div>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">API</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Operational</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900 rounded-full flex items-center justify-center mx-auto mb-2">
              <div className="w-3 h-3 bg-success-500 rounded-full"></div>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Database</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Operational</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900 rounded-full flex items-center justify-center mx-auto mb-2">
              <div className="w-3 h-3 bg-success-500 rounded-full"></div>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Cache</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Operational</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900 rounded-full flex items-center justify-center mx-auto mb-2">
              <div className="w-3 h-3 bg-success-500 rounded-full"></div>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">CDN</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Operational</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;