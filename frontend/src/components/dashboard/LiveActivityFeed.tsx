import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, QrCode, Upload, Clock, Eye, Copy, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

interface ActivityItem {
  id: string;
  type: 'url' | 'qr' | 'file';
  title: string;
  shortUrl: string;
  clicks: number;
  timestamp: string;
  isNew?: boolean;
}

interface LiveActivityFeedProps {
  maxItems?: number;
  showActions?: boolean;
  className?: string;
}

const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({ 
  maxItems = 5, 
  showActions = true,
  className = '' 
}) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActivities = async () => {
    if (!user?.id) return;

    try {
      const [urlsResponse, qrResponse, filesResponse] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080/api'}/v1/urls/user/${user.id}`).then(r => r.json()).catch(() => ({ success: false, data: [] })),
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080/api'}/v1/qr/user/${user.id}`).then(r => r.json()).catch(() => ({ success: false, data: [] })),
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080/api'}/v1/files/user/${user.id}`).then(r => r.json()).catch(() => ({ success: false, data: [] }))
      ]);

      const links = urlsResponse.success ? urlsResponse.data : [];
      const qrCodes = qrResponse.success ? qrResponse.data : [];
      const files = filesResponse.success ? filesResponse.data : [];

      const allActivities: ActivityItem[] = [
        ...links.map((link: any) => ({
          id: link.id,
          type: 'url' as const,
          title: 'Short Link',
          shortUrl: link.shortUrl,
          clicks: link.clicks || 0,
          timestamp: link.createdAt
        })),
        ...qrCodes.map((qr: any) => ({
          id: qr.id,
          type: 'qr' as const,
          title: 'QR Code',
          shortUrl: qr.shortUrl,
          clicks: qr.scans || 0,
          timestamp: qr.createdAt
        })),
        ...files.map((file: any) => ({
          id: file.id,
          type: 'file' as const,
          title: file.originalFileName || 'File Link',
          shortUrl: file.fileUrl,
          clicks: file.totalDownloads || 0,
          timestamp: file.uploadedAt
        }))
      ];

      const sortedActivities = allActivities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, maxItems);

      // Check for new activities
      const previousIds = activities.map(a => a.id);
      const newActivities = sortedActivities.filter(a => !previousIds.includes(a.id));
      
      if (newActivities.length > 0 && activities.length > 0) {
        newActivities.forEach(activity => {
          toast.success(`New ${activity.type === 'url' ? 'short link' : activity.type === 'qr' ? 'QR code' : 'file'} created!`, {
            duration: 3000,
            icon: activity.type === 'url' ? '🔗' : activity.type === 'qr' ? '📱' : '📁'
          });
        });
      }

      setActivities(sortedActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
    
    // Refresh every 10 seconds
    const interval = setInterval(loadActivities, 10000);
    return () => clearInterval(interval);
  }, [user?.id, maxItems]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'qr':
        return <QrCode className="w-4 h-4 text-purple-600" />;
      case 'file':
        return <Upload className="w-4 h-4 text-orange-600" />;
      default:
        return <Link className="w-4 h-4 text-blue-600" />;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 ${className}`}>
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>Live Activity</span>
        </h3>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Live updates"></div>
      </div>

      {activities.length > 0 ? (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  {getIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-xs text-blue-600 font-mono truncate max-w-32">
                      {activity.shortUrl}
                    </p>
                    <span className="text-xs text-gray-400 flex items-center space-x-1">
                      <Eye className="w-3 h-3" />
                      <span>{activity.clicks}</span>
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-500">
                  {getTimeAgo(activity.timestamp)}
                </span>
                {showActions && (
                  <div className="flex items-center space-x-1 ml-2">
                    <button
                      onClick={() => copyToClipboard(activity.shortUrl)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded"
                      title="Copy link"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => window.open(activity.shortUrl, '_blank')}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded"
                      title="Open link"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No recent activity</p>
        </div>
      )}
    </div>
  );
};

export default LiveActivityFeed;