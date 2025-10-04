import React from 'react';
import { 
  Upload, 
  Palette, 
  Settings, 
  Crown, 
  Zap, 
  BarChart3,
  RefreshCw,
  Grid,
  Circle,
  Square,
  Type,
  Image as ImageIcon
} from 'lucide-react';

interface QRCustomization {
  pattern: 'grid' | 'dots' | 'rounded' | 'abstract';
  corners: 'rounded' | 'sharp' | 'custom';
  frame: 'square' | 'circle' | 'custom';
  colorMode: 'single' | 'dual' | 'gradient';
  foregroundColor: string;
  backgroundColor: string;
  gradientStart?: string;
  gradientEnd?: string;
  gradientDirection?: number;
  logo?: string;
  logoSize: number;
  centerText?: string;
  textColor?: string;
  size: number;
  format: 'PNG' | 'SVG' | 'PDF';
  transparentBackground: boolean;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  margin: number;
}

interface ColorPreset {
  name: string;
  foreground: string;
  background: string;
  gradient?: { start: string; end: string };
}

interface CreateQRTabProps {
  title: string;
  setTitle: (title: string) => void;
  url: string;
  setUrl: (url: string) => void;
  customization: QRCustomization;
  setCustomization: (customization: QRCustomization | ((prev: QRCustomization) => QRCustomization)) => void;
  trackingEnabled: boolean;
  setTrackingEnabled: (enabled: boolean) => void;
  isDynamic: boolean;
  setIsDynamic: (dynamic: boolean) => void;
  isPremium: boolean;
  isCreating: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  logoInputRef: React.RefObject<HTMLInputElement>;
  colorPresets: ColorPreset[];
  onLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onApplyPreset: (preset: ColorPreset) => void;
  onCreateQR: () => void;
}

