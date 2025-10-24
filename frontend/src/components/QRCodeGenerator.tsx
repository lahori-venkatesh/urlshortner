import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCustomization {
  foregroundColor?: string;
  backgroundColor?: string;
  size?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
  pattern?: 'square';
  cornerStyle?: 'square';
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

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  className?: string;
  customization?: QRCustomization;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ 
  value, 
  size = 200, 
  className = '',
  customization = {}
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Default customization values
  const defaultCustomization: Required<QRCustomization> = {
    foregroundColor: '#000000',
    backgroundColor: '#FFFFFF',
    size: size,
    errorCorrectionLevel: 'M',
    margin: 2,
    pattern: 'square',
    cornerStyle: 'square',
    frameStyle: 'none',
    gradientType: 'none',
    gradientDirection: 'to-right',
    gradientStartColor: '#000000',
    gradientEndColor: '#333333',
    logo: '',
    logoSize: 20,
    logoCornerRadius: 0,
    centerText: '',
    centerTextSize: 16,
    centerTextFontFamily: 'Arial',
    centerTextColor: '#000000',
    centerTextBackgroundColor: '#FFFFFF',
    centerTextBold: true
  };

  const config = { ...defaultCustomization, ...customization };

  useEffect(() => {
    if (canvasRef.current && value) {
      generateCustomQRCode();
    }
  }, [value, size, customization]);

  const generateCustomQRCode = async () => {
    if (!canvasRef.current || !value) return;

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Generate basic QR code first
      await QRCode.toCanvas(canvas, value, {
        width: config.size,
        margin: config.margin,
        color: {
          dark: config.foregroundColor,
          light: config.backgroundColor
        },
        errorCorrectionLevel: config.errorCorrectionLevel
      });

      // Apply advanced customizations
      await applyCustomizations(ctx, canvas);

    } catch (error) {
      console.error('QR Code generation error:', error);
    }
  };

  const applyCustomizations = async (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Apply gradient if specified
    if (config.gradientType !== 'none') {
      applyGradient(ctx, canvas);
    }

    // Pattern is always square, no additional processing needed

    // Corner style is always square, no additional processing needed

    // Apply frame style
    if (config.frameStyle !== 'none') {
      applyFrameStyle(ctx, canvas);
    }

    // Add logo if specified
    if (config.logo && config.logo.trim()) {
      await addLogo(ctx, canvas);
    }

    // Add center text if specified
    if (config.centerText && config.centerText.trim()) {
      addCenterText(ctx, canvas);
    }
  };

  const applyGradient = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let gradient: CanvasGradient;
    
    if (config.gradientType === 'linear') {
      switch (config.gradientDirection) {
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

    gradient.addColorStop(0, config.gradientStartColor);
    gradient.addColorStop(1, config.gradientEndColor);

    // Apply gradient to dark pixels only
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
  };

  const applyPattern = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Since we only support square pattern, this function is simplified
    // The basic QR code generation already creates square patterns
    // No additional pattern processing needed
  };

  const applyCornerStyle = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Since we only support square corner style, no additional processing needed
    // The basic QR code generation already creates square corners
  };

  const applyFrameStyle = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const frameWidth = 20;
    
    switch (config.frameStyle) {
      case 'simple':
        ctx.strokeStyle = config.foregroundColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
        break;
      case 'scan-me':
        ctx.fillStyle = config.foregroundColor;
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
        // Company frame with border and branding area
        ctx.strokeStyle = config.foregroundColor;
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
        ctx.fillStyle = config.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, 30);
        ctx.fillStyle = config.foregroundColor;
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR CODE', canvas.width / 2, 20);
        break;
      case 'modern':
        // Sleek modern design with gradient border
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, config.foregroundColor);
        gradient.addColorStop(1, config.backgroundColor);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);
        break;
      case 'classic':
        // Traditional frame with corner decorations
        ctx.strokeStyle = config.foregroundColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
        // Corner decorations
        const cornerSize = 15;
        ctx.fillStyle = config.foregroundColor;
        // Top-left corner
        ctx.fillRect(0, 0, cornerSize, 3);
        ctx.fillRect(0, 0, 3, cornerSize);
        // Top-right corner
        ctx.fillRect(canvas.width - cornerSize, 0, cornerSize, 3);
        ctx.fillRect(canvas.width - 3, 0, 3, cornerSize);
        // Bottom-left corner
        ctx.fillRect(0, canvas.height - 3, cornerSize, 3);
        ctx.fillRect(0, canvas.height - cornerSize, 3, cornerSize);
        // Bottom-right corner
        ctx.fillRect(canvas.width - cornerSize, canvas.height - 3, cornerSize, 3);
        ctx.fillRect(canvas.width - 3, canvas.height - cornerSize, 3, cornerSize);
        break;
      case 'rounded':
        // Soft rounded frame
        ctx.strokeStyle = config.foregroundColor;
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

  const addLogo = async (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise<void>((resolve) => {
        img.onload = () => {
          const logoSizePercent = (config.logoSize || 20) / 100;
          const logoSize = Math.min(canvas.width, canvas.height) * logoSizePercent;
          const x = (canvas.width - logoSize) / 2;
          const y = (canvas.height - logoSize) / 2;
          const cornerRadius = config.logoCornerRadius || 0;
          
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
        img.src = config.logo;
      });
    } catch (error) {
      console.error('Error adding logo:', error);
    }
  };

  const addCenterText = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const fontSize = config.centerTextSize;
    const fontWeight = config.centerTextBold ? 'bold' : 'normal';
    
    ctx.font = `${fontWeight} ${fontSize}px ${config.centerTextFontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const textMetrics = ctx.measureText(config.centerText);
    const textWidth = textMetrics.width;
    const textHeight = fontSize;
    
    const x = canvas.width / 2;
    const y = canvas.height / 2;
    
    // Add background for text
    ctx.fillStyle = config.centerTextBackgroundColor;
    ctx.fillRect(x - textWidth / 2 - 5, y - textHeight / 2 - 2, textWidth + 10, textHeight + 4);
    
    // Add text
    ctx.fillStyle = config.centerTextColor;
    ctx.fillText(config.centerText, x, y);
  };

  if (!value) return null;

  return (
    <div className={`inline-block ${className}`}>
      <canvas ref={canvasRef} className="border border-gray-200 rounded-lg" />
    </div>
  );
};

export default QRCodeGenerator;