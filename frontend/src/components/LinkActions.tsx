import React, { useState } from 'react';
import { 
  Copy, 
  Share2, 
  Edit3, 
  MoreVertical, 
  Trash2, 
  BarChart3, 
  QrCode,
  Tag,
  ExternalLink,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

interface LinkActionsProps {
  link: {
    id: string;
    shortUrl: string;
    originalUrl: string;
    shortCode: string;
    clicks: number;
    createdAt: string;
    tags?: string[];
    type?: 'url' | 'qr' | 'file';
    title?: string;
  };
  onEdit?: (linkId: string) => void;
  onDelete?: (linkId: string) => void;
  onUpdateTags?: (linkId: string, tags: string[]) => void;
  showQRCode?: boolean;
}

const LinkActions: React.FC<LinkActionsProps> = ({
  link,
  onEdit,
  onDelete,
  onUpdateTags,
  showQRCode = true
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showTagEditor, setShowTagEditor] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [tagInput, setTagInput] = useState('');
  const [currentTags, setCurrentTags] = useState<string[]>(link.tags || []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(link.shortUrl);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const shareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Check out this link',
        url: link.shortUrl,
      }).catch(() => {
        // Fallback to manual sharing
        openShareModal();
      });
    } else {
      openShareModal();
    }
  };

  const openShareModal = () => {
    const shareText = `Check out this ${link.type === 'file' ? 'file' : 'link'}: ${link.shortUrl}`;
    const platforms = [
      { name: 'WhatsApp', url: `https://wa.me/?text=${encodeURIComponent(shareText)}` },
      { name: 'Telegram', url: `https://t.me/share/url?url=${encodeURIComponent(link.shortUrl)}&text=${encodeURIComponent(shareText)}` },
      { name: 'Twitter', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}` },
      { name: 'LinkedIn', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link.shortUrl)}` },
      { name: 'Facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link.shortUrl)}` }
    ];

    // Create a simple share modal
    const shareModal = document.createElement('div');
    shareModal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
    shareModal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-sm mx-4">
        <h3 class="text-lg font-semibold mb-4">Share Link</h3>
        <div class="space-y-2">
          ${platforms.map(platform => `
            <button onclick="window.open('${platform.url}', '_blank', 'width=600,height=400')" 
                    class="w-full text-left px-3 py-2 hover:bg-gray-100 rounded">
              ${platform.name}
            </button>
          `).join('')}
        </div>
        <button onclick="this.parentElement.parentElement.remove()" 
                class="mt-4 w-full bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300">
          Close
        </button>
      </div>
    `;
    document.body.appendChild(shareModal);
    shareModal.onclick = (e) => {
      if (e.target === shareModal) shareModal.remove();
    };
  };

  const viewDetails = () => {
    console.log('Opening analytics for link:', link);
    console.log('Short code:', link.shortCode);
    console.log('Analytics URL:', `/analytics/${link.shortCode}`);
    
    // Use navigate instead of window.open for better routing
    const analyticsUrl = `/analytics/${link.shortCode}`;
    window.location.href = analyticsUrl;
  };

  const generateQRCode = async () => {
    try {
      const dataUrl = await QRCode.toDataURL(link.shortUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataUrl(dataUrl);
      setShowQR(true);
    } catch (err) {
      toast.error('Failed to generate QR code');
    }
  };

  const downloadQRCode = () => {
    if (qrCodeDataUrl) {
      const downloadLink = document.createElement('a');
      downloadLink.download = `qr-code-${link.shortCode || 'link'}.png`;
      downloadLink.href = qrCodeDataUrl;
      downloadLink.click();
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !currentTags.includes(tagInput.trim())) {
      const newTags = [...currentTags, tagInput.trim()];
      setCurrentTags(newTags);
      setTagInput('');
      if (onUpdateTags) {
        onUpdateTags(link.id, newTags);
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = currentTags.filter(tag => tag !== tagToRemove);
    setCurrentTags(newTags);
    if (onUpdateTags) {
      onUpdateTags(link.id, newTags);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag();
    }
  };

  return (
    <div className="relative">
      {/* Main Action Buttons */}
      <div className="flex items-center space-x-2">
        {/* Copy Button */}
        <button
          onClick={copyToClipboard}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Copy link"
        >
          <Copy className="w-4 h-4" />
        </button>

        {/* Share Button */}
        <button
          onClick={shareLink}
          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          title="Share link"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* Edit Button */}
        {onEdit && (
          <button
            onClick={() => onEdit(link.id)}
            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            title="Edit link"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}

        {/* More Options Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            title="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10"
              >
                <button
                  onClick={() => {
                    viewDetails();
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>View Details</span>
                </button>

                {showQRCode && (
                  <button
                    onClick={() => {
                      generateQRCode();
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>View QR Code</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowTagEditor(true);
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <Tag className="w-4 h-4" />
                  <span>Manage Tags</span>
                </button>

                <button
                  onClick={() => window.open(link.shortUrl, '_blank')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Link</span>
                </button>

                <hr className="my-1" />

                {onDelete && (
                  <button
                    onClick={() => {
                      onDelete(link.id);
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg p-6 max-w-sm mx-4"
            >
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-4">QR Code</h3>
                {qrCodeDataUrl && (
                  <img 
                    src={qrCodeDataUrl} 
                    alt="QR Code" 
                    className="mx-auto mb-4 border rounded-lg"
                  />
                )}
                <p className="text-sm text-gray-600 mb-4 break-all">{link.shortUrl}</p>
                <div className="flex space-x-2">
                  <button
                    onClick={downloadQRCode}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => setShowQR(false)}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tag Editor Modal */}
      <AnimatePresence>
        {showTagEditor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg p-6 max-w-md mx-4 w-full"
            >
              <h3 className="text-lg font-semibold mb-4">Manage Tags</h3>
              
              {/* Current Tags */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Tags</label>
                <div className="flex flex-wrap gap-2">
                  {currentTags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {currentTags.length === 0 && (
                    <span className="text-gray-500 text-sm">No tags added</span>
                  )}
                </div>
              </div>

              {/* Add New Tag */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Add New Tag</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter tag name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleAddTag}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowTagEditor(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default LinkActions;