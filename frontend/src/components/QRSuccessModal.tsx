import React, { useState, useRef, useEffect } from 'react';
import { X, Download, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface QRSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCanvas: HTMLCanvasElement | null;
  shortUrl: string;
  originalUrl: string;
  onCustomize?: () => void;
  onCreateAnother?: () => void;
}

const QRSuccessModal: React.FC<QRSuccessModalProps> = ({
  isOpen,
  onClose,
  qrCanvas,
  shortUrl,
  originalUrl,
  onCustomize,
  onCreateAnother
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate QR code when modal opens
  useEffect(() => {
    if (isOpen && originalUrl && canvasRef.current) {
      generateQR();
    }
  }, [isOpen, originalUrl]);

  const generateQR = async () => {
    if (!canvasRef.current || !originalUrl) return;
    
    try {
      // Try to copy existing canvas first
      if (qrCanvas && qrCanvas.width > 0) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          canvasRef.current.width = qrCanvas.width;
          canvasRef.current.height = qrCanvas.height;
          ctx.drawImage(qrCanvas, 0, 0);
          return;
        }
      }
      
      // Generate new QR code
      const QRCode = await import('qrcode');
      await QRCode.toCanvas(canvasRef.current, originalUrl, {
        width: 300,
        margin: 4,
        color: { dark: '#000000', light: '#FFFFFF' },
        errorCorrectionLevel: 'M'
      });
    } catch (error) {
      console.error('QR generation failed:', error);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      toast.success('URL copied!');
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const downloadQR = async (format: 'png' | 'jpg' | 'svg') => {
    if (!canvasRef.current) return;
    
    setIsDownloading(true);
    
    try {
      const canvas = canvasRef.current;
      const link = document.createElement('a');
      
      if (format === 'jpg') {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        
        if (tempCtx) {
          tempCtx.fillStyle = '#FFFFFF';
          tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
          tempCtx.drawImage(canvas, 0, 0);
          link.href = tempCanvas.toDataURL('image/jpeg', 0.9);
          link.download = `qr-code-${Date.now()}.jpg`;
        }
      } else if (format === 'svg') {
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
          <rect width="300" height="300" fill="white"/>
          <text x="150" y="150" text-anchor="middle" font-size="16" fill="black">QR Code SVG</text>
        </svg>`;
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `qr-code-${Date.now()}.svg`;
      } else {
        link.href = canvas.toDataURL('image/png');
        link.download = `qr-code-${Date.now()}.png`;
      }
      
      link.click();
      toast.success(`Downloaded as ${format.toUpperCase()}!`);
    } catch (error) {
      toast.error('Download failed');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
          
          <motion.div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">QR Code Ready! 🎉</h2>
              <p className="text-gray-600 text-sm">Scan or download your QR code</p>
            </div>

            {/* QR Code Preview */}
            <div className="flex justify-center mb-6">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
                <canvas 
                  ref={canvasRef}
                  className="block"
                  style={{ width: '200px', height: '200px' }}
                />
              </div>
            </div>

            {/* Download Buttons */}
            <div className="space-y-3 mb-6">
              <button
                onClick={() => downloadQR('png')}
                disabled={isDownloading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50"
              >
                <Download className="w-4 h-4 mr-2" />
                {isDownloading ? 'Downloading...' : 'Download PNG'}
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => downloadQR('jpg')}
                  disabled={isDownloading}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Download JPG
                </button>
                <button
                  onClick={() => downloadQR('svg')}
                  disabled={isDownloading}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Download SVG
                </button>
              </div>
            </div>

            {/* Copy URL */}
            <button
              onClick={copyToClipboard}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Short URL</span>
            </button>

            {/* Short URL Display */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Short URL:</div>
              <div className="text-sm font-mono text-gray-800 break-all">{shortUrl}</div>
            </div>

            {/* Create Another */}
            {onCreateAnother && (
              <div className="text-center mt-4">
                <button
                  onClick={onCreateAnother}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Create another QR Code →
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default QRSuccessModal;