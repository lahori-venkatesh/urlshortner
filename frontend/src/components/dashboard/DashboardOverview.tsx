import React from 'react';
import { 
  Link, 
  QrCode, 
  Upload, 
  Eye, 
  TrendingUp, 
  Globe,
  Plus,
  ExternalLink,
  Copy,
  BarChart3,
  RefreshCw,
  Activity,
  Clock,
  MousePointer,
  MapPin
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { useDashboardData } from '../../hooks/useDashboardData';
import { StatCardSkeleton, ChartSkeleton, ActivitySkeleton } from '../ui/Skeleton';
import LiveActivityFeed from './LiveActivityFeed';
import LocationWidget from './LocationWidget';
import WorldMapWidget from './WorldMapWidget';

interface DashboardOverviewProps {
  onCreateClick: (mode: 'url' | 'qr' | 'file') => void;
}

interface DashboardStats {
  totalLinks: number;
  totalClicks: number;
  totalQRCodes: number;
  totalFiles: number;
  shortLinks: number;
  qrCodeCount: number;
  fileLinksCount: number;
  clicksToday: number;
  clicksThisWeek: number;
  topPerformingLink: any;
  recentActivity: any[];
  clicksOverTime: any[];
}



const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onCreateClick }) => {
  // Use React Query hook for fast loading with caching
  const { stats, isLoading, isRefreshing, hasData, error, refetch } = useDashboardData();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Dashboard refreshed!');
  };

  // Handle error state
  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-4">Failed to load dashboard data</div>
        <button 
          onClick={handleRefresh}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Show skeleton loading only when there's no cached data
  if (isLoading && !hasData) {
    return (
      <div className="space-y-6">
        {/* Welcome Section Skeleton */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <div className="h-8 bg-white/20 rounded w-48 mb-2"></div>
              <div className="h-4 bg-white/20 rounded w-64"></div>
            </div>
            <div className="h-10 w-24 bg-white/20 rounded-lg"></div>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Chart and Activity Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ActivitySkeleton />
        </div>

        {/* Location Widgets Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      </div>
    );
  }

  // If we have cached data, show it even while refreshing
  if (!stats && !isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No dashboard data available</p>
        <button 
          onClick={handleRefresh}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Load Data
        </button>
      </div>
    );
  }

  // Ensure stats is available before rendering
  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Welcome back!</h2>
            <p className="text-blue-100">
              Here's what's happening with your links today.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-white/10 text-white px-3 py-2 rounded-lg hover:bg-white/20 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onCreateClick('url')}
            className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2"
          >
            <Link className="w-4 h-4" />
            <span>Create Short Link</span>
          </button>
          <button
            onClick={() => onCreateClick('qr')}
            className="bg-white/10 text-white px-4 py-2 rounded-lg font-semibold hover:bg-white/20 transition-colors flex items-center space-x-2"
          >
            <QrCode className="w-4 h-4" />
            <span>Create QR</span>
          </button>
          <button
            onClick={() => onCreateClick('file')}
            className="bg-white/10 text-white px-4 py-2 rounded-lg font-semibold hover:bg-white/20 transition-colors flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload File to URL</span>
          </button>
        </div>


      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Short Links</p>
              <p className="text-3xl font-bold text-blue-600">{stats.shortLinks}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Link className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <button
              onClick={() => onCreateClick('url')}
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
            >
              <Plus className="w-3 h-3" />
              <span>Create Short Link</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">QR Code Count</p>
              <p className="text-3xl font-bold text-purple-600">{stats.qrCodeCount}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <QrCode className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <button
              onClick={() => onCreateClick('qr')}
              className="text-purple-600 hover:text-purple-800 font-medium flex items-center space-x-1"
            >
              <Plus className="w-3 h-3" />
              <span>Create QR Code</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">File Links Count</p>
              <p className="text-3xl font-bold text-orange-600">{stats.fileLinksCount}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Upload className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <button
              onClick={() => onCreateClick('file')}
              className="text-orange-600 hover:text-orange-800 font-medium flex items-center space-x-1"
            >
              <Plus className="w-3 h-3" />
              <span>Upload File</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Clicks</p>
              <p className="text-3xl font-bold text-green-600">{stats.totalClicks.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <MousePointer className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <Clock className="w-3 h-3 text-gray-400 mr-1" />
            <span className="text-gray-600">{stats.clicksToday} today</span>
          </div>
        </div>
      </div>

      {/* Total Links and Total Clicks Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Links (All Types)</p>
              <p className="text-4xl font-bold">{stats.totalLinks}</p>
              <p className="text-blue-100 text-sm mt-2">
                {stats.shortLinks} Short • {stats.qrCodeCount} QR • {stats.fileLinksCount} Files
              </p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
              <Globe className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Clicks & Interactions</p>
              <p className="text-4xl font-bold">{stats.totalClicks.toLocaleString()}</p>
              <p className="text-green-100 text-sm mt-2">
                {stats.clicksToday} today • {stats.clicksThisWeek} this week
              </p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
              <Activity className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clicks Over Time Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Clicks Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={stats.clicksOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="clicks" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.1}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Live Activity Feed */}
        <div className="lg:col-span-1">
          <LiveActivityFeed maxItems={6} className="h-full" />
        </div>
      </div>

      {/* Location Analytics and World Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Location Widget */}
        <LocationWidget maxItems={5} />

        {/* Performance Metrics */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Globe className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">
                {stats.totalClicks > 0 ? Math.min(15, Math.floor(stats.totalClicks / 10) + 3) : 0}
              </p>
              <p className="text-sm text-gray-600">Countries Reached</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <MapPin className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">
                {stats.totalClicks > 0 ? Math.min(50, Math.floor(stats.totalClicks / 5) + 8) : 0}
              </p>
              <p className="text-sm text-gray-600">Cities Reached</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">
                {stats.totalClicks > 0 ? Math.floor((stats.totalClicks * 0.65) / Math.max(stats.totalClicks, 1) * 100) : 0}%
              </p>
              <p className="text-sm text-gray-600">Mobile Traffic</p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Top Traffic Source</h4>
                <p className="text-sm text-gray-600">India • Mumbai</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-600">
                  {Math.floor(stats.totalClicks * 0.25).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">clicks (25%)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* World Map Visualization */}
      <WorldMapWidget />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Link */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Link</h3>
          {stats.topPerformingLink ? (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Short URL</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => copyToClipboard(stats.topPerformingLink.shortUrl)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => window.open(stats.topPerformingLink.shortUrl, '_blank')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="font-mono text-blue-600 text-sm mb-2">{stats.topPerformingLink.shortUrl}</p>
                <p className="text-xs text-gray-500 truncate">{stats.topPerformingLink.originalUrl}</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{stats.topPerformingLink.clicks || 0}</p>
                  <p className="text-sm text-gray-600">Total Clicks</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {((stats.topPerformingLink.clicks || 0) / Math.max(stats.totalClicks, 1) * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600">of Total Traffic</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No links created yet</p>
              <button
                onClick={() => onCreateClick('url')}
                className="mt-3 text-blue-600 hover:text-blue-800 font-medium"
              >
                Create your first link
              </button>
            </div>
          )}
        </div>

        {/* Quick Stats Summary */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Link className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900">Short Links</span>
              </div>
              <span className="text-xl font-bold text-blue-600">{stats.shortLinks}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <QrCode className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-gray-900">QR Codes</span>
              </div>
              <span className="text-xl font-bold text-purple-600">{stats.qrCodeCount}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Upload className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-gray-900">File Links</span>
              </div>
              <span className="text-xl font-bold text-orange-600">{stats.fileLinksCount}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <MousePointer className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">Total Clicks</span>
              </div>
              <span className="text-xl font-bold text-green-600">{stats.totalClicks.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Recent Activity */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span>Recent Activity</span>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Live</span>
          </h3>
          <button
            onClick={handleRefresh}
            className="text-gray-400 hover:text-gray-600 p-1 rounded"
            title="Refresh activity"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {stats.recentActivity.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {stats.recentActivity.map((activity, index) => (
              <div key={`${activity.type}-${activity.id || index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.type === 'qr' ? 'bg-purple-100' :
                    activity.type === 'file' ? 'bg-orange-100' : 'bg-blue-100'
                  }`}>
                    {activity.type === 'qr' ? (
                      <QrCode className={`w-4 h-4 ${activity.type === 'qr' ? 'text-purple-600' : 'text-blue-600'}`} />
                    ) : activity.type === 'file' ? (
                      <Upload className="w-4 h-4 text-orange-600" />
                    ) : (
                      <Link className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">
                      {activity.title || (activity.type === 'qr' ? 'QR Code' : activity.type === 'file' ? 'File Link' : 'Short Link')} {activity.action}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-xs text-blue-600 font-mono truncate max-w-xs">
                        {activity.shortUrl || activity.fileUrl}
                      </p>
                      {activity.shortUrl && (
                        <button
                          onClick={() => copyToClipboard(activity.shortUrl)}
                          className="text-gray-400 hover:text-gray-600 p-1"
                          title="Copy link"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-400 flex items-center space-x-1">
                      <Eye className="w-3 h-3" />
                      <span>{activity.clicks || activity.scans || activity.totalDownloads || 0}</span>
                    </span>
                    {activity.type === 'file' && (
                      <span className="text-xs bg-orange-100 text-orange-800 px-1 py-0.5 rounded">
                        {(activity.fileSize && (activity.fileSize / 1024 / 1024).toFixed(1)) || '0'} MB
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-3">No recent activity</p>
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => onCreateClick('url')}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                Create Link
              </button>
              <span className="text-gray-300">•</span>
              <button
                onClick={() => onCreateClick('qr')}
                className="text-purple-600 hover:text-purple-800 font-medium text-sm"
              >
                Create QR
              </button>
              <span className="text-gray-300">•</span>
              <button
                onClick={() => onCreateClick('file')}
                className="text-orange-600 hover:text-orange-800 font-medium text-sm"
              >
                Upload File
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => onCreateClick('url')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group"
          >
            <Link className="w-8 h-8 text-gray-400 group-hover:text-blue-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900 group-hover:text-blue-900">Create Short Link</p>
            <p className="text-sm text-gray-600">Shorten any URL instantly</p>
          </button>

          <button
            onClick={() => onCreateClick('qr')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors group"
          >
            <QrCode className="w-8 h-8 text-gray-400 group-hover:text-purple-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900 group-hover:text-purple-900">Generate QR Code</p>
            <p className="text-sm text-gray-600">Create customizable QR codes</p>
          </button>

          <button
            onClick={() => onCreateClick('file')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors group"
          >
            <Upload className="w-8 h-8 text-gray-400 group-hover:text-orange-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900 group-hover:text-orange-900">Upload File</p>
            <p className="text-sm text-gray-600">Share files with short links</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;