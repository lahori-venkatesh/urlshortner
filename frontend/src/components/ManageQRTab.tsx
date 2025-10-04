import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  Download, 
  Copy, 
  Edit, 
  Trash2, 
  BarChart3, 
  Eye, 
  Share2,
  Search,
  Filter,
  Calendar,
  Crown,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import QRAnalytics from './QRAnalytics';

interface QRCodeData {
  id: string;
  title: string;
  url: string;
  shortUrl?: string;
  scans: number;
  createdAt: string;
  customization: QRCustomization;
  isPremium: boolean;
  trackingEnabled: boolean;
  isDynamic: boolean;
}

interface QRCustomization {
  pattern: 'grid' | 'dots' | 'rounded' | 'abstract';
  corners: 'rounded' | 'sharp' | 'custom';
  frame: 'square' | 'circle' | 'custom';
  colorMode: 'single' | 'dual' | 'gradient';
  foregroundColor: string;
  backgroundColor: string;
  gradientStart?: string;
  gradientEnd?: string;
  logo?: string;
  logoSize: number;
  centerText?: string;
  textColor?: string;
  size: number;
  format: 'PNG' | 'SVG' | 'PDF';
  transparentBackground: boolean;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  margin: number;
}

interface ManageQRTabProps {
  qrCodes: QRCodeData[];
  onDownload: (qrData: QRCodeData) => void;
  onCopy: (url: string) => void;
  onDelete: (qrId: string) => void;
  onEdit: (qrData: QRCodeData) => void;
}

