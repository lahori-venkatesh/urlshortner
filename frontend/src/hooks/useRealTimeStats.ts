import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

interface RealTimeStats {
  totalLinks: number;
  totalClicks: number;
  shortLinks: number;
  qrCodes: number;
  fileLinks: number;
  lastUpdated: Date;
}

export const useRealTimeStats = (refreshInterval: number = 30000) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<RealTimeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      const [urlsResponse, qrResponse, filesResponse] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL || 'https://urlshortner-mrrl.onrender.com/api'}/v1/urls/user/${user.id}`).then(r => r.json()).catch(() => ({ success: false, data: [] })),
        fetch(`${process.env.REACT_APP_API_URL || 'https://urlshortner-mrrl.onrender.com/api'}/v1/qr/user/${user.id}`).then(r => r.json()).catch(() => ({ success: false, data: [] })),
        fetch(`${process.env.REACT_APP_API_URL || 'https://urlshortner-mrrl.onrender.com/api'}/v1/files/user/${user.id}`).then(r => r.json()).catch(() => ({ success: false, data: [] }))
      ]);

      const links = urlsResponse.success ? urlsResponse.data : [];
      const qrCodes = qrResponse.success ? qrResponse.data : [];
      const files = filesResponse.success ? filesResponse.data : [];

      const shortLinks = links.filter((link: any) => !link.isFileLink);
      const totalClicks = links.reduce((sum: number, link: any) => sum + (link.clicks || 0), 0) +
                         qrCodes.reduce((sum: number, qr: any) => sum + (qr.scans || 0), 0);

      setStats({
        totalLinks: links.length + qrCodes.length + files.length,
        totalClicks,
        shortLinks: shortLinks.length,
        qrCodes: qrCodes.length,
        fileLinks: files.length,
        lastUpdated: new Date()
      });

      setError(null);
    } catch (err) {
      setError('Failed to fetch stats');
      console.error('Error fetching real-time stats:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchStats();

    const interval = setInterval(fetchStats, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchStats, refreshInterval]);

  return { stats, loading, error, refetch: fetchStats };
};