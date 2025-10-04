import React, { useState, useEffect, useRef } from 'react';
import { 
  Link, 
  QrCode, 
  Upload, 
  Copy, 
  ExternalLink, 
  Settings, 
  Eye, 
  EyeOff, 
  Zap, 
  Sparkles, 
  Shield,
  Palette,
  Crown,
  Download,
  Save
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import QRCodeGenerator from '../QRCodeGenerator';
import { aiService, AliasSuggestion, SecurityCheck } from '../../services/aiService';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import LinkSuccessModal from '../LinkSuccessModal';
import QRSuccessModal from '../QRSuccessModal';

type CreateMode = 'url' | 'qr' | 'file';

interface CreateSectionProps {
  mode: CreateMode;
  onModeChange: (mode: CreateMode) => void;
}

interface QRCustomization {
  foregroundColor: string;
  backgroundColor: string;
  size: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  margin: number;
  logo?: string;
  centerText?: string;
  centerTextFontSize: number;
  centerTextFontFamily: string;
  centerTextColor: string;
  centerTextBackgroundColor: string;
  centerTextBold: boolean;
  pattern: 'square' | 'circle' | 'rounded' | 'diamond';
  cornerStyle: 'square' | 'rounded' | 'circle' | 'extra-rounded';
  frameStyle: 'none' | 'simple' | 'scan-me' | 'scan-me-black' | 'arrow' | 'gradient' | 'social' | 'minimal';
  gradientType: 'none' | 'linear' | 'radial';
  gradientDirection: 'to-right' | 'to-bottom' | 'to-top-right' | 'to-bottom-right';
  secondaryColor: string;
}

interface ShortenedLink {
  id: string;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  qrCode?: string;
  clicks: number;
  createdAt: string;
  customDomain?: string;
  type: 'url' | 'qr' | 'file';
  qrCustomization?: QRCustomization;
}

const CreateSection: React.FC<CreateSectionProps> = ({ mode, onModeChange }) => {
  const { user } = useAuth();
  const [urlInput, setUrlInput] = useState('');
  const [qrText, setQrText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customAlias, setCustomAlias] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('shlnk.pro');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [expirationDays, setExpirationDays] = useState<number | ''>('');
  const [maxClicks, setMaxClicks] = useState<number | ''>('');
  const [isOneTime, setIsOneTime] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ShortenedLink | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showQRSuccessModal, setShowQRSuccessModal] = useState(false);
  
  // QR Customization
  const [qrCustomization, setQrCustomization] = useState<QRCustomization>({
    foregroundColor: '#000000',
    backgroundColor: '#FFFFFF',
    size: 300,
    errorCorrectionLevel: 'M',
    margin: 4,
    pattern: 'square',
    cornerStyle: 'square',
    frameStyle: 'none',
    gradientType: 'none',
    gradientDirection: 'to-right',
    secondaryColor: '#333333',
    centerTextFontSize: 16,
    centerTextFontFamily: 'Arial',
    centerTextColor: '#000000',
    centerTextBackgroundColor: '#FFFFFF',
    centerTextBold: true
  });
  
  // AI Features
  const [aiSuggestions, setAiSuggestions] = useState<AliasSuggestion[]>([]);
  const [securityCheck, setSecurityCheck] = useState<SecurityCheck | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [customDomains, setCustomDomains] = useState<string[]>(['shlnk.pro']);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const isPremium = user?.plan === 'premium';

  // Add roundRect polyfill for older browsers
  useEffect(() => {
    if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
      CanvasRenderingContext2D.prototype.roundRect = function(x: number, y: number, width: number, height: number, radius: number) {
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
      };
    }
  }, []);

  // Color presets for QR codes
  const colorPresets = [
    { name: 'Classic', foreground: '#000000', background: '#FFFFFF' },
    { name: 'Ocean', foreground: '#1e40af', background: '#dbeafe' },
    { name: 'Forest', foreground: '#166534', background: '#dcfce7' },
    { name: 'Sunset', foreground: '#dc2626', background: '#fef2f2' },
    { name: 'Purple', foreground: '#7c3aed', background: '#f3e8ff' },
    { name: 'Gold', foreground: '#d97706', background: '#fef3c7' }
  ];

  // Load custom domains
  useEffect(() => {
    const storedDomains = localStorage.getItem('customDomains');
    if (storedDomains) {
      try {
        const parsedDomains = JSON.parse(storedDomains);
        const activeDomains = parsedDomains
          .filter((d: any) => d.status === 'active')
          .map((d: any) => d.domain);
        setCustomDomains(['shlnk.pro', ...activeDomains]);
      } catch (err) {
        console.error('Failed to parse custom domains:', err);
      }
    }
  }, []);

  // AI-powered URL analysis
  useEffect(() => {
    const analyzeURL = async () => {
      const currentUrl = mode === 'url' ? urlInput : mode === 'qr' ? qrText : '';
      
      if (!currentUrl.trim() || !currentUrl.startsWith('http')) return;

      setIsLoadingAI(true);
      
      try {
        const [suggestions, security] = await Promise.all([
          aiService.generateAliasSuggestions(currentUrl),
          aiService.checkURLSecurity(currentUrl)
        ]);
        
        setAiSuggestions(suggestions);
        setSecurityCheck(security);
      } catch (error) {
        console.error('AI analysis failed:', error);
      } finally {
        setIsLoadingAI(false);
      }
    };

    const timer = setTimeout(analyzeURL, 1000);
    return () => clearTimeout(timer);
  }, [urlInput, qrText, mode]);

  // Generate QR code preview
  useEffect(() => {
    if (mode === 'qr' && qrText && canvasRef.current) {
      const timer = setTimeout(() => {
        generateQRCode();
      }, 100); // Small delay to prevent too frequent updates
      return () => clearTimeout(timer);
    }
  }, [qrText, qrCustomization, mode]);

  const generateQRCode = async () => {
    if (!canvasRef.current || !qrText) return;

    try {
      // Determine colors based on gradient settings
      let foregroundColor = qrCustomization.foregroundColor;
      let backgroundColor = qrCustomization.backgroundColor;

      // Generate QR code with basic settings
      await QRCode.toCanvas(canvasRef.current, qrText, {
        width: qrCustomization.size,
        margin: qrCustomization.margin,
        color: {
          dark: foregroundColor,
          light: backgroundColor
        },
        errorCorrectionLevel: qrCustomization.errorCorrectionLevel
      });

      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      // Apply gradient if enabled
      if (qrCustomization.gradientType !== 'none') {
        const imageData = ctx.getImageData(0, 0, qrCustomization.size, qrCustomization.size);
        const data = imageData.data;
        
        let gradient;
        if (qrCustomization.gradientType === 'linear') {
          gradient = ctx.createLinearGradient(0, 0, 
            qrCustomization.gradientDirection.includes('right') ? qrCustomization.size : 0,
            qrCustomization.gradientDirection.includes('bottom') ? qrCustomization.size : 0
          );
        } else {
          gradient = ctx.createRadialGradient(
            qrCustomization.size / 2, qrCustomization.size / 2, 0,
            qrCustomization.size / 2, qrCustomization.size / 2, qrCustomization.size / 2
          );
        }
        
        gradient.addColorStop(0, qrCustomization.foregroundColor);
        gradient.addColorStop(1, qrCustomization.secondaryColor);
        
        // Apply gradient to dark pixels
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // If pixel is dark (QR code data)
          if (r < 128 && g < 128 && b < 128) {
            const x = (i / 4) % qrCustomization.size;
            const y = Math.floor((i / 4) / qrCustomization.size);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }

      // Apply pattern modifications (simplified for demo)
      if (qrCustomization.pattern !== 'square') {
        // This would require more complex pixel manipulation
        // For now, we'll keep the basic square pattern
      }

      // Apply logo if present
      if (qrCustomization.logo) {
        const img = new Image();
        img.onload = () => {
          const logoSize = qrCustomization.size * 0.2;
          const x = (qrCustomization.size - logoSize) / 2;
          const y = (qrCustomization.size - logoSize) / 2;
          
          // Add white background for logo with corner style
          ctx.fillStyle = '#FFFFFF';
          if (qrCustomization.cornerStyle === 'circle') {
            ctx.beginPath();
            ctx.arc(qrCustomization.size / 2, qrCustomization.size / 2, logoSize / 2 + 5, 0, 2 * Math.PI);
            ctx.fill();
          } else {
            const radius = qrCustomization.cornerStyle === 'rounded' ? 10 : 
                          qrCustomization.cornerStyle === 'extra-rounded' ? 20 : 0;
            if (radius > 0) {
              ctx.beginPath();
              ctx.roundRect(x - 5, y - 5, logoSize + 10, logoSize + 10, radius);
              ctx.fill();
            } else {
              ctx.fillRect(x - 5, y - 5, logoSize + 10, logoSize + 10);
            }
          }
          
          // Draw logo with corner style
          ctx.save();
          if (qrCustomization.cornerStyle === 'circle') {
            ctx.beginPath();
            ctx.arc(qrCustomization.size / 2, qrCustomization.size / 2, logoSize / 2, 0, 2 * Math.PI);
            ctx.clip();
          } else if (qrCustomization.cornerStyle !== 'square') {
            const radius = qrCustomization.cornerStyle === 'rounded' ? 8 : 15;
            ctx.beginPath();
            ctx.roundRect(x, y, logoSize, logoSize, radius);
            ctx.clip();
          }
          
          ctx.drawImage(img, x, y, logoSize, logoSize);
          ctx.restore();
        };
        img.src = qrCustomization.logo;
      }

      // Add center text if present
      if (qrCustomization.centerText) {
        // Use custom font settings
        const fontSize = qrCustomization.centerTextFontSize;
        const fontWeight = qrCustomization.centerTextBold ? 'bold' : 'normal';
        const fontFamily = qrCustomization.centerTextFontFamily;
        
        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Measure text for background sizing
        const textWidth = ctx.measureText(qrCustomization.centerText).width;
        const padding = Math.max(fontSize * 0.5, 8);
        const backgroundWidth = textWidth + (padding * 2);
        const backgroundHeight = fontSize + (padding * 2);
        
        // Background with corner style and custom color
        ctx.fillStyle = qrCustomization.centerTextBackgroundColor;
        
        const centerX = qrCustomization.size / 2;
        const centerY = qrCustomization.size / 2;
        
        if (qrCustomization.cornerStyle === 'circle') {
          const radius = Math.max(backgroundWidth / 2, backgroundHeight / 2);
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
          ctx.fill();
        } else {
          const cornerRadius = qrCustomization.cornerStyle === 'rounded' ? 8 : 
                             qrCustomization.cornerStyle === 'extra-rounded' ? 15 : 0;
          ctx.beginPath();
          ctx.roundRect(
            centerX - backgroundWidth / 2, 
            centerY - backgroundHeight / 2, 
            backgroundWidth, 
            backgroundHeight, 
            cornerRadius
          );
          ctx.fill();
        }
        
        // Text with custom color
        ctx.fillStyle = qrCustomization.centerTextColor;
        ctx.fillText(qrCustomization.centerText, centerX, centerY);
      }
    } catch (error) {
      console.error('QR Code generation error:', error);
    }
  };

  const handleCreate = async () => {
    if (mode === 'url' && !urlInput.trim()) return;
    if (mode === 'qr' && !qrText.trim()) return;
    if (mode === 'file' && !selectedFile) return;

    setIsLoading(true);

    try {
      const shortCode = customAlias || Math.random().toString(36).substr(2, 6);
      const baseUrl = window.location.origin;
      let originalUrl = '';
      
      if (mode === 'url') {
        originalUrl = urlInput;
      } else if (mode === 'qr') {
        originalUrl = qrText;
      } else if (mode === 'file' && selectedFile) {
        // For now, create a data URL for the file (works for images and small files)
        const reader = new FileReader();
        const fileDataUrl = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(selectedFile);
        });
        
        // Store the file data in localStorage with a unique key
        const fileId = `file_${Date.now()}_${selectedFile.name}`;
        localStorage.setItem(fileId, JSON.stringify({
          name: selectedFile.name,
          type: selectedFile.type,
          size: selectedFile.size,
          data: fileDataUrl,
          uploadedAt: new Date().toISOString()
        }));
        
        // Create a local URL that we can handle
        originalUrl = `${window.location.origin}/file/${fileId}`;
        toast.success('File processed successfully!');
      }

      const finalDomain = selectedDomain === 'shlnk.pro' ? baseUrl : `https://${selectedDomain}`;
      
      const newLink: ShortenedLink = {
        id: Date.now().toString(),
        shortCode,
        shortUrl: `${finalDomain}/${shortCode}`,
        originalUrl,
        clicks: 0,
        createdAt: new Date().toISOString(),
        customDomain: selectedDomain !== 'shlnk.pro' ? selectedDomain : undefined,
        type: mode,
        qrCustomization: mode === 'qr' ? qrCustomization : undefined
      };

      // Save to localStorage
      const existingLinks = JSON.parse(localStorage.getItem('shortenedLinks') || '[]');
      const updatedLinks = [newLink, ...existingLinks];
      localStorage.setItem('shortenedLinks', JSON.stringify(updatedLinks));

      // Save QR codes separately if needed
      if (mode === 'qr') {
        const existingQRs = JSON.parse(localStorage.getItem('bitlyQRCodes') || '[]');
        const qrData = {
          id: newLink.id,
          title: `QR Code - ${shortCode}`,
          url: originalUrl,
          shortUrl: newLink.shortUrl,
          scans: 0,
          createdAt: newLink.createdAt,
          customization: qrCustomization,
          isPremium,
          trackingEnabled: false,
          isDynamic: false
        };
        const updatedQRs = [qrData, ...existingQRs];
        localStorage.setItem('bitlyQRCodes', JSON.stringify(updatedQRs));
      }

      setResult(newLink);
      
      // Reset form
      setUrlInput('');
      setQrText('');
      setSelectedFile(null);
      setCustomAlias('');
      setPassword('');
      setExpirationDays('');
      setMaxClicks('');
      setIsOneTime(false);
      setAiSuggestions([]);
      setSecurityCheck(null);

      // Add a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsLoading(false);

      // Show appropriate success modal
      if (mode === 'qr') {
        setShowQRSuccessModal(true);
      } else {
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('Error creating link:', error);
      toast.error('Failed to create link. Please try again.');
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadQR = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `qr-code-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setQrCustomization(prev => ({
          ...prev,
          logo: event.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Mode Selection */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-center mb-6">
          <div className="bg-gray-100 p-1 rounded-lg flex">
            <button
              onClick={() => onModeChange('url')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                mode === 'url'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Link className="w-4 h-4 inline mr-2" />
              URL Shortener
            </button>
            <button
              onClick={() => onModeChange('qr')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                mode === 'qr'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <QrCode className="w-4 h-4 inline mr-2" />
              QR Code
            </button>
            <button
              onClick={() => onModeChange('file')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                mode === 'file'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              File to Link
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Main Form */}
          <div className={`space-y-6 ${mode === 'qr' ? 'grid grid-cols-1 xl:grid-cols-3 gap-6' : ''}`}>
            {/* QR Preview Section (only for QR mode) */}
            {mode === 'qr' && (
              <div className="order-2 xl:order-1 xl:col-span-1">
                <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 text-center xl:sticky xl:top-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h3>
                  {qrText ? (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <div className="relative">
                          <canvas 
                            ref={canvasRef} 
                            className="border border-gray-200 rounded-lg shadow-sm bg-white"
                          />
                          {/* Frame overlay based on selected frame style */}
                          {qrCustomization.frameStyle !== 'none' && (
                            <div className="absolute inset-0 pointer-events-none">
                              {qrCustomization.frameStyle === 'simple' && (
                                <div className="absolute inset-0 border-4 border-gray-800 rounded-lg"></div>
                              )}
                              {qrCustomization.frameStyle === 'scan-me' && (
                                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded text-sm font-medium border">
                                  SCAN ME
                                </div>
                              )}
                              {qrCustomization.frameStyle === 'scan-me-black' && (
                                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white px-3 py-1 rounded text-sm font-medium">
                                  SCAN ME
                                </div>
                              )}
                              {qrCustomization.frameStyle === 'arrow' && (
                                <div className="absolute -right-8 top-1/2 transform -translate-y-1/2 text-gray-600">
                                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-center space-x-3">
                        <button
                          onClick={downloadQR}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </button>
                        <button
                          onClick={() => {
                            if (canvasRef.current) {
                              canvasRef.current.toBlob((blob) => {
                                if (blob) {
                                  const url = URL.createObjectURL(blob);
                                  copyToClipboard(url);
                                }
                              });
                            }
                          }}
                          className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          <span>Copy</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12">
                      <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Enter text or URL to see QR code preview</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Form Section */}
            <div className={`space-y-6 ${mode === 'qr' ? 'order-1 xl:order-2 xl:col-span-2' : ''}`}>
            {/* Input Section */}
            <div className="space-y-4">
              {mode === 'url' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter URL to shorten
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="https://example.com/very-long-url..."
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {isLoadingAI && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {mode === 'qr' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter text or URL for QR code
                  </label>
                  <div className="relative">
                    <textarea
                      placeholder="Enter text, URL, or any content..."
                      value={qrText}
                      onChange={(e) => setQrText(e.target.value)}
                      rows={3}
                      maxLength={2000}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                      {qrText.length}/2000
                    </div>
                  </div>
                  {qrText && (
                    <div className="mt-2 flex items-center space-x-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${
                        qrText.length > 0 ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                      <span className="text-gray-600">
                        {qrText.startsWith('http') ? 'URL detected' : 'Text content'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {mode === 'file' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload file to create shareable link
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 mb-2">
                      {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      PDF, Images, Documents (Max 10MB)
                    </p>
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                    />
                    <label
                      htmlFor="file-upload"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
                    >
                      Choose File
                    </label>
                  </div>
                </div>
              )}

              {/* AI Suggestions */}
              {aiSuggestions.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
                    AI-Suggested Aliases
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {aiSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => setCustomAlias(suggestion.alias)}
                        className="px-3 py-2 bg-white border border-purple-200 rounded-lg text-sm hover:bg-purple-50 transition-colors text-left"
                        title={suggestion.reason}
                      >
                        <div className="font-medium">{suggestion.alias}</div>
                        <div className="text-xs text-gray-500 capitalize">{suggestion.category}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Security Check */}
              {securityCheck && (
                <div className={`p-4 rounded-lg border ${
                  securityCheck.isSpam || securityCheck.riskScore > 50
                    ? 'bg-red-50 border-red-200'
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center">
                    <Shield className={`w-5 h-5 mr-2 ${
                      securityCheck.isSpam || securityCheck.riskScore > 50
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`} />
                    <span className="font-medium">
                      {securityCheck.isSpam || securityCheck.riskScore > 50
                        ? 'Security Risk Detected'
                        : 'URL is Safe'
                      }
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      (Risk Score: {securityCheck.riskScore}%)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* QR Customization (only for QR mode) */}
            {mode === 'qr' && (
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Palette className="w-5 h-5 mr-2" />
                    QR Code Customization
                  </h3>
                  <button
                    onClick={() => setQrCustomization({
                      foregroundColor: '#000000',
                      backgroundColor: '#FFFFFF',
                      size: 300,
                      errorCorrectionLevel: 'M',
                      margin: 4,
                      pattern: 'square',
                      cornerStyle: 'square',
                      frameStyle: 'none',
                      gradientType: 'none',
                      gradientDirection: 'to-right',
                      secondaryColor: '#333333',
                      centerTextFontSize: 16,
                      centerTextFontFamily: 'Arial',
                      centerTextColor: '#000000',
                      centerTextBackgroundColor: '#FFFFFF',
                      centerTextBold: true,
                      logo: undefined,
                      centerText: undefined
                    })}
                    className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Reset
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  {/* Left Column - Colors & Patterns */}
                  <div className="space-y-6">
                    {/* Color Presets */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Color Presets</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {colorPresets.map((preset) => (
                          <button
                            key={preset.name}
                            onClick={() => setQrCustomization(prev => ({
                              ...prev,
                              foregroundColor: preset.foreground,
                              backgroundColor: preset.background
                            }))}
                            className={`p-3 border-2 rounded-lg hover:border-blue-300 transition-colors ${
                              qrCustomization.foregroundColor === preset.foreground && 
                              qrCustomization.backgroundColor === preset.background
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200'
                            }`}
                          >
                            <div 
                              className="w-8 h-8 rounded border-2 border-white shadow-sm mx-auto mb-1"
                              style={{ backgroundColor: preset.foreground }}
                            />
                            <span className="text-xs font-medium">{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Gradient Options */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Gradient Style</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                        {[
                          { id: 'none', name: 'None' },
                          { id: 'linear', name: 'Linear' },
                          { id: 'radial', name: 'Radial' }
                        ].map((gradient) => (
                          <button
                            key={gradient.id}
                            onClick={() => setQrCustomization(prev => ({
                              ...prev,
                              gradientType: gradient.id as any
                            }))}
                            className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                              qrCustomization.gradientType === gradient.id
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {gradient.name}
                          </button>
                        ))}
                      </div>
                      
                      {qrCustomization.gradientType !== 'none' && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">Secondary Color</label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="color"
                                value={qrCustomization.secondaryColor}
                                onChange={(e) => setQrCustomization(prev => ({
                                  ...prev,
                                  secondaryColor: e.target.value
                                }))}
                                className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={qrCustomization.secondaryColor}
                                onChange={(e) => setQrCustomization(prev => ({
                                  ...prev,
                                  secondaryColor: e.target.value
                                }))}
                                className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                              />
                            </div>
                          </div>
                          
                          {qrCustomization.gradientType === 'linear' && (
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-2">Direction</label>
                              <select
                                value={qrCustomization.gradientDirection}
                                onChange={(e) => setQrCustomization(prev => ({
                                  ...prev,
                                  gradientDirection: e.target.value as any
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              >
                                <option value="to-right">Left to Right</option>
                                <option value="to-bottom">Top to Bottom</option>
                                <option value="to-top-right">Bottom-Left to Top-Right</option>
                                <option value="to-bottom-right">Top-Left to Bottom-Right</option>
                              </select>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Pattern Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Data Pattern</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { id: 'square', name: 'Square', icon: '⬛' },
                          { id: 'circle', name: 'Circle', icon: '⚫' },
                          { id: 'rounded', name: 'Rounded', icon: '⬜' },
                          { id: 'diamond', name: 'Diamond', icon: '◆' }
                        ].map((pattern) => (
                          <button
                            key={pattern.id}
                            onClick={() => setQrCustomization(prev => ({
                              ...prev,
                              pattern: pattern.id as any
                            }))}
                            className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                              qrCustomization.pattern === pattern.id
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <span className="text-lg">{pattern.icon}</span>
                            <span>{pattern.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Corner Style */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Corner Style</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { id: 'square', name: 'Square' },
                          { id: 'rounded', name: 'Rounded' },
                          { id: 'circle', name: 'Circle' },
                          { id: 'extra-rounded', name: 'Extra Rounded' }
                        ].map((corner) => (
                          <button
                            key={corner.id}
                            onClick={() => setQrCustomization(prev => ({
                              ...prev,
                              cornerStyle: corner.id as any
                            }))}
                            className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                              qrCustomization.cornerStyle === corner.id
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {corner.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Frames & Advanced */}
                  <div className="space-y-6">
                    {/* Frame Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Select Frame</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                        {[
                          { id: 'none', name: 'No Frame', preview: '⬜' },
                          { id: 'simple', name: 'Simple Border', preview: '⬛' },
                          { id: 'scan-me', name: 'Scan Me', preview: '📱' },
                          { id: 'scan-me-black', name: 'Scan Me (Black)', preview: '📲' },
                          { id: 'arrow', name: 'Arrow', preview: '➡️' },
                          { id: 'gradient', name: 'Gradient', preview: '🌈' },
                          { id: 'social', name: 'Social', preview: '💬' },
                          { id: 'minimal', name: 'Minimal', preview: '⚪' }
                        ].map((frame) => (
                          <button
                            key={frame.id}
                            onClick={() => setQrCustomization(prev => ({
                              ...prev,
                              frameStyle: frame.id as any
                            }))}
                            className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors flex flex-col items-center space-y-1 ${
                              qrCustomization.frameStyle === frame.id
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <span className="text-lg">{frame.preview}</span>
                            <span className="text-xs text-center">{frame.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Colors */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Custom Colors</label>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">
                            Foreground Color
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={qrCustomization.foregroundColor}
                              onChange={(e) => setQrCustomization(prev => ({
                                ...prev,
                                foregroundColor: e.target.value
                              }))}
                              className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={qrCustomization.foregroundColor}
                              onChange={(e) => setQrCustomization(prev => ({
                                ...prev,
                                foregroundColor: e.target.value
                              }))}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">
                            Background Color
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={qrCustomization.backgroundColor}
                              onChange={(e) => setQrCustomization(prev => ({
                                ...prev,
                                backgroundColor: e.target.value
                              }))}
                              className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={qrCustomization.backgroundColor}
                              onChange={(e) => setQrCustomization(prev => ({
                                ...prev,
                                backgroundColor: e.target.value
                              }))}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Frames & Advanced */}
                  <div className="space-y-6">
                    {/* Logo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Add Logo (Optional)
                        {!isPremium && <Crown className="w-4 h-4 text-yellow-500 ml-1 inline" />}
                      </label>
                      {!isPremium && (
                        <p className="text-sm text-gray-500 mb-3">
                          Upgrade to Premium to add custom logos
                        </p>
                      )}
                      <div className="space-y-3">
                        <button
                          onClick={() => logoInputRef.current?.click()}
                          disabled={!isPremium}
                          className={`w-full flex items-center justify-center space-x-2 px-4 py-3 border-2 border-dashed rounded-lg transition-colors ${
                            isPremium 
                              ? 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-700' 
                              : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <Upload className="w-5 h-5" />
                          <span>Upload Logo</span>
                        </button>
                        {qrCustomization.logo && (
                          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <img 
                              src={qrCustomization.logo} 
                              alt="Logo preview" 
                              className="w-12 h-12 object-cover rounded border"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-700 block">Logo added</span>
                              <button
                                onClick={() => setQrCustomization(prev => ({ ...prev, logo: undefined }))}
                                className="text-xs text-red-600 hover:text-red-800"
                              >
                                Remove logo
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </div>

                    {/* Center Text */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Center Text (Optional)
                      </label>
                      
                      {/* Text Input */}
                      <div className="relative mb-4">
                        <input
                          type="text"
                          placeholder="BRAND"
                          value={qrCustomization.centerText || ''}
                          onChange={(e) => setQrCustomization(prev => ({
                            ...prev,
                            centerText: e.target.value.toUpperCase()
                          }))}
                          maxLength={12}
                          className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                          {(qrCustomization.centerText || '').length}/12
                        </div>
                      </div>

                      {/* Font Options - Only show when text is entered */}
                      {qrCustomization.centerText && (
                        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-700">Text Styling</h4>
                          
                          {/* Font Family */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">Font Family</label>
                            <select
                              value={qrCustomization.centerTextFontFamily}
                              onChange={(e) => setQrCustomization(prev => ({
                                ...prev,
                                centerTextFontFamily: e.target.value
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="Arial">Arial</option>
                              <option value="Helvetica">Helvetica</option>
                              <option value="Times New Roman">Times New Roman</option>
                              <option value="Georgia">Georgia</option>
                              <option value="Verdana">Verdana</option>
                              <option value="Courier New">Courier New</option>
                              <option value="Impact">Impact</option>
                              <option value="Comic Sans MS">Comic Sans MS</option>
                              <option value="Trebuchet MS">Trebuchet MS</option>
                              <option value="Tahoma">Tahoma</option>
                            </select>
                          </div>

                          {/* Font Size */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">
                              Font Size: {qrCustomization.centerTextFontSize}px
                            </label>
                            <input
                              type="range"
                              min="10"
                              max="32"
                              step="2"
                              value={qrCustomization.centerTextFontSize}
                              onChange={(e) => setQrCustomization(prev => ({
                                ...prev,
                                centerTextFontSize: parseInt(e.target.value)
                              }))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>Small (10px)</span>
                              <span>Large (32px)</span>
                            </div>
                          </div>

                          {/* Font Weight */}
                          <div>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={qrCustomization.centerTextBold}
                                onChange={(e) => setQrCustomization(prev => ({
                                  ...prev,
                                  centerTextBold: e.target.checked
                                }))}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-xs font-medium text-gray-600">Bold Text</span>
                            </label>
                          </div>

                          {/* Text Colors */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-2">Text Color</label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="color"
                                  value={qrCustomization.centerTextColor}
                                  onChange={(e) => setQrCustomization(prev => ({
                                    ...prev,
                                    centerTextColor: e.target.value
                                  }))}
                                  className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={qrCustomization.centerTextColor}
                                  onChange={(e) => setQrCustomization(prev => ({
                                    ...prev,
                                    centerTextColor: e.target.value
                                  }))}
                                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-2">Background</label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="color"
                                  value={qrCustomization.centerTextBackgroundColor}
                                  onChange={(e) => setQrCustomization(prev => ({
                                    ...prev,
                                    centerTextBackgroundColor: e.target.value
                                  }))}
                                  className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={qrCustomization.centerTextBackgroundColor}
                                  onChange={(e) => setQrCustomization(prev => ({
                                    ...prev,
                                    centerTextBackgroundColor: e.target.value
                                  }))}
                                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Text Preview */}
                          <div className="mt-4">
                            <label className="block text-xs font-medium text-gray-600 mb-2">Preview</label>
                            <div 
                              className="inline-block px-3 py-2 rounded border"
                              style={{
                                fontFamily: qrCustomization.centerTextFontFamily,
                                fontSize: `${qrCustomization.centerTextFontSize}px`,
                                fontWeight: qrCustomization.centerTextBold ? 'bold' : 'normal',
                                color: qrCustomization.centerTextColor,
                                backgroundColor: qrCustomization.centerTextBackgroundColor
                              }}
                            >
                              {qrCustomization.centerText || 'BRAND'}
                            </div>
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-gray-500 mt-2">
                        Short text that appears in the center of the QR code
                      </p>
                    </div>

                    {/* Size and Settings */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Size & Quality Settings</label>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">
                            Size: {qrCustomization.size}x{qrCustomization.size}px
                          </label>
                          <input
                            type="range"
                            min="200"
                            max="500"
                            step="50"
                            value={qrCustomization.size}
                            onChange={(e) => setQrCustomization(prev => ({
                              ...prev,
                              size: parseInt(e.target.value)
                            }))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>200px</span>
                            <span>500px</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">
                            Margin: {qrCustomization.margin}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="8"
                            step="1"
                            value={qrCustomization.margin}
                            onChange={(e) => setQrCustomization(prev => ({
                              ...prev,
                              margin: parseInt(e.target.value)
                            }))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>None</span>
                            <span>Large</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">
                            Error Correction
                          </label>
                          <select
                            value={qrCustomization.errorCorrectionLevel}
                            onChange={(e) => setQrCustomization(prev => ({
                              ...prev,
                              errorCorrectionLevel: e.target.value as 'L' | 'M' | 'Q' | 'H'
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="L">Low (7%) - Faster scan</option>
                            <option value="M">Medium (15%) - Balanced</option>
                            <option value="Q">Quartile (25%) - Good for logos</option>
                            <option value="H">High (30%) - Best for damage</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Settings */}
            <div className="border-t pt-6">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
              >
                <Settings className="w-4 h-4 mr-2" />
                Advanced Settings
                <span className="ml-2">{showAdvanced ? '−' : '+'}</span>
              </button>

              {showAdvanced && (
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Domain
                    </label>
                    <select
                      value={selectedDomain}
                      onChange={(e) => setSelectedDomain(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {customDomains.map(domain => (
                        <option key={domain} value={domain}>{domain}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Alias (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="my-custom-link"
                      value={customAlias}
                      onChange={(e) => setCustomAlias(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password Protection
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Optional password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiration (Days)
                    </label>
                    <input
                      type="number"
                      placeholder="Never expires"
                      value={expirationDays}
                      onChange={(e) => setExpirationDays(e.target.value ? parseInt(e.target.value) : '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreate}
              disabled={isLoading || 
                (mode === 'url' && !urlInput.trim()) || 
                (mode === 'qr' && !qrText.trim()) || 
                (mode === 'file' && !selectedFile)
              }
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {mode === 'url' ? 'Shortening...' : mode === 'qr' ? 'Generating...' : 'Uploading...'}
                </div>
              ) : (
                <>
                  {mode === 'url' ? 'Shorten URL' : mode === 'qr' ? 'Generate QR Code' : 'Upload & Create Link'}
                </>
              )}
            </button>
            </div>
          </div>

        </div>
      </div>

      {/* Success Modal */}
      <LinkSuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          setResult(null);
        }}
        shortUrl={result?.shortUrl || ''}
        originalUrl={result?.originalUrl || ''}
        qrCode={result?.qrCode}
        type={mode}
      />

      {/* QR Success Modal */}
      <QRSuccessModal
        isOpen={showQRSuccessModal}
        onClose={() => {
          setShowQRSuccessModal(false);
          setResult(null);
        }}
        qrCanvas={canvasRef.current}
        shortUrl={result?.shortUrl || ''}
        originalUrl={result?.originalUrl || ''}
        onCustomize={() => {
          setShowQRSuccessModal(false);
          // Keep the form open for customization
        }}
        onCreateAnother={() => {
          setShowQRSuccessModal(false);
          setResult(null);
          setQrText('');
          setCustomAlias('');
          setPassword('');
          setExpirationDays('');
          setMaxClicks('');
          setIsOneTime(false);
          setAiSuggestions([]);
          setSecurityCheck(null);
        }}
      />
    </div>
  );
};

export default CreateSection;