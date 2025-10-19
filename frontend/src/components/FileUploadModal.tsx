import React, { useState, useRef } from 'react';
import { 
  Upload, 
  X, 
  File, 
  Image, 
  FileText, 
  Video, 
  Music,
  AlertCircle,
  Check,
  Loader2,
  Calendar,
  Lock,
  Tag,
  Globe,
  Eye,
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fileService, FileUploadRequest } from '../services/fileService';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (fileData: any) => void;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({ isOpen, onClose, onUploadSuccess }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [customShortCode, setCustomShortCode] = useState('');
  const [password, setPassword] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [maxDownloadsPerDay, setMaxDownloadsPerDay] = useState<number | undefined>();
  const [maxDownloadsPerHour, setMaxDownloadsPerHour] = useState<number | undefined>();

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFileSelection(files);
  };

  const handleFileSelection = (files: File[]) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      const validation = fileService.validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (errors.length > 0) {
      toast.error(`Some files were rejected:\n${errors.join('\n')}`);
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFileSelection(files);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    const type = fileService.getFileTypeCategory(file.type);
    switch (type) {
      case 'image': return <Image className="w-6 h-6 text-green-600" />;
      case 'video': return <Video className="w-6 h-6 text-purple-600" />;
      case 'audio': return <Music className="w-6 h-6 text-blue-600" />;
      case 'document': return <FileText className="w-6 h-6 text-red-600" />;
      default: return <File className="w-6 h-6 text-gray-600" />;
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags(prev => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadPromises = selectedFiles.map(async (file, index) => {
        const request: FileUploadRequest = {
          file,
          title: title || file.name,
          description,
          customShortCode: selectedFiles.length === 1 ? customShortCode : undefined,
          password: password || undefined,
          expiresAt: expiresAt || undefined,
          tags: tags.length > 0 ? tags : undefined,
          isPublic,
          maxDownloadsPerDay,
          maxDownloadsPerHour,
        };

        const result = await fileService.uploadFile(request);
        
        // Update progress
        setUploadProgress(((index + 1) / selectedFiles.length) * 100);
        
        return result;
      });

      const results = await Promise.all(uploadPromises);
      
      // Call success callback for each uploaded file
      results.forEach(result => {
        if (result.success) {
          onUploadSuccess({
            id: result.data.fileId,
            fileName: result.data.fileName,
            fileType: fileService.getFileTypeCategory(selectedFiles.find(f => f.name === result.data.fileName)?.type || ''),
            fileSize: result.data.fileSize,
            shortUrl: result.data.shortUrl,
            shortCode: result.data.shortCode,
            originalUrl: result.data.shortUrl,
            clicks: 0,
            createdAt: result.data.uploadedAt,
            downloadCount: 0,
            tags: tags,
            type: 'file',
            isPasswordProtected: result.data.isPasswordProtected,
            expiresAt: result.data.expiresAt,
          });
        }
      });

      toast.success(`Successfully uploaded ${results.length} file(s) to MongoDB!`);
      
      // Reset form
      setSelectedFiles([]);
      setTitle('');
      setDescription('');
      setCustomShortCode('');
      setPassword('');
      setExpiresAt('');
      setTags([]);
      setTagInput('');
      setIsPublic(true);
      setMaxDownloadsPerDay(undefined);
      setMaxDownloadsPerHour(undefined);
      
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Upload Files to MongoDB</h2>
            <p className="text-gray-600 mt-1">Upload files and create shareable links stored in MongoDB</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* File Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Drop files here or click to browse
            </h3>
            <p className="text-gray-600 mb-4">
              Supports images, documents, videos, audio files up to 50MB
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Choose Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
              accept="image/*,application/pdf,text/*,application/zip,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,video/*,audio/*"
            />
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Selected Files ({selectedFiles.length})</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(file)}
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-600">{fileService.formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">File Information</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Custom title for the file"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your file"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Short Code (optional)
                </label>
                <input
                  type="text"
                  value={customShortCode}
                  onChange={(e) => setCustomShortCode(e.target.value)}
                  placeholder="e.g., my-file"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={selectedFiles.length > 1}
                />
                {selectedFiles.length > 1 && (
                  <p className="text-xs text-gray-500 mt-1">Custom codes not available for multiple files</p>
                )}
              </div>
            </div>

            {/* Advanced Options */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Advanced Options</h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Password Protection (optional)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set password for file access"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Expiry Date (optional)
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Tag className="w-4 h-4 inline mr-1" />
                  Tags
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add tags"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={addTag}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Add
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map(tag => (
                      <span
                        key={tag}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center space-x-1"
                      >
                        <span>{tag}</span>
                        <button onClick={() => removeTag(tag)} className="text-blue-600 hover:text-blue-800">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 flex items-center">
                    {isPublic ? <Globe className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                    Public Access
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Uploading to MongoDB...</span>
                <span className="text-sm text-gray-600">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={uploading}
              className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || uploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload to MongoDB</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal;