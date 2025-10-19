import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import toast from 'react-hot-toast';

interface SimpleFileUploadProps {
  onSuccess: (fileData: any) => void;
}

const SimpleFileUpload: React.FC<SimpleFileUploadProps> = ({ onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      console.log('File selected:', file.name);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsUploading(true);
    console.log('Starting upload for:', selectedFile.name);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('userId', 'simple-upload-user');
      formData.append('title', selectedFile.name);
      formData.append('description', 'Uploaded via Simple File Upload');
      formData.append('isPublic', 'true');

      console.log('Making request to: http://localhost:8080/api/v1/files/upload');

      const response = await fetch('http://localhost:8080/api/v1/files/upload', {
        method: 'POST',
        body: formData
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Upload result:', result);

      if (result.success) {
        const fileData = {
          id: result.data.id,
          shortCode: result.data.fileCode,
          shortUrl: result.data.fileUrl,
          originalUrl: result.data.fileUrl,
          clicks: 0,
          createdAt: result.data.uploadedAt,
          type: 'file'
        };

        onSuccess(fileData);
        toast.success('File uploaded successfully!');
        setSelectedFile(null);
        
        // Reset file input
        const fileInput = document.getElementById('simple-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600 mb-2">
          {selectedFile ? selectedFile.name : 'Select a file to upload'}
        </p>
        <input
          id="simple-file-input"
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
        />
        <label
          htmlFor="simple-file-input"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
        >
          Choose File
        </label>
      </div>

      {selectedFile && (
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-all disabled:opacity-50"
        >
          {isUploading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Uploading...
            </div>
          ) : (
            'Upload File'
          )}
        </button>
      )}
    </div>
  );
};

export default SimpleFileUpload;