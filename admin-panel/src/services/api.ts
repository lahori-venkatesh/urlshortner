import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

// Create axios instance for admin API
export const adminApi: AxiosInstance = axios.create({
  baseURL: '/api/v1/admin',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin-token');
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
adminApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin-token');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    } else if (error.response?.status === 403) {
      toast.error('Access denied. Insufficient permissions.');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    }
    
    return Promise.reject(error);
  }
);

// Admin API endpoints
export const adminApiEndpoints = {
  // Authentication
  auth: {
    login: (data: { email: string; password: string; mfaCode?: string }) =>
      adminApi.post('/auth/login', data),
    logout: () => adminApi.post('/auth/logout'),
    me: () => adminApi.get('/auth/me'),
    refreshToken: () => adminApi.post('/auth/refresh'),
  },

  // User Management
  users: {
    list: (params?: any) => adminApi.get('/users', { params }),
    get: (id: string) => adminApi.get(`/users/${id}`),
    create: (data: any) => adminApi.post('/users', data),
    update: (id: string, data: any) => adminApi.put(`/users/${id}`, data),
    suspend: (id: string, reason: string) => 
      adminApi.post(`/users/${id}/suspend`, { reason }),
    reactivate: (id: string) => adminApi.post(`/users/${id}/reactivate`),
    delete: (id: string) => adminApi.delete(`/users/${id}`),
    impersonate: (id: string) => adminApi.post(`/users/${id}/impersonate`),
    exportData: (id: string) => adminApi.get(`/users/${id}/export`),
    bulkAction: (action: string, userIds: string[], data?: any) =>
      adminApi.post('/users/bulk', { action, userIds, data }),
  },

  // Team Management
  teams: {
    list: (params?: any) => adminApi.get('/teams', { params }),
    get: (id: string) => adminApi.get(`/teams/${id}`),
    create: (data: any) => adminApi.post('/teams', data),
    update: (id: string, data: any) => adminApi.put(`/teams/${id}`, data),
    delete: (id: string) => adminApi.delete(`/teams/${id}`),
    transferOwnership: (id: string, newOwnerId: string) =>
      adminApi.post(`/teams/${id}/transfer`, { newOwnerId }),
    addMember: (id: string, userId: string, role: string) =>
      adminApi.post(`/teams/${id}/members`, { userId, role }),
    removeMember: (id: string, userId: string) =>
      adminApi.delete(`/teams/${id}/members/${userId}`),
  },

  // Domain Management
  domains: {
    list: (params?: any) => adminApi.get('/domains', { params }),
    get: (id: string) => adminApi.get(`/domains/${id}`),
    verify: (id: string) => adminApi.post(`/domains/${id}/verify`),
    suspend: (id: string, reason: string) =>
      adminApi.post(`/domains/${id}/suspend`, { reason }),
    reactivate: (id: string) => adminApi.post(`/domains/${id}/reactivate`),
    delete: (id: string) => adminApi.delete(`/domains/${id}`),
    renewSsl: (id: string) => adminApi.post(`/domains/${id}/renew-ssl`),
    transfer: (id: string, newOwnerId: string) =>
      adminApi.post(`/domains/${id}/transfer`, { newOwnerId }),
  },

  // Link Management
  links: {
    list: (params?: any) => adminApi.get('/links', { params }),
    get: (id: string) => adminApi.get(`/links/${id}`),
    disable: (id: string, reason: string) =>
      adminApi.post(`/links/${id}/disable`, { reason }),
    enable: (id: string) => adminApi.post(`/links/${id}/enable`),
    delete: (id: string) => adminApi.delete(`/links/${id}`),
    bulkAction: (action: string, linkIds: string[], data?: any) =>
      adminApi.post('/links/bulk', { action, linkIds, data }),
  },

  // Billing & Subscriptions
  billing: {
    subscriptions: {
      list: (params?: any) => adminApi.get('/billing/subscriptions', { params }),
      get: (id: string) => adminApi.get(`/billing/subscriptions/${id}`),
      update: (id: string, data: any) => adminApi.put(`/billing/subscriptions/${id}`, data),
      cancel: (id: string, reason: string) =>
        adminApi.post(`/billing/subscriptions/${id}/cancel`, { reason }),
      reactivate: (id: string) => adminApi.post(`/billing/subscriptions/${id}/reactivate`),
    },
    invoices: {
      list: (params?: any) => adminApi.get('/billing/invoices', { params }),
      get: (id: string) => adminApi.get(`/billing/invoices/${id}`),
      refund: (id: string, amount: number, reason: string) =>
        adminApi.post(`/billing/invoices/${id}/refund`, { amount, reason }),
      resend: (id: string) => adminApi.post(`/billing/invoices/${id}/resend`),
    },
    coupons: {
      list: (params?: any) => adminApi.get('/billing/coupons', { params }),
      create: (data: any) => adminApi.post('/billing/coupons', data),
      update: (id: string, data: any) => adminApi.put(`/billing/coupons/${id}`, data),
      delete: (id: string) => adminApi.delete(`/billing/coupons/${id}`),
    },
  },

  // Support
  support: {
    tickets: {
      list: (params?: any) => adminApi.get('/support/tickets', { params }),
      get: (id: string) => adminApi.get(`/support/tickets/${id}`),
      assign: (id: string, adminId: string) =>
        adminApi.post(`/support/tickets/${id}/assign`, { adminId }),
      respond: (id: string, message: string, isInternal: boolean) =>
        adminApi.post(`/support/tickets/${id}/respond`, { message, isInternal }),
      updateStatus: (id: string, status: string) =>
        adminApi.put(`/support/tickets/${id}/status`, { status }),
      updatePriority: (id: string, priority: string) =>
        adminApi.put(`/support/tickets/${id}/priority`, { priority }),
      close: (id: string, resolution: string) =>
        adminApi.post(`/support/tickets/${id}/close`, { resolution }),
    },
  },

  // Analytics
  analytics: {
    dashboard: () => adminApi.get('/analytics/dashboard'),
    users: (params?: any) => adminApi.get('/analytics/users', { params }),
    revenue: (params?: any) => adminApi.get('/analytics/revenue', { params }),
    usage: (params?: any) => adminApi.get('/analytics/usage', { params }),
    export: (type: string, params?: any) =>
      adminApi.get(`/analytics/export/${type}`, { params, responseType: 'blob' }),
  },

  // System Management
  system: {
    health: () => adminApi.get('/system/health'),
    metrics: () => adminApi.get('/system/metrics'),
    jobs: {
      list: (params?: any) => adminApi.get('/system/jobs', { params }),
      retry: (id: string) => adminApi.post(`/system/jobs/${id}/retry`),
      cancel: (id: string) => adminApi.post(`/system/jobs/${id}/cancel`),
    },
    cache: {
      clear: (key?: string) => adminApi.post('/system/cache/clear', { key }),
      stats: () => adminApi.get('/system/cache/stats'),
    },
  },

  // Feature Flags
  featureFlags: {
    list: () => adminApi.get('/feature-flags'),
    get: (key: string) => adminApi.get(`/feature-flags/${key}`),
    update: (key: string, data: any) => adminApi.put(`/feature-flags/${key}`, data),
    create: (data: any) => adminApi.post('/feature-flags', data),
    delete: (key: string) => adminApi.delete(`/feature-flags/${key}`),
  },

  // Audit Logs
  audit: {
    list: (params?: any) => adminApi.get('/audit', { params }),
    export: (params?: any) =>
      adminApi.get('/audit/export', { params, responseType: 'blob' }),
  },

  // Admin Management
  admins: {
    list: (params?: any) => adminApi.get('/admins', { params }),
    create: (data: any) => adminApi.post('/admins', data),
    update: (id: string, data: any) => adminApi.put(`/admins/${id}`, data),
    delete: (id: string) => adminApi.delete(`/admins/${id}`),
    resetPassword: (id: string) => adminApi.post(`/admins/${id}/reset-password`),
    toggleMfa: (id: string) => adminApi.post(`/admins/${id}/toggle-mfa`),
  },
};

export default adminApiEndpoints;