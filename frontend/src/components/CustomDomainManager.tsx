import React, { useState, useEffect } from 'react';
import { Globe, Plus, CheckCircle, AlertCircle, Clock, Settings, Trash2, Copy, ExternalLink, Shield, RefreshCw, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useUpgradeModal } from '../context/ModalContext';
import { subscriptionService, UserPlanInfo } from '../services/subscriptionService';
import axios from 'axios';
import toast from 'react-hot-toast';
import CustomDomainOnboarding from './CustomDomainOnboarding';
// Removed unused import - UpgradeModal is now global

interface CustomDomain {
  id: string;
  domainName: string;
  ownerType: string;
  ownerId: string;
  status: 'RESERVED' | 'PENDING' | 'VERIFIED' | 'ERROR' | 'SUSPENDED';
  sslStatus: 'PENDING' | 'ACTIVE' | 'ERROR' | 'EXPIRED';
  cnameTarget: string;
  verificationToken: string;
  reservedUntil?: string;
  verificationAttempts: number;
  lastVerificationAttempt?: string;
  verificationError?: string;
  sslProvider?: string;
  sslIssuedAt?: string;
  sslExpiresAt?: string;
  sslError?: string;
  isBlacklisted: boolean;
  blacklistReason?: string;
  totalRedirects: number;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
}

interface DomainTransferRequest {
  domainId: string;
  targetOwnerType: string;
  targetOwnerId: string;
  reason?: string;
  migrateLinks?: boolean;
}

interface CustomDomainManagerProps {
  ownerType?: 'USER' | 'TEAM';
  ownerId?: string;
}

