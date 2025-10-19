import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  QrCode, 
  Plus, 
  Download, 
  Copy, 
  Trash2, 
  Eye, 
  Search,
  Calendar,
  MoreVertical,
  Edit3,
  Link,
  EyeOff,
  Palette,
  BarChart3,
  Star,
  StarOff,
  Grid,
  List,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface QRCodeData {
  id: string;
  title: string;
  url: string;
  shortUrl?: string;
  scans: number;
  createdAt: string;
  updatedAt?: string;
  customization: {
    foregroundColor: string;
    backgroundColor: string;
    logoUrl?: string;
    style: 'square' | 'rounded' | 'dots' | 'classy';
    size: number;
    errorCorrection: 'L' | 'M' | 'Q' | 'H';
  };
  isPremium: boolean;
  trackingEnabled: boolean;
  isDynamic: boolean;
  isHidden: boolean;
  isFavorite: boolean;
  category: string;
  description?: string;
  tags: string[];
  qrCodeImage?: string;
  type: 'url' | 'text' | 'email' | 'phone' | 'wifi' | 'vcard' | 'sms';
}

interface QRManageSectionProps {
  onCreateClick: () => void;
}

const QRManageSection: React.FC<QRManageSectionProps> = ({ onCreateClick }) => {
  const { user } = useAuth();
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'scans' | 'name'>('date');
  const [filterBy, setFilterBy] = useState<'all' | 'favorites' | 'hidden' | 'dynamic'>('all');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    loadQRCodes();
  }, []);

  const loadQRCodes = async () => {
    if (!user?.id) {
      console.log('No user ID available for loading QR codes');
      setQrCodes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Loading QR codes from backend for user:', user.id);
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
      const response = await fetch(`${apiUrl}/v1/qr/user/${user.id}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const qrCodesData: QRCodeData[] = result.data.map((qr: any) => ({
          id: qr.id,
          title: qr.title || 'QR Code',
          url: qr.content || qr.originalUrl,
          shortUrl: qr.shortUrl,
          scans: qr.scans || 0,
          createdAt: qr.createdAt,
          updatedAt: qr.updatedAt,
          customization: qr.customization || {
            foregroundColor: qr.foregroundColor || '#000000',
            backgroundColor: qr.backgroundColor || '#ffffff',
            style: 'square',
            size: qr.size || 256,
            errorCorrection: qr.errorCorrectionLevel || 'M'
          },
          isPremium: false,
          trackingEnabled: true,
          isDynamic: false,
          isHidden: false,
          isFavorite: false,
          category: 'General',
          tags: [],
          qrCodeImage: qr.qrCodeImage,
          type: qr.type || 'url'
        }));
        
        setQrCodes(qrCodesData);
        console.log(`Loaded ${qrCodesData.length} QR codes from backend`);
        toast.success(`Loaded ${qrCodesData.length} QR codes`);
      } else {
        console.log('No QR codes found for user');
        setQrCodes([]);
      }
    } catch (error) {
      console.error('Failed to load QR codes from backend:', error);
      toast.error('Failed to load QR codes');
      setQrCodes([]);
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown && dropdownRefs.current[activeDropdown] && 
          !dropdownRefs.current[activeDropdown]?.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  const updateQRCodes = async (updatedQRs: QRCodeData[]) => {
    setQrCodes(updatedQRs);
    // TODO: Update via backend API instead of localStorage
    // localStorage.setItem('bitlyQRCodes', JSON.stringify(updatedQRs));
  };

  const copyQRUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('URL copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy URL');
    }
  };

  const createShortLink = (qr: QRCodeData) => {
    const shortUrl = `https://shlnk.pro/${Math.random().toString(36).substring(2, 10)}`;
    const updatedQRs = qrCodes.map(q => 
      q.id === qr.id ? { ...q, shortUrl } : q
    );
    updateQRCodes(updatedQRs);
    toast.success('Short link created!');
    setActiveDropdown(null);
  };

  const duplicateQR = (qr: QRCodeData) => {
    const duplicatedQR: QRCodeData = {
      ...qr,
      id: Date.now().toString(),
      title: `${qr.title} (Copy)`,
      createdAt: new Date().toISOString(),
      scans: 0,
      shortUrl: undefined
    };
    const updatedQRs = [duplicatedQR, ...qrCodes];
    updateQRCodes(updatedQRs);
    toast.success('QR Code duplicated!');
    setActiveDropdown(null);
  };

  const toggleHidden = (qrId: string) => {
    const updatedQRs = qrCodes.map(qr => 
      qr.id === qrId ? { ...qr, isHidden: !qr.isHidden } : qr
    );
    updateQRCodes(updatedQRs);
    const qr = qrCodes.find(q => q.id === qrId);
    toast.success(qr?.isHidden ? 'QR Code shown' : 'QR Code hidden');
    setActiveDropdown(null);
  };

  const toggleFavorite = (qrId: string) => {
    const updatedQRs = qrCodes.map(qr => 
      qr.id === qrId ? { ...qr, isFavorite: !qr.isFavorite } : qr
    );
    updateQRCodes(updatedQRs);
    const qr = qrCodes.find(q => q.id === qrId);
    toast.success(qr?.isFavorite ? 'Removed from favorites' : 'Added to favorites');
    setActiveDropdown(null);
  };

  const deleteQR = (qrId: string) => {
    if (window.confirm('Are you sure you want to delete this QR code?')) {
      const updatedQRs = qrCodes.filter(qr => qr.id !== qrId);
      updateQRCodes(updatedQRs);
      toast.success('QR Code deleted');
    }
    setActiveDropdown(null);
  };

  const downloadQR = async (qr: QRCodeData) => {
    try {
      // Generate QR code using the qrcode library
      const canvas = document.createElement('canvas');
      
      // Import QRCode dynamically to avoid issues
      const QRCode = await import('qrcode');
      
      // Generate QR code on canvas
      await QRCode.toCanvas(canvas, qr.url, {
        width: qr.customization.size,
        margin: 4, // Default margin since it's not in the interface
        color: {
          dark: qr.customization.foregroundColor,
          light: qr.customization.backgroundColor
        },
        errorCorrectionLevel: qr.customization.errorCorrection
      });
      
      // Download the canvas as PNG
      const link = document.createElement('a');
      link.download = `${qr.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_qr_code.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('QR Code downloaded successfully!');
    } catch (error) {
      console.error('Error generating QR code for download:', error);
      toast.error('Failed to download QR code. Please try again.');
    }
    setActiveDropdown(null);
  };

  const filteredQRCodes = qrCodes
    .filter(qr => {
      const matchesSearch = qr.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           qr.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           qr.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesFilter = filterBy === 'all' || 
                           (filterBy === 'favorites' && qr.isFavorite) ||
                           (filterBy === 'hidden' && qr.isHidden) ||
                           (filterBy === 'dynamic' && qr.isDynamic);
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.title.localeCompare(b.title);
        case 'scans':
          return b.scans - a.scans;
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const QRDropdownMenu: React.FC<{ qr: QRCodeData }> = ({ qr }) => (
    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
      <button
        onClick={() => duplicateQR(qr)}
        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Copy className="w-4 h-4 mr-3" />
        Duplicate Design
      </button>
      
      <button
        onClick={() => createShortLink(qr)}
        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Link className="w-4 h-4 mr-3" />
        Create Link
      </button>
      
      <button
        onClick={() => toast.success('Customization modal would open here')}
        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Palette className="w-4 h-4 mr-3" />
        Customization
      </button>
      
      <div className="border-t border-gray-100 my-1"></div>
      
      <button
        onClick={() => deleteQR(qr.id)}
        className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
      >
        <Trash2 className="w-4 h-4 mr-3" />
        Delete
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">QR Code Manager</h2>
            <p className="text-purple-100">
              Manage and track your QR codes from MongoDB database
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadQRCodes}
              disabled={loading}
              className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg hover:bg-opacity-30 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={onCreateClick}
              className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create QR Code</span>
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Your QR Codes ({filteredQRCodes.length})
          </h3>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search QR codes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent w-64"
              />
            </div>

            {/* Filter */}
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All QR Codes</option>
              <option value="favorites">Favorites</option>
              <option value="hidden">Hidden</option>
              <option value="dynamic">Dynamic</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="scans">Sort by Scans</option>
            </select>

            {/* View Mode */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={() => window.location.reload()}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{qrCodes.length}</div>
            <div className="text-sm text-blue-700">Total QR Codes</div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">
              {qrCodes.reduce((sum, qr) => sum + qr.scans, 0)}
            </div>
            <div className="text-sm text-purple-700">Total Scans</div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {qrCodes.filter(qr => qr.isDynamic).length}
            </div>
            <div className="text-sm text-green-700">Dynamic QRs</div>
          </div>
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600">
              {qrCodes.filter(qr => qr.isFavorite).length}
            </div>
            <div className="text-sm text-orange-700">Favorites</div>
          </div>
          <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">
              {qrCodes.filter(qr => qr.isHidden).length}
            </div>
            <div className="text-sm text-red-700">Hidden</div>
          </div>
        </div>

        {/* QR Codes Display */}
        {filteredQRCodes.length === 0 ? (
          <div className="text-center py-12">
            {qrCodes.length === 0 ? (
              <>
                <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No QR codes yet</h4>
                <p className="text-gray-600 mb-4">Create your first QR code to get started</p>
                <button
                  onClick={onCreateClick}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create QR Code</span>
                </button>
              </>
            ) : (
              <>
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No QR codes found matching your criteria</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterBy('all');
                  }}
                  className="text-purple-600 hover:text-purple-700 mt-2"
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="space-y-4">
            {filteredQRCodes.map((qr) => (
              <motion.div
                key={qr.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  {/* QR Code Preview - Left Side */}
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 relative">
                    {qr.qrCodeImage ? (
                      <img src={qr.qrCodeImage} alt={qr.title} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center rounded-lg"
                        style={{ backgroundColor: qr.customization.backgroundColor }}
                      >
                        <QrCode 
                          className="w-12 h-12" 
                          style={{ color: qr.customization.foregroundColor }}
                        />
                      </div>
                    )}
                    
                    {/* Status Indicators */}
                    <div className="absolute -top-1 -right-1 flex space-x-1">
                      {qr.isFavorite && (
                        <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                          <Star className="w-2 h-2 text-white fill-current" />
                        </div>
                      )}
                      {qr.isHidden && (
                        <div className="w-4 h-4 bg-gray-500 rounded-full flex items-center justify-center">
                          <EyeOff className="w-2 h-2 text-white" />
                        </div>
                      )}
                      {qr.isDynamic && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <RefreshCw className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* QR Information - Middle Section */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate" title={qr.title}>
                          {qr.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-1">
                          {qr.type.charAt(0).toUpperCase() + qr.type.slice(1)}
                        </p>
                      </div>
                    </div>

                    {/* URL Display */}
                    <div className="mb-3">
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Link className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate" title={qr.url}>{qr.url}</span>
                      </div>
                      
                      {qr.shortUrl && (
                        <div className="flex items-center text-sm text-purple-600 bg-purple-50 px-2 py-1 rounded-md">
                          <span className="truncate font-mono" title={qr.shortUrl}>{qr.shortUrl}</span>
                          <button
                            onClick={() => copyQRUrl(qr.shortUrl!)}
                            className="ml-2 text-purple-500 hover:text-purple-700 flex-shrink-0"
                            title="Copy short link"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <BarChart3 className="w-4 h-4 mr-1" />
                        <span>Scan data</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{new Date(qr.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons - Right Side */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="relative" ref={el => dropdownRefs.current[qr.id] = el}>
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === qr.id ? null : qr.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="More options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {/* Dropdown Menu */}
                      {activeDropdown === qr.id && (
                        <AnimatePresence>
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.1 }}
                          >
                            <QRDropdownMenu qr={qr} />
                          </motion.div>
                        </AnimatePresence>
                      )}
                    </div>
                    
                    <button
                      onClick={() => toast.success('QR code scan data would be shown here')}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Scan data"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => toast.success('Edit modal would open here')}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Edit QR code"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => downloadQR(qr)}
                      className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Download QR code"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => toast.success('Analytics modal would open here')}
                      className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                      title="View details"
                    >
                      View details
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQRCodes.map((qr) => (
              <motion.div
                key={qr.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    {/* QR Preview */}
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {qr.qrCodeImage ? (
                        <img src={qr.qrCodeImage} alt={qr.title} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <QrCode 
                          className="w-6 h-6" 
                          style={{ color: qr.customization.foregroundColor }}
                        />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900 truncate">{qr.title}</h4>
                        {qr.isFavorite && <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />}
                        {qr.isHidden && <EyeOff className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                        {qr.isDynamic && <RefreshCw className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                      </div>
                      
                      <p className="text-sm text-gray-600 truncate mb-1">{qr.url}</p>
                      
                      {qr.shortUrl && (
                        <div className="flex items-center space-x-2 mb-2">
                          <code className="text-purple-600 font-mono text-sm bg-purple-50 px-2 py-1 rounded">
                            {qr.shortUrl}
                          </code>
                          <button
                            onClick={() => copyQRUrl(qr.shortUrl!)}
                            className="text-gray-400 hover:text-purple-600 p-1 hover:bg-purple-50 rounded transition-colors"
                            title="Copy link"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Eye className="w-3 h-3" />
                          <span>{qr.scans} scans</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(qr.createdAt).toLocaleDateString()}</span>
                        </span>
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          {qr.type.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => downloadQR(qr)}
                      className="text-gray-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded transition-colors"
                      title="Download QR code"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    
                    <div className="relative" ref={el => dropdownRefs.current[qr.id] = el}>
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === qr.id ? null : qr.id)}
                        className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-50 rounded transition-colors"
                        title="More options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      <AnimatePresence>
                        {activeDropdown === qr.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.1 }}
                          >
                            <QRDropdownMenu qr={qr} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QRManageSection;