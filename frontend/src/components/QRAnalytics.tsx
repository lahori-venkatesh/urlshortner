import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Globe, 
  Smartphone, 
  Calendar,
  Download,
  Share2,
  Eye,
  Clock,
  MapPin,
  Users
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface QRAnalyticsProps {
  qrCodeId: string;
  qrTitle: string;
  totalScans: number;
  onClose: () => void;
}

interface AnalyticsData {
  scansOverTime: Array<{ date: string; scans: number; uniqueScans: number }>;
  deviceBreakdown: Array<{ device: string; count: number; percentage: number }>;
  locationData: Array<{ country: string; city: string; count: number }>;
  browserData: Array<{ browser: string; count: number }>;
  hourlyData: Array<{ hour: number; scans: number }>;
  referrerData: Array<{ source: string; count: number }>;
}

const QRAnalytics: React.FC<QRAnalyticsProps> = ({
  qrCodeId,
  qrTitle,
  totalScans,
  onClose
}) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Mock data - in real app, this would come from API
  useEffect(() => {
    const generateMockData = (): AnalyticsData => {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      
      const scansOverTime = Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        return {
          date: date.toISOString().split('T')[0],
          scans: Math.floor(Math.random() * 50) + 5,
          uniqueScans: Math.floor(Math.random() * 30) + 3
        };
      });

      const deviceBreakdown = [
        { device: 'Mobile', count: Math.floor(totalScans * 0.65), percentage: 65 },
        { device: 'Desktop', count: Math.floor(totalScans * 0.25), percentage: 25 },
        { device: 'Tablet', count: Math.floor(totalScans * 0.10), percentage: 10 }
      ];

      const locationData = [
        { country: 'India', city: 'Mumbai', count: Math.floor(totalScans * 0.35) },
        { country: 'India', city: 'Delhi', count: Math.floor(totalScans * 0.25) },
        { country: 'India', city: 'Bangalore', count: Math.floor(totalScans * 0.20) },
        { country: 'USA', city: 'New York', count: Math.floor(totalScans * 0.10) },
        { country: 'UK', city: 'London', count: Math.floor(totalScans * 0.05) },
        { country: 'Others', city: 'Various', count: Math.floor(totalScans * 0.05) }
      ];

      const browserData = [
        { browser: 'Chrome', count: Math.floor(totalScans * 0.60) },
        { browser: 'Safari', count: Math.floor(totalScans * 0.20) },
        { browser: 'Firefox', count: Math.floor(totalScans * 0.10) },
        { browser: 'Edge', count: Math.floor(totalScans * 0.07) },
        { browser: 'Others', count: Math.floor(totalScans * 0.03) }
      ];

      const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        scans: Math.floor(Math.random() * 20) + (hour >= 9 && hour <= 21 ? 10 : 2)
      }));

      const referrerData = [
        { source: 'Direct Scan', count: Math.floor(totalScans * 0.70) },
        { source: 'WhatsApp', count: Math.floor(totalScans * 0.15) },
        { source: 'Instagram', count: Math.floor(totalScans * 0.08) },
        { source: 'Facebook', count: Math.floor(totalScans * 0.04) },
        { source: 'Others', count: Math.floor(totalScans * 0.03) }
      ];

      return {
        scansOverTime,
        deviceBreakdown,
        locationData,
        browserData,
        hourlyData,
        referrerData
      };
    };

    setTimeout(() => {
      setAnalyticsData(generateMockData());
      setLoading(false);
    }, 1000);
  }, [qrCodeId, timeRange, totalScans]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Analytics</h3>
            <p className="text-gray-600">Analyzing QR code performance...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{qrTitle} - Analytics</h2>
              <p className="text-gray-600">Detailed performance insights for your QR code</p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Scans</p>
                  <p className="text-3xl font-bold">{totalScans.toLocaleString()}</p>
                </div>
                <Eye className="w-8 h-8 text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Unique Visitors</p>
                  <p className="text-3xl font-bold">{Math.floor(totalScans * 0.75).toLocaleString()}</p>
                </div>
                <Users className="w-8 h-8 text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Avg. Daily Scans</p>
                  <p className="text-3xl font-bold">{Math.floor(totalScans / 30)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Peak Hour</p>
                  <p className="text-3xl font-bold">
                    {analyticsData.hourlyData.reduce((max, curr) => 
                      curr.scans > max.scans ? curr : max
                    ).hour}:00
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-200" />
              </div>
            </div>
          </div>

          {/* Scans Over Time */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Scans Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.scansOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="scans" 
                  stackId="1" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6}
                  name="Total Scans"
                />
                <Area 
                  type="monotone" 
                  dataKey="uniqueScans" 
                  stackId="2" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.6}
                  name="Unique Scans"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Device Breakdown */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Smartphone className="w-5 h-5 mr-2" />
                Device Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={analyticsData.deviceBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ device, percentage }) => `${device} ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analyticsData.deviceBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Browser Data */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Browser Usage</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analyticsData.browserData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="browser" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Hourly Activity */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Hourly Activity Pattern
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analyticsData.hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour" 
                  tickFormatter={(hour) => `${hour}:00`}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(hour) => `${hour}:00`}
                  formatter={(value) => [value, 'Scans']}
                />
                <Line 
                  type="monotone" 
                  dataKey="scans" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Geographic Data */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Top Locations
              </h3>
              <div className="space-y-3">
                {analyticsData.locationData.map((location, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{location.city}</p>
                        <p className="text-sm text-gray-600">{location.country}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{location.count}</p>
                      <p className="text-sm text-gray-600">
                        {((location.count / totalScans) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Referrer Sources */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Share2 className="w-5 h-5 mr-2" />
                Traffic Sources
              </h3>
              <div className="space-y-3">
                {analyticsData.referrerData.map((referrer, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium text-gray-900">{referrer.source}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{referrer.count}</p>
                      <p className="text-sm text-gray-600">
                        {((referrer.count / totalScans) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Analytics</h3>
            <div className="flex flex-wrap gap-3">
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export as PDF</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export as CSV</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <Share2 className="w-4 h-4" />
                <span>Share Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRAnalytics;