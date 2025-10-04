import React, { useState, useRef, useEffect } from 'react';
import { X, Download, Copy, ChevronDown, Palette } from 'lucide-react';
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
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Copy the QR canvas to our modal canvas when it opens
  useEffect(() => {
    if (isOpen && qrCanvas && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        canvasRef.current.width = qrCanvas.width;
        canvasRef.current.height = qrCanvas.height;
        ctx.drawImage(qrCanvas, 0, 0);
      }
    }
  }, [isOpen, qrCanvas]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      toast.success('Short URL copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy URL');
    }
  };

  const downloadQR = async (format: 'png' | 'jpeg' | 'svg') => {
    if (!canvasRef.current) return;
    
    setIsDownloading(true);
    
    try {
      if (format === 'svg') {
        // For SVG, we'll create a simple SVG version
        await downloadAsSVG();
      } else {
        // For PNG and JPEG
        const canvas = canvasRef.current;
        const link = document.createElement('a');
        
        if (format === 'jpeg') {
          // Create a new canvas with white background for JPEG
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          tempCanvas.width = canvas.width;
          tempCanvas.height = canvas.height;
          
          if (tempCtx) {
            // Fill with white background
            tempCtx.fillStyle = '#FFFFFF';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            // Draw the QR code on top
            tempCtx.drawImage(canvas, 0, 0);
            
            link.href = tempCanvas.toDataURL('image/jpeg', 0.9);
            link.download = `qr-code-${Date.now()}.jpeg`;
          }
        } else {
          link.href = canvas.toDataURL('image/png');
          link.download = `qr-code-${Date.now()}.png`;
        }
        
        link.click();
        toast.success(`QR code downloaded as ${format.toUpperCase()}!`);
      }
    } catch (error) {
      toast.error('Failed to download QR code');
      console.error('Download error:', error);
    } finally {
      setIsDownloading(false);
      setShowDownloadOptions(false);
    }
  };

  const downloadAsSVG = async () => {
    if (!canvasRef.current) return;

    try {
      // Create SVG from canvas data
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Create SVG string
      let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">`;
      
      // Convert pixels to SVG rectangles (simplified approach)
      const pixelSize = 1;
      for (let y = 0; y < canvas.height; y += pixelSize) {
        for (let x = 0; x < canvas.width; x += pixelSize) {
          const index = (y * canvas.width + x) * 4;
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          const a = data[index + 3];
          
          if (a > 0 && (r < 128 || g < 128 || b < 128)) { // Dark pixels
            const color = `rgb(${r},${g},${b})`;
            svgContent += `<rect x="${x}" y="${y}" width="${pixelSize}" height="${pixelSize}" fill="${color}"/>`;
          }
        }
      }
      
      svgContent += '</svg>';
      
      // Download SVG
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-code-${Date.now()}.svg`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success('QR code downloaded as SVG!');
    } catch (error) {
      toast.error('Failed to create SVG');
      console.error('SVG creation error:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          <motion.div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-8"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center">
                Your QR Code is ready 🎉
              </h2>
              <p className="text-gray-600">
                Scan the image below to preview your code
              </p>
            </div>

            {/* QR Code Display */}
            <div className="flex justify-center mb-6">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-100 shadow-sm">
                <canvas 
                  ref={canvasRef}
                  className="max-w-full h-auto"
                  style={{ maxWidth: '200px', maxHeight: '200px' }}
                />
              </div>
            </div>

            {/* Download Section */}
            <div className="mb-6">
              <div className="relative">
                <button
                  onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                  disabled={isDownloading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  <Download className="w-5 h-5 mr-2" />
                  {isDownloading ? 'Downloading...' : 'Download PNG'}
                  <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showDownloadOptions ? 'rotate-180' : ''}`} />
                </button>

                {/* Download Options Dropdown */}
                <AnimatePresence>
                  {showDownloadOptions && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
                    >
                      <button
                        onClick={() => downloadQR('png')}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100"
                      >
                        <div className="font-medium text-gray-900">PNG Format</div>
                        <div className="text-sm text-gray-500">Best for web and digital use</div>
                      </button>
                      <button
                        onClick={() => downloadQR('jpeg')}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100"
                      >
                        <div className="font-medium text-gray-900">JPEG Format</div>
                        <div className="text-sm text-gray-500">Smaller file size, white background</div>
                      </button>
                      <button
                        onClick={() => downloadQR('svg')}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors rounded-b-lg"
                      >
                        <div className="font-medium text-gray-900">SVG Format</div>
                        <div className="text-sm text-gray-500">Vector format, scalable</div>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={copyToClipboard}
                className="flex items-center justify-center space-x-2 px-4 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span className="font-medium">Copy code</span>
              </button>
              
              {onCustomize && (
                <button
                  onClick={onCustomize}
                  className="flex items-center justify-center space-x-2 px-4 py-3 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  <Palette className="w-4 h-4" />
                  <span className="font-medium">Customize</span>
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-2">On a roll? Don't stop now!</p>
              {onCreateAnother && (
                <button
                  onClick={onCreateAnother}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center justify-center mx-auto"
                >
                  Create another QR Code →
                </button>
              )}
            </div>

            {/* Short URL Info */}
            <div className="mt-6 p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Short URL:</div>
              <div className="text-sm font-mono text-gray-700 break-all">{shortUrl}</div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default QRSuccessModal;