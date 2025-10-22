import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Analytics: React.FC = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // Mock data for fallback
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
    ]
  };

  const loadAnalytics = useCallback(async () => {
    if (!shortCode || !user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
      const analyticsUrl = `${apiUrl}/v1/analytics/url/${shortCode}?userId=${user.id}`;
      
      const response = await fetch(analyticsUrl);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAnalyticsData(result.data);
        } else {
          setAnalyticsData(null);
          toast.error(`Analytics error: ${result.message}`);
        }
      } else {
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
  }, [shortCode, user]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const displayData = analyticsData || mockData;
  const hasRealData = !!analyticsData;

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading analytics...
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <button
          onClick={() => navigate('/dashboard/links')}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#3B82F6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px',
            marginBottom: '20px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          ← Back to Links
        </button>
        
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          margin: '0 0 10px 0',
          color: '#1F2937'
        }}>
          Analytics for /{shortCode}
        </h1>
        
        <p style={{ 
          color: '#6B7280', 
          margin: '0',
          fontSize: '16px'
        }}>
          Detailed analytics and insights for your short link
          {hasRealData ? ' (Real Data)' : ' (Demo Data - No clicks yet)'}
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px',
        marginBottom: '40px'
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '24px', 
          borderRadius: '12px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #E5E7EB'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              backgroundColor: '#DBEAFE', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px'
            }}>
              📊
            </div>
            <div>
              <p style={{ margin: '0', fontSize: '14px', color: '#6B7280', fontWeight: '500' }}>
                Total Clicks
              </p>
              <p style={{ margin: '0', fontSize: '28px', fontWeight: 'bold', color: '#1F2937' }}>
                {displayData.totalClicks}
              </p>
            </div>
          </div>
        </div>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '24px', 
          borderRadius: '12px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #E5E7EB'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              backgroundColor: '#D1FAE5', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px'
            }}>
              👥
            </div>
            <div>
              <p style={{ margin: '0', fontSize: '14px', color: '#6B7280', fontWeight: '500' }}>
                Unique Visitors
              </p>
              <p style={{ margin: '0', fontSize: '28px', fontWeight: 'bold', color: '#1F2937' }}>
                {displayData.uniqueClicks}
              </p>
            </div>
          </div>
        </div>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '24px', 
          borderRadius: '12px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #E5E7EB'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              backgroundColor: '#EDE9FE', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px'
            }}>
              📱
            </div>
            <div>
              <p style={{ margin: '0', fontSize: '14px', color: '#6B7280', fontWeight: '500' }}>
                Mobile Traffic
              </p>
              <p style={{ margin: '0', fontSize: '28px', fontWeight: 'bold', color: '#1F2937' }}>
                42%
              </p>
            </div>
          </div>
        </div>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '24px', 
          borderRadius: '12px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #E5E7EB'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              backgroundColor: '#FEF3C7', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px'
            }}>
              📈
            </div>
            <div>
              <p style={{ margin: '0', fontSize: '14px', color: '#6B7280', fontWeight: '500' }}>
                Avg. Daily
              </p>
              <p style={{ margin: '0', fontSize: '28px', fontWeight: 'bold', color: '#1F2937' }}>
                22
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Geographic Distribution */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '24px', 
        borderRadius: '12px', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #E5E7EB',
        marginBottom: '20px'
      }}>
        <h3 style={{ 
          margin: '0 0 20px 0', 
          fontSize: '18px', 
          fontWeight: '600', 
          color: '#1F2937' 
        }}>
          🌍 Geographic Distribution
        </h3>
        {displayData.clicksByCountry.map((country: any, index: number) => (
          <div key={country.name} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '12px 0',
            borderBottom: index < displayData.clicksByCountry.length - 1 ? '1px solid #F3F4F6' : 'none'
          }}>
            <span style={{ color: '#374151', fontWeight: '500' }}>{country.name}</span>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                width: '100px', 
                height: '8px', 
                backgroundColor: '#F3F4F6', 
                borderRadius: '4px',
                marginRight: '12px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${(country.value / displayData.totalClicks) * 100}%`,
                  height: '100%',
                  backgroundColor: '#3B82F6',
                  borderRadius: '4px'
                }} />
              </div>
              <span style={{ fontWeight: 'bold', color: '#1F2937', minWidth: '30px' }}>
                {country.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Device Types */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '24px', 
        borderRadius: '12px', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #E5E7EB'
      }}>
        <h3 style={{ 
          margin: '0 0 20px 0', 
          fontSize: '18px', 
          fontWeight: '600', 
          color: '#1F2937' 
        }}>
          💻 Device Types
        </h3>
        {displayData.clicksByDevice.map((device: any, index: number) => (
          <div key={device.name} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '12px 0',
            borderBottom: index < displayData.clicksByDevice.length - 1 ? '1px solid #F3F4F6' : 'none'
          }}>
            <span style={{ color: '#374151', fontWeight: '500' }}>{device.name}</span>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                width: '100px', 
                height: '8px', 
                backgroundColor: '#F3F4F6', 
                borderRadius: '4px',
                marginRight: '12px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${(device.value / displayData.clicksByDevice.reduce((sum: number, d: any) => sum + d.value, 0)) * 100}%`,
                  height: '100%',
                  backgroundColor: '#10B981',
                  borderRadius: '4px'
                }} />
              </div>
              <span style={{ fontWeight: 'bold', color: '#1F2937', minWidth: '30px' }}>
                {device.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Refresh Button */}
      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button
          onClick={loadAnalytics}
          style={{ 
            padding: '12px 24px', 
            backgroundColor: '#10B981', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          🔄 Refresh Analytics
        </button>
      </div>
    </div>
  );
};

export default Analytics;