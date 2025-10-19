import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';

const QRTestComponent: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [testUrl, setTestUrl] = useState('https://example.com/test');

  const generateTestQR = async () => {
    if (!canvasRef.current) {
      toast.error('Canvas not ready');
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log('Testing QR generation...');
      const QRCode = await import('qrcode');
      
      await QRCode.toCanvas(canvasRef.current, testUrl, {
        width: 200,
        margin: 4,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      
      console.log('Test QR generated successfully!');
      toast.success('Test QR generated!');
    } catch (error) {
      console.error('Test QR failed:', error);
      toast.error('Test QR failed: ' + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-md mx-auto">
      <h3 className="text-lg font-bold mb-4">QR Code Test</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Test URL:</label>
        <input
          type="text"
          value={testUrl}
          onChange={(e) => setTestUrl(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>
      
      <button
        onClick={generateTestQR}
        disabled={isGenerating}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-4"
      >
        {isGenerating ? 'Generating...' : 'Generate Test QR'}
      </button>
      
      <div className="flex justify-center">
        <canvas 
          ref={canvasRef}
          className="border border-gray-300 rounded-lg"
          style={{ maxWidth: '200px', maxHeight: '200px' }}
        />
      </div>
    </div>
  );
};

export default QRTestComponent;