const ManageQRTab: React.FC<ManageQRTabProps> = ({
  qrCodes,
  onDownload,
  onCopy,
  onDelete,
  onEdit
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'scans' | 'title'>('date');
  const [filterBy, setFilterBy] = useState<'all' | 'premium' | 'free'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedQRs, setSelectedQRs] = useState<string[]>([]);
  const [showAnalytics, setShowAnalytics] = useState<QRCodeData | null>(null);

  // Filter and sort QR codes
  const filteredQRs = qrCodes
    .filter(qr => {
      const matchesSearch = qr.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           qr.url.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterBy === 'all' || 
                           (filterBy === 'premium' && qr.isPremium) ||
                           (filterBy === 'free' && !qr.isPremium);
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'scans':
          return b.scans - a.scans;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  const handleSelectAll = () => {
    if (selectedQRs.length === filteredQRs.length) {
      setSelectedQRs([]);
    } else {
      setSelectedQRs(filteredQRs.map(qr => qr.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedQRs.length === 0) return;
    
    if (window.confirm(`Delete ${selectedQRs.length} QR codes?`)) {
      selectedQRs.forEach(id => onDelete(id));
      setSelectedQRs([]);
      toast.success(`${selectedQRs.length} QR codes deleted`);
    }
  };

  const handleBulkDownload = async () => {
    if (selectedQRs.length === 0) return;
    
    toast.success(`Downloading ${selectedQRs.length} QR codes...`);
    
    for (const id of selectedQRs) {
      const qr = qrCodes.find(q => q.id === id);
      if (qr) {
        await onDownload(qr);
        // Add small delay to prevent browser blocking
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  };

  if (qrCodes.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No QR Codes Yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first QR code to start tracking scans and managing your links.
          </p>
          <button
            onClick={() => window.location.hash = '#create'}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First QR Code
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search QR codes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters & Sort */}
          <div className="flex items-center space-x-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="date">Sort by Date</option>
              <option value="scans">Sort by Scans</option>
              <option value="title">Sort by Title</option>
            </select>

            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All QR Codes</option>
              <option value="premium">Premium Only</option>
              <option value="free">Free Only</option>
            </select>

            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
              >
                <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                </div>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
              >
                <div className="w-4 h-4 flex flex-col gap-1">
                  <div className="h-0.5 bg-current rounded"></div>
                  <div className="h-0.5 bg-current rounded"></div>
                  <div className="h-0.5 bg-current rounded"></div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedQRs.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedQRs.length} QR code{selectedQRs.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBulkDownload}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              >
                Download All
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
              >
                Delete All
              </button>
              <button
                onClick={() => setSelectedQRs([])}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">{qrCodes.length}</div>
            <div className="text-sm text-gray-600">Total QR Codes</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">
              {qrCodes.reduce((sum, qr) => sum + qr.scans, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Scans</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">
              {qrCodes.filter(qr => qr.isPremium).length}
            </div>
            <div className="text-sm text-gray-600">Premium QR Codes</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {qrCodes.filter(qr => qr.trackingEnabled).length}
            </div>
            <div className="text-sm text-gray-600">With Analytics</div>
          </div>
        </div>
      </div>

      {/* QR Codes Grid/List */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        {filteredQRs.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No QR codes found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            {/* Select All */}
            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedQRs.length === filteredQRs.length}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Select all</span>
              </label>
              <div className="text-sm text-gray-600">
                Showing {filteredQRs.length} of {qrCodes.length} QR codes
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredQRs.map((qr) => (
                  <QRCodeCard
                    key={qr.id}
                    qrData={qr}
                    isSelected={selectedQRs.includes(qr.id)}
                    onSelect={(selected) => {
                      if (selected) {
                        setSelectedQRs(prev => [...prev, qr.id]);
                      } else {
                        setSelectedQRs(prev => prev.filter(id => id !== qr.id));
                      }
                    }}
                    onDownload={() => onDownload(qr)}
                    onCopy={() => onCopy(qr.shortUrl || qr.url)}
                    onDelete={() => onDelete(qr.id)}
                    onEdit={() => onEdit(qr)}
                    onViewAnalytics={() => setShowAnalytics(qr)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQRs.map((qr) => (
                  <QRCodeListItem
                    key={qr.id}
                    qrData={qr}
                    isSelected={selectedQRs.includes(qr.id)}
                    onSelect={(selected) => {
                      if (selected) {
                        setSelectedQRs(prev => [...prev, qr.id]);
                      } else {
                        setSelectedQRs(prev => prev.filter(id => id !== qr.id));
                      }
                    }}
                    onDownload={() => onDownload(qr)}
                    onCopy={() => onCopy(qr.shortUrl || qr.url)}
                    onDelete={() => onDelete(qr.id)}
                    onEdit={() => onEdit(qr)}
                    onViewAnalytics={() => setShowAnalytics(qr)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Analytics Modal */}
      {showAnalytics && (
        <QRAnalytics
          qrCodeId={showAnalytics.id}
          qrTitle={showAnalytics.title}
          totalScans={showAnalytics.scans}
          onClose={() => setShowAnalytics(null)}
        />
      )}
    </div>
  );
};

// QR Code Card Component
interface QRCodeCardProps {
  qrData: QRCodeData;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onDownload: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onViewAnalytics: () => void;
}

const QRCodeCard: React.FC<QRCodeCardProps> = ({
  qrData,
  isSelected,
  onSelect,
  onDownload,
  onCopy,
  onDelete,
  onEdit,
  onViewAnalytics
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrData.url, {
        width: 120,
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
    <div className={`border-2 rounded-lg p-4 transition-all hover:shadow-md ${
      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
    }`}>
      {/* Selection Checkbox */}
      <div className="flex items-center justify-between mb-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <div className="flex items-center space-x-1">
          {qrData.isPremium && <Crown className="w-4 h-4 text-yellow-500" />}
          {qrData.trackingEnabled && <BarChart3 className="w-4 h-4 text-green-500" />}
          {qrData.isDynamic && <RefreshCw className="w-4 h-4 text-purple-500" />}
        </div>
      </div>

      {/* QR Code Preview */}
      <div className="text-center mb-4">
        <canvas ref={canvasRef} className="mx-auto border border-gray-100 rounded" />
      </div>
      
      {/* QR Code Info */}
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900 truncate" title={qrData.title}>
          {qrData.title}
        </h4>
        <p className="text-sm text-gray-600 truncate" title={qrData.url}>
          {qrData.url}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center space-x-1">
            <Eye className="w-3 h-3" />
            <span>{qrData.scans} scans</span>
          </span>
          <span>{new Date(qrData.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-1">
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
          {qrData.trackingEnabled && (
            <button
              onClick={onViewAnalytics}
              className="text-orange-600 hover:text-orange-800 p-1 hover:bg-orange-50 rounded"
              title="View Analytics"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onEdit}
            className="text-purple-600 hover:text-purple-800 p-1 hover:bg-purple-50 rounded"
            title="Edit QR Code"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={() => {
            if (window.confirm('Delete this QR code?')) {
              onDelete();
            }
          }}
          className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
          title="Delete QR Code"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// QR Code List Item Component
const QRCodeListItem: React.FC<QRCodeCardProps> = ({
  qrData,
  isSelected,
  onSelect,
  onDownload,
  onCopy,
  onDelete,
  onEdit,
  onViewAnalytics
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrData.url, {
        width: 80,
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
    <div className={`border-2 rounded-lg p-4 transition-all ${
      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
    }`}>
      <div className="flex items-center space-x-4">
        {/* Selection */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />

        {/* QR Code Preview */}
        <canvas ref={canvasRef} className="border border-gray-100 rounded flex-shrink-0" />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-semibold text-gray-900 truncate">{qrData.title}</h4>
            <div className="flex items-center space-x-1">
              {qrData.isPremium && <Crown className="w-4 h-4 text-yellow-500" />}
              {qrData.trackingEnabled && <BarChart3 className="w-4 h-4 text-green-500" />}
              {qrData.isDynamic && <RefreshCw className="w-4 h-4 text-purple-500" />}
            </div>
          </div>
          <p className="text-sm text-gray-600 truncate mb-2">{qrData.url}</p>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span className="flex items-center space-x-1">
              <Eye className="w-3 h-3" />
              <span>{qrData.scans} scans</span>
            </span>
            <span className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{new Date(qrData.createdAt).toLocaleDateString()}</span>
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onDownload}
            className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onCopy}
            className="text-green-600 hover:text-green-800 p-2 hover:bg-green-50 rounded"
            title="Copy URL"
          >
            <Copy className="w-4 h-4" />
          </button>
          {qrData.trackingEnabled && (
            <button
              onClick={onViewAnalytics}
              className="text-orange-600 hover:text-orange-800 p-2 hover:bg-orange-50 rounded"
              title="View Analytics"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onEdit}
            className="text-purple-600 hover:text-purple-800 p-2 hover:bg-purple-50 rounded"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (window.confirm('Delete this QR code?')) {
                onDelete();
              }
            }}
            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageQRTab;