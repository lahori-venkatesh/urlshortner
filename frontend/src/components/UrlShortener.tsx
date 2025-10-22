import React, { useState, useEffect } from 'react';
import { Link, QrCode, Upload, Copy, ExternalLink, Settings, Calendar, Lock, Eye, EyeOff, Zap, Sparkles, Shield, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import QRCodeGenerator from './QRCodeGenerator';
import { aiService, AliasSuggestion, SecurityCheck } from '../services/aiService';
import toast from 'react-hot-toast';
import { uploadFileToBackend, createShortUrl, createQrCode, getUserUrls, getUserFiles, getUserQrCodes } from '../services/api';
import SimpleFileUpload from './SimpleFileUpload';

interface ShortenedLink {
  id: string;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  qrCode?: string;
  clicks: number;
  createdAt: string;
  customDomain?: string;
  type?: 'url' | 'qr' | 'file';
}

const UrlShortener: React.FC = () => {
  console.log('=== UrlShortener component rendered ===');
  console.log('Current time:', new Date().toISOString());
  
  // Add global error handlers
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('=== GLOBAL ERROR HANDLER ===');
      console.error('Global error:', event.error);
      console.error('Message:', event.message);
      console.error('Filename:', event.filename);
      console.error('Line:', event.lineno);
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('=== UNHANDLED PROMISE REJECTION ===');
      console.error('Reason:', event.reason);
      console.error('Promise:', event.promise);
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
  
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'url' | 'qr' | 'file'>('url');
  const [urlInput, setUrlInput] = useState('');
  const [qrText, setQrText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customAlias, setCustomAlias] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('pebly.vercel.app');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [expirationDays, setExpirationDays] = useState<number | ''>('');
  const [maxClicks, setMaxClicks] = useState<number | ''>('');
  const [isOneTime, setIsOneTime] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shortenedLinks, setShortenedLinks] = useState<ShortenedLink[]>([]);
  
  // Load data from database on component mount
  useEffect(() => {
    loadDataFromDatabase();
  }, [user]);

  const loadDataFromDatabase = async () => {
    if (!user || !user.id) {
      console.log('No authenticated user, skipping database load');
      return;
    }

    try {
      console.log('Loading user data from database for user:', user.id);
      
      // Load URLs, files, and QR codes from database
      const [urlsResponse, filesResponse, qrResponse] = await Promise.all([
        getUserUrls(user.id).catch(e => ({ success: false, data: [] })),
        getUserFiles(user.id).catch(e => ({ success: false, data: [] })),
        getUserQrCodes(user.id).catch(e => ({ success: false, data: [] }))
      ]);

      const allLinks: ShortenedLink[] = [];

      // Add URLs
      if (urlsResponse.success) {
        urlsResponse.data.forEach((url: any) => {
          allLinks.push({
            id: url.id,
            shortCode: url.shortCode,
            shortUrl: url.shortUrl,
            originalUrl: url.originalUrl,
            clicks: url.totalClicks || 0,
            createdAt: url.createdAt,
            type: 'url'
          });
        });
      }

      // Add Files
      if (filesResponse.success) {
        filesResponse.data.forEach((file: any) => {
          allLinks.push({
            id: file.id,
            shortCode: file.fileCode,
            shortUrl: file.fileUrl,
            originalUrl: file.fileUrl,
            clicks: file.totalDownloads || 0,
            createdAt: file.uploadedAt,
            type: 'file'
          });
        });
      }

      // Add QR Codes
      if (qrResponse.success) {
        qrResponse.data.forEach((qr: any) => {
          allLinks.push({
            id: qr.id,
            shortCode: qr.qrCode,
            shortUrl: qr.qrImageUrl,
            originalUrl: qr.content,
            clicks: qr.totalScans || 0,
            createdAt: qr.createdAt,
            type: 'qr',
            qrCode: qr.qrImagePath
          });
        });
      }

      // Sort by creation date (newest first)
      allLinks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setShortenedLinks(allLinks);
      console.log(`Loaded ${allLinks.length} items from database`);
      
      if (allLinks.length > 0) {
        toast.success(`Loaded ${allLinks.length} items from database`);
      }

    } catch (error) {
      console.error('Failed to load data from database:', error);
      toast.error('Failed to load your data from database');
    }
  };
  
  // AI Features
  const [aiSuggestions, setAiSuggestions] = useState<AliasSuggestion[]>([]);
  const [securityCheck, setSecurityCheck] = useState<SecurityCheck | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [customDomains, setCustomDomains] = useState<string[]>(['pebly.vercel.app']);

  // Custom domains configuration (removed localStorage dependency)
  React.useEffect(() => {
    // Load custom domains from backend API in the future
    // For now, use default domain
    setCustomDomains(['pebly.vercel.app']);
  }, []);

  // AI-powered URL analysis
  React.useEffect(() => {
    const analyzeURL = async () => {
      const currentUrl = activeTab === 'url' ? urlInput : activeTab === 'qr' ? qrText : '';
      
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

    const timer = setTimeout(analyzeURL, 1000); // Debounce
    return () => clearTimeout(timer);
  }, [urlInput, qrText, activeTab]);

  const handleShorten = async () => {
    // Force console log to appear
    console.log('='.repeat(50));
    console.log('HANDLE SHORTEN CALLED');
    console.log('activeTab:', activeTab);
    console.log('selectedFile:', selectedFile);
    console.log('='.repeat(50));
    
    // Validation with alerts for debugging
    if (activeTab === 'url' && !urlInput.trim()) {
      console.log('URL validation failed');
      alert('URL validation failed');
      return;
    }
    if (activeTab === 'qr' && !qrText.trim()) {
      console.log('QR validation failed');
      alert('QR validation failed');
      return;
    }
    if (activeTab === 'file') {
      console.log('File tab - navigating to file-to-link section');
      window.location.href = '/dashboard?section=file-to-url';
      setIsLoading(false);
      return;
    }

    console.log('Validation passed, starting process...');
    alert('Starting upload process...');
    setIsLoading(true);

    try {
      // Get user ID from auth context
      let userId = user?.id || 'anonymous-user';
      
      if (!user?.id) {
        console.warn('No authenticated user found, using anonymous-user');
      }
      
      console.log('User from auth context:', user);
      console.log('Using userId for backend:', userId);
      
      console.log('Using userId:', userId);
      
      console.log('Skipping health check, proceeding directly to upload...');

      let result;
      let newLink: ShortenedLink | null = null;

      if (activeTab === 'url') {
        // Create shortened URL via backend API
        console.log('Creating short URL via backend API...');
        result = await createShortUrl({
          originalUrl: urlInput,
          userId,
          customAlias: customAlias || undefined,
          password: password || undefined,
          expirationDays: expirationDays ? parseInt(expirationDays.toString()) : undefined,
          title: `Short link for ${urlInput}`,
          description: 'Created via URL Shortener'
        });

        if (result.success) {
          newLink = {
            id: result.data.id,
            shortCode: result.data.shortCode,
            shortUrl: result.data.shortUrl,
            originalUrl: result.data.originalUrl,
            clicks: 0,
            createdAt: result.data.createdAt,
            type: 'url'
          };
          toast.success('URL shortened and stored in database!');
        } else {
          throw new Error(result.message || 'Failed to create short URL');
        }

      } else if (activeTab === 'qr') {
        // Create QR code via backend API
        console.log('Creating QR code via backend API...');
        result = await createQrCode({
          content: qrText,
          contentType: 'TEXT',
          userId,
          title: `QR Code for ${qrText}`,
          description: 'Created via QR Generator'
        });

        if (result.success) {
          newLink = {
            id: result.data.id,
            shortCode: result.data.qrCode,
            shortUrl: result.data.qrImageUrl,
            originalUrl: result.data.content,
            clicks: 0,
            createdAt: result.data.createdAt,
            type: 'qr',
            qrCode: result.data.qrImagePath
          };
          toast.success('QR Code created and stored in database!');
        } else {
          throw new Error(result.message || 'Failed to create QR code');
        }

      }

      console.log('=== FINAL PROCESSING ===');
      console.log('Backend result:', result);
      console.log('Created link:', newLink);
      console.log('newLink exists:', !!newLink);

      // Add to local state for immediate UI update (only if newLink was created)
      if (newLink) {
        console.log('Adding newLink to state...');
        setShortenedLinks(prev => {
          const updatedLinks = [newLink!, ...prev];
          console.log('Updated links array:', updatedLinks);
          return updatedLinks;
        });
        console.log('Successfully added to state');
        
        // Reload data from database to ensure consistency
        if (user?.id) {
          loadDataFromDatabase();
        }
      } else {
        console.error('newLink is null/undefined, cannot add to state');
        throw new Error('Failed to create link object');
      }
      
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
      
    } catch (error) {
      console.error('=== ERROR IN HANDLE SHORTEN ===');
      console.error('Error type:', typeof error);
      console.error('Error object:', error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // Force the error to be visible
      alert(`ERROR CAUGHT: ${error instanceof Error ? error.message : String(error)}`);
      
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while processing your request';
      toast.error(`Failed to create link: ${errorMessage}`);
    } finally {
      console.log('=== FINALLY BLOCK EXECUTED ===');
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Import toast dynamically to avoid issues
      const { toast } = await import('react-hot-toast');
      toast.success('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      const { toast } = await import('react-hot-toast');
      toast.success('Link copied to clipboard!');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('=== FILE SELECTION ===');
    console.log('Input event:', e);
    console.log('Files:', e.target.files);
    const file = e.target.files?.[0];
    console.log('Selected file:', file);
    if (file) {
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      setSelectedFile(file);
      console.log('File set in state');
      alert(`File selected: ${file.name}`);
    } else {
      console.log('No file selected');
      alert('No file selected');
    }
  };

  // Simple file upload function that definitely works
  const simpleFileUpload = async () => {
    console.log('=== SIMPLE FILE UPLOAD STARTED ===');
    alert('Simple file upload started');
    
    if (!selectedFile) {
      alert('No file selected!');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('userId', 'simple-test-user');
      formData.append('title', selectedFile.name);
      formData.append('isPublic', 'true');

      console.log('Making simple fetch request...');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
      const response = await fetch(`${apiUrl}/v1/files/upload`, {
        method: 'POST',
        body: formData
      });

      console.log('Response received:', response.status);
      const result = await response.json();
      console.log('Result:', result);

      if (result.success) {
        alert(`SUCCESS! File uploaded: ${result.data.fileUrl}`);
        
        // Add to state
        const newLink = {
          id: result.data.id,
          shortCode: result.data.fileCode,
          shortUrl: result.data.fileUrl,
          originalUrl: result.data.fileUrl,
          clicks: 0,
          createdAt: result.data.uploadedAt,
          type: 'file' as const
        };
        
        setShortenedLinks(prev => [newLink, ...prev]);
        toast.success('File uploaded successfully!');
      } else {
        alert(`FAILED: ${result.message}`);
      }
    } catch (error) {
      console.error('Simple upload error:', error);
      alert(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Free User Ad Banner */}
      {user?.plan === 'free' && (
        <motion.div 
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Zap className="w-5 h-5" />
              <div>
                <p className="font-semibold">Upgrade to Premium</p>
                <p className="text-sm opacity-90">Remove ads, get advanced analytics, and unlock all features</p>
              </div>
            </div>
            <button className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Upgrade Now
            </button>
          </div>
        </motion.div>
      )}

      {/* Main Shortener Card */}
      <motion.div 
        className="bg-white rounded-2xl shadow-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Short Links</h2>
        
        {/* Tab Navigation */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-100 p-1 rounded-lg flex">
            <button
              onClick={() => setActiveTab('url')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'url'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Link className="w-4 h-4 inline mr-2" />
              URL Shortener
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'qr'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <QrCode className="w-4 h-4 inline mr-2" />
              QR Code
            </button>
            <button
              onClick={() => setActiveTab('file')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'file'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              File to Link
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {activeTab === 'url' && (
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

          {activeTab === 'qr' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter text or URL for QR code
              </label>
              <input
                type="text"
                placeholder="Enter text, URL, or any content..."
                value={qrText}
                onChange={(e) => setQrText(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {activeTab === 'file' && (
            <div className="text-center py-8">
              <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-lg p-6">
                <Upload className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">File to Link Creation</h3>
                <p className="text-gray-600 mb-4">
                  Upload files and create shareable links with advanced features
                </p>
                <button
                  onClick={() => {
                    // Navigate to dashboard file section
                    window.location.href = '/dashboard?section=file-to-url';
                  }}
                  className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center space-x-2 mx-auto"
                >
                  <Upload className="w-4 h-4" />
                  <span>Go to File to Link</span>
                </button>
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
              {securityCheck.reasons.length > 0 && (
                <ul className="mt-2 text-sm text-gray-600">
                  {securityCheck.reasons.map((reason, index) => (
                    <li key={index}>• {reason}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Advanced Settings */}
          <div className="border-t pt-4">
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
                  {customAlias && (
                    <p className="text-xs text-gray-500 mt-1">
                      Preview: {selectedDomain}/{customAlias}
                    </p>
                  )}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Clicks
                  </label>
                  <input
                    type="number"
                    placeholder="Unlimited"
                    value={maxClicks}
                    onChange={(e) => setMaxClicks(e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isOneTime}
                      onChange={(e) => setIsOneTime(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">One-time use link (self-destruct after first click)</span>
                  </label>
                </div>
              </motion.div>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={(e) => {
              console.log('=== BUTTON CLICKED ===');
              console.log('Event:', e);
              console.log('activeTab:', activeTab);
              console.log('selectedFile:', selectedFile);
              console.log('isLoading:', isLoading);
              console.log('Button disabled:', isLoading || (activeTab === 'url' && !urlInput.trim()) || (activeTab === 'qr' && !qrText.trim()) || (activeTab === 'file' && !selectedFile));
              handleShorten();
            }}
            disabled={isLoading || (activeTab === 'url' && !urlInput.trim()) || (activeTab === 'qr' && !qrText.trim()) || (activeTab === 'file')}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {activeTab === 'url' ? 'Shortening...' : activeTab === 'qr' ? 'Generating...' : 'Processing...'}
              </div>
            ) : (
              <>
                {activeTab === 'url' ? 'Shorten URL' : activeTab === 'qr' ? 'Generate QR Code' : 'Go to File Upload'}
              </>
            )}
          </button>
          
          {/* Backend Test Button */}
          <button
            onClick={async () => {
              console.log('=== TESTING BACKEND CONNECTIVITY ===');
              try {
                const response = await fetch('http://localhost:8080/api/v1/urls', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    originalUrl: 'https://test-frontend-connectivity.com',
                    userId: user?.id || 'test-user',
                    title: 'Frontend Connectivity Test',
                    description: 'Testing if frontend can reach backend'
                  })
                });
                
                const result = await response.json();
                console.log('Backend test result:', result);
                
                if (result.success) {
                  alert('✅ Backend connectivity test PASSED! Data saved to MongoDB.');
                  // Reload data to show the new entry
                  loadDataFromDatabase();
                } else {
                  alert('❌ Backend test failed: ' + result.message);
                }
              } catch (error: any) {
                console.error('Backend test error:', error);
                alert('❌ Backend connectivity test FAILED: ' + (error.message || String(error)));
              }
            }}
            className="w-full mt-2 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition-all"
          >
            🔗 Test Backend Connection
          </button>
          
          {/* Refresh Data Button */}
          <button
            onClick={() => {
              console.log('=== REFRESHING DATA FROM DATABASE ===');
              loadDataFromDatabase();
            }}
            className="w-full mt-2 bg-purple-500 text-white py-2 rounded-lg font-semibold hover:bg-purple-600 transition-all"
          >
            🔄 Refresh from Database
          </button>

          {/* Simple Upload Button for File Tab */}
          {activeTab === 'file' && (
            <button
              onClick={simpleFileUpload}
              disabled={!selectedFile}
              className="w-full mt-2 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition-all disabled:opacity-50"
            >
              📤 Simple File Upload (Working Version)
            </button>
          )}
          
          {/* Debug Button for File Upload */}
          {activeTab === 'file' && (
            <button
              onClick={async () => {
                console.log('=== DEBUG BUTTON CLICKED ===');
                console.log('selectedFile:', selectedFile);
                if (!selectedFile) {
                  alert('Please select a file first');
                  return;
                }
                
                try {
                  const formData = new FormData();
                  formData.append('file', selectedFile);
                  formData.append('userId', 'debug-user');
                  formData.append('title', 'Debug Upload');
                  formData.append('isPublic', 'true');
                  
                  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
                  const response = await fetch(`${apiUrl}/v1/files/upload`, {
                    method: 'POST',
                    body: formData
                  });
                  
                  const result = await response.json();
                  console.log('Debug upload result:', result);
                  alert(`Debug upload ${result.success ? 'SUCCESS' : 'FAILED'}: ${JSON.stringify(result)}`);
                } catch (error: any) {
                  console.error('Debug upload error:', error);
                  alert(`Debug upload ERROR: ${error.message || String(error)}`);
                }
              }}
              className="w-full mt-2 bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600 transition-all"
            >
              🐛 Debug Upload Test
            </button>
          )}
        </div>
      </motion.div>

      {/* Results */}
      {shortenedLinks.length > 0 && (
        <motion.div 
          className="bg-white rounded-2xl shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4">Your Links</h3>
          <div className="space-y-4">
            {shortenedLinks.map((link) => (
              <div key={link.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Original: {link.originalUrl}</p>
                    <div className="flex items-center space-x-2">
                      <code className="text-blue-600 font-mono">{link.shortUrl}</code>
                      <button
                        onClick={() => copyToClipboard(link.shortUrl)}
                        className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => window.open(link.shortUrl, '_blank')}
                        className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded"
                        title="Open link"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{link.clicks} clicks</p>
                    <p className="text-xs text-gray-400">{new Date(link.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                
                {activeTab === 'qr' && (
                  <div className="mt-3 flex justify-center">
                    <QRCodeGenerator value={link.shortUrl} size={128} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default UrlShortener;