import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Download, Eye, Edit, Copy, Share2, Palette, Settings } from 'lucide-react';

interface QRCodeData {
  id: string;
  title: string;
  url: string;
  scans: number;
  createdAt: string;
  customization: QRCustomization;
}

interface QRCustomization {
  foregroundColor: string;
  backgroundColor: string;
  logoUrl?: string;
  size: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  margin: number;
  style: 'square' | 'dots' | 'rounded';
}

const AdvancedQRGenerator: React.FC = () => {
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingQR, setEditingQR] = useState<QRCodeData | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  
  // Form states
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [customization, setCustomization] = useState<QRCustomization>({
    foregroundColor: '#000000',
    backgroundColor: '#FFFFFF',
    size: 300,
    errorCorrectionLevel: 'M',
    margin: 4,
    style: 'square'
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load existing QR codes from backend
  useEffect(() => {
    loadQRCodesFromBackend();
  }, []);

  const loadQRCodesFromBackend = async () => {
    try {
      // TODO: Load from backend API instead of localStorage
      setQrCodes([]);
    } catch (error) {
      console.error('Failed to load QR codes from backend:', error);
      setQrCodes([]);
    }
  };

  // Generate preview QR code
  useEffect(() => {
    if (url && canvasRef.current) {
      generateQRCode(url, customization, canvasRef.current);
    }
  }, [url, customization]);

  const generateQRCode = async (
    data: string, 
    options: QRCustomization, 
    canvas: HTMLCanvasElement
  ) => {
    try {
      await QRCode.toCanvas(canvas, data, {
        width: options.size,
        margin: options.margin,
        color: {
          dark: options.foregroundColor,
          light: options.backgroundColor
        },
        errorCorrectionLevel: options.errorCorrectionLevel
      });
    } catch (error) {
      console.error('QR Code generation error:', error);
    }
  };

  const handleCreateQR = async () => {
    if (!title.trim() || !url.trim()) return;

    setIsCreating(true);

    // Generate QR code data URL
    const canvas = document.createElement('canvas');
    await generateQRCode(url, customization, canvas);
    const dataUrl = canvas.toDataURL();

    const newQR: QRCodeData = {
      id: Date.now().toString(),
      title: title.trim(),
      url: url.trim(),
      scans: 0,
      createdAt: new Date().toISOString(),
      customization: { ...customization }
    };

    const updatedQRs = [newQR, ...qrCodes];
    setQrCodes(updatedQRs);
    // TODO: Save to backend API instead of localStorage

    // Reset form
    setTitle('');
    setUrl('');
    setIsCreating(false);
  };

  const downloadQR = async (qrData: QRCodeData) => {
    const canvas = document.createElement('canvas');
    await generateQRCode(qrData.url, qrData.customization, canvas);
    
    const link = document.createElement('a');
    link.download = `${qrData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_qr.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const copyQRUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      const { toast } = await import('react-hot-toast');
      toast.success('URL copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const deleteQR = (qrId: string) => {
    const updatedQRs = qrCodes.filter(qr => qr.id !== qrId);
    setQrCodes(updatedQRs);
    // TODO: Delete via backend API instead of localStorage
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Create New QR Code */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Custom QR Code</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                QR Code Title *
              </label>
              <input
                type="text"
                placeholder="My Awesome QR Code"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destination URL *
              </label>
              <input
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Customization Options */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Palette className="w-5 h-5 mr-2" />
                Customization
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Foreground Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={customization.foregroundColor}
                      onChange={(e) => setCustomization(prev => ({
                        ...prev,
                        foregroundColor: e.target.value
                      }))}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customization.foregroundColor}
                      onChange={(e) => setCustomization(prev => ({
                        ...prev,
                        foregroundColor: e.target.value
                      }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={customization.backgroundColor}
                      onChange={(e) => setCustomization(prev => ({
                        ...prev,
                        backgroundColor: e.target.value
                      }))}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customization.backgroundColor}
                      onChange={(e) => setCustomization(prev => ({
                        ...prev,
                        backgroundColor: e.target.value
                      }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Size (px)
                  </label>
                  <select
                    value={customization.size}
                    onChange={(e) => setCustomization(prev => ({
                      ...prev,
                      size: parseInt(e.target.value)
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value={200}>200x200</option>
                    <option value={300}>300x300</option>
                    <option value={400}>400x400</option>
                    <option value={500}>500x500</option>
                    <option value={800}>800x800</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Error Correction
                  </label>
                  <select
                    value={customization.errorCorrectionLevel}
                    onChange={(e) => setCustomization(prev => ({
                      ...prev,
                      errorCorrectionLevel: e.target.value as 'L' | 'M' | 'Q' | 'H'
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="L">Low (7%)</option>
                    <option value="M">Medium (15%)</option>
                    <option value="Q">Quartile (25%)</option>
                    <option value="H">High (30%)</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Margin: {customization.margin}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={customization.margin}
                  onChange={(e) => setCustomization(prev => ({
                    ...prev,
                    margin: parseInt(e.target.value)
                  }))}
                  className="w-full"
                />
              </div>
            </div>

            <button
              onClick={handleCreateQR}
              disabled={!title.trim() || !url.trim() || isCreating}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isCreating ? 'Creating QR Code...' : 'Create QR Code'}
            </button>
          </div>

          {/* Preview */}
          <div className="flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h3>
            <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300">
              {url ? (
                <canvas 
                  ref={canvasRef}
                  className="border border-gray-200 rounded-lg shadow-sm"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Settings className="w-12 h-12 mx-auto mb-2" />
                    <p>Enter URL to see preview</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QR Codes List */}
      {qrCodes.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Your QR Codes</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {qrCodes.map((qr) => (
              <QRCodeCard
                key={qr.id}
                qrData={qr}
                onDownload={() => downloadQR(qr)}
                onCopy={() => copyQRUrl(qr.url)}
                onDelete={() => deleteQR(qr.id)}
                onEdit={() => setEditingQR(qr)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface QRCodeCardProps {
  qrData: QRCodeData;
  onDownload: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

const QRCodeCard: React.FC<QRCodeCardProps> = ({
  qrData,
  onDownload,
  onCopy,
  onDelete,
  onEdit
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrData.url, {
        width: 150,
        margin: qrData.customization.margin,
        color: {
          dark: qrData.customization.foregroundColor,
          light: qrData.customization.backgroundColor
        },
        errorCorrectionLevel: qrData.customization.errorCorrectionLevel
      });
    }
  }, [qrData]);

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="text-center mb-4">
        <canvas ref={canvasRef} className="mx-auto border border-gray-100 rounded" />
      </div>
      
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900 truncate" title={qrData.title}>
          {qrData.title}
        </h4>
        <p className="text-sm text-gray-600 truncate" title={qrData.url}>
          {qrData.url}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{qrData.scans} scans</span>
          <span>{new Date(qrData.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <button
            onClick={onDownload}
            className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded"
            title="Download QR Code"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onCopy}
            className="text-green-600 hover:text-green-800 p-1 hover:bg-green-50 rounded"
            title="Copy URL"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            className="text-purple-600 hover:text-purple-800 p-1 hover:bg-purple-50 rounded"
            title="Edit QR Code"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
          title="Delete QR Code"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AdvancedQRGenerator;