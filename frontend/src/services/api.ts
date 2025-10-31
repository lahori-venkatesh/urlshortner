import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://urlshortner-mrrl.onrender.com/api';
const ANALYTICS_BASE_URL = process.env.REACT_APP_ANALYTICS_URL || 'http://localhost:3001/api';
const FILE_BASE_URL = process.env.REACT_APP_FILE_URL || 'http://localhost:3002/api';

// Create axios instances
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

const analyticsClient = axios.create({
  baseURL: ANALYTICS_BASE_URL,
  timeout: 10000,
});

const fileClient = axios.create({
  baseURL: FILE_BASE_URL,
  timeout: 30000, // Longer timeout for file uploads
});

// Add auth interceptors to all clients
[analyticsClient, fileClient].forEach(client => {
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('API Error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        console.warn('Unauthorized request - token may be expired');
      }
      return Promise.reject(error);
    }
  );
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    // Handle 401 unauthorized errors
    if (error.response?.status === 401) {
      console.warn('Unauthorized request - clearing invalid auth');
      // Clear invalid authentication
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login page
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    
    return Promise.reject(error);
  }
);

// Types
export interface ShortenUrlRequest {
  originalUrl: string;
  customAlias?: string;
  password?: string;
  expirationDays?: number;
  maxClicks?: number;
  isOneTime?: boolean;
}

export interface ShortenUrlResponse {
  shortUrl: string;
  shortCode: string;
  originalUrl: string;
  createdAt: string;
}

export interface UploadFileRequest {
  customAlias?: string;
  password?: string;
  expirationDays?: number;
  maxClicks?: number;
  isOneTime?: boolean;
}

export interface AnalyticsData {
  totalClicks: number;
  uniqueClicks: number;
  clicksByCountry: Array<{ _id: string; count: number }>;
  clicksByDevice: Array<{ _id: string; count: number }>;
  clicksByBrowser: Array<{ _id: string; count: number }>;
  clicksOverTime: Array<{ _id: { year: number; month: number; day: number }; count: number }>;
  topReferrers: Array<{ _id: string; count: number }>;
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface GoogleAuthRequest {
  email: string;
  googleId: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    subscriptionPlan: string;
    emailVerified: boolean;
    totalUrls: number;
    totalQrCodes: number;
    totalFiles: number;
    totalClicks: number;
    authProvider: string;
    apiKey: string;
    createdAt: string;
    lastLoginAt?: string;
    profilePicture?: string;
  };
}

// API Functions
export const shortenUrl = async (data: ShortenUrlRequest): Promise<ShortenUrlResponse> => {
  const response = await apiClient.post('/shorten', data);
  return response.data;
};

export const uploadFile = async (file: File, options: UploadFileRequest): Promise<ShortenUrlResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  // Add options to form data
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) {
      formData.append(key, value.toString());
    }
  });

  const response = await fileClient.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getAnalytics = async (shortCode: string, timeRange?: string): Promise<AnalyticsData> => {
  const params = timeRange ? { timeRange } : {};
  const response = await analyticsClient.get(`/analytics/${shortCode}`, { params });
  return response.data;
};

export const recordClick = async (shortCode: string, additionalData?: any): Promise<void> => {
  await analyticsClient.post('/click', {
    shortCode,
    ...additionalData,
  });
};

// Authentication API Functions
export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await apiClient.post('/v1/auth/login', data);
  return response.data;
};

export const signup = async (data: SignupRequest): Promise<AuthResponse> => {
  const response = await apiClient.post('/v1/auth/register', data);
  return response.data;
};

export const googleAuth = async (data: GoogleAuthRequest): Promise<AuthResponse> => {
  const response = await apiClient.post('/v1/auth/google', data);
  return response.data;
};

