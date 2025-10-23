import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import {
  ArrowLeft,
  Save,
  Download,
  Eye,
  Palette,
  Type,
  Settings,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import QRCodeGenerator from '../components/QRCodeGenerator';

interface QRCodeData {
  id: string;
  qrCode: string;
  title: string;
  description: string;
  content: string;
  contentType: string;
  style: string;
  foregroundColor: string;
  backgroundColor: string;
  size: number;
  format: string;
  qrImageUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

const QREditPage: React.FC = () => {
  const { qrCode } = useParams<{ qrCode: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    contentType: 'URL',
    style: 'square',
    foregroundColor: '#000000',
    backgroundColor: '#ffffff',
    size: 300,
    format: 'PNG'
  });

  useEffect(() => {
    if (qrCode && user?.id) {
      loadQRCode();
    }
  }, [qrCode, user?.id]);

  const loadQRCode = async () => {
    if (!qrCode || !user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
      const response = await fetch(`${apiUrl}/v1/qr/${qrCode}`);
      const result = await response.json();

      if (result.success && result.data) {
        const data = result.data;
        setQrData(data);
        setFormData({
          title: data.title || '',
          description: data.description || '',
          content: data.content || '',
          contentType: data.contentType || 'URL',
          style: data.style || 'square',
          foregroundColor: data.foregroundColor || '#000000',
          backgroundColor: data.backgroundColor || '#ffffff',
          size: data.size || 300,
          format: data.format || 'PNG'
        });
      } else {
        setError(result.message || 'QR code not found');
      }
    } catch (error) {
      console.error('Failed to load QR code:', error);
      setError('Failed to load QR code data');
      toast.error('Failed to load QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!qrCode || !user?.id) return;

    try {
      setSaving(true);

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
      const response = await fetch(`${apiUrl}/v1/qr/${qrCode}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          title: formData.title,
          description: formData.description,
          content: formData.content,
          contentType: formData.contentType,
          style: formData.style,
          foregroundColor: formData.foregroundColor,
          backgroundColor: formData.backgroundColor,
          size: formData.size,
          format: formData.format
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('QR code updated successfully!');
        // Reload the data to get the updated version
        await loadQRCode();
      } else {
        toast.error(result.message || 'Failed to update QR code');
      }
    } catch (error) {
      console.error('Failed to update QR code:', error);
      toast.error('Failed to update QR code');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateQR = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
      const response = await fetch(`${apiUrl}/v1/qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          content: formData.content,
          contentType: formData.contentType,
          title: formData.title,
          description: formData.description,
          style: formData.style,
          foregroundColor: formData.foregroundColor,
          backgroundColor: formData.backgroundColor,
          size: formData.size,
          format: formData.format
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('QR code regenerated successfully!');
        navigate('/dashboard/qr-codes');
      } else {
        toast.error(result.message || 'Failed to regenerate QR code');
      }
    } catch (error) {
      console.error('Failed to regenerate QR code:', error);
      toast.error('Failed to regenerate QR code');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !qrData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="text-center py-12">
            <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">QR Code Not Found</h2>
            <p className="text-gray-600 mb-4">{error || 'The QR code could not be loaded'}</p>
            <button
              onClick={() => navigate('/dashboard/qr-codes')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to QR Codes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard/qr-codes')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit QR Code</h1>
              <p className="text-gray-600">Customize your QR code design and content</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(`/dashboard/qr-codes/analytics/${qrCode}`)}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>View Analytics</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Type className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter QR code title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter description (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter the content for your QR code"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Type
                  </label>
                  <select
                    value={formData.contentType}
                    onChange={(e) => handleInputChange('contentType', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="URL">URL</option>
                    <option value="TEXT">Text</option>
                    <option value="EMAIL">Email</option>
                    <option value="PHONE">Phone</option>
                    <option value="SMS">SMS</option>
                    <option value="WIFI">WiFi</option>
                    <option value="VCARD">vCard</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Customization */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Palette className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Customization</h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Foreground Color
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={formData.foregroundColor}
                        onChange={(e) => handleInputChange('foregroundColor', e.target.value)}
                        className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.foregroundColor}
                        onChange={(e) => handleInputChange('foregroundColor', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="#000000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Background Color
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={formData.backgroundColor}
                        onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                        className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.backgroundColor}
                        onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Size (pixels)
                    </label>
                    <input
                      type="number"
                      value={formData.size}
                      onChange={(e) => handleInputChange('size', parseInt(e.target.value) || 300)}
                      min="100"
                      max="1000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Format
                    </label>
                    <select
                      value={formData.format}
                      onChange={(e) => handleInputChange('format', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="PNG">PNG</option>
                      <option value="JPG">JPG</option>
                      <option value="SVG">SVG</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Style
                  </label>
                  <select
                    value={formData.style}
                    onChange={(e) => handleInputChange('style', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="square">Square</option>
                    <option value="rounded">Rounded</option>
                    <option value="dots">Dots</option>
                    <option value="classy">Classy</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Settings className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleRegenerateQR}
                  disabled={saving}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Regenerate QR Code</span>
                </button>

                <p className="text-sm text-gray-600">
                  Regenerating will create a new QR code with the current settings and redirect you to the QR codes page.
                </p>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Eye className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
              </div>

              <div className="text-center">
                <div className="inline-block p-6 bg-gray-50 rounded-xl">
                  <QRCodeGenerator
                    value={formData.content || 'https://example.com'}
                    size={Math.min(formData.size, 300)}
                    className="mx-auto"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  Preview updates automatically as you make changes
                </p>
              </div>
            </div>

            {/* Current QR Code Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current QR Code</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">QR Code ID</label>
                  <p className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded mt-1">
                    {qrData.qrCode}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Created</label>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(qrData.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {qrData.updatedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Last Updated</label>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(qrData.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QREditPage;