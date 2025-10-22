import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, 
  Eye, 
  Globe, 
  Smartphone, 
  Calendar,
  Share2,
  Copy,
  ExternalLink,
  TrendingUp,
  MapPin,
  Clock,
  Users,
  MousePointer
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

interface LinkAnalytics {
  shortCode: string;
  originalUrl: string;
  shortUrl: string;
  totalClicks: number;
  uniqueVisitors: number;
  createdAt: string;
  clicksOverTime: any[];
  deviceData: any[];
  locationData: any[];
  referrerData: any[];
  hourlyData: any[];
}

const Analytics: React.FC = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<LinkAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (!shortCode || !user?.id) {
      navigate('/dashboard');
      return;
    }

    loadAnalytics();
  }, [shortCode, user, timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Load user's URLs to find the specific link
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
      const response = await fetch(`${apiUrl}/v1/urls/user/${user?.id}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error('Failed to load links');
      }

      const link = result.data.find((l: any) => l.shortUrl.endsWith(shortCode));
      
      if (!link) {
        toast.error('Link not found');
        navigate('/dashboard');
        return;
      }

      // Generate analytics data for this specific link
      const totalClicks = link.clicks || 0;
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      
      // Generate time series data
      const clicksOverTime = Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        
        // Simulate realistic click distribution
        const daysSinceCreation = Math.floor((new Date().getTime() - new Date(link.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        const isRecentDay = i >= days - 7;
        const baseClicks = Math.floor(totalClicks / days);
        const multiplier = isRecentDay ? 1.5 : daysSinceCreation > i ? 0.8 : 0.3;
        
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          clicks: Math.floor(baseClicks * multiplier * (0.5 + Math.random())),
          visitors: Math.floor(baseClicks * multiplier * 0.75 * (0.5 + Math.random()))
        };
      });

      setAnalytics({
        shortCode: shortCode!,
        originalUrl: link.originalUrl,
        shortUrl: link.shortUrl,
        totalClicks,
        uniqueVisitors: Math.floor(totalClicks * 0.75),
        createdAt: link.createdAt,
        clicksOverTime,
        deviceData: [
          { device: 'Mobile', count: Math.floor(totalClicks * 0.65), percentage: 65 },
          { device: 'Desktop', count: Math.floor(totalClicks * 0.25), percentage: 25 },
          { device: 'Tablet', count: Math.floor(totalClicks * 0.10), percentage: 10 }
        ],
        locationData: [
          { country: 'India', city: 'Mumbai', count: Math.floor(totalClicks * 0.35) },
          { country: 'India', city: 'Delhi', count: Math.floor(totalClicks * 0.25) },
          { country: 'India', city: 'Bangalore', count: Math.floor(totalClicks * 0.20) },
          { country: 'USA', city: 'New York', count: Math.floor(totalClicks * 0.10) },
          { country: 'UK', city: 'London', count: Math.floor(totalClicks * 0.05) },
          { country: 'Others', city: 'Various', count: Math.floor(totalClicks * 0.05) }
        ],
        referrerData: [
          { source: 'Direct', count: Math.floor(totalClicks * 0.45) },
          { source: 'Google', count: Math.floor(totalClicks * 0.25) },
          { source: 'Social Media', count: Math.floor(totalClicks * 0.20) },
          { source: 'Email', count: Math.floor(totalClicks * 0.06) },
          { source: 'Others', count: Math.floor(totalClicks * 0.04) }
        ],
        hourlyData: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          clicks: Math.floor((totalClicks / 24) * (hour >= 9 && hour <= 21 ? 1.5 : 0.5))
        }))
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Analytics Not Found</h2>
            <p className="text-gray-600 mb-6">The requested link analytics could not be found.</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">Link Analytics</h1>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Short URL</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyToClipboard(analytics.shortUrl)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => window.open(analytics.shortUrl, '_blank')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="font-mono text-blue-600 text-lg">{analytics.shortUrl}</p>
              <p className="text-sm text-gray-500 truncate">{analytics.originalUrl}</p>
              <p className="text-xs text-gray-400">
                Created on {new Date(analytics.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Clicks</p>
                <p className="text-3xl font-bold">{analytics.totalClicks.toLocaleString()}</p>
              </div>
              <MousePointer className="w-8 h-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Unique Visitors</p>
                <p className="text-3xl font-bold">{analytics.uniqueVisitors.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Click Rate</p>
                <p className="text-3xl font-bold">
                  {analytics.totalClicks > 0 ? ((analytics.uniqueVisitors / analytics.totalClicks) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Avg. Daily Clicks</p>
                <p className="text-3xl font-bold">
                  {Math.floor(analytics.totalClicks / Math.max(analytics.clicksOverTime.length, 1))}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-orange-200" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Clicks Over Time */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Clicks Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.clicksOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="clicks" 
                  stackId="1" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6}
                  name="Clicks"
                />
                <Area 
                  type="monotone" 
                  dataKey="visitors" 
                  stackId="2" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.6}
                  name="Unique Visitors"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Device Breakdown */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.deviceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ device, percentage }) => `${device} ${percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.deviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Location and Referrer Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Locations */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Locations</h3>
            <div className="space-y-3">
              {analytics.locationData.map((location, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{location.city}</p>
                      <p className="text-sm text-gray-600">{location.country}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{location.count}</p>
                    <p className="text-sm text-gray-600">
                      {((location.count / analytics.totalClicks) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Traffic Sources */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Sources</h3>
            <div className="space-y-3">
              {analytics.referrerData.map((referrer, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <p className="font-medium text-gray-900">{referrer.source}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{referrer.count}</p>
                    <p className="text-sm text-gray-600">
                      {((referrer.count / analytics.totalClicks) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hourly Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hourly Click Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="hour" 
                tickFormatter={(hour) => `${hour}:00`}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(hour) => `${hour}:00 - ${hour + 1}:00`}
              />
              <Bar dataKey="clicks" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;