import React, { useState, useEffect } from 'react';
import { 
  Link, 
  QrCode, 
  Upload, 
  Eye, 
  TrendingUp, 
  Globe, 
  Smartphone,
  Plus,
  ExternalLink,
  Copy,
  BarChart3
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardOverviewProps {
  onCreateClick: (mode: 'url' | 'qr' | 'file') => void;
}

interface DashboardStats {
  totalLinks: number;
  totalClicks: number;
  totalQRCodes: number;
  totalFiles: number;
  clicksToday: number;
  clicksThisWeek: number;
  topPerformingLink: any;
  recentActivity: any[];
  clicksOverTime: any[];
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onCreateClick }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load data from localStorage and calculate stats
    const loadDashboardData = () => {
      try {
        const links = JSON.parse(localStorage.getItem('shortenedLinks') || '[]');
        const qrCodes = JSON.parse(localStorage.getItem('bitlyQRCodes') || '[]');
        const files = links.filter((link: any) => link.type === 'file');

        const totalClicks = links.reduce((sum: number, link: any) => sum + (link.clicks || 0), 0);
        const totalQRScans = qrCodes.reduce((sum: number, qr: any) => sum + (qr.scans || 0), 0);
        
        // Calculate real time-based data
        const today = new Date();
        const todayStr = today.toDateString();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const clicksToday = links
          .filter((link: any) => new Date(link.createdAt).toDateString() === todayStr)
          .reduce((sum: number, link: any) => sum + (link.clicks || 0), 0);
        
        const clicksThisWeek = links
          .filter((link: any) => new Date(link.createdAt) >= weekAgo)
          .reduce((sum: number, link: any) => sum + (link.clicks || 0), 0);
        
        // Generate realistic time series data based on actual link creation dates
        const clicksOverTime = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          const dateStr = date.toDateString();
          
          const dayLinks = links.filter((link: any) => 
            new Date(link.createdAt).toDateString() === dateStr
          );
          
          const dayClicks = dayLinks.reduce((sum: number, link: any) => sum + (link.clicks || 0), 0);
          
          return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            clicks: dayClicks || 0,
            links: dayLinks.length
          };
        });

        const dashboardStats: DashboardStats = {
          totalLinks: links.length,
          totalClicks: totalClicks + totalQRScans, // Include QR scans in total clicks
          totalQRCodes: qrCodes.length,
          totalFiles: files.length,
          clicksToday,
          clicksThisWeek,
          topPerformingLink: links.length > 0 ? links.reduce((max: any, link: any) => 
            (link.clicks || 0) > (max.clicks || 0) ? link : max
          ) : null,
          recentActivity: [...links, ...qrCodes]
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
            .map((item: any) => ({
              ...item,
              action: 'created',
              timestamp: item.createdAt,
              type: item.type || (item.customization ? 'qr' : 'url')
            })),
          clicksOverTime
        };

        setStats(dashboardStats);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      const { toast } = await import('react-hot-toast');
      toast.success('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-2">Welcome back!</h2>
        <p className="text-blue-100 mb-4">
          Here's what's happening with your links today.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onCreateClick('url')}
            className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2"
          >
            <Link className="w-4 h-4" />
            <span>Create Link</span>
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
            <span>Upload File</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Links</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalLinks}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Link className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            {stats.totalLinks > 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600">
                  {stats.totalLinks === 1 ? 'First link created!' : `${stats.totalLinks} links created`}
                </span>
              </>
            ) : (
              <span className="text-gray-500">No links yet</span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Clicks</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalClicks.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600">{stats.clicksToday} clicks today</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">QR Codes</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalQRCodes}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <QrCode className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600">Active QR codes</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">File Links</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalFiles}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Upload className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600">Uploaded files</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clicks Over Time Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
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
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        {stats.recentActivity.length > 0 ? (
          <div className="space-y-3">
            {stats.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    {activity.type === 'qr' ? (
                      <QrCode className="w-4 h-4 text-blue-600" />
                    ) : activity.type === 'file' ? (
                      <Upload className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Link className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {activity.type === 'qr' ? 'QR Code' : activity.type === 'file' ? 'File Link' : 'Short Link'} created
                    </p>
                    <p className="text-sm text-gray-600 truncate max-w-xs">{activity.shortUrl}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-400">
                    {activity.clicks || 0} clicks
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Plus className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-3">No recent activity</p>
            <button
              onClick={() => onCreateClick('url')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Create your first link
            </button>
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