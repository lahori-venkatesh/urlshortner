import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, FileText, Image, File } from 'lucide-react';

interface FileData {
  name: string;
  type: string;
  size: number;
  data: string;
  uploadedAt: string;
}

const FileViewer: React.FC = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('FileViewer mounted with fileId:', fileId);
    
    if (!fileId) {
      setError('File ID not provided');
      setLoading(false);
      return;
    }

    try {
      const storedData = localStorage.getItem(fileId);
      console.log('Stored data found:', !!storedData);
      
      if (!storedData) {
        setError('File not found in storage');
        setLoading(false);
        return;
      }

      const parsedData: FileData = JSON.parse(storedData);
      console.log('Parsed file data:', { name: parsedData.name, type: parsedData.type, size: parsedData.size });
      setFileData(parsedData);
    } catch (err) {
      console.error('Error loading file:', err);
      setError('Failed to load file');
    } finally {
      setLoading(false);
    }
  }, [fileId]);

  const downloadFile = () => {
    if (!fileData) return;

    const link = document.createElement('a');
    link.href = fileData.data;
    link.download = fileData.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="w-8 h-8 text-green-600" />;
    } else if (type.includes('pdf') || type.includes('document')) {
      return <FileText className="w-8 h-8 text-red-600" />;
    } else {
      return <File className="w-8 h-8 text-gray-600" />;
    }
  };

  const canPreview = (type: string): boolean => {
    return type.startsWith('image/') || type === 'application/pdf' || type.startsWith('text/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading file...</p>
        </div>
      </div>
    );
  }

  if (error || !fileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">File Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The requested file could not be found.'}</p>
          <p className="text-sm text-gray-500 mb-4">File ID: {fileId}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* File Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {getFileIcon(fileData.type)}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{fileData.name}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                  <span>{formatFileSize(fileData.size)}</span>
                  <span>•</span>
                  <span>{new Date(fileData.uploadedAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{fileData.type}</span>
                </div>
              </div>
            </div>
            <button
              onClick={downloadFile}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* File Preview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {canPreview(fileData.type) ? (
            <div className="text-center">
              {fileData.type.startsWith('image/') ? (
                <img
                  src={fileData.data}
                  alt={fileData.name}
                  className="max-w-full h-auto mx-auto rounded-lg shadow-sm"
                  style={{ maxHeight: '70vh' }}
                />
              ) : fileData.type === 'application/pdf' ? (
                <div className="w-full" style={{ height: '80vh' }}>
                  <iframe
                    src={fileData.data}
                    className="w-full h-full border-0 rounded-lg"
                    title={fileData.name}
                  />
                </div>
              ) : (
                <div className="py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Preview not available for this file type</p>
                  <button
                    onClick={downloadFile}
                    className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Download to View
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              {getFileIcon(fileData.type)}
              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">Preview Not Available</h3>
              <p className="text-gray-600 mb-4">This file type cannot be previewed in the browser.</p>
              <button
                onClick={downloadFile}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Download File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileViewer;