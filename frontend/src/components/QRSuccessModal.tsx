import React, { useState, useRef, useEffect } from 'react';
import { X, Download, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface QRCustomization {
  foregroundColor?: string;
  backgroundColor?: string;
  size?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
  frameStyle?: 'none' | 'simple' | 'scan-me' | 'scan-me-black' | 'branded' | 'modern' | 'classic' | 'rounded';
  gradientType?: 'none' | 'linear' | 'radial';
  gradientDirection?: 'to-right' | 'to-bottom' | 'to-top-right' | 'to-bottom-right';
  gradientStartColor?: string;
  gradientEndColor?: string;
  logo?: string;
  logoSize?: number;
  logoCornerRadius?: number;
  centerText?: string;
  centerTextSize?: number;
  centerTextFontFamily?: string;
  centerTextColor?: string;
  centerTextBackgroundColor?: string;
  centerTextBold?: boolean;
}

interface QRSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCanvas: HTMLCanvasElement | null;
  shortUrl: string;
  originalUrl: string;
  qrCustomization?: QRCustomization;
  onCustomize?: () => void;
  onCreateAnother?: () => void;
}

const QRSuccessModal: React.FC<QRSuccessModalProps> = ({
  isOpen,
  onClose,
  qrCanvas,
  shortUrl,
  originalUrl,
  qrCustomization,
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
      // Try to copy existing canvas first (if it has the right customizations)
      if (qrCanvas && qrCanvas.width > 0) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          canvasRef.current.width = qrCanvas.width;
          canvasRef.current.height = qrCanvas.height;
          ctx.drawImage(qrCanvas, 0, 0);
          return;
        }
      }
      
      // Generate new QR code with customizations
      const QRCode = await import('qrcode');
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Use customization settings or defaults
      const settings = {
        width: qrCustomization?.size || 300,
        margin: qrCustomization?.margin || 4,
        color: {
          dark: qrCustomization?.foregroundColor || '#000000',
          light: qrCustomization?.backgroundColor || '#FFFFFF'
        },
        errorCorrectionLevel: qrCustomization?.errorCorrectionLevel || 'M'
      };

      await QRCode.toCanvas(canvas, originalUrl, settings);

      // Apply customizations
      if (qrCustomization) {
        await applyCustomizations(ctx, canvas, qrCustomization);
      }
    } catch (error) {
      console.error('QR generation failed:', error);
    }
  };

  const applyCustomizations = async (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, customization: QRCustomization) => {
    // Apply gradient if specified
    if (customization.gradientType !== 'none') {
      let gradient: CanvasGradient;
      
      if (customization.gradientType === 'linear') {
        switch (customization.gradientDirection) {
          case 'to-right':
            gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
            break;
          case 'to-bottom':
            gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            break;
          case 'to-top-right':
            gradient = ctx.createLinearGradient(0, canvas.height, canvas.width, 0);
            break;
          case 'to-bottom-right':
          default:
            gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            break;
        }
      } else {
        gradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, 0,
          canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 2
        );
      }

      gradient.addColorStop(0, customization.foregroundColor || '#000000');
      gradient.addColorStop(1, customization.gradientStartColor || customization.foregroundColor || '#000000');

      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
    }

    // Apply frame style
    if (customization.frameStyle && customization.frameStyle !== 'none') {
      applyFrameStyle(ctx, canvas, customization);
    }

    // Add logo if specified
    if (customization.logo && customization.logo.trim()) {
      await addLogo(ctx, canvas, customization);
    }

    // Add center text if specified
    if (customization.centerText && customization.centerText.trim()) {
      addCenterText(ctx, canvas, customization);
    }
  };

  const applyFrameStyle = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, customization: QRCustomization) => {
    const frameStyle = customization.frameStyle;
    const foregroundColor = customization.foregroundColor || '#000000';
    const backgroundColor = customization.backgroundColor || '#FFFFFF';
    
    switch (frameStyle) {
      case 'simple':
        ctx.strokeStyle = foregroundColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
        break;
      case 'scan-me':
        ctx.fillStyle = foregroundColor;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SCAN ME', canvas.width / 2, canvas.height - 8);
        break;
      case 'scan-me-black':
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, canvas.height - 25, canvas.width, 25);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SCAN ME', canvas.width / 2, canvas.height - 8);
        break;
      case 'branded':
        ctx.strokeStyle = foregroundColor;
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, 30);
        ctx.fillStyle = foregroundColor;
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR CODE', canvas.width / 2, 20);
        break;
      case 'modern':
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, foregroundColor);
        gradient.addColorStop(1, backgroundColor);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);
        break;
      case 'classic':
        ctx.strokeStyle = foregroundColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
        const cornerSize = 15;
        ctx.fillStyle = foregroundColor;
        // Corner decorations
        ctx.fillRect(0, 0, cornerSize, 3);
        ctx.fillRect(0, 0, 3, cornerSize);
        ctx.fillRect(canvas.width - cornerSize, 0, cornerSize, 3);
        ctx.fillRect(canvas.width - 3, 0, 3, cornerSize);
        ctx.fillRect(0, canvas.height - 3, cornerSize, 3);
        ctx.fillRect(0, canvas.height - cornerSize, 3, cornerSize);
        ctx.fillRect(canvas.width - cornerSize, canvas.height - 3, cornerSize, 3);
        ctx.fillRect(canvas.width - 3, canvas.height - cornerSize, 3, cornerSize);
        break;
      case 'rounded':
        ctx.strokeStyle = foregroundColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(5, 5, canvas.width - 10, canvas.height - 10, 15);
        } else {
          ctx.rect(5, 5, canvas.width - 10, canvas.height - 10);
        }
        ctx.stroke();
        break;
    }
  };

  const addLogo = async (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, customization: QRCustomization) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise<void>((resolve) => {
        img.onload = () => {
          const logoSizePercent = (customization.logoSize || 20) / 100;
          const logoSize = Math.min(canvas.width, canvas.height) * logoSizePercent;
          const x = (canvas.width - logoSize) / 2;
          const y = (canvas.height - logoSize) / 2;
          const cornerRadius = customization.logoCornerRadius || 0;
          
          // Save the current context state
          ctx.save();
          
          // Create clipping path for logo with corner radius
          ctx.beginPath();
          if (cornerRadius > 0 && ctx.roundRect) {
            // Use roundRect if available and corner radius is set
            ctx.roundRect(x, y, logoSize, logoSize, cornerRadius);
          } else if (cornerRadius > 0) {
            // Fallback for browsers that don't support roundRect
            const radius = Math.min(cornerRadius, logoSize / 2);
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + logoSize - radius, y);
            ctx.quadraticCurveTo(x + logoSize, y, x + logoSize, y + radius);
            ctx.lineTo(x + logoSize, y + logoSize - radius);
            ctx.quadraticCurveTo(x + logoSize, y + logoSize, x + logoSize - radius, y + logoSize);
            ctx.lineTo(x + radius, y + logoSize);
            ctx.quadraticCurveTo(x, y + logoSize, x, y + logoSize - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
          } else {
            // Square logo (no corner radius)
            ctx.rect(x, y, logoSize, logoSize);
          }
          
          // Clip to the path
          ctx.clip();
          
          // Add white background for logo
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(x - 2, y - 2, logoSize + 4, logoSize + 4);
          
          // Draw the logo image
          ctx.drawImage(img, x, y, logoSize, logoSize);
          
          // Restore the context state
          ctx.restore();
          
          resolve();
        };
        
        img.onerror = () => resolve();
        img.src = customization.logo!;
      });
    } catch (error) {
      console.error('Error adding logo:', error);
    }
  };

  const addCenterText = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, customization: QRCustomization) => {
    const fontSize = customization.centerTextSize || 16;
    const fontWeight = customization.centerTextBold ? 'bold' : 'normal';
    
    ctx.font = `${fontWeight} ${fontSize}px ${customization.centerTextFontFamily || 'Arial'}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const textMetrics = ctx.measureText(customization.centerText!);
    const textWidth = textMetrics.width;
    const textHeight = fontSize;
    
    const x = canvas.width / 2;
    const y = canvas.height / 2;
    
    // Add background for text
    ctx.fillStyle = customization.centerTextBackgroundColor || '#FFFFFF';
    ctx.fillRect(x - textWidth / 2 - 5, y - textHeight / 2 - 2, textWidth + 10, textHeight + 4);
    
    // Add text
    ctx.fillStyle = customization.centerTextColor || '#000000';
    ctx.fillText(customization.centerText!, x, y);
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