const CustomDomainManager: React.FC<CustomDomainManagerProps> = ({ 
  ownerType = 'USER', 
  ownerId 
}) => {
  // Add immediate console log to verify component is being called
  console.log('🚀 CustomDomainManager component started rendering');
  
  const { user, token } = useAuth();
  console.log('🔍 Auth data:', { user: !!user, token: !!token, userPlan: user?.plan });
  
  const featureAccess = useFeatureAccess(user);
  console.log('🔍 Feature access:', { canUseCustomDomain: featureAccess.canUseCustomDomain });
  
  const upgradeModal = useUpgradeModal();
  const [userPlan, setUserPlan] = useState<UserPlanInfo | null>(null);
  
  // Use centralized policy for custom domain access
  const hasCustomDomainAccess = featureAccess.canUseCustomDomain;
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [verificationMethod, setVerificationMethod] = useState<'dns' | 'file'>('dns');
  const [showVerificationModal, setShowVerificationModal] = useState<CustomDomain | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

  // Debug logging for custom domain access
  useEffect(() => {
    console.log('🔍 CustomDomainManager - Debug Info:', {
      userPlan: user?.plan,
      subscriptionPlan: user?.subscriptionPlan,
      hasCustomDomainAccess,
      featureAccess: {
        canUseCustomDomain: featureAccess.canUseCustomDomain,
        isFree: featureAccess.isFree,
        isPaid: featureAccess.isPaid,
        limits: featureAccess.limits
      },
      domainsCount: domains.length,
      isLoading,
      showOnboarding
    });
  }, [user, hasCustomDomainAccess, featureAccess, domains.length, isLoading, showOnboarding]);

  // Handle Add Custom Domain button click with centralized policy
  const handleAddCustomDomain = () => {
    console.log('🔍 Add Custom Domain clicked - Using centralized policy');
    
    const verifiedDomainCount = domains.filter(d => d.status === 'VERIFIED').length;
    
    console.log('🔍 Policy Check:', {
      userPlan: user?.plan,
      verifiedDomainCount,
      canUseCustomDomain: featureAccess.canUseCustomDomain,
      canAddDomain: featureAccess.canAddDomain(verifiedDomainCount),
      domainLimit: featureAccess.domainLimit
    });
    
    // 🚫 FREE user - show upgrade modal via context
    if (!featureAccess.canUseCustomDomain) {
      console.log('✅ FREE user - showing upgrade modal via context');
      upgradeModal.open(
        'Custom Domains',
        'Use your own branded domains for professional short links with SSL certificates included.',
        false
      );
      return;
    }
    
    // 🟡 Has feature but reached limit
    if (!featureAccess.canAddDomain(verifiedDomainCount)) {
      if (user?.plan === 'PRO') {
        console.log('✅ PRO user at limit - showing upgrade modal for Business via context');
        upgradeModal.open(
          'Upgrade to Business for more domains',
          'Get up to 3 custom domains and advanced team features with our Business plan.',
          true
        );
      } else {
        console.log('✅ BUSINESS user at limit - showing limit message');
        toast.error(featureAccess.getUpgradeReason('Custom Domains', verifiedDomainCount));
      }
      return;
    }
    
    // ✅ Can add domain - check if they have existing domains
    const hasExistingDomains = domains && domains.length > 0;
    
    if (!hasExistingDomains) {
      console.log('✅ User with no domains - showing onboarding');
      setShowOnboarding(true);
    } else {
      console.log('✅ User with existing domains - showing domain management');
      setIsAddingDomain(true);
    }
  };

  // Load user plan and domains from backend API
  useEffect(() => {
    if (user && token) {
      loadUserPlan();
      
      // Only load domains if user has access to custom domains
      if (hasCustomDomainAccess) {
        loadDomainsFromBackend();
      } else {
        console.log('User does not have custom domain access, skipping domain load');
        setIsLoading(false);
        setDomains([]);
      }
      
      // Add timeout fallback to prevent infinite loading
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          console.warn('⚠️ Loading timeout reached, forcing loading to false');
          setIsLoading(false);
          toast.error('Loading took too long. Please refresh the page if domains are not visible.');
        }
      }, 10000); // 10 second timeout
      
      return () => clearTimeout(timeoutId);
    } else {
      // If no user or token, don't show loading
      console.log('No user or token available, setting loading to false');
      setIsLoading(false);
      setDomains([]);
    }
    
    // Check for onboarding trigger from URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'onboard' && hasCustomDomainAccess) {
      setShowOnboarding(true);
    }
  }, [user, token, ownerType, ownerId, hasCustomDomainAccess]);

  const loadUserPlan = async () => {
    if (!user?.id) return;
    
    try {
      const planInfo = await subscriptionService.getUserPlan(user.id);
      setUserPlan(planInfo);
    } catch (error) {
      console.error('Failed to load user plan:', error);
      // Fallback to checking subscription plan from user object
      setUserPlan(null);
    }
  };

  const loadDomainsFromBackend = async () => {
    try {
      console.log('🔍 Loading domains from backend...');
      console.log('API_BASE_URL:', API_BASE_URL);
      console.log('Token available:', !!token);
      console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'null');
      console.log('User ID:', user?.id);
      console.log('User plan:', user?.plan);
      
      setIsLoading(true);
      
      // Check if we have authentication
      if (!token) {
        console.error('❌ No authentication token available');
        setDomains([]);
        toast.error('Please log in to view custom domains.');
        return;
      }
      
      const params = new URLSearchParams();
      if (ownerType !== 'USER') {
        params.append('ownerType', ownerType);
        params.append('ownerId', ownerId || '');
      }

      const url = `${API_BASE_URL}/v1/domains/my?${params}`;
      console.log('Making request to:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      let responseData;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        const textData = await response.text();
        console.log('Non-JSON response:', textData);
        responseData = { success: false, message: 'Invalid response format', rawResponse: textData };
      }

      console.log('Domains API response:', responseData);

      if (response.ok && responseData.success) {
        setDomains(responseData.domains || []);
        console.log('✅ Domains loaded successfully:', responseData.domains?.length || 0);
        
        // Show helpful messages for different scenarios
        if (responseData.repositoryStatus === 'not_available') {
          toast('Custom domains feature is being deployed. Please try again in a few minutes.', {
            icon: 'ℹ️',
            duration: 4000,
          });
        } else if (responseData.domains.length === 0) {
          console.log('No domains found for user');
        }
      } else if (response.status === 404) {
        console.error('❌ Custom domains endpoint not found (404)');
        setDomains([]);
        toast.error('Custom domains feature is not available. The backend may need to be updated.');
      } else if (response.status === 401) {
        console.error('❌ Authentication failed (401)');
        setDomains([]);
        toast.error('Authentication failed. Please log in again.');
        // Optionally trigger re-authentication
        // logout();
      } else if (response.status === 403) {
        console.error('❌ Access forbidden (403)');
        setDomains([]);
        if (responseData.message && responseData.message.includes('PRO')) {
          toast.error('Custom domains require a PRO or BUSINESS plan. Please upgrade your account.');
        } else {
          toast.error('Access denied. You may not have permission to view custom domains.');
        }
      } else if (response.status === 500) {
        console.error('❌ Server error (500):', responseData);
        setDomains([]);
        
        // More specific error handling for 500 errors
        if (responseData.message && responseData.message.includes('repository')) {
          toast.error('Custom domains database is not ready. Please try again in a few minutes.');
        } else {
          toast.error(`Server error: ${responseData.message || 'Internal server error'}`);
        }
      } else {
        console.error('❌ Failed to load domains:', responseData.message || 'Unknown error');
        setDomains([]);
        toast.error(`Failed to load domains: ${responseData.message || 'Server error'}`);
      }
    } catch (error: any) {
      console.error('❌ Failed to load domains from backend:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      setDomains([]);
      
      // More specific error messages
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast.error('Network error: Unable to connect to the server. Please check your internet connection.');
      } else if (error.message.includes('CORS')) {
        toast.error('CORS error: The server is not allowing requests from this domain.');
      } else if (error.message.includes('Failed to fetch')) {
        toast.error('Network error: Unable to reach the server. Please check your connection.');
      } else {
        toast.error(`Failed to load custom domains: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
      console.log('🔍 Loading complete, isLoading set to false');
    }
  };

  const addDomain = async () => {
    if (!newDomain.trim()) return;

    const domainName = newDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    // Validate domain format
    if (!isValidDomain(domainName)) {
      toast.error('Please enter a valid domain name');
      return;
    }

    // Check if domain already exists
    if (domains.some(d => d.domainName === domainName)) {
      toast.error('Domain already exists');
      return;
    }

    try {
      const requestData = {
        domainName,
        ownerType,
        ownerId: ownerId || user?.id
      };

      const response = await axios.post(`${API_BASE_URL}/v1/domains`, requestData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const newCustomDomain = response.data.domain;
        setDomains(prev => [...prev, newCustomDomain]);
        setNewDomain('');
        setIsAddingDomain(false);
        setShowVerificationModal(newCustomDomain);

        toast.success('Domain reserved! Please complete DNS verification.');
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('custom-domain-added', { 
          detail: newCustomDomain 
        }));
      } else {
        toast.error(response.data.message || 'Failed to add domain');
      }
    } catch (error: any) {
      console.error('Failed to add domain:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add domain. Please try again.';
      toast.error(errorMessage);
    }
  };



  const isValidDomain = (domain: string): boolean => {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
    return domainRegex.test(domain) && domain.includes('.');
  };

  const verifyDomain = async (domainId: string) => {
    const domain = domains.find(d => d.id === domainId);
    if (!domain) return;

    try {
      setIsVerifying(domainId);
      
      const response = await axios.post(`${API_BASE_URL}/v1/domains/verify?domainId=${domainId}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        // Update the domain in state
        setDomains(prev => prev.map(d => 
          d.id === domainId ? { ...d, ...response.data.domain } : d
        ));

        if (response.data.verified) {
          toast.success('Domain verified successfully! SSL certificate is being provisioned.');
        } else {
          toast('Verification in progress. Please ensure CNAME record is correctly configured.', {
            icon: 'ℹ️',
            duration: 4000,
          });
        }
      } else {
        toast.error(response.data.message || 'Verification failed');
      }
    } catch (error: any) {
      console.error('Failed to verify domain:', error);
      const errorMessage = error.response?.data?.message || 'Verification failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsVerifying(null);
    }
  };

  const deleteDomain = async (domainId: string) => {
    const domain = domains.find(d => d.id === domainId);
    if (!domain) return;

    if (domain.totalRedirects > 0) {
      toast.error(`Cannot delete domain with ${domain.totalRedirects} active redirects`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${domain.domainName}? This action cannot be undone.`)) {
      return;
    }

    try {
      // Note: Delete endpoint would need to be implemented in backend
      // For now, we'll just remove from local state
      setDomains(prev => prev.filter(d => d.id !== domainId));

      toast.success('Domain deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete domain:', error);
      toast.error('Failed to delete domain. Please try again.');
    }
  };

  const refreshDomainStatus = async (domainId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/v1/domains/${domainId}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setDomains(prev => prev.map(d => 
          d.id === domainId ? { ...d, ...response.data.domain } : d
        ));
      }
    } catch (error) {
      console.error('Failed to refresh domain status:', error);
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

  const getStatusIcon = (domain: CustomDomain) => {
    if (isVerifying === domain.id) {
      return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
    }
    
    switch (domain.status) {
      case 'VERIFIED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'ERROR':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'SUSPENDED':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (domain: CustomDomain) => {
    if (isVerifying === domain.id) {
      return 'Verifying...';
    }
    
    switch (domain.status) {
      case 'VERIFIED':
        return domain.sslStatus === 'ACTIVE' ? 'Active & Secured' : 'Verified';
      case 'ERROR':
        return 'Verification Failed';
      case 'PENDING':
        return 'Pending Verification';
      case 'SUSPENDED':
        return 'Suspended';
      case 'RESERVED':
        return 'Reserved';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (domain: CustomDomain) => {
    switch (domain.status) {
      case 'VERIFIED':
        return domain.sslStatus === 'ACTIVE' ? 'text-green-600' : 'text-blue-600';
      case 'ERROR':
        return 'text-red-600';
      case 'PENDING':
        return 'text-yellow-600';
      case 'SUSPENDED':
        return 'text-red-700';
      default:
        return 'text-gray-600';
    }
  };

  // Add loading state check with timeout fallback
  if (isLoading && domains.length === 0) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-blue-500 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">Loading custom domains...</p>
            <p className="text-xs text-gray-400 mt-2">
              If this takes too long, please refresh the page
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Debug Info - Always show for troubleshooting */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm mb-4">
        <div className="flex items-center justify-between">
          <div>
            <strong>Debug Info:</strong> Plan: {user?.plan}, HasAccess: {hasCustomDomainAccess.toString()}, 
            Domains: {domains.length}, Loading: {isLoading.toString()}, API: {API_BASE_URL}
            <br />
            <span className="text-xs text-gray-600">
              Token: {token ? '✅ Available' : '❌ Missing'} | 
              User: {user?.email || 'Not logged in'} | 
              Auth: {user ? '✅ Authenticated' : '❌ Not authenticated'}
            </span>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={loadDomainsFromBackend}
              disabled={isLoading}
              className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Retry Load'}
            </button>
            <button 
              onClick={() => {
                console.log('=== Manual Debug Info ===');
                console.log('User:', user);
                console.log('Token:', token ? token.substring(0, 20) + '...' : 'null');
                console.log('API_BASE_URL:', API_BASE_URL);
                console.log('hasCustomDomainAccess:', hasCustomDomainAccess);
                console.log('domains:', domains);
                console.log('isLoading:', isLoading);
                console.log('featureAccess:', featureAccess);
              }}
              className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
            >
              Log Debug
            </button>
            <button 
              onClick={async () => {
                try {
                  console.log('=== Testing API Connection ===');
                  
                  // Test 1: Health check
                  const healthUrl = `${API_BASE_URL}/v1/domains/health`;
                  console.log('Testing health:', healthUrl);
                  const healthResponse = await fetch(healthUrl);
                  const healthData = await healthResponse.json();
                  console.log('Health response:', healthData);
                  
                  // Test 2: Auth test
                  if (token) {
                    const domainsUrl = `${API_BASE_URL}/v1/domains/my`;
                    console.log('Testing domains with auth:', domainsUrl);
                    const domainsResponse = await fetch(domainsUrl, {
                      headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      }
                    });
                    const domainsData = await domainsResponse.json();
                    console.log('Domains response:', domainsResponse.status, domainsData);
                    
                    if (domainsResponse.ok && domainsData.success) {
                      toast.success(`API test successful! Found ${domainsData.domains?.length || 0} domains.`);
                    } else {
                      toast.error(`API test failed: ${domainsData.message || 'Unknown error'}`);
                    }
                  } else {
                    toast.error('No authentication token available for testing');
                  }
                } catch (error: any) {
                  console.error('API test failed:', error);
                  toast.error(`API test failed: ${error.message || 'Unknown error'}`);
                }
              }}
              className="px-3 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600"
            >
              Test API
            </button>
          </div>
        </div>
      </div>

      {/* Error State - Show if not loading and no domains but has access */}
      {!isLoading && domains.length === 0 && hasCustomDomainAccess && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <h3 className="font-medium text-red-900">Unable to load custom domains</h3>
                <p className="text-sm text-red-700">There was an issue loading your domains. This might be a temporary backend issue.</p>
                <p className="text-xs text-red-600 mt-1">
                  💡 Try: Refresh page, check internet connection, or start fresh with onboarding
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowOnboarding(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Add Domain
              </button>
              <button
                onClick={loadDomainsFromBackend}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Prompt for Free Users */}
      {!hasCustomDomainAccess && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Globe className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Unlock Custom Domains</h3>
                <p className="text-purple-100 mt-1">
                  Use your own branded domains like go.yourbrand.com for professional short links
                </p>
                <div className="flex items-center space-x-4 mt-3 text-sm">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>Professional branding</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>SSL certificates included</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>Advanced analytics</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <button
                onClick={() => window.location.href = '/pricing'}
                className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Upgrade to Pro
              </button>
              <p className="text-purple-100 text-sm mt-2">Starting at $9/month</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Globe className="w-6 h-6 mr-2" />
              Custom Domains
              {!hasCustomDomainAccess && (
                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full ml-2 font-medium">
                  PRO FEATURE
                </span>
              )}
            </h2>
            <p className="text-gray-600 mt-1">
              Use your own branded domains for short links
            </p>
          </div>
          <button
            onClick={handleAddCustomDomain}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Domain
          </button>
        </div>

        {/* Add Domain Form */}
        {isAddingDomain && hasCustomDomainAccess && (
          <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50">
            <h3 className="font-semibold text-gray-900 mb-4">Add New Domain</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domain Name
                </label>
                <input
                  type="text"
                  placeholder="example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Method
                </label>
                <select
                  value={verificationMethod}
                  onChange={(e) => setVerificationMethod(e.target.value as 'dns' | 'file')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="dns">DNS Record</option>
                  <option value="file">File Upload</option>
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-3 mt-4">
              <button
                onClick={addDomain}
                disabled={!newDomain.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Add Domain
              </button>
              <button
                onClick={() => {
                  setIsAddingDomain(false);
                  setNewDomain('');
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Domains List */}
        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-blue-500 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">Loading domains...</p>
          </div>
        ) : domains.length === 0 ? (
          <div className="text-center py-12">
            <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No custom domains</h3>
            {hasCustomDomainAccess ? (
              <div>
                <p className="text-gray-500 mb-4">Add your first custom domain to get started</p>
                <button
                  onClick={() => setShowOnboarding(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center space-x-2"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Add Your First Domain</span>
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Simple 3-step process • Takes 2-5 minutes • SSL included
                </p>
              </div>
            ) : (
              <div>
                <p className="text-gray-500 mb-4">Custom domains are available with Pro and Business plans</p>
                <button
                  onClick={() => upgradeModal.open(
                    'Custom Domains',
                    'Use your own branded domains for professional short links with SSL certificates included.',
                    false
                  )}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  View Plans
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {domains.map((domain) => (
              <div key={domain.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(domain)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">{domain.domainName}</h3>
                        {domain.sslStatus === 'ACTIVE' && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                            <Shield className="w-3 h-3 mr-1" />
                            SSL
                          </span>
                        )}
                        {domain.isBlacklisted && (
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                            Blocked
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        <span className={getStatusColor(domain)}>{getStatusText(domain)}</span>
                        {' • '}
                        {domain.totalRedirects} redirects
                        {' • '}
                        Added {new Date(domain.createdAt).toLocaleDateString()}
                      </p>
                      {domain.verificationError && (
                        <p className="text-xs text-red-600 mt-1">
                          Error: {domain.verificationError}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {(domain.status === 'RESERVED' || domain.status === 'PENDING') && (
                      <button
                        onClick={() => setShowVerificationModal(domain)}
                        className="text-blue-600 hover:text-blue-800 px-3 py-1 text-sm border border-blue-600 rounded hover:bg-blue-50 transition-colors"
                      >
                        Setup
                      </button>
                    )}
                    {domain.status === 'ERROR' && (
                      <button
                        onClick={() => verifyDomain(domain.id)}
                        disabled={isVerifying === domain.id}
                        className="text-yellow-600 hover:text-yellow-800 px-3 py-1 text-sm border border-yellow-600 rounded hover:bg-yellow-50 transition-colors disabled:opacity-50"
                      >
                        {isVerifying === domain.id ? 'Retrying...' : 'Retry'}
                      </button>
                    )}
                    <button
                      onClick={() => refreshDomainStatus(domain.id)}
                      className="text-gray-600 hover:text-gray-800 p-1 hover:bg-gray-50 rounded transition-colors"
                      title="Refresh status"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteDomain(domain.id)}
                      className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                      title="Delete domain"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verification Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Verify Domain: {showVerificationModal.domainName}
              </h3>
              <button
                onClick={() => setShowVerificationModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">DNS Verification</h4>
                <p className="text-blue-800 text-sm mb-4">
                  Add the following CNAME record to your domain's DNS settings:
                </p>
                
                <div className="bg-white rounded border p-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Type:</span>
                      <div className="font-mono">CNAME</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Name:</span>
                      <div className="font-mono break-all">{showVerificationModal.domainName}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">TTL:</span>
                      <div className="font-mono">Auto</div>
                    </div>
                    <div className="md:col-span-3">
                      <span className="font-medium text-gray-600">Value:</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <code className="flex-1 bg-gray-100 p-2 rounded text-xs break-all">
                          {showVerificationModal.cnameTarget}
                        </code>
                        <button
                          onClick={() => copyToClipboard(showVerificationModal.cnameTarget)}
                          className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-100 rounded"
                          title="Copy value"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">Verification Token</h4>
                <p className="text-green-800 text-sm mb-2">
                  Your unique verification token:
                </p>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-white p-2 rounded text-sm font-mono border">
                    {showVerificationModal.verificationToken}
                  </code>
                  <button
                    onClick={() => copyToClipboard(showVerificationModal.verificationToken)}
                    className="text-green-600 hover:text-green-800 p-1 hover:bg-green-100 rounded"
                    title="Copy token"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">Important Notes</h4>
                <ul className="text-yellow-800 text-sm space-y-1">
                  <li>• DNS changes can take up to 24 hours to propagate</li>
                  <li>• Remove any existing A records for this domain</li>
                  <li>• The CNAME should point to: <code className="bg-yellow-100 px-1 rounded">{showVerificationModal.cnameTarget}</code></li>
                  <li>• SSL certificate will be automatically provisioned after verification</li>
                  <li>• Contact your DNS provider if you need help</li>
                </ul>
              </div>

              {showVerificationModal.verificationError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-2">Verification Error</h4>
                  <p className="text-red-800 text-sm">{showVerificationModal.verificationError}</p>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    verifyDomain(showVerificationModal.id);
                    setShowVerificationModal(null);
                  }}
                  disabled={isVerifying === showVerificationModal.id}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  {isVerifying === showVerificationModal.id ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Domain'
                  )}
                </button>
                <button
                  onClick={() => setShowVerificationModal(null)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Domain Onboarding Modal */}
      <CustomDomainOnboarding
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={(domain) => {
          setDomains(prev => [...prev, domain]);
          setShowOnboarding(false);
          toast.success('🎉 Custom domain added successfully! DNS propagation may take 5-60 minutes.');
          
          // Dispatch event to notify other components
          window.dispatchEvent(new CustomEvent('custom-domain-added', { 
            detail: domain 
          }));
        }}
      />

      {/* Upgrade Modal is now mounted globally in App.tsx */}
    </div>
  );
};

export default CustomDomainManager;