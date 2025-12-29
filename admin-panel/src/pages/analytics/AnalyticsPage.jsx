import React, { useState } from 'react';

// Analytics Page - Complete Implementation
const AnalyticsPage = ({ hasPermission }) => {
  const [dateRange, setDateRange] = useState('7d');
  const [activeMetric, setActiveMetric] = useState('clicks');
  const [selectedTeam, setSelectedTeam] = useState('all');

  // Mock analytics data
  const analyticsData = {
    overview: {
      totalClicks: 125678,
      uniqueClicks: 89432,
      totalLinks: 1234,
      activeLinks: 987,
      topCountries: [
        { country: 'United States', clicks: 45678, percentage: 36.3 },
        { country: 'United Kingdom', clicks: 23456, percentage: 18.7 },
        { country: 'Canada', clicks: 15678, percentage: 12.5 },
        { country: 'Germany', clicks: 12345, percentage: 9.8 },
        { country: 'France', clicks: 8901, percentage: 7.1 }
      ],
      topDevices: [
        { device: 'Desktop', clicks: 75407, percentage: 60.0 },
        { device: 'Mobile', clicks: 43987, percentage: 35.0 },
        { device: 'Tablet', clicks: 6284, percentage: 5.0 }
      ],
      topReferrers: [
        { referrer: 'Direct', clicks: 50271, percentage: 40.0 },
        { referrer: 'Google', clicks: 37703, percentage: 30.0 },
        { device: 'Facebook', clicks: 18852, percentage: 15.0 },
        { referrer: 'Twitter', clicks: 12568, percentage: 10.0 },
        { referrer: 'LinkedIn', clicks: 6284, percentage: 5.0 }
      ]
    },
    timeSeriesData: [
      { date: '2024-01-24', clicks: 1250, uniqueClicks: 890, links: 45 },
      { date: '2024-01-25', clicks: 1456, uniqueClicks: 1023, links: 52 },
      { date: '2024-01-26', clicks: 1123, uniqueClicks: 834, links: 38 },
      { date: '2024-01-27', clicks: 1789, uniqueClicks: 1234, links: 67 },
      { date: '2024-01-28', clicks: 1567, uniqueClicks: 1098, links: 58 },
      { date: '2024-01-29', clicks: 1890, uniqueClicks: 1345, links: 72 },
      { date: '2024-01-30', clicks: 2134, uniqueClicks: 1567, links: 89 }
    ],
    topLinks: [
      { shortUrl: 'pebly.com/abc123', title: 'Marketing Campaign', clicks: 5678, team: 'Marketing' },
      { shortUrl: 'short.company.com/dev456', title: 'Release Download', clicks: 4321, team: 'Development' },
      { shortUrl: 'sales.pebly.com/demo789', title: 'Product Demo', clicks: 3456, team: 'Sales' },
      { shortUrl: 'help.support.com/guide', title: 'Help Guide', clicks: 2345, team: 'Support' }
    ],
    teamPerformance: [
      { team: 'Marketing Team', links: 45, clicks: 23456, uniqueClicks: 16789, ctr: 71.5 },
      { team: 'Development Team', links: 32, clicks: 18765, uniqueClicks: 13234, ctr: 70.5 },
      { team: 'Sales Team', links: 28, clicks: 15432, uniqueClicks: 10876, ctr: 70.5 },
      { team: 'Support Team', links: 15, clicks: 8901, uniqueClicks: 6234, ctr: 70.0 }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Comprehensive analytics and performance insights</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="all">All Teams</option>
            <option value="marketing">Marketing Team</option>
            <option value="development">Development Team</option>
            <option value="sales">Sales Team</option>
            <option value="support">Support Team</option>
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          {hasPermission('analytics', 'export') && (
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Export Report
            </button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Clicks</h3>
          <p className="text-2xl font-bold text-blue-600 mt-2">{analyticsData.overview.totalClicks.toLocaleString()}</p>
          <p className="text-sm text-green-600 mt-1">+15.3% vs last period</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Unique Clicks</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">{analyticsData.overview.uniqueClicks.toLocaleString()}</p>
          <p className="text-sm text-green-600 mt-1">+12.8% vs last period</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Click-Through Rate</h3>
          <p className="text-2xl font-bold text-purple-600 mt-2">
            {((analyticsData.overview.uniqueClicks / analyticsData.overview.totalClicks) * 100).toFixed(1)}%
          </p>
          <p className="text-sm text-purple-600 mt-1">Above average</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Links</h3>
          <p className="text-2xl font-bold text-yellow-600 mt-2">{analyticsData.overview.activeLinks}</p>
          <p className="text-sm text-gray-500 mt-1">of {analyticsData.overview.totalLinks} total</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Series Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Trend</h3>
            <div className="flex space-x-2">
              {[
                { id: 'clicks', label: 'Clicks' },
                { id: 'uniqueClicks', label: 'Unique' },
                { id: 'links', label: 'Links' }
              ].map((metric) => (
                <button
                  key={metric.id}
                  onClick={() => setActiveMetric(metric.id)}
                  className={`px-3 py-1 text-xs rounded-full ${activeMetric === metric.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                >
                  {metric.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 flex items-end justify-between space-x-2">
            {analyticsData.timeSeriesData.map((data, index) => {
              const maxValue = Math.max(...analyticsData.timeSeriesData.map(d => d[activeMetric]));
              const height = (data[activeMetric] / maxValue) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t"
                    style={{ height: `${height}%` }}
                    title={`${data.date}: ${data[activeMetric]}`}
                  />
                  <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                    {data.date.split('-')[2]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Countries */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Countries</h3>
          <div className="space-y-3">
            {analyticsData.overview.topCountries.map((country, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <span className="text-sm text-gray-900 dark:text-white w-24">{country.country}</span>
                  <div className="flex-1 mx-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${country.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {country.clicks.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">{country.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Links */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Performing Links</h3>
          <div className="space-y-3">
            {analyticsData.topLinks.map((link, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {link.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                    {link.shortUrl}
                  </div>
                  <div className="text-xs text-blue-600">{link.team}</div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {link.clicks.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">clicks</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Device Types</h3>
          <div className="space-y-4">
            {analyticsData.overview.topDevices.map((device, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${device.device === 'Desktop' ? 'bg-blue-500' :
                    device.device === 'Mobile' ? 'bg-green-500' : 'bg-purple-500'
                    }`} />
                  <span className="text-sm text-gray-900 dark:text-white">{device.device}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {device.clicks.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">{device.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Team Performance</h3>
          <div className="space-y-3">
            {analyticsData.teamPerformance.map((team, index) => (
              <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-b-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {team.team}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {team.links} links • {team.clicks.toLocaleString()} clicks
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600">
                      {team.ctr}%
                    </div>
                    <div className="text-xs text-gray-500">CTR</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
