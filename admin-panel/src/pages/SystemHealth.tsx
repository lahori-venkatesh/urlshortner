import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CreditCard, 
  Mail, 
  Globe, 
  Server, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'checking';
  responseTime?: number;
  lastCheck: string;
  details?: any;
  icon: React.ReactNode;
}

interface SystemHealthData {
  mongodb: {
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    connections: number;
    collections: {
      users: number;
      urls: number;
      analytics: number;
      teams: number;
      support_tickets: number;
    };
    operations: {
      reads: number;
      writes: number;
    };
  };
  razorpay: {
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    apiVersion: string;
  };
  sendgrid: {
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    emailsSent24h: number;
    deliveryRate: number;
  };
  vercel: {
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    deploymentStatus: string;
    lastDeploy: string;
  };
  render: {
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    cpuUsage: number;
    memoryUsage: number;
    uptime: string;
  };
}

export const SystemHealth: React.FC = () => {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchSystemHealth();
    const interval = setInterval(fetchSystemHealth, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSystemHealth = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/admin/system/health');
      const data = await response.json();
      setHealthData(data.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'down':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
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

  const services: ServiceHealth[] = healthData ? [
    {
      name: 'MongoDB Database',
      status: healthData.mongodb.status,
      responseTime: healthData.mongodb.responseTime,
      lastCheck: new Date().toLocaleTimeString(),
      details: healthData.mongodb,
      icon: <Database className="w-6 h-6" />
    },
    {
      name: 'Razorpay Payment',
      status: healthData.razorpay.status,
      responseTime: healthData.razorpay.responseTime,
      lastCheck: new Date().toLocaleTimeString(),
      details: healthData.razorpay,
      icon: <CreditCard className="w-6 h-6" />
    },
    {
      name: 'SendGrid Email',
      status: healthData.sendgrid.status,
      responseTime: healthData.sendgrid.responseTime,
      lastCheck: new Date().toLocaleTimeString(),
      details: healthData.sendgrid,
      icon: <Mail className="w-6 h-6" />
    },
    {
      name: 'Vercel Frontend',
      status: healthData.vercel.status,
      responseTime: healthData.vercel.responseTime,
      lastCheck: new Date().toLocaleTimeString(),
      details: healthData.vercel,
      icon: <Globe className="w-6 h-6" />
    },
    {
      name: 'Render Backend',
      status: healthData.render.status,
      responseTime: healthData.render.responseTime,
      lastCheck: new Date().toLocaleTimeString(),
      details: healthData.render,
      icon: <Server className="w-6 h-6" />
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
          <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
          <p className="text-gray-600">Monitor the health of all BitaURL services</p>
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
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Service Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div key={service.name} className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="text-gray-600">{service.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
              </div>
              <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(service.status)}`}>
                {getStatusIcon(service.status)}
                <span className="ml-1 capitalize">{service.status}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Response Time:</span>
                <span className="font-medium">{service.responseTime}ms</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Last Check:</span>
                <span className="font-medium">{service.lastCheck}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed MongoDB Health */}
      {healthData?.mongodb && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">MongoDB Database Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{healthData.mongodb.connections}</div>
              <div className="text-sm text-gray-600">Active Connections</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{healthData.mongodb.responseTime}ms</div>
              <div className="text-sm text-gray-600">Response Time</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{healthData.mongodb.operations.reads}</div>
              <div className="text-sm text-gray-600">Reads/sec</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{healthData.mongodb.operations.writes}</div>
              <div className="text-sm text-gray-600">Writes/sec</div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Collection Document Counts</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(healthData.mongodb.collections).map(([collection, count]) => (
                <div key={collection} className="bg-gray-50 rounded p-3 text-center">
                  <div className="font-semibold text-gray-900">{count.toLocaleString()}</div>
                  <div className="text-xs text-gray-600 capitalize">
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
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">SendGrid Email Service</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{healthData.sendgrid.emailsSent24h}</div>
              <div className="text-sm text-gray-600">Emails Sent (24h)</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{healthData.sendgrid.deliveryRate}%</div>
              <div className="text-sm text-gray-600">Delivery Rate</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{healthData.sendgrid.responseTime}ms</div>
              <div className="text-sm text-gray-600">API Response Time</div>
            </div>
          </div>
        </div>
      )}

      {/* Render Backend Details */}
      {healthData?.render && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Render Backend Service</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{healthData.render.cpuUsage}%</div>
              <div className="text-sm text-gray-600">CPU Usage</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{healthData.render.memoryUsage}%</div>
              <div className="text-sm text-gray-600">Memory Usage</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{healthData.render.uptime}</div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{healthData.render.responseTime}ms</div>
              <div className="text-sm text-gray-600">Response Time</div>
            </div>
          </div>
        </div>
      )}

      {/* Vercel Frontend Details */}
      {healthData?.vercel && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vercel Frontend Service</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{healthData.vercel.deploymentStatus}</div>
              <div className="text-sm text-gray-600">Deployment Status</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">{healthData.vercel.lastDeploy}</div>
              <div className="text-sm text-gray-600">Last Deploy</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{healthData.vercel.responseTime}ms</div>
              <div className="text-sm text-gray-600">Response Time</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemHealth;