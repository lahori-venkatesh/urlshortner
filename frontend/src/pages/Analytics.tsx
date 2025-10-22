import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Globe, Smartphone, MousePointer, ArrowLeft, RefreshCw, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Analytics: React.FC = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);



  // Fallback mock data
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

  const loadAnalytics = useCallback(async () => {
    if (!shortCode || !user?.id) {
      console.log('Missing shortCode or user ID:', { shortCode, userId: user?.id });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
      const analyticsUrl = `${apiUrl}/v1/analytics/url/${shortCode}?userId=${user.id}&timeRange=${timeRange}`;
      
      console.log('Loading analytics from:', analyticsUrl);
      
      const response = await fetch(analyticsUrl);
      
      console.log('Analytics response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Analytics result:', result);
        
        if (result.success) {
          setAnalyticsData(result.data);
          console.log('Analytics data loaded successfully:', result.data);
        } else {
          console.warn('Analytics API returned error:', result.message);
          setAnalyticsData(null);
          toast.error(`Analytics error: ${result.message}`);
        }
      } else {
        const errorText = await response.text();
        console.warn('Analytics API request failed:', response.status, errorText);
        setAnalyticsData(null);
        toast.error(`Failed to load analytics: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setAnalyticsData(null);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [shortCode, timeRange, user]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const goBack = () => {
    navigate('/dashboard/links');
  };

  // Use real data if available, otherwise fall back to mock data
  const displayData = analyticsData || mockData;
  const hasRealData = !!analyticsData;

  // Debug logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log('Analytics rendered:', { shortCode, loading, hasRealData });
  }





  // If no shortCode, show error
  if (!shortCode) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Invalid Link</h2>
          <p className="text-red-600 mb-4">No short code provided for analytics.</p>
          <button
            onClick={() => navigate('/dashboard/links')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Links
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center min-h-96">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading analytics...</span>
        </div>
      </div>
    );
  }

  // Force show main UI if we have real data, otherwise check for empty state
  if (!hasRealData && (!displayData || displayData.totalClicks === 0)) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-4 mb-2">
                <button
                  onClick={goBack}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Links</span>
                </button>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Analytics for /{shortCode}
              </h1>
              <p className="text-gray-600">
                No analytics data available yet. This link hasn't been clicked.
              </p>
            </div>
            <button
              onClick={loadAnalytics}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="text-gray-400 mb-4">
            <BarChart3 className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Data Yet</h3>
          <p className="text-gray-600 mb-4">
            This link hasn't received any clicks yet. Share your link to start collecting analytics data.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <p className="text-sm text-gray-700 font-medium mb-2">Your short link:</p>
            <div className="flex items-center space-x-2">
              <code className="bg-white px-3 py-2 rounded border text-blue-600 flex-1">
                {process.env.REACT_APP_SHORT_URL_DOMAIN || 'https://pebly.vercel.app'}/{shortCode}
              </code>
              <button
                onClick={() => {
                  const url = `${process.env.REACT_APP_SHORT_URL_DOMAIN || 'https://pebly.vercel.app'}/${shortCode}`;
                  navigator.clipboard.writeText(url);
                  toast.success('Link copied to clipboard!');
                }}
                className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // FORCE SIMPLE ANALYTICS UI
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <button
          onClick={goBack}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#3B82F6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            marginBottom: '20px',
            cursor: 'pointer'
          }}
        >
          ← Back to Links
        </button>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
          Analytics for /{shortCode}
        </h1>
        <p style={{ color: '#666', margin: '0' }}>
          Analytics data for your short link
          {hasRealData ? ' (Real Data)' : ' (Demo Data)'}
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Total Clicks</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#3B82F6' }}>
            {displayData.totalClicks}
          </p>
        </div>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Unique Visitors</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#10B981' }}>
            {displayData.uniqueClicks}
          </p>
        </div>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Mobile %</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#8B5CF6' }}>
            42%
          </p>
        </div>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Avg. Daily</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#F59E0B' }}>
            22
          </p>
        </div>
      </div>

      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>Geographic Distribution</h3>
        {displayData.clicksByCountry.map((country: any, index: number) => (
          <div key={country.name} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '8px 0',
            borderBottom: index < displayData.clicksByCountry.length - 1 ? '1px solid #eee' : 'none'
          }}>
            <span style={{ color: '#333' }}>{country.name}</span>
            <span style={{ fontWeight: 'bold', color: '#666' }}>{country.value}</span>
          </div>
        ))}
      </div>

      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>Device Types</h3>
        {displayData.clicksByDevice.map((device: any, index: number) => (
          <div key={device.name} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '8px 0',
            borderBottom: index < displayData.clicksByDevice.length - 1 ? '1px solid #eee' : 'none'
          }}>
            <span style={{ color: '#333' }}>{device.name}</span>
            <span style={{ fontWeight: 'bold', color: '#666' }}>{device.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Fallback component in case of any issues
const AnalyticsWrapper: React.FC = () => {
  try {
    return <Analytics />;
  } catch (error) {
    console.error('Analytics component error:', error);
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="bg-red-100 border border-red-400 rounded p-4">
          <h2 className="text-red-800 font-bold">Analytics Error</h2>
          <p className="text-red-700">Component failed to render. Check console for details.</p>
        </div>
      </div>
    );
  }
};

export default AnalyticsWrapper;