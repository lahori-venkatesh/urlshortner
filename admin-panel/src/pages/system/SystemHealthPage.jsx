import React, { useState, useEffect } from 'react';

// System Health Page - BitaURL Services Implementation
const SystemHealthPage = ({ hasPermission }) => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    fetchSystemHealth();
    const interval = setInterval(fetchSystemHealth, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSystemHealth = async () => {
    try {
      setLoading(true);
      // In a real implementation this would fetch from an API
      // const response = await fetch('/api/v1/admin/system/health');
      // const data = await response.json();

      // Simulating API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockData = {
        mongodb: {
          status: 'healthy',
          responseTime: 25,
          connections: 8,
          collections: {
            users: 1250,
            urls: 8940,
            analytics: 45620,
            teams: 89,
            support_tickets: 156
          },
          operations: {
            reads: 45,
            writes: 12
          }
        },
        razorpay: {
          status: 'healthy',
          responseTime: 180,
          apiVersion: 'v1'
        },
        sendgrid: {
          status: 'healthy',
          responseTime: 220,
          emailsSent24h: 342,
          deliveryRate: 98.5
        },
        vercel: {
          status: 'healthy',
          responseTime: 95,
          deploymentStatus: 'Ready',
          lastDeploy: '2 hours ago'
        },
        render: {
          status: 'healthy',
          responseTime: 120,
          cpuUsage: 45,
          memoryUsage: 68,
          uptime: '5d 12h 30m'
        }
      };

      setHealthData(mockData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return '✅';
      case 'degraded':
        return '⚠️';
      case 'down':
        return '❌';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'down':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const services = healthData ? [
    {
      name: 'MongoDB Database',
      icon: '🗄️',
      status: healthData.mongodb.status,
      responseTime: healthData.mongodb.responseTime,
      details: healthData.mongodb
    },
    {
      name: 'Razorpay Payment',
      icon: '💳',
      status: healthData.razorpay.status,
      responseTime: healthData.razorpay.responseTime,
      details: healthData.razorpay
    },
    {
      name: 'SendGrid Email',
      icon: '📧',
      status: healthData.sendgrid.status,
      responseTime: healthData.sendgrid.responseTime,
      details: healthData.sendgrid
    },
    {
      name: 'Vercel Frontend',
      icon: '🌐',
      status: healthData.vercel.status,
      responseTime: healthData.vercel.responseTime,
      details: healthData.vercel
    },
    {
      name: 'Render Backend',
      icon: '⚙️',
      status: healthData.render.status,
      responseTime: healthData.render.responseTime,
      details: healthData.render
    }
  ] : [];

  if (loading && !healthData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading system health...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Health</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor the health of all BitaURL services</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchSystemHealth}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <span className={`mr-2 ${loading ? 'animate-spin' : ''}`}>🔄</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Service Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div key={service.name} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{service.icon}</span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{service.name}</h3>
              </div>
              <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(service.status)}`}>
                <span className="mr-1">{getStatusIcon(service.status)}</span>
                <span className="capitalize">{service.status}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Response Time:</span>
                <span className="font-medium">{service.responseTime}ms</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Last Check:</span>
                <span className="font-medium">{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed MongoDB Health */}
      {healthData?.mongodb && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">MongoDB Database Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{healthData.mongodb.connections}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Connections</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{healthData.mongodb.responseTime}ms</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Response Time</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{healthData.mongodb.operations.reads}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Reads/sec</div>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{healthData.mongodb.operations.writes}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Writes/sec</div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Collection Document Counts</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(healthData.mongodb.collections).map(([collection, count]) => (
                <div key={collection} className="bg-gray-50 dark:bg-gray-700 rounded p-3 text-center">
                  <div className="font-semibold text-gray-900 dark:text-white">{count.toLocaleString()}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                    {collection.replace('_', ' ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SendGrid Email Details */}
      {healthData?.sendgrid && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">SendGrid Email Service</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{healthData.sendgrid.emailsSent24h}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Emails Sent (24h)</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{healthData.sendgrid.deliveryRate}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Delivery Rate</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{healthData.sendgrid.responseTime}ms</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">API Response Time</div>
            </div>
          </div>
        </div>
      )}

      {/* Render Backend Details */}
      {healthData?.render && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Render Backend Service</h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{healthData.render.cpuUsage}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">CPU Usage</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{healthData.render.memoryUsage}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Memory Usage</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{healthData.render.uptime}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Uptime</div>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{healthData.render.responseTime}ms</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Response Time</div>
            </div>
          </div>
        </div>
      )}

      {/* Vercel Frontend Details */}
      {healthData?.vercel && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Vercel Frontend Service</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{healthData.vercel.deploymentStatus}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Deployment Status</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-lg font-bold text-green-600">{healthData.vercel.lastDeploy}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Last Deploy</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{healthData.vercel.responseTime}ms</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Response Time</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemHealthPage;
