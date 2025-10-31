import { useQuery, useQueries } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';

// Types
interface DashboardStats {
  totalLinks: number;
  totalClicks: number;
  totalQRCodes: number;
  totalFiles: number;
  shortLinks: number;
  qrCodeCount: number;
  fileLinksCount: number;
  clicksToday: number;
  clicksThisWeek: number;
  topPerformingLink: any;
  recentActivity: any[];
  clicksOverTime: any[];
}

// API functions
const fetchUserUrls = async (userId: string) => {
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${apiUrl}/v1/urls/user/${userId}`, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch URLs: ${response.status}`);
  }
  
  const data = await response.json();
  return data.success ? data.data : [];
};

const fetchUserQRCodes = async (userId: string) => {
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${apiUrl}/v1/qr/user/${userId}`, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch QR codes: ${response.status}`);
  }
  
  const data = await response.json();
  return data.success ? data.data : [];
};

const fetchUserFiles = async (userId: string) => {
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${apiUrl}/v1/files/user/${userId}`, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch files: ${response.status}`);
  }
  
  const data = await response.json();
  return data.success ? data.data : [];
};

// Process raw data into dashboard stats
const processDashboardData = (links: any[], qrCodes: any[], files: any[]): DashboardStats => {
  const shortLinks = links.filter((link: any) => !link.isFileLink);
  const totalClicks = links.reduce((sum: number, link: any) => sum + (link.clicks || 0), 0);
  const totalQRScans = qrCodes.reduce((sum: number, qr: any) => sum + (qr.scans || 0), 0);
  
  // Calculate time-based data
  const today = new Date();
  const todayStr = today.toDateString();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const clicksToday = links
    .filter((link: any) => new Date(link.createdAt).toDateString() === todayStr)
    .reduce((sum: number, link: any) => sum + (link.clicks || 0), 0);
  
  const clicksThisWeek = links
    .filter((link: any) => new Date(link.createdAt) >= weekAgo)
    .reduce((sum: number, link: any) => sum + (link.clicks || 0), 0);
  
  // Generate time series data
  const clicksOverTime = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toDateString();
    
    const dayLinks = links.filter((link: any) => 
      new Date(link.createdAt).toDateString() === dateStr
    );
    
    const dayClicks = dayLinks.reduce((sum: number, link: any) => sum + (link.clicks || 0), 0);
    
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      clicks: dayClicks || 0,
      links: dayLinks.length
    };
  });

  // Create recent activity
  const allActivity = [
    ...links.map((link: any) => ({
      ...link,
      type: 'link',
      action: 'created',
      timestamp: link.createdAt
    })),
    ...qrCodes.map((qr: any) => ({
      ...qr,
      type: 'qr',
      action: 'generated',
      timestamp: qr.createdAt
    })),
    ...files.map((file: any) => ({
      ...file,
      type: 'file',
      action: 'uploaded',
      timestamp: file.createdAt
    }))
  ]
  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  .slice(0, 10);

  const topPerformingLink = links.length > 0 
    ? links.reduce((max: any, link: any) => 
        (link.clicks || 0) > (max.clicks || 0) ? link : max
      )
    : null;

  return {
    totalLinks: links.length,
    totalClicks: totalClicks + totalQRScans,
    totalQRCodes: qrCodes.length,
    totalFiles: files.length,
    shortLinks: shortLinks.length,
    qrCodeCount: qrCodes.length,
    fileLinksCount: files.length,
    clicksToday,
    clicksThisWeek,
    topPerformingLink,
    recentActivity: allActivity,
    clicksOverTime
  };
};

// Custom hooks
export const useDashboardData = () => {
  const { user } = useAuth();
  
  // Use parallel queries for better performance
  const queries = useQueries({
    queries: [
      {
        queryKey: ['user-urls', user?.id],
        queryFn: () => fetchUserUrls(user!.id),
        enabled: !!user?.id,
        staleTime: 3 * 60 * 1000, // 3 minutes for URLs (more dynamic)
      },
      {
        queryKey: ['user-qrcodes', user?.id],
        queryFn: () => fetchUserQRCodes(user!.id),
        enabled: !!user?.id,
        staleTime: 5 * 60 * 1000, // 5 minutes for QR codes
      },
      {
        queryKey: ['user-files', user?.id],
        queryFn: () => fetchUserFiles(user!.id),
        enabled: !!user?.id,
        staleTime: 5 * 60 * 1000, // 5 minutes for files
      }
    ]
  });

  const [urlsQuery, qrCodesQuery, filesQuery] = queries;

  // Check if any query is loading for the first time (no cached data)
  const isInitialLoading = queries.some(query => query.isLoading && !query.data);
  
  // Check if any query is fetching in background
  const isRefreshing = queries.some(query => query.isFetching && query.data);
  
  // Check if all queries have data (from cache or fresh)
  const hasData = queries.every(query => query.data !== undefined);
  
  // Process data when available
  const stats = hasData 
    ? processDashboardData(
        urlsQuery.data || [],
        qrCodesQuery.data || [],
        filesQuery.data || []
      )
    : null;

  return {
    stats,
    isLoading: isInitialLoading,
    isRefreshing,
    hasData,
    error: queries.find(query => query.error)?.error,
    refetch: () => queries.forEach(query => query.refetch())
  };
};

// Hook for individual data types (for specific components)
export const useUserUrls = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-urls', user?.id],
    queryFn: () => fetchUserUrls(user!.id),
    enabled: !!user?.id,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

export const useUserQRCodes = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-qrcodes', user?.id],
    queryFn: () => fetchUserQRCodes(user!.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUserFiles = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-files', user?.id],
    queryFn: () => fetchUserFiles(user!.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};