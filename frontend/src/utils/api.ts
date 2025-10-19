// API utility functions for consistent URL handling
export const getApiUrl = () => {
  return process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
};

export const buildApiUrl = (endpoint: string) => {
  const baseUrl = getApiUrl();
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/${cleanEndpoint}`;
};

// Common API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: 'v1/auth/login',
  REGISTER: 'v1/auth/register',
  GOOGLE_AUTH: 'v1/auth/google',
  
  // URLs
  CREATE_URL: 'v1/urls',
  USER_URLS: (userId: string) => `v1/urls/user/${userId}`,
  SHORTEN_URL: 'v1/urls/shorten',
  
  // QR Codes
  CREATE_QR: 'v1/qr',
  USER_QR: (userId: string) => `v1/qr/user/${userId}`,
  
  // Files
  UPLOAD_FILE: 'v1/files/upload',
  USER_FILES: (userId: string) => `v1/files/user/${userId}`,
  
  // Analytics
  USER_ANALYTICS: (userId: string) => `v1/analytics/user/${userId}`,
};