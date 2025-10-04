import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Globe, Smartphone, MousePointer } from 'lucide-react';

const Analytics: React.FC = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [timeRange, setTimeRange] = useState('7d');

  // Mock analytics data
  const mockData = {
    totalClicks: 156,
    uniqueClicks: 89,
    clicksByCountry: [
      { name: 'United States', value: 45 },
      { name: 'United Kingdom', value: 23 },
      { name: 'Canada', value: 18 },
      { name: 'Germany', value: 12 },
      { name: 'Others', value: 58 }
    ],
    clicksByDevice: [
      { name: 'Desktop', value: 78 },
      { name: 'Mobile', value: 65 },
      { name: 'Tablet', value: 13 }
    ],
    clicksOverTime: [
      { date: '2024-01-10', clicks: 12 },
      { date: '2024-01-11', clicks: 19 },
      { date: '2024-01-12', clicks: 23 },
      { date: '2024-01-13', clicks: 15 },
      { date: '2024-01-14', clicks: 28 },
      { date: '2024-01-15', clicks: 34 },
      { date: '2024-01-16', clicks: 25 }
    ]
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Analytics for /{shortCode}
        </h1>
        <p className="text-gray-600">Detailed analytics and insights for your short link</p>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6">
        <div className="flex space-x-2">
          {['24h', '7d', '30d', 'all'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === '24h' ? '24 Hours' : 
               range === '7d' ? '7 Days' :
               range === '30d' ? '30 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <MousePointer className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Clicks</p>
              <p className="text-2xl font-bold text-gray-900">{mockData.totalClicks}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Globe className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unique Visitors</p>
              <p className="text-2xl font-bold text-gray-900">{mockData.uniqueClicks}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Smartphone className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Mobile %</p>
              <p className="text-2xl font-bold text-gray-900">42%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Daily</p>
              <p className="text-2xl font-bold text-gray-900">22</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Clicks Over Time */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Clicks Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockData.clicksOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="clicks" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Device Types */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Types</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mockData.clicksByDevice}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {mockData.clicksByDevice.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Geographic Distribution */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Distribution</h3>
        <div className="space-y-4">
          {mockData.clicksByCountry.map((country, index) => (
            <div key={country.name} className="flex items-center justify-between">
              <div className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-full mr-3"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <span className="text-sm font-medium text-gray-900">{country.name}</span>
              </div>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div 
                    className="h-2 rounded-full"
                    style={{ 
                      width: `${(country.value / mockData.totalClicks) * 100}%`,
                      backgroundColor: COLORS[index % COLORS.length]
                    }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-8">{country.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;