export const validateToken = async (token: string): Promise<AuthResponse> => {
  const response = await apiClient.post('/v1/auth/validate', {}, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data;
};

export const getProfile = async (email: string): Promise<AuthResponse> => {
  const response = await apiClient.get(`/v1/auth/profile/${email}`);
  return response.data;
};

// URL Shortening API Functions
export const createShortUrl = async (data: {
  originalUrl: string;
  userId?: string;
  customAlias?: string;
  password?: string;
  expirationDays?: number;
  title?: string;
  description?: string;
  customDomain?: string;
}): Promise<any> => {
  const response = await apiClient.post('/v1/urls', data);
  return response.data;
};

export const getUserUrls = async (userId: string): Promise<any> => {
  const response = await apiClient.get(`/v1/urls/user/${userId}`);
  return response.data;
};

export const updateUrl = async (shortCode: string, data: any): Promise<any> => {
  const response = await apiClient.put(`/v1/urls/${shortCode}`, data);
  return response.data;
};

export const deleteUrl = async (shortCode: string, userId: string): Promise<any> => {
  const response = await apiClient.delete(`/v1/urls/${shortCode}?userId=${userId}`);
  return response.data;
};

// File Upload API Functions
export const uploadFileToBackend = async (file: File, options: {
  userId?: string;
  title?: string;
  description?: string;
  password?: string;
  expirationDays?: number;
  isPublic?: boolean;
}): Promise<any> => {
  try {
    console.log('uploadFileToBackend called with:', { fileName: file.name, fileSize: file.size, options });
    
    const formData = new FormData();
    formData.append('file', file);
    
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    console.log('Making API request to:', `${apiClient.defaults.baseURL}/v1/files/upload`);
    console.log('apiClient.defaults.baseURL:', apiClient.defaults.baseURL);
    console.log('Full URL will be:', apiClient.defaults.baseURL + '/v1/files/upload');
    
    const response = await apiClient.post('/v1/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('API response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('uploadFileToBackend error:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
      console.error('Error status:', error.response.status);
    }
    throw error;
  }
};

export const getUserFiles = async (userId: string): Promise<any> => {
  const response = await apiClient.get(`/v1/files/user/${userId}`);
  return response.data;
};

export const updateFile = async (fileCode: string, data: any): Promise<any> => {
  const response = await apiClient.put(`/v1/files/${fileCode}`, data);
  return response.data;
};

export const deleteFile = async (fileCode: string, userId: string): Promise<any> => {
  const response = await apiClient.delete(`/v1/files/${fileCode}?userId=${userId}`);
  return response.data;
};

// QR Code API Functions
export const createQrCode = async (data: {
  content: string;
  contentType?: string;
  userId?: string;
  title?: string;
  description?: string;
  style?: string;
  foregroundColor?: string;
  backgroundColor?: string;
  size?: number;
  format?: string;
}): Promise<any> => {
  const response = await apiClient.post('/v1/qr', data);
  return response.data;
};

export const getUserQrCodes = async (userId: string): Promise<any> => {
  const response = await apiClient.get(`/v1/qr/user/${userId}`);
  return response.data;
};

export const updateQrCode = async (qrCodeId: string, data: any): Promise<any> => {
  const response = await apiClient.put(`/v1/qr/${qrCodeId}`, data);
  return response.data;
};

export const deleteQrCode = async (qrCodeId: string, userId: string): Promise<any> => {
  const response = await apiClient.delete(`/v1/qr/${qrCodeId}?userId=${userId}`);
  return response.data;
};

// Analytics API Functions
export const getUrlAnalytics = async (shortCode: string, userId: string): Promise<any> => {
  const response = await apiClient.get(`/v1/analytics/url/${shortCode}?userId=${userId}`);
  return response.data;
};

export const getUserAnalytics = async (userId: string): Promise<any> => {
  const response = await apiClient.get(`/v1/analytics/user/${userId}`);
  return response.data;
};

export const getRealtimeAnalytics = async (userId: string): Promise<any> => {
  const response = await apiClient.get(`/v1/analytics/realtime/${userId}`);
  return response.data;
};

export const recordUrlClick = async (shortCode: string, data: {
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  country?: string;
  city?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
}): Promise<any> => {
  const response = await apiClient.post(`/v1/urls/${shortCode}/click`, data);
  return response.data;
};

export const recordQrScan = async (qrCodeId: string, data: {
  ipAddress?: string;
  userAgent?: string;
  country?: string;
  city?: string;
  deviceType?: string;
}): Promise<any> => {
  const response = await apiClient.post(`/v1/qr/${qrCodeId}/scan`, data);
  return response.data;
};

// Team Management API Functions
export const createTeam = async (data: {
  userId: string;
  teamName: string;
  description?: string;
}): Promise<any> => {
  const response = await apiClient.post('/v1/teams', data);
  return response.data;
};

export const getUserTeams = async (userId: string): Promise<any> => {
  const response = await apiClient.get(`/v1/teams/my?userId=${userId}`);
  return response.data;
};

export const getTeam = async (teamId: string, userId: string): Promise<any> => {
  const response = await apiClient.get(`/v1/teams/${teamId}?userId=${userId}`);
  return response.data;
};

export const updateTeam = async (teamId: string, data: {
  teamName: string;
  description?: string;
}): Promise<any> => {
  const response = await apiClient.put(`/v1/teams/${teamId}`, data);
  return response.data;
};

export const deleteTeam = async (teamId: string): Promise<any> => {
  const response = await apiClient.delete(`/v1/teams/${teamId}`);
  return response.data;
};

export const inviteUserToTeam = async (teamId: string, data: {
  userId: string;
  email: string;
  role: string;
}): Promise<any> => {
  const response = await apiClient.post(`/v1/teams/${teamId}/invite`, data);
  return response.data;
};

export const acceptTeamInvite = async (inviteToken: string): Promise<any> => {
  const response = await apiClient.post(`/v1/teams/invite/${inviteToken}/accept`);
  return response.data;
};

export const getTeamMembers = async (teamId: string, userId: string): Promise<any> => {
  const response = await apiClient.get(`/v1/teams/${teamId}/members?userId=${userId}`);
  return response.data;
};

export const removeTeamMember = async (teamId: string, memberUserId: string): Promise<any> => {
  const response = await apiClient.delete(`/v1/teams/${teamId}/members/${memberUserId}`);
  return response.data;
};

export const updateTeamMemberRole = async (teamId: string, memberUserId: string, data: {
  role: string;
}): Promise<any> => {
  const response = await apiClient.put(`/v1/teams/${teamId}/members/${memberUserId}/role`, data);
  return response.data;
};

export const getTeamInvites = async (teamId: string): Promise<any> => {
  const response = await apiClient.get(`/v1/teams/${teamId}/invites`);
  return response.data;
};

// Team-scoped content functions
export const createTeamShortUrl = async (teamId: string, userId: string, data: {
  originalUrl: string;
  customAlias?: string;
  password?: string;
  expirationDays?: number;
  maxClicks?: number;
  title?: string;
  description?: string;
}): Promise<any> => {
  const response = await apiClient.post('/v1/urls', {
    ...data,
    userId,
    scopeType: 'TEAM',
    scopeId: teamId
  });
  return response.data;
};

export const getTeamUrls = async (teamId: string): Promise<any> => {
  const response = await apiClient.get(`/v1/urls/scope/TEAM/${teamId}`);
  return response.data;
};

export const createTeamQrCode = async (teamId: string, userId: string, data: {
  content: string;
  contentType?: string;
  title?: string;
  description?: string;
  style?: string;
  foregroundColor?: string;
  backgroundColor?: string;
  logoUrl?: string;
  size?: number;
}): Promise<any> => {
  const response = await apiClient.post('/v1/qr', {
    ...data,
    userId,
    scopeType: 'TEAM',
    scopeId: teamId
  });
  return response.data;
};

export const getTeamQrCodes = async (teamId: string): Promise<any> => {
  const response = await apiClient.get(`/v1/qr/scope/TEAM/${teamId}`);
  return response.data;
};

export const uploadTeamFile = async (teamId: string, file: File, options: {
  title?: string;
  description?: string;
  password?: string;
  expirationDays?: number;
  isPublic?: boolean;
}): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  
  if (options.title) formData.append('title', options.title);
  if (options.description) formData.append('description', options.description);
  if (options.password) formData.append('password', options.password);
  if (options.expirationDays) formData.append('expirationDays', options.expirationDays.toString());
  if (options.isPublic !== undefined) formData.append('isPublic', options.isPublic.toString());
  
  formData.append('scopeType', 'TEAM');
  formData.append('scopeId', teamId);
  
  const response = await apiClient.post('/v1/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getTeamFiles = async (teamId: string): Promise<any> => {
  const response = await apiClient.get(`/v1/files/scope/TEAM/${teamId}`);
  return response.data;
};

export default {
  // Legacy functions (keep for backward compatibility)
  shortenUrl,
  uploadFile,
  getAnalytics,
  recordClick,
  
  // Authentication
  login,
  signup,
  googleAuth,
  getProfile,
  
  // New URL functions
  createShortUrl,
  getUserUrls,
  updateUrl,
  deleteUrl,
  
  // File functions
  uploadFileToBackend,
  getUserFiles,
  updateFile,
  deleteFile,
  
  // QR Code functions
  createQrCode,
  getUserQrCodes,
  updateQrCode,
  deleteQrCode,
  
  // Analytics functions
  getUrlAnalytics,
  getUserAnalytics,
  getRealtimeAnalytics,
  recordUrlClick,
  recordQrScan,
  
  // Team functions
  createTeam,
  getUserTeams,
  getTeam,
  updateTeam,
  deleteTeam,
  inviteUserToTeam,
  acceptTeamInvite,
  getTeamMembers,
  removeTeamMember,
  updateTeamMemberRole,
  getTeamInvites,
  
  // Team-scoped content functions
  createTeamShortUrl,
  getTeamUrls,
  createTeamQrCode,
  getTeamQrCodes,
  uploadTeamFile,
  getTeamFiles,
};