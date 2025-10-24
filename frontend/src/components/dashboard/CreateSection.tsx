import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
import QRCodeGenerator from '../QRCodeGenerator';
import { aiService, AliasSuggestion, SecurityCheck } from '../../services/aiService';
import * as QRCode from 'qrcode';
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
  const location = useLocation();
  const [urlInput, setUrlInput] = useState('');
  const [qrText, setQrText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customAlias, setCustomAlias] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('pebly.vercel.app');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [expirationDays, setExpirationDays] = useState<number | ''>('');
  const [maxClicks, setMaxClicks] = useState<number | ''>('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editQRId, setEditQRId] = useState<string | null>(null);
  const [isOneTime, setIsOneTime] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ShortenedLink | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showQRSuccessModal, setShowQRSuccessModal] = useState(false);
  
  // QR Code caching for performance
  const qrCacheRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  
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
  const [customDomains, setCustomDomains] = useState<string[]>(['pebly.vercel.app']);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const isPremium = user?.plan === 'premium';

  // Handle edit mode when component loads with edit data
  useEffect(() => {
    const editData = (location.state as any)?.editQRData;
    if (editData) {
      setIsEditMode(true);
      setEditQRId(editData.id);
      setQrText(editData.content || '');
      setQrCustomization({
        foregroundColor: editData.foregroundColor || '#000000',
        backgroundColor: editData.backgroundColor || '#FFFFFF',
        size: editData.size || 300,
        errorCorrectionLevel: editData.errorCorrectionLevel || 'M',
        margin: 4,
        pattern: editData.style === 'dots' ? 'circle' : 
                 editData.style === 'rounded' ? 'rounded' :
                 editData.style === 'classy' ? 'diamond' : 'square',
        cornerStyle: editData.cornerStyle || 'square',
        frameStyle: editData.frameStyle || 'none',
        gradientType: 'none',
        gradientDirection: 'to-right',
        secondaryColor: '#333333',
        centerTextFontSize: 16,
        centerTextFontFamily: 'Arial',
        centerTextColor: '#000000',
        centerTextBackgroundColor: '#FFFFFF',
        centerTextBold: true
      });
      
      // Clear the location state to prevent re-loading on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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

  // Load custom domains from backend
  useEffect(() => {
    loadCustomDomainsFromBackend();
  }, []);

  const loadCustomDomainsFromBackend = async () => {
    try {
      // TODO: Load from backend API instead of localStorage
      setCustomDomains(['pebly.vercel.app']); // Default domain only
    } catch (error) {
      console.error('Failed to load custom domains:', error);
      setCustomDomains(['pebly.vercel.app']);
    }
  };

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

  // Generate QR code preview with optimized debouncing
  useEffect(() => {
    if (mode === 'qr' && qrText && canvasRef.current) {
      console.log('QR generation triggered for text:', qrText.substring(0, 50) + '...');
      const timer = setTimeout(() => {
        generateQRCodeOptimized();
      }, 50); // Reduced delay for faster response
      return () => clearTimeout(timer);
    }
  }, [qrText, qrCustomization, mode]);

  // Ultra-fast QR code generation with caching and optimization
  const generateQRCodeOptimized = async () => {
    if (!canvasRef.current || !qrText) return;

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Create cache key for basic QR settings
      const cacheKey = `${qrText}-${qrCustomization.size}-${qrCustomization.margin}-${qrCustomization.errorCorrectionLevel}`;
      
      // Check cache first for instant rendering
      const cachedCanvas = qrCacheRef.current.get(cacheKey);
      if (cachedCanvas && 
          qrCustomization.gradientType === 'none' && 
          !qrCustomization.logo && 
          !qrCustomization.centerText) {
        
        // Instant copy from cache
        canvas.width = cachedCanvas.width;
        canvas.height = cachedCanvas.height;
        ctx.drawImage(cachedCanvas, 0, 0);
        return;
      }

      // Generate QR code with minimal settings for speed
      try {
        console.log('Generating QR code with settings:', {
          width: qrCustomization.size,
          margin: qrCustomization.margin,
          foreground: qrCustomization.foregroundColor,
          background: qrCustomization.backgroundColor,
          errorCorrection: qrCustomization.errorCorrectionLevel
        });
        
        await QRCode.toCanvas(canvas, qrText, {
          width: qrCustomization.size,
          margin: qrCustomization.margin,
          color: {
            dark: qrCustomization.foregroundColor,
            light: qrCustomization.backgroundColor
          },
          errorCorrectionLevel: qrCustomization.errorCorrectionLevel
        });
        
        console.log('QR code generated successfully, canvas size:', canvas.width, 'x', canvas.height);
      } catch (qrError) {
        console.error('QRCode.toCanvas error:', qrError);
        toast.error('QR Code generation failed: ' + (qrError as Error).message);
        
        // Fallback: create a simple placeholder
        canvas.width = qrCustomization.size;
        canvas.height = qrCustomization.size;
        ctx.fillStyle = qrCustomization.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = qrCustomization.foregroundColor;
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR Code Error', canvas.width / 2, canvas.height / 2);
        ctx.fillText('Check console', canvas.width / 2, canvas.height / 2 + 20);
        return;
      }

      // Cache the basic QR code for future use
      if (!cachedCanvas) {
        const cacheCanvas = document.createElement('canvas');
        cacheCanvas.width = canvas.width;
        cacheCanvas.height = canvas.height;
        const cacheCtx = cacheCanvas.getContext('2d');
        if (cacheCtx) {
          cacheCtx.drawImage(canvas, 0, 0);
          qrCacheRef.current.set(cacheKey, cacheCanvas);
        }
      }

      // Apply customizations asynchronously for instant basic preview
      if (qrCustomization.gradientType !== 'none' || 
          (qrCustomization.logo && qrCustomization.logo.trim()) || 
          (qrCustomization.centerText && qrCustomization.centerText.trim())) {
        
        // Use immediate timeout for fastest response
        setTimeout(() => {
          applyAdvancedCustomizations(ctx);
        }, 0);
      }
    } catch (error) {
      console.error('QR Code generation error:', error);
      toast.error('Failed to generate QR code. Please check your input.');
    }
  };

  // Non-blocking advanced customizations
  const applyAdvancedCustomizations = (ctx: CanvasRenderingContext2D) => {
    try {
      // Apply gradient (optimized with composite operations)
      if (qrCustomization.gradientType !== 'none') {
        applyGradientFast(ctx);
      }

      // Apply logo (async loading)
      if (qrCustomization.logo) {
        applyLogoFast(ctx);
      }

      // Apply center text (immediate)
      if (qrCustomization.centerText) {
        applyCenterTextFast(ctx);
      }
    } catch (error) {
      console.error('Error applying customizations:', error);
    }
  };

  // Fast gradient application using composite operations
  const applyGradientFast = (ctx: CanvasRenderingContext2D) => {
    const size = qrCustomization.size;
    
    // Create gradient
    let gradient;
    if (qrCustomization.gradientType === 'linear') {
      gradient = ctx.createLinearGradient(0, 0, 
        qrCustomization.gradientDirection.includes('right') ? size : 0,
        qrCustomization.gradientDirection.includes('bottom') ? size : 0
      );
    } else {
      gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    }
    
    gradient.addColorStop(0, qrCustomization.foregroundColor);
    gradient.addColorStop(1, qrCustomization.secondaryColor);

    // Use composite operation for instant gradient application
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    ctx.globalCompositeOperation = 'source-over';
  };

  // Fast logo application
  const applyLogoFast = (ctx: CanvasRenderingContext2D) => {
    if (!qrCustomization.logo) return;
    
    const img = new Image();
    img.onload = () => {
      const logoSize = qrCustomization.size * 0.15; // Smaller for better performance
      const x = (qrCustomization.size - logoSize) / 2;
      const y = (qrCustomization.size - logoSize) / 2;
      
      // Simple white background (no complex shapes for speed)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x - 4, y - 4, logoSize + 8, logoSize + 8);
      
      // Draw logo
      ctx.drawImage(img, x, y, logoSize, logoSize);
    };
    img.src = qrCustomization.logo;
  };

  // Fast center text application
  const applyCenterTextFast = (ctx: CanvasRenderingContext2D) => {
    if (!qrCustomization.centerText) return;
    
    const fontSize = Math.min(qrCustomization.centerTextFontSize, 20); // Limit for performance
    const fontWeight = qrCustomization.centerTextBold ? 'bold' : 'normal';
    
    ctx.font = `${fontWeight} ${fontSize}px system-ui, Arial`; // Use system fonts for speed
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const centerX = qrCustomization.size / 2;
    const centerY = qrCustomization.size / 2;
    
    // Simple rectangular background for speed
    const textWidth = ctx.measureText(qrCustomization.centerText).width;
    const padding = 6;
    
    ctx.fillStyle = qrCustomization.centerTextBackgroundColor;
    ctx.fillRect(
      centerX - textWidth / 2 - padding, 
      centerY - fontSize / 2 - 3, 
      textWidth + padding * 2, 
      fontSize + 6
    );
    
    // Draw text
    ctx.fillStyle = qrCustomization.centerTextColor;
    ctx.fillText(qrCustomization.centerText, centerX, centerY);
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
        
        // Upload file to backend via API
        try {
          const formData = new FormData();
          formData.append('file', selectedFile);
          formData.append('userId', user?.id || 'anonymous-user');
          formData.append('title', selectedFile.name);
          formData.append('description', 'Uploaded via Dashboard');
          formData.append('isPublic', 'true');
          
          const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
          const response = await fetch(`${apiUrl}/v1/files/upload`, {
            method: 'POST',
            body: formData
          });
          
          const fileResult = await response.json();
          if (fileResult.success) {
            originalUrl = fileResult.data.fileUrl;
            toast.success('File uploaded to database successfully!');
          } else {
            throw new Error(fileResult.message || 'File upload failed');
          }
        } catch (error) {
          console.error('File upload error:', error);
          toast.error('Failed to upload file to database');
          return;
        }
      }

      const finalDomain = selectedDomain === 'pebly.vercel.app' ? baseUrl : `https://${selectedDomain}`;
      
      const newLink: ShortenedLink = {
        id: Date.now().toString(),
        shortCode,
        shortUrl: `${finalDomain}/${shortCode}`,
        originalUrl,
        clicks: 0,
        createdAt: new Date().toISOString(),
        customDomain: selectedDomain !== 'pebly.vercel.app' ? selectedDomain : undefined,
        type: mode,
        qrCustomization: mode === 'qr' ? qrCustomization : undefined
      };

      // Save to MongoDB via backend API
      try {
        let backendResult;
        
        if (mode === 'url') {
          // Call URL shortening API
          const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
          const response = await fetch(`${apiUrl}/v1/urls`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              originalUrl: originalUrl,
              userId: user?.id || 'anonymous-user',
              customAlias: customAlias || undefined,
              password: password || undefined,
              expirationDays: expirationDays || undefined,
              title: `Dashboard URL - ${shortCode}`,
              description: 'Created via Dashboard'
            })
          });
          backendResult = await response.json();
        } else if (mode === 'qr') {
          // Call QR code API (create or update)
          const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
          
          if (isEditMode && editQRId) {
            // Update existing QR code
            const response = await fetch(`${apiUrl}/v1/qr/${editQRId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: user?.id || 'anonymous-user',
                content: originalUrl,
                contentType: 'TEXT',
                title: `Dashboard QR - ${shortCode}`,
                description: 'Updated via Dashboard',
                foregroundColor: qrCustomization.foregroundColor,
                backgroundColor: qrCustomization.backgroundColor,
                size: qrCustomization.size,
                errorCorrectionLevel: qrCustomization.errorCorrectionLevel,
                style: qrCustomization.pattern === 'circle' ? 'dots' :
                       qrCustomization.pattern === 'rounded' ? 'rounded' :
                       qrCustomization.pattern === 'diamond' ? 'classy' : 'square',
                cornerStyle: qrCustomization.cornerStyle,
                frameStyle: qrCustomization.frameStyle
              })
            });
            backendResult = await response.json();
          } else {
            // Create new QR code
            const response = await fetch(`${apiUrl}/v1/qr`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                content: originalUrl,
                contentType: 'TEXT',
                userId: user?.id || 'anonymous-user',
                title: `Dashboard QR - ${shortCode}`,
                description: 'Created via Dashboard',
                foregroundColor: qrCustomization.foregroundColor,
                backgroundColor: qrCustomization.backgroundColor,
                size: qrCustomization.size,
                errorCorrectionLevel: qrCustomization.errorCorrectionLevel,
                style: qrCustomization.pattern === 'circle' ? 'dots' :
                       qrCustomization.pattern === 'rounded' ? 'rounded' :
                       qrCustomization.pattern === 'diamond' ? 'classy' : 'square',
                cornerStyle: qrCustomization.cornerStyle,
                frameStyle: qrCustomization.frameStyle
              })
            });
            backendResult = await response.json();
          }
        }
        
        if (backendResult && backendResult.success) {
          console.log('Successfully saved to MongoDB:', backendResult);
          
          // Update newLink with the actual shortUrl from backend
          if (backendResult.data && backendResult.data.shortUrl) {
            newLink.shortUrl = backendResult.data.shortUrl;
            newLink.id = backendResult.data.id || newLink.id;
            newLink.shortCode = backendResult.data.shortCode || newLink.shortCode;
          }
          
          toast.success(isEditMode ? 'QR code updated successfully!' : 'Link created and saved to database!');
        } else {
          console.error('Backend save failed:', backendResult);
          toast.error('Failed to save to database: ' + (backendResult?.message || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error saving to backend:', error);
        toast.error('Failed to save to database');
      }

      setResult(newLink);
      
      // Reset form (except in edit mode)
      if (!isEditMode) {
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
      } else {
        // Reset edit mode after successful update
        setIsEditMode(false);
        setEditQRId(null);
      }

      // Add a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsLoading(false);

      // Show appropriate success modal
      if (mode === 'qr') {
        // Ensure QR code is generated and ready
        if (qrText && canvasRef.current) {
          try {
            console.log('Final QR generation before modal...');
            await QRCode.toCanvas(canvasRef.current, qrText, {
              width: qrCustomization.size,
              margin: qrCustomization.margin,
              color: {
                dark: qrCustomization.foregroundColor,
                light: qrCustomization.backgroundColor
              },
              errorCorrectionLevel: qrCustomization.errorCorrectionLevel
            });
            console.log('QR code ready for modal, canvas size:', canvasRef.current.width, 'x', canvasRef.current.height);
          } catch (error) {
            console.error('Final QR generation error:', error);
            toast.error('QR generation failed, but modal will still open with regeneration option');
          }
        }
        
        // Show modal - it will handle QR generation if needed
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

  const downloadQR = async () => {
    if (!qrText) {
      toast.error('No QR code content to download');
      return;
    }

    try {
      // Generate QR code with full customization for download
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');
      
      // Import QRCode dynamically
      const QRCode = await import('qrcode');
      
      // Generate basic QR code first
      await QRCode.toCanvas(canvas, qrText, {
        width: qrCustomization.size,
        margin: qrCustomization.margin,
        color: {
          dark: qrCustomization.foregroundColor,
          light: qrCustomization.backgroundColor
        },
        errorCorrectionLevel: qrCustomization.errorCorrectionLevel
      });

      // Apply customizations
      await applyQRCustomizations(ctx, canvas, qrCustomization);
      
      const link = document.createElement('a');
      link.download = `qr-code-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('QR code downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download QR code');
    }
  };

  const applyQRCustomizations = async (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, customization: any) => {
    // Apply gradient if specified
    if (customization.gradientType !== 'none') {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
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

      gradient.addColorStop(0, customization.foregroundColor);
      gradient.addColorStop(1, customization.secondaryColor);

      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
    }

    // Apply pattern if not square
    if (customization.pattern !== 'square') {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const moduleSize = Math.floor(canvas.width / 25);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = customization.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = customization.foregroundColor;

      for (let y = 0; y < canvas.height; y += moduleSize) {
        for (let x = 0; x < canvas.width; x += moduleSize) {
          const pixelIndex = (y * canvas.width + x) * 4;
          const isDark = data[pixelIndex] < 128;

          if (isDark) {
            switch (customization.pattern) {
              case 'circle':
                ctx.beginPath();
                ctx.arc(x + moduleSize / 2, y + moduleSize / 2, moduleSize / 2 - 1, 0, 2 * Math.PI);
                ctx.fill();
                break;
              case 'rounded':
                ctx.beginPath();
                if (ctx.roundRect) {
                  ctx.roundRect(x + 1, y + 1, moduleSize - 2, moduleSize - 2, moduleSize / 4);
                } else {
                  ctx.rect(x + 1, y + 1, moduleSize - 2, moduleSize - 2);
                }
                ctx.fill();
                break;
              case 'diamond':
                ctx.beginPath();
                ctx.moveTo(x + moduleSize / 2, y + 1);
                ctx.lineTo(x + moduleSize - 1, y + moduleSize / 2);
                ctx.lineTo(x + moduleSize / 2, y + moduleSize - 1);
                ctx.lineTo(x + 1, y + moduleSize / 2);
                ctx.closePath();
                ctx.fill();
                break;
              default:
                ctx.fillRect(x + 1, y + 1, moduleSize - 2, moduleSize - 2);
                break;
            }
          }
        }
      }
    }

    // Apply frame style
    if (customization.frameStyle !== 'none') {
      switch (customization.frameStyle) {
        case 'simple':
          ctx.strokeStyle = customization.foregroundColor;
          ctx.lineWidth = 2;
          ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
          break;
        case 'scan-me':
          ctx.fillStyle = customization.foregroundColor;
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('SCAN ME', canvas.width / 2, canvas.height - 5);
          break;
        case 'scan-me-black':
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('SCAN ME', canvas.width / 2, canvas.height - 6);
          break;
      }
    }

    // Add center text if specified
    if (customization.centerText && customization.centerText.trim()) {
      const fontSize = customization.centerTextFontSize || 16;
      const fontWeight = customization.centerTextBold ? 'bold' : 'normal';
      
      ctx.font = `${fontWeight} ${fontSize}px ${customization.centerTextFontFamily || 'Arial'}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const textMetrics = ctx.measureText(customization.centerText);
      const textWidth = textMetrics.width;
      const textHeight = fontSize;
      
      const x = canvas.width / 2;
      const y = canvas.height / 2;
      
      // Add background for text
      ctx.fillStyle = customization.centerTextBackgroundColor || '#FFFFFF';
      ctx.fillRect(x - textWidth / 2 - 5, y - textHeight / 2 - 2, textWidth + 10, textHeight + 4);
      
      // Add text
      ctx.fillStyle = customization.centerTextColor || '#000000';
      ctx.fillText(customization.centerText, x, y);
    }
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
      {/* Header */}
      {isEditMode && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <QrCode className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Edit QR Code</h2>
              <p className="text-gray-600">Update your QR code settings and see changes in real-time</p>
            </div>
          </div>
        </div>
      )}
      
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
          <div className={`${mode === 'qr' ? 'flex flex-col xl:flex-row gap-6' : 'space-y-6'}`}>
            {/* QR Preview Section (only for QR mode) - Sticky on desktop */}
            {mode === 'qr' && (
              <div className="xl:w-80 xl:flex-shrink-0 order-1 xl:order-1">
                <div className="bg-white rounded-2xl p-4 xl:p-6 text-center border border-gray-200 shadow-sm xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)]">
                  <div className="mb-4">
                    <h3 className="text-base xl:text-lg font-semibold text-gray-900 flex items-center justify-center">
                      <Eye className="w-4 h-4 xl:w-5 xl:h-5 mr-2 text-blue-600" />
                      Live Preview
                    </h3>
                  </div>
                  {qrText ? (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <div className="relative bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                          <QRCodeGenerator
                            value={qrText || 'https://example.com'}
                            size={200}
                            className="rounded"
                            customization={{
                              foregroundColor: qrCustomization.foregroundColor,
                              backgroundColor: qrCustomization.backgroundColor,
                              size: 200,
                              errorCorrectionLevel: qrCustomization.errorCorrectionLevel,
                              margin: qrCustomization.margin,
                              pattern: qrCustomization.pattern,
                              cornerStyle: qrCustomization.cornerStyle,
                              frameStyle: qrCustomization.frameStyle,
                              gradientType: qrCustomization.gradientType,
                              gradientDirection: qrCustomization.gradientDirection,
                              gradientStartColor: qrCustomization.foregroundColor,
                              gradientEndColor: qrCustomization.secondaryColor,
                              logo: qrCustomization.logo,
                              centerText: qrCustomization.centerText,
                              centerTextSize: qrCustomization.centerTextFontSize,
                              centerTextFontFamily: qrCustomization.centerTextFontFamily,
                              centerTextColor: qrCustomization.centerTextColor,
                              centerTextBackgroundColor: qrCustomization.centerTextBackgroundColor,
                              centerTextBold: qrCustomization.centerTextBold
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={downloadQR}
                          className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Download className="w-3 h-3" />
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
                          className="flex items-center space-x-1 px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8">
                      <QrCode className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Enter text or URL above</p>
                      {qrText && (
                        <div className="mt-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-xs text-gray-500">Generating...</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Form Section - Scrollable on desktop */}
            <div className={`${mode === 'qr' ? 'flex-1 order-2 xl:order-2 xl:overflow-y-auto xl:max-h-[calc(100vh-8rem)] xl:pr-2' : ''} space-y-6`}>
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
                  {mode === 'url' ? 'Shorten URL' : 
                   mode === 'qr' ? (isEditMode ? 'Update QR Code' : 'Generate QR Code') : 
                   'Upload & Create Link'}
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