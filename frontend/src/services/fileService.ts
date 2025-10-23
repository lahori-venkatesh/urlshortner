// File Service for MongoDB Integration
// This service handles file uploads and management with the MongoDB backend

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://urlshortner-mrrl.onrender.com/api/v1';

export interface FileUploadRequest {
  file: File;
  title?: string;
  description?: string;
  customShortCode?: string;
  password?: string;
  expiresAt?: string;
  tags?: string[];
  isPublic?: boolean;
  maxDownloadsPerDay?: number;
  maxDownloadsPerHour?: number;
}

export interface FileUploadResponse {
  success: boolean;
  message: string;
  data: {
    fileId: string;
    shortCode: string;
    shortUrl: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    uploadedAt: string;
    expiresAt?: string;
    isPasswordProtected: boolean;
  };
}

export interface FileInfo {
  fileId: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  uploadedAt: string;
  description?: string;
  downloadCount: number;
  isPublic: boolean;
  shortUrl?: string;
  shortCode?: string;
  tags?: string[];
}

export interface FileStats {
  totalFiles: number;
  totalSize: number;
  totalDownloads: number;
  fileTypeStats: Record<string, number>;
}

class FileService {
  private getAuthHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
    };
  }

  private getFormDataHeaders(): HeadersInit {
    return {
      // Don't set Content-Type for FormData, let browser set it with boundary
    };
  }

  private getUserId(): string {
    // Get user ID from localStorage (set by AuthContext)
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        return userData.id || 'demo-user-id';
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
    return 'demo-user-id';
  }

  /**
   * Upload a file to MongoDB GridFS and create a short URL
   */
  async uploadFile(request: FileUploadRequest): Promise<FileUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', request.file);
      formData.append('userId', this.getUserId());
      
      if (request.title) formData.append('title', request.title);
      if (request.description) formData.append('description', request.description);
      if (request.customShortCode) formData.append('customShortCode', request.customShortCode);
      if (request.password) formData.append('password', request.password);
      if (request.expiresAt) formData.append('expiresAt', request.expiresAt);
      if (request.tags) formData.append('tags', request.tags.join(','));
      if (request.isPublic !== undefined) formData.append('isPublic', request.isPublic.toString());
      if (request.maxDownloadsPerDay) formData.append('maxDownloadsPerDay', request.maxDownloadsPerDay.toString());
      if (request.maxDownloadsPerHour) formData.append('maxDownloadsPerHour', request.maxDownloadsPerHour.toString());

      const response = await fetch(`${API_BASE_URL}/files/upload`, {
        method: 'POST',
        headers: this.getFormDataHeaders(),
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(files: File[], description?: string, isPublic: boolean = true): Promise<FileUploadResponse> {
    try {
      const formData = new FormData();
      
      files.forEach(file => {
        formData.append('files', file);
      });
      
      if (description) formData.append('description', description);
      formData.append('isPublic', isPublic.toString());

      const response = await fetch(`${API_BASE_URL}/files/upload/bulk`, {
        method: 'POST',
        headers: this.getFormDataHeaders(),
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Bulk upload failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Bulk file upload error:', error);
      throw error;
    }
  }

  /**
   * Get user's uploaded files
   */
  async getUserFiles(): Promise<{ success: boolean; data: FileInfo[] }> {
    try {
      const userId = this.getUserId();
      const response = await fetch(`${API_BASE_URL}/files/user/${userId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get user files error:', error);
      throw error;
    }
  }

  /**
   * Get file information
   */
  async getFileInfo(fileId: string): Promise<{ success: boolean; data: FileInfo }> {
    try {
      const response = await fetch(`${API_BASE_URL}/files/${fileId}/info`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch file info: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get file info error:', error);
      throw error;
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(fileCode: string): Promise<{ success: boolean; message: string }> {
    try {
      const userId = this.getUserId();
      const response = await fetch(`${API_BASE_URL}/files/${fileCode}?userId=${userId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Delete file error:', error);
      throw error;
    }
  }

  /**
   * Get file statistics
   */
  async getFileStats(): Promise<{ success: boolean; data: FileStats }> {
    try {
      const response = await fetch(`${API_BASE_URL}/files/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch file stats: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get file stats error:', error);
      throw error;
    }
  }

  /**
   * Download a file
   */
  async downloadFile(fileCode: string, fileName?: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/files/${fileCode}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download file error:', error);
      throw error;
    }
  }

  /**
   * Get file download URL
   */
  getFileDownloadUrl(fileCode: string): string {
    return `${API_BASE_URL}/files/${fileCode}`;
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/zip',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'video/mp4', 'audio/mpeg', 'audio/wav',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 50MB limit' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not supported' };
    }

    return { valid: true };
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file type category
   */
  getFileTypeCategory(mimeType: string): 'image' | 'document' | 'video' | 'audio' | 'other' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
    return 'other';
  }

  /**
   * Get file icon based on type
   */
  getFileIcon(mimeType: string): string {
    const category = this.getFileTypeCategory(mimeType);
    switch (category) {
      case 'image': return '🖼️';
      case 'video': return '🎥';
      case 'audio': return '🎵';
      case 'document': return '📄';
      default: return '📁';
    }
  }
}

export const fileService = new FileService();
export default fileService;