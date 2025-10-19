import React from 'react';
import { Link, QrCode, Upload, MousePointer, RefreshCw, Wifi } from 'lucide-react';
import { useRealTimeStats } from '../../hooks/useRealTimeStats';

interface RealTimeStatsWidgetProps {
  className?: string;
  showLastUpdated?: boolean;
}

const RealTimeStatsWidget: React.FC<RealTimeStatsWidgetProps> = ({ 
  className = '', 
  showLastUpdated = true 
}) => {
  const { stats, loading, error, refetch } = useRealTimeStats(15000); // Update every 15 seconds

  if (loading && !stats) {
    return (
      <div className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={`bg-white rounded-lg p-4 shadow-sm border border-red-200 ${className}`}>
        <div className="text-red-600 text-sm">
          <p>Failed to load real-time stats</p>
          <button 
            onClick={refetch}
            className="mt-2 text-xs underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
          <Wifi className="w-4 h-4 text-green-500" />
          <span>Live Stats</span>
        </h3>
        <button
          onClick={refetch}
          className="text-gray-400 hover:text-gray-600 p-1 rounded"
          title="Refresh stats"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="text-center">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-1">
            <Link className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{stats.shortLinks}</p>
          <p className="text-xs text-gray-600">Short Links</p>
        </div>

        <div className="text-center">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-1">
            <QrCode className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{stats.qrCodes}</p>
          <p className="text-xs text-gray-600">QR Codes</p>
        </div>

        <div className="text-center">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-1">
            <Upload className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{stats.fileLinks}</p>
          <p className="text-xs text-gray-600">File Links</p>
        </div>

        <div className="text-center">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-1">
            <MousePointer className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{stats.totalClicks.toLocaleString()}</p>
          <p className="text-xs text-gray-600">Total Clicks</p>
        </div>
      </div>

      {showLastUpdated && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            Last updated: {stats.lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default RealTimeStatsWidget;