const CreateQRTab: React.FC<CreateQRTabProps> = ({
  title,
  setTitle,
  url,
  setUrl,
  customization,
  setCustomization,
  trackingEnabled,
  setTrackingEnabled,
  isDynamic,
  setIsDynamic,
  isPremium,
  isCreating,
  canvasRef,
  logoInputRef,
  colorPresets,
  onLogoUpload,
  onApplyPreset,
  onCreateQR
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="xl:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                QR Code Title *
              </label>
              <input
                type="text"
                placeholder="My Awesome QR Code"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destination URL *
              </label>
              <input
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Style Options */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Palette className="w-5 h-5 mr-2" />
              Style Options
            </h3>
            
            {/* Pattern Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Pattern</label>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { value: 'grid', label: 'Grid', icon: Grid },
                  { value: 'dots', label: 'Dots', icon: Circle },
                  { value: 'rounded', label: 'Rounded', icon: Square },
                  { value: 'abstract', label: 'Abstract', icon: Settings, premium: true }
                ].map(({ value, label, icon: Icon, premium }) => (
                  <button
                    key={value}
                    onClick={() => {
                      if (premium && !isPremium) return;
                      setCustomization(prev => ({ ...prev, pattern: value as any }));
                    }}
                    disabled={premium && !isPremium}
                    className={`p-3 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                      customization.pattern === value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${premium && !isPremium ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{label}</span>
                    {premium && !isPremium && <Crown className="w-3 h-3 text-yellow-500" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Corner Style */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Corners</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'rounded', label: 'Rounded' },
                  { value: 'sharp', label: 'Sharp' },
                  { value: 'custom', label: 'Custom', premium: true }
                ].map(({ value, label, premium }) => (
                  <button
                    key={value}
                    onClick={() => {
                      if (premium && !isPremium) return;
                      setCustomization(prev => ({ ...prev, corners: value as any }));
                    }}
                    disabled={premium && !isPremium}
                    className={`p-2 border-2 rounded-lg text-sm font-medium transition-colors ${
                      customization.corners === value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${premium && !isPremium ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {label}
                    {premium && !isPremium && <Crown className="w-3 h-3 text-yellow-500 ml-1 inline" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Frame Style */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Frame</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'square', label: 'Square' },
                  { value: 'circle', label: 'Circle' },
                  { value: 'custom', label: 'Custom', premium: true }
                ].map(({ value, label, premium }) => (
                  <button
                    key={value}
                    onClick={() => {
                      if (premium && !isPremium) return;
                      setCustomization(prev => ({ ...prev, frame: value as any }));
                    }}
                    disabled={premium && !isPremium}
                    className={`p-2 border-2 rounded-lg text-sm font-medium transition-colors ${
                      customization.frame === value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${premium && !isPremium ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {label}
                    {premium && !isPremium && <Crown className="w-3 h-3 text-yellow-500 ml-1 inline" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Color Options */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Colors</h3>
            
            {/* Color Presets */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Popular Presets</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      if (preset.gradient && !isPremium) return;
                      onApplyPreset(preset);
                    }}
                    disabled={preset.gradient && !isPremium}
                    className={`p-3 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors hover:border-gray-300 ${
                      preset.gradient && !isPremium ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <div 
                      className="w-8 h-8 rounded border-2 border-white shadow-sm"
                      style={{
                        background: preset.gradient 
                          ? `linear-gradient(45deg, ${preset.gradient.start}, ${preset.gradient.end})`
                          : preset.foreground
                      }}
                    />
                    <span className="text-xs font-medium">{preset.name}</span>
                    {preset.gradient && !isPremium && <Crown className="w-3 h-3 text-yellow-500" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Mode */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Color Mode</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'single', label: 'Single Color' },
                  { value: 'dual', label: 'Dual Color' },
                  { value: 'gradient', label: 'Gradient', premium: true }
                ].map(({ value, label, premium }) => (
                  <button
                    key={value}
                    onClick={() => {
                      if (premium && !isPremium) return;
                      setCustomization(prev => ({ ...prev, colorMode: value as any }));
                    }}
                    disabled={premium && !isPremium}
                    className={`p-2 border-2 rounded-lg text-sm font-medium transition-colors ${
                      customization.colorMode === value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${premium && !isPremium ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {label}
                    {premium && !isPremium && <Crown className="w-3 h-3 text-yellow-500 ml-1 inline" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foreground Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={customization.foregroundColor}
                    onChange={(e) => setCustomization(prev => ({
                      ...prev,
                      foregroundColor: e.target.value
                    }))}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customization.foregroundColor}
                    onChange={(e) => setCustomization(prev => ({
                      ...prev,
                      foregroundColor: e.target.value
                    }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Background Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={customization.backgroundColor}
                    onChange={(e) => setCustomization(prev => ({
                      ...prev,
                      backgroundColor: e.target.value
                    }))}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customization.backgroundColor}
                    onChange={(e) => setCustomization(prev => ({
                      ...prev,
                      backgroundColor: e.target.value
                    }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Gradient Colors (Premium) */}
            {customization.colorMode === 'gradient' && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gradient Start
                  </label>
                  <input
                    type="color"
                    value={customization.gradientStart || '#3b82f6'}
                    onChange={(e) => setCustomization(prev => ({
                      ...prev,
                      gradientStart: e.target.value
                    }))}
                    disabled={!isPremium}
                    className="w-full h-10 border border-gray-300 rounded cursor-pointer disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gradient End
                  </label>
                  <input
                    type="color"
                    value={customization.gradientEnd || '#1e40af'}
                    onChange={(e) => setCustomization(prev => ({
                      ...prev,
                      gradientEnd: e.target.value
                    }))}
                    disabled={!isPremium}
                    className="w-full h-10 border border-gray-300 rounded cursor-pointer disabled:opacity-50"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Branding & Personalization */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Branding & Personalization</h3>
            
            {/* Logo Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Logo (PNG, JPG, SVG - Max 5MB)
              </label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Logo</span>
                </button>
                {customization.logo && (
                  <div className="flex items-center space-x-2">
                    <img 
                      src={customization.logo} 
                      alt="Logo preview" 
                      className="w-8 h-8 object-cover rounded border"
                    />
                    <button
                      onClick={() => setCustomization(prev => ({ ...prev, logo: undefined }))}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={onLogoUpload}
                className="hidden"
              />
            </div>

            {/* Logo Size */}
            {customization.logo && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo Size: {customization.logoSize}%
                </label>
                <input
                  type="range"
                  min="10"
                  max="40"
                  value={customization.logoSize}
                  onChange={(e) => setCustomization(prev => ({
                    ...prev,
                    logoSize: parseInt(e.target.value)
                  }))}
                  className="w-full"
                />
              </div>
            )}

            {/* Center Text */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Center Text (Brand name or initials)
              </label>
              <input
                type="text"
                placeholder="BRAND"
                value={customization.centerText || ''}
                onChange={(e) => setCustomization(prev => ({
                  ...prev,
                  centerText: e.target.value
                }))}
                maxLength={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          {/* Output Options */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Output Options</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File Format
                </label>
                <select
                  value={customization.format}
                  onChange={(e) => {
                    if ((e.target.value === 'SVG' || e.target.value === 'PDF') && !isPremium) return;
                    setCustomization(prev => ({
                      ...prev,
                      format: e.target.value as 'PNG' | 'SVG' | 'PDF'
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="PNG">PNG (Free)</option>
                  <option value="SVG" disabled={!isPremium}>SVG (Premium)</option>
                  <option value="PDF" disabled={!isPremium}>PDF (Premium)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Size
                </label>
                <select
                  value={customization.size}
                  onChange={(e) => setCustomization(prev => ({
                    ...prev,
                    size: parseInt(e.target.value)
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value={200}>200x200</option>
                  <option value={300}>300x300</option>
                  <option value={400}>400x400</option>
                  <option value={500}>500x500</option>
                  <option value={800}>800x800</option>
                  <option value={1000}>1000x1000</option>
                  <option value={2500}>2500x2500 (Max)</option>
                </select>
              </div>
            </div>

            {/* Advanced Options */}
            <div className="mt-4 space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="transparent"
                  checked={customization.transparentBackground}
                  onChange={(e) => {
                    if (e.target.checked && !isPremium) return;
                    setCustomization(prev => ({
                      ...prev,
                      transparentBackground: e.target.checked
                    }));
                  }}
                  disabled={!isPremium}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                />
                <label htmlFor="transparent" className="text-sm text-gray-700 flex items-center">
                  Transparent Background
                  {!isPremium && <Crown className="w-4 h-4 text-yellow-500 ml-1" />}
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="tracking"
                  checked={trackingEnabled}
                  onChange={(e) => {
                    if (e.target.checked && !isPremium) return;
                    setTrackingEnabled(e.target.checked);
                  }}
                  disabled={!isPremium}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                />
                <label htmlFor="tracking" className="text-sm text-gray-700 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Enable QR Scan Analytics
                  {!isPremium && <Crown className="w-4 h-4 text-yellow-500 ml-1" />}
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="dynamic"
                  checked={isDynamic}
                  onChange={(e) => {
                    if (e.target.checked && !isPremium) return;
                    setIsDynamic(e.target.checked);
                  }}
                  disabled={!isPremium}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                />
                <label htmlFor="dynamic" className="text-sm text-gray-700 flex items-center">
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Dynamic QR (Edit URL later)
                  {!isPremium && <Crown className="w-4 h-4 text-yellow-500 ml-1" />}
                </label>
              </div>
            </div>
          </div>

          {/* Create Button */}
          <button
            onClick={onCreateQR}
            disabled={!title.trim() || !url.trim() || isCreating}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating QR Code...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <Zap className="w-5 h-5" />
                <span>Create QR Code</span>
              </div>
            )}
          </button>
        </div>

        {/* Preview Section */}
        <div className="xl:col-span-1">
          <div className="sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h3>
            <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300">
              {url ? (
                <div className="text-center">
                  <canvas 
                    ref={canvasRef}
                    className="mx-auto border border-gray-200 rounded-lg shadow-sm"
                  />
                  <p className="text-sm text-gray-600 mt-3">
                    {customization.size}×{customization.size}px • {customization.format}
                  </p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Settings className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500">Enter URL to see preview</p>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            {url && (
              <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">QR Code Info</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Error Correction:</span>
                    <span className="font-medium">{customization.errorCorrectionLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Size:</span>
                    <span className="font-medium">
                      {customization.format === 'PNG' ? '~50KB' : '~10KB'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Scan Distance:</span>
                    <span className="font-medium">Up to 3 meters</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateQRTab;