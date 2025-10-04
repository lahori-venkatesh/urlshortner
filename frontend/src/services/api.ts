import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081/api';
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

// Request/Response interceptors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
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

export default {
  shortenUrl,
  uploadFile,
  getAnalytics,
  recordClick,
};