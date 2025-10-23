import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import {
  ArrowLeft,
  BarChart3,
  Eye,
  Globe,
  Smartphone,
  Calendar,
  TrendingUp,
  MapPin,
  Clock,
  Users,
  Download,
  Share2,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

interface QRAnalytics {
  id: string;
  title: string;
  content: string;
  qrCode: string;
  totalScans: number;
  uniqueScans: number;
  todayScans: number;
  thisWeekScans: number;
  thisMonthScans: number;
  scansByCountry: { [key: string]: number };
  scansByCity: { [key: string]: number };
  scansByDevice: { [key: string]: number };
  scansByBrowser: { [key: string]: number };
  scansByOS: { [key: string]: number };
  scansByHour: { [key: string]: number };
  scansByDay: { [key: string]: number };
  createdAt: string;
  lastScannedAt?: string;
}

const QRAnalyticsPage: React.FC = () => {
  const { qrCode } = useParams<{ qrCode: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<QRAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (qrCode && user?.id) {
      loadAnalytics();
    }
  }, [qrCode, user?.id]);

  const loadAnalytics = async () => {
    if (!qrCode || !user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
      const response = await fetch(`${apiUrl}/v1/qr/${qrCode}`);
      const result = await response.json();

      if (result.success && result.data) {
        setAnalytics(result.data);
      } else {
        setError(result.message || 'QR code not found');
      }
    } catch (error) {
      console.error('Failed to load QR analytics:', error);
      setError('Failed to load analytics data');
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTopEntries = (data: { [key: string]: number }, limit = 5) => {
    return Object.entries(data)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics Not Available</h2>
            <p className="text-gray-600 mb-4">{error || 'QR code analytics could not be loaded'}</p>
            <button
              onClick={() => navigate('/dashboard/qr-codes')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to QR Codes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard/qr-codes')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{analytics.title}</h1>
              <p className="text-gray-600">QR Code Analytics</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadAnalytics}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Total</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{analytics.totalScans}</div>
            <div className="text-sm text-gray-600">Total Scans</div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">Unique</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{analytics.uniqueScans}</div>
            <div className="text-sm text-gray-600">Unique Visitors</div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">Today</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{analytics.todayScans}</div>
            <div className="text-sm text-gray-600">Scans Today</div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-sm text-gray-500">This Week</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{analytics.thisWeekScans}</div>
            <div className="text-sm text-gray-600">Weekly Scans</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Geographic Data */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Geographic Distribution</h3>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Top Countries</h4>
                <div className="space-y-2">
                  {getTopEntries(analytics.scansByCountry).map(([country, count]) => (
                    <div key={country} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{country}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(count / analytics.totalScans) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Top Cities</h4>
                <div className="space-y-2">
                  {getTopEntries(analytics.scansByCity).map(([city, count]) => (
                    <div key={city} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{city}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${(count / analytics.totalScans) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Device & Browser Data */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Smartphone className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Device & Browser</h3>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Device Types</h4>
                <div className="space-y-2">
                  {getTopEntries(analytics.scansByDevice).map(([device, count]) => (
                    <div key={device} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{device}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${(count / analytics.totalScans) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Operating Systems</h4>
                <div className="space-y-2">
                  {getTopEntries(analytics.scansByOS).map(([os, count]) => (
                    <div key={os} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{os}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-orange-600 h-2 rounded-full" 
                            style={{ width: `${(count / analytics.totalScans) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Time-based Analytics */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Time Distribution</h3>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Scans by Hour</h4>
                <div className="space-y-2">
                  {getTopEntries(analytics.scansByHour).map(([hour, count]) => (
                    <div key={hour} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{hour}:00</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${(count / analytics.totalScans) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Scans by Day</h4>
                <div className="space-y-2">
                  {getTopEntries(analytics.scansByDay).map(([day, count]) => (
                    <div key={day} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{day}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(count / analytics.totalScans) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">QR Code Details</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Content</label>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg mt-1 break-all">
                  {analytics.content}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Created</label>
                <p className="text-sm text-gray-600 mt-1">{formatDate(analytics.createdAt)}</p>
              </div>

              {analytics.lastScannedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Scanned</label>
                  <p className="text-sm text-gray-600 mt-1">{formatDate(analytics.lastScannedAt)}</p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => navigate(`/dashboard/qr-codes/edit/${analytics.qrCode}`)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit QR Code
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QRAnalyticsPage;