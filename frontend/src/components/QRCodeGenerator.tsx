import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCustomization {
  foregroundColor?: string;
  backgroundColor?: string;
  size?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
  pattern?: 'square' | 'circle' | 'rounded' | 'diamond';
  cornerStyle?: 'square' | 'rounded' | 'circle' | 'extra-rounded';
  frameStyle?: 'none' | 'simple' | 'scan-me' | 'scan-me-black' | 'arrow' | 'gradient' | 'social' | 'minimal';
  gradientType?: 'none' | 'linear' | 'radial';
  gradientDirection?: 'to-right' | 'to-bottom' | 'to-top-right' | 'to-bottom-right';
  gradientStartColor?: string;
  gradientEndColor?: string;
  logo?: string;
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

    // Apply pattern customization
    if (config.pattern !== 'square') {
      applyPattern(ctx, canvas);
    }

    // Apply corner style
    if (config.cornerStyle !== 'square') {
      applyCornerStyle(ctx, canvas);
    }

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
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const moduleSize = Math.floor(canvas.width / 25); // Approximate module size

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = config.foregroundColor;

    for (let y = 0; y < canvas.height; y += moduleSize) {
      for (let x = 0; x < canvas.width; x += moduleSize) {
        const pixelIndex = (y * canvas.width + x) * 4;
        const isDark = data[pixelIndex] < 128; // Check if pixel is dark

        if (isDark) {
          switch (config.pattern) {
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
                // Fallback for browsers that don't support roundRect
                const radius = moduleSize / 4;
                ctx.moveTo(x + 1 + radius, y + 1);
                ctx.lineTo(x + moduleSize - 1 - radius, y + 1);
                ctx.quadraticCurveTo(x + moduleSize - 1, y + 1, x + moduleSize - 1, y + 1 + radius);
                ctx.lineTo(x + moduleSize - 1, y + moduleSize - 1 - radius);
                ctx.quadraticCurveTo(x + moduleSize - 1, y + moduleSize - 1, x + moduleSize - 1 - radius, y + moduleSize - 1);
                ctx.lineTo(x + 1 + radius, y + moduleSize - 1);
                ctx.quadraticCurveTo(x + 1, y + moduleSize - 1, x + 1, y + moduleSize - 1 - radius);
                ctx.lineTo(x + 1, y + 1 + radius);
                ctx.quadraticCurveTo(x + 1, y + 1, x + 1 + radius, y + 1);
                ctx.closePath();
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
  };

  const applyCornerStyle = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // This is a simplified corner style application
    // In a full implementation, you'd need to detect and modify the finder patterns
    const cornerSize = Math.floor(canvas.width / 5);
    
    if (config.cornerStyle === 'rounded' || config.cornerStyle === 'circle' || config.cornerStyle === 'extra-rounded') {
      const radius = config.cornerStyle === 'circle' ? cornerSize / 2 : 
                    config.cornerStyle === 'extra-rounded' ? cornerSize / 3 : cornerSize / 6;
      
      // Apply rounded corners to the three finder patterns (simplified)
      const positions = [
        { x: 0, y: 0 },
        { x: canvas.width - cornerSize, y: 0 },
        { x: 0, y: canvas.height - cornerSize }
      ];

      positions.forEach(pos => {
        ctx.fillStyle = config.backgroundColor;
        ctx.fillRect(pos.x, pos.y, cornerSize, cornerSize);
        
        ctx.fillStyle = config.foregroundColor;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(pos.x + 2, pos.y + 2, cornerSize - 4, cornerSize - 4, radius);
        } else {
          // Fallback for browsers that don't support roundRect
          ctx.rect(pos.x + 2, pos.y + 2, cornerSize - 4, cornerSize - 4);
        }
        ctx.fill();
      });
    }
  };

  const applyFrameStyle = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const frameWidth = 20;
    
    switch (config.frameStyle) {
      case 'simple':
        ctx.strokeStyle = config.foregroundColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
        break;
      case 'scan-me':
        ctx.fillStyle = config.foregroundColor;
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
      // Add more frame styles as needed
    }
  };

  const addLogo = async (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise<void>((resolve) => {
        img.onload = () => {
          const logoSize = Math.min(canvas.width, canvas.height) * 0.2;
          const x = (canvas.width - logoSize) / 2;
          const y = (canvas.height - logoSize) / 2;
          
          // Add white background for logo
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(x - 5, y - 5, logoSize + 10, logoSize + 10);
          
          ctx.drawImage(img, x, y, logoSize, logoSize);
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