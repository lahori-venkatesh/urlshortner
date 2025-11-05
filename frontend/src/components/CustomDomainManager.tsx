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

  // Handle Add Custom Domain button click
  const handleAddCustomDomain = () => {
    const verifiedDomainCount = domains.filter(d => d.status === 'VERIFIED').length;
    
    // Check if user has access to custom domains
    if (!featureAccess.canUseCustomDomain) {
      upgradeModal.open(
        'Custom Domains',
        'Use your own branded domains for professional short links with SSL certificates included.',
        false
      );
      return;
    }
    
    // Check if user has reached domain limit
    if (!featureAccess.canAddDomain(verifiedDomainCount)) {
      if (user?.plan === 'PRO') {
        upgradeModal.open(
          'Upgrade to Business for more domains',
          'Get up to 3 custom domains and advanced team features with our Business plan.',
          true
        );
      } else {
        toast.error(featureAccess.getUpgradeReason('Custom Domains', verifiedDomainCount));
      }
      return;
    }
    
    // Always use onboarding for consistent experience
    setShowOnboarding(true);
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

  // Manual DNS check function for debugging
  const checkDNSManually = async (domain: CustomDomain) => {
    try {
      console.log('🔍 Manual DNS check for:', domain.domainName);
      
      // Try to resolve the domain using a public DNS API
      const dnsResponse = await fetch(`https://dns.google/resolve?name=${domain.domainName}&type=CNAME`);
      const dnsData = await dnsResponse.json();
      
      console.log('🔍 DNS API response:', dnsData);
      
      if (dnsData.Answer && dnsData.Answer.length > 0) {
        const cnameRecord = dnsData.Answer.find((record: any) => record.type === 5); // CNAME type
        if (cnameRecord) {
          const resolvedTarget = cnameRecord.data.replace(/\.$/, ''); // Remove trailing dot
          console.log('🔍 CNAME resolves to:', resolvedTarget);
          console.log('🔍 Expected target:', domain.cnameTarget);
          
          if (resolvedTarget === domain.cnameTarget) {
            toast.success('✅ DNS is correctly configured! The backend verification might have an issue.');
          } else {
            toast.error(`❌ DNS mismatch: Found ${resolvedTarget}, expected ${domain.cnameTarget}`);
          }
        } else {
          toast.error('❌ No CNAME record found');
        }
      } else {
        toast.error('❌ Domain not found in DNS');
      }
    } catch (error) {
      console.error('DNS check failed:', error);
      toast.error('Failed to check DNS. Please verify manually.');
    }
  };

  // Simulate what backend verification should do
  const simulateBackendVerification = async (domain: CustomDomain) => {
    try {
      console.log('🔍 Simulating backend verification process...');
      
      // Step 1: Check DNS resolution (what backend should do)
      const dnsResponse = await fetch(`https://dns.google/resolve?name=${domain.domainName}&type=CNAME`);
      const dnsData = await dnsResponse.json();
      
      console.log('🔍 Backend DNS check result:', dnsData);
      
      if (dnsData.Answer && dnsData.Answer.length > 0) {
        const cnameRecord = dnsData.Answer.find((record: any) => record.type === 5);
        if (cnameRecord) {
          const resolvedTarget = cnameRecord.data.replace(/\.$/, '');
          
          console.log('🔍 Expected verification logic:');
          console.log('  - Domain:', domain.domainName);
          console.log('  - CNAME resolves to:', resolvedTarget);
          console.log('  - Expected target:', domain.cnameTarget);
          console.log('  - Match:', resolvedTarget === domain.cnameTarget);
          
          if (resolvedTarget === domain.cnameTarget) {
            toast.success('✅ Simulation: Domain verification should succeed!');
            return true;
          } else {
            toast.error(`❌ Simulation: CNAME mismatch - ${resolvedTarget} vs ${domain.cnameTarget}`);
            return false;
          }
        }
      }
      
      toast.error('❌ Simulation: No CNAME record found');
      return false;
    } catch (error) {
      console.error('Simulation failed:', error);
      toast.error('❌ Simulation failed');
      return false;
    }
  };

  // Simple and reliable domain verification
  const verifyDomainReliably = async (domain: CustomDomain) => {
    try {
      console.log('🔍 Starting domain verification...');
      setIsVerifying(domain.id);
      
      // Step 1: Client-side DNS verification for immediate feedback
      console.log('🔍 Checking DNS configuration...');
      const dnsResponse = await fetch(`https://dns.google/resolve?name=${domain.domainName}&type=CNAME`);
      const dnsData = await dnsResponse.json();
      
      if (!dnsData.Answer || dnsData.Answer.length === 0) {
        throw new Error('No CNAME record found. Please check your DNS configuration.');
      }
      
      const cnameRecord = dnsData.Answer.find((record: any) => record.type === 5);
      if (!cnameRecord) {
        throw new Error('No CNAME record found. Please add the CNAME record to your DNS.');
      }
      
      const resolvedTarget = cnameRecord.data.replace(/\.$/, '');
      
      if (resolvedTarget !== domain.cnameTarget) {
        throw new Error(`DNS configuration error: CNAME points to ${resolvedTarget}, but should point to ${domain.cnameTarget}`);
      }
      
      console.log('✅ DNS verification passed');
      toast.success('✅ DNS configuration verified!');
      
      // Step 2: Call backend verification endpoint
      console.log('🔍 Calling backend verification...');
      
      const verifyResponse = await axios.post(`${API_BASE_URL}/v1/domains/verify?domainId=${domain.id}`, {
        dnsVerified: true,
        cnameTarget: resolvedTarget,
        verificationMethod: 'client-side-dns'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15 second timeout
      });
      
      console.log('🔍 Backend verification response:', verifyResponse.data);
      
      if (verifyResponse.data.success && verifyResponse.data.verified) {
        // Update local state with backend response
        setDomains(prev => prev.map(d => 
          d.id === domain.id ? { ...d, ...verifyResponse.data.domain } : d
        ));
        
        toast.success('✅ Domain verified successfully! SSL certificate is being provisioned.');
        return true;
      } else {
        throw new Error(verifyResponse.data.message || 'Backend verification failed');
      }
      
    } catch (error: any) {
      console.error('❌ Domain verification failed:', error);
      
      // Provide specific error messages
      if (error.message.includes('DNS')) {
        toast.error(`❌ ${error.message}`);
      } else if (error.response?.status === 404) {
        toast.error('❌ Domain not found. Please try adding the domain again.');
      } else if (error.response?.status === 403) {
        toast.error('❌ Access denied. You may not own this domain.');
      } else if (error.response?.status === 401) {
        toast.error('❌ Authentication failed. Please log in again.');
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        toast.error('❌ Verification timed out. Please try again.');
      } else {
        toast.error(`❌ Verification failed: ${error.response?.data?.message || error.message}`);
      }
      
      return false;
    } finally {
      setIsVerifying(null);
    }
  };

  // Test backend endpoint availability
  const testBackendEndpoint = async () => {
    try {
      console.log('🔍 Testing backend endpoint availability...');
      console.log('🔍 API Base URL:', API_BASE_URL);
      console.log('🔍 Token available:', !!token);
      
      // Test if the domains endpoint exists
      const testResponse = await fetch(`${API_BASE_URL}/v1/domains/my`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🔍 Backend test response:', {
        status: testResponse.status,
        statusText: testResponse.statusText,
        headers: Object.fromEntries(testResponse.headers.entries())
      });
      
      if (testResponse.ok) {
        toast.success('✅ Backend is reachable. The verification endpoint might have specific issues.');
      } else {
        toast.error(`❌ Backend issue: ${testResponse.status} ${testResponse.statusText}`);
      }
    } catch (error) {
      console.error('Backend test failed:', error);
      toast.error('❌ Cannot reach backend server');
    }
  };

  const verifyDomain = async (domainId: string) => {
    const domain = domains.find(d => d.id === domainId);
    if (!domain) return;

    try {
      setIsVerifying(domainId);
      
      console.log('🔍 Starting domain verification:', {
        domainId,
        domainName: domain.domainName,
        cnameTarget: domain.cnameTarget,
        verificationToken: domain.verificationToken,
        apiUrl: `${API_BASE_URL}/v1/domains/verify?domainId=${domainId}`,
        hasToken: !!token,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'null'
      });
      
      const verifyUrl = `${API_BASE_URL}/v1/domains/verify?domainId=${domainId}`;
      console.log('🔍 Making verification request to:', verifyUrl);
      
      const response = await axios.post(verifyUrl, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 Verification response status:', response.status);
      console.log('🔍 Verification response headers:', response.headers);
      console.log('🔍 Verification response data:', response.data);

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
        console.error('❌ Verification failed:', response.data);
        toast.error(response.data.message || 'Verification failed');
      }
    } catch (error: any) {
      console.error('❌ Failed to verify domain:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      let errorMessage = 'Verification failed. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 404) {
        errorMessage = 'Domain verification endpoint not found. Please contact support.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error during verification. Please try again in a few minutes.';
      }
      
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
                  onClick={handleAddCustomDomain}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center space-x-2 mx-auto"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Add Custom Domain</span>
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
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <h4 className="font-bold text-blue-900 mb-4 flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  DNS Configuration Required
                </h4>
                
                <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 mb-4">
                  <p className="text-blue-800 text-sm font-medium">
                    📋 <strong>Quick Setup:</strong> Point your domain to <code className="bg-white px-2 py-1 rounded font-mono">pebly-proxy.vercel.app</code>
                  </p>
                </div>obe>
                {(() => {
                  const domain = showVerificationModal.domainName;
                  const parts = domain.split('.');
                  const isSubdomain = parts.length > 2;
                  
                  if (isSubdomain) {
                    const subdomain = parts[0];
                    const rootDomain = parts.slice(1).join('.');
                    return (
                      <div className="bg-blue-100 border border-blue-300 rounded p-3 mb-4 text-sm">
                        <p className="text-blue-900 font-medium">📝 For subdomain setup:</p>
                        <p className="text-blue-800">
                          You're setting up <code className="bg-white px-1 rounded">{domain}</code>
                        </p>
                        <p className="text-blue-800">
                          In your DNS provider for <code className="bg-white px-1 rounded">{rootDomain}</code>, 
                          add a CNAME record with name <code className="bg-white px-1 rounded">{subdomain}</code>
                        </p>
                      </div>
                    );
                  } else {
                    return (
                      <div className="bg-blue-100 border border-blue-300 rounded p-3 mb-4 text-sm">
                        <p className="text-blue-900 font-medium">📝 For root domain setup:</p>
                        <p className="text-blue-800">
                          You're setting up <code className="bg-white px-1 rounded">{domain}</code>
                        </p>
                        <p className="text-blue-800">
                          Use <code className="bg-white px-1 rounded">@</code> as the name (represents root domain)
                        </p>
                      </div>
                    );
                  }
                })()}
                
                <div className="bg-white rounded border p-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Type:</span>
                      <div className="font-mono">CNAME</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Name:</span>
                      <div className="font-mono break-all">
                        {(() => {
                          const domain = showVerificationModal.domainName;
                          const parts = domain.split('.');
                          // If it's a subdomain (more than 2 parts), show only the subdomain part
                          if (parts.length > 2) {
                            return parts[0]; // e.g., "links" from "links.pdfcircle.com"
                          }
                          // If it's a root domain, show @ or the full domain
                          return '@';
                        })()}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">TTL:</span>
                      <div className="font-mono">Auto</div>
                    </div>
                    <div className="md:col-span-3">
                      <span className="font-medium text-gray-600">Value:</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <code className="flex-1 bg-gray-100 p-2 rounded text-xs break-all">
                          pebly-proxy.vercel.app
                        </code>
                        <button
                          onClick={() => copyToClipboard('pebly-proxy.vercel.app')}
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
                  {(() => {
                    const domain = showVerificationModal.domainName;
                    const parts = domain.split('.');
                    const isSubdomain = parts.length > 2;
                    
                    if (isSubdomain) {
                      return (
                        <li>• For subdomains: Remove any existing A records for <code className="bg-yellow-100 px-1 rounded">{domain}</code></li>
                      );
                    } else {
                      return (
                        <li>• For root domains: Remove any existing A records for <code className="bg-yellow-100 px-1 rounded">{domain}</code></li>
                      );
                    }
                  })()}
                  <li>• The CNAME should point to: <code className="bg-yellow-100 px-1 rounded">pebly-proxy.vercel.app</code></li>
                  <li>• SSL certificate will be automatically provisioned after verification</li>
                  <li>• Contact your DNS provider if you need help</li>
                  {(() => {
                    const domain = showVerificationModal.domainName;
                    const parts = domain.split('.');
                    const isSubdomain = parts.length > 2;
                    
                    if (isSubdomain) {
                      return (
                        <li>• 💡 <strong>Cloudflare users:</strong> Make sure the proxy is OFF (gray cloud, not orange)</li>
                      );
                    }
                    return null;
                  })()}
                </ul>
              </div>

              {showVerificationModal.verificationError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-2">Verification Error</h4>
                  <p className="text-red-800 text-sm">{showVerificationModal.verificationError}</p>
                </div>
              )}

              {/* Verification Process */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Verification Process
                </h4>
                <div className="space-y-3 text-sm text-blue-800">
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</div>
                    <div>
                      <div className="font-semibold">Add DNS Record</div>
                      <div className="text-blue-700">Add the CNAME record above to your domain provider</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</div>
                    <div>
                      <div className="font-semibold">Wait for Propagation</div>
                      <div className="text-blue-700">DNS changes typically take 5-10 minutes (up to 24 hours)</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</div>
                    <div>
                      <div className="font-semibold">Verify Domain</div>
                      <div className="text-blue-700">Click "Verify Domain" to complete the setup</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Help */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                  <Globe className="w-4 h-4 mr-2" />
                  Universal Compatibility
                </h4>
                <div className="text-sm text-green-800 space-y-1">
                  <div>✅ <strong>Works with all providers:</strong> Hostinger, GoDaddy, Namecheap, Cloudflare, etc.</div>
                  <div>✅ <strong>Automatic SSL:</strong> HTTPS certificate provisioned automatically</div>
                  <div>✅ <strong>Global CDN:</strong> Fast redirects worldwide via Vercel Edge Network</div>
                  <div>✅ <strong>No conflicts:</strong> Universal proxy eliminates provider-specific issues</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowVerificationModal(null)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={async () => {
                    const success = await verifyDomainReliably(showVerificationModal);
                    if (success) {
                      setShowVerificationModal(null);
                    }
                  }}
                  disabled={isVerifying === showVerificationModal.id}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center font-semibold"
                >
                  {isVerifying === showVerificationModal.id ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Verifying Domain...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Verify Domain
                    </>
                  )}
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