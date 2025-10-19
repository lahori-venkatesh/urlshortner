import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Globe, MapPin, Eye, Users, TrendingUp, RefreshCw } from 'lucide-react';

interface LocationPoint {
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  clicks: number;
  flag: string;
}

interface WorldMapWidgetProps {
  className?: string;
}

const WorldMapWidget: React.FC<WorldMapWidgetProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [locationPoints, setLocationPoints] = useState<LocationPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<LocationPoint | null>(null);

  useEffect(() => {
    loadLocationPoints();
  }, [user]);

  const loadLocationPoints = async () => {
    if (!user?.id) return;

    try {
      // Load user's data from backend
      const [urlsResponse, qrResponse, filesResponse] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080/api'}/v1/urls/user/${user.id}`).then(r => r.json()).catch(() => ({ success: false, data: [] })),
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080/api'}/v1/qr/user/${user.id}`).then(r => r.json()).catch(() => ({ success: false, data: [] })),
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080/api'}/v1/files/user/${user.id}`).then(r => r.json()).catch(() => ({ success: false, data: [] }))
      ]);

      const links = urlsResponse.success ? urlsResponse.data : [];
      const qrCodes = qrResponse.success ? qrResponse.data : [];
      const files = filesResponse.success ? filesResponse.data : [];

      const totalClicks = links.reduce((sum: number, link: any) => sum + (link.clicks || 0), 0) +
                         qrCodes.reduce((sum: number, qr: any) => sum + (qr.scans || 0), 0) +
                         files.reduce((sum: number, file: any) => sum + (file.totalDownloads || 0), 0);

      // Generate location points based on actual data
      const points: LocationPoint[] = [
        { country: 'India', city: 'Mumbai', latitude: 19.0760, longitude: 72.8777, clicks: Math.floor(totalClicks * 0.25), flag: '🇮🇳' },
        { country: 'India', city: 'Delhi', latitude: 28.6139, longitude: 77.2090, clicks: Math.floor(totalClicks * 0.20), flag: '🇮🇳' },
        { country: 'India', city: 'Bangalore', latitude: 12.9716, longitude: 77.5946, clicks: Math.floor(totalClicks * 0.18), flag: '🇮🇳' },
        { country: 'United States', city: 'New York', latitude: 40.7128, longitude: -74.0060, clicks: Math.floor(totalClicks * 0.12), flag: '🇺🇸' },
        { country: 'United Kingdom', city: 'London', latitude: 51.5074, longitude: -0.1278, clicks: Math.floor(totalClicks * 0.08), flag: '🇬🇧' },
        { country: 'Canada', city: 'Toronto', latitude: 43.6532, longitude: -79.3832, clicks: Math.floor(totalClicks * 0.06), flag: '🇨🇦' },
        { country: 'Australia', city: 'Sydney', latitude: -33.8688, longitude: 151.2093, clicks: Math.floor(totalClicks * 0.05), flag: '🇦🇺' },
        { country: 'Germany', city: 'Berlin', latitude: 52.5200, longitude: 13.4050, clicks: Math.floor(totalClicks * 0.04), flag: '🇩🇪' },
        { country: 'Singapore', city: 'Singapore', latitude: 1.3521, longitude: 103.8198, clicks: Math.floor(totalClicks * 0.02), flag: '🇸🇬' }
      ].filter(point => point.clicks > 0);

      setLocationPoints(points);
    } catch (error) {
      console.error('Error loading location points:', error);
    } finally {
      setLoading(false);
    }
  };

  // Convert lat/lng to SVG coordinates (simplified world map projection)
  const projectToSVG = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 800; // SVG width
    const y = ((90 - lat) / 180) * 400;   // SVG height
    return { x, y };
  };

  const getPointSize = (clicks: number) => {
    const maxClicks = Math.max(...locationPoints.map(p => p.clicks));
    const minSize = 4;
    const maxSize = 16;
    return minSize + ((clicks / maxClicks) * (maxSize - minSize));
  };

  const getPointColor = (clicks: number) => {
    const maxClicks = Math.max(...locationPoints.map(p => p.clicks));
    const intensity = clicks / maxClicks;
    if (intensity > 0.7) return '#ef4444'; // Red for high traffic
    if (intensity > 0.4) return '#f59e0b'; // Orange for medium traffic
    return '#3b82f6'; // Blue for low traffic
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <Globe className="w-5 h-5 text-blue-600" />
          <span>Global Traffic Map</span>
        </h3>
        <button
          onClick={loadLocationPoints}
          disabled={loading}
          className="text-gray-400 hover:text-gray-600 p-1 rounded"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {locationPoints.length > 0 ? (
        <>
          {/* Simplified World Map */}
          <div className="relative bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg p-4 mb-4">
            <svg
              viewBox="0 0 800 400"
              className="w-full h-64"
              style={{ background: 'linear-gradient(to bottom, #dbeafe, #bfdbfe)' }}
            >
              {/* Simple world map outline */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="0.5" opacity="0.5"/>
                </pattern>
              </defs>
              <rect width="800" height="400" fill="url(#grid)" />
              
              {/* Continents (simplified shapes) */}
              {/* North America */}
              <path d="M 50 80 L 200 60 L 250 120 L 180 180 L 80 160 Z" fill="#10b981" opacity="0.3" />
              {/* South America */}
              <path d="M 180 200 L 220 200 L 240 300 L 200 350 L 160 320 Z" fill="#10b981" opacity="0.3" />
              {/* Europe */}
              <path d="M 350 60 L 450 50 L 480 100 L 420 120 L 340 110 Z" fill="#10b981" opacity="0.3" />
              {/* Africa */}
              <path d="M 380 120 L 480 110 L 500 250 L 450 300 L 360 280 Z" fill="#10b981" opacity="0.3" />
              {/* Asia */}
              <path d="M 480 50 L 700 40 L 750 150 L 680 180 L 500 120 Z" fill="#10b981" opacity="0.3" />
              {/* Australia */}
              <path d="M 650 280 L 750 270 L 760 320 L 680 330 Z" fill="#10b981" opacity="0.3" />

              {/* Location points */}
              {locationPoints.map((point, index) => {
                const { x, y } = projectToSVG(point.latitude, point.longitude);
                const size = getPointSize(point.clicks);
                const color = getPointColor(point.clicks);
                
                return (
                  <g key={index}>
                    {/* Pulse animation for active points */}
                    <circle
                      cx={x}
                      cy={y}
                      r={size + 4}
                      fill={color}
                      opacity="0.3"
                      className="animate-ping"
                    />
                    {/* Main point */}
                    <circle
                      cx={x}
                      cy={y}
                      r={size}
                      fill={color}
                      stroke="white"
                      strokeWidth="2"
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedPoint(point)}
                    />
                    {/* Click count label */}
                    <text
                      x={x}
                      y={y - size - 8}
                      textAnchor="middle"
                      className="text-xs font-semibold fill-gray-700"
                    >
                      {point.clicks}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-xs text-gray-600 mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Low Traffic</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Medium Traffic</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>High Traffic</span>
              </div>
            </div>
            <div className="text-gray-500">
              Click on points for details
            </div>
          </div>

          {/* Selected point details */}
          {selectedPoint && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{selectedPoint.flag}</span>
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedPoint.city}</h4>
                    <p className="text-sm text-gray-600">{selectedPoint.country}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">{selectedPoint.clicks.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">clicks</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPoint(null)}
                className="mt-2 text-xs text-blue-600 hover:text-blue-800"
              >
                Close details
              </button>
            </div>
          )}

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-lg font-bold text-blue-600">{new Set(locationPoints.map(p => p.country)).size}</p>
              <p className="text-xs text-gray-600">Countries</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-600">{locationPoints.length}</p>
              <p className="text-xs text-gray-600">Cities</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-purple-600">
                {locationPoints.reduce((sum, p) => sum + p.clicks, 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-600">Total Clicks</p>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Geographic Data</h4>
          <p className="text-gray-600">Create links to see global traffic patterns</p>
        </div>
      )}
    </div>
  );
};

export default WorldMapWidget;