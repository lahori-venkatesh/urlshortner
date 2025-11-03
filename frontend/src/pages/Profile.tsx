import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Camera,
  Save,
  Edit3,
  Globe,
  Shield,
  Bell,
  Eye,
  EyeOff,
  Crown,
  CreditCard,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { subscriptionService } from '../services/subscriptionService';
import Header from '../components/Header';
import toast from 'react-hot-toast';

// Subscription Section Component
const SubscriptionSection: React.FC = () => {
  const { user } = useAuth();
  const { planInfo, refreshPlanInfo } = useSubscription();
  const featureAccess = useFeatureAccess(user);
  const [isLoading, setIsLoading] = useState(false);

  const handleCancelSubscription = async () => {
    if (!user?.id) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to cancel your subscription? You will lose access to Pro features at the end of your billing period.'
    );
    
    if (!confirmed) return;

    setIsLoading(true);
    try {
      // Add cancel subscription API call here
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080/api'}/v1/subscription/cancel/${user.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Subscription cancelled successfully');
        await refreshPlanInfo();
      } else {
        toast.error(result.message || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'FREE':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">🆓 Free Plan</span>;
      case 'PRO_MONTHLY':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Crown className="w-3 h-3 mr-1" />Pro Monthly</span>;
      case 'PRO_YEARLY':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Crown className="w-3 h-3 mr-1" />Pro Yearly</span>;
      case 'BUSINESS_MONTHLY':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"><Crown className="w-3 h-3 mr-1" />Business Monthly</span>;
      case 'BUSINESS_YEARLY':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"><Crown className="w-3 h-3 mr-1" />Business Yearly</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Unknown</span>;
    }
  };

  if (!planInfo) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-1">Current Plan</h4>
          {getPlanBadge(planInfo.plan)}
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">
            {planInfo.subscriptionExpiry ? `Expires: ${formatDate(planInfo.subscriptionExpiry)}` : 'No expiry'}
          </p>
          {planInfo.inTrial && (
            <p className="text-xs text-orange-600 font-medium">Trial Active</p>
          )}
        </div>
      </div>

      {/* Usage Limits - Updated for New Pricing Structure */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Monthly Usage Limits</h4>
        
        {planInfo.hasProAccess ? (
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-lg font-bold text-blue-600">∞</div>
              <div className="text-xs text-gray-500 mt-1">Short Links</div>
              <div className="text-xs text-green-600 mt-1">Unlimited</div>
            </div>
            <div className="text-center bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-lg font-bold text-purple-600">∞</div>
              <div className="text-xs text-gray-500 mt-1">QR Codes</div>
              <div className="text-xs text-green-600 mt-1">Unlimited</div>
            </div>
            <div className="text-center bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-lg font-bold text-orange-600">
                {planInfo.plan === 'BUSINESS_MONTHLY' || planInfo.plan === 'BUSINESS_YEARLY' ? '200' : '50'}
              </div>
              <div className="text-xs text-gray-500 mt-1">File Conversions</div>
              <div className="text-xs text-blue-600 mt-1">
                {planInfo.remainingMonthlyFiles} remaining
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {/* Free Plan - Monthly Limits Only */}
            <div className="text-center bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-lg font-bold text-blue-600">
                {planInfo.remainingMonthlyUrls || 0}/75
              </div>
              <div className="text-xs text-gray-500 mt-1">Short Links</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${((75 - (planInfo.remainingMonthlyUrls || 0)) / 75) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="text-center bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-lg font-bold text-purple-600">
                {planInfo.remainingMonthlyQrCodes || 0}/30
              </div>
              <div className="text-xs text-gray-500 mt-1">QR Codes</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${((30 - (planInfo.remainingMonthlyQrCodes || 0)) / 30) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="text-center bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-lg font-bold text-orange-600">
                {planInfo.remainingMonthlyFiles || 0}/5
              </div>
              <div className="text-xs text-gray-500 mt-1">File Conversions</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all"
                  style={{ width: `${((5 - (planInfo.remainingMonthlyFiles || 0)) / 5) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
        
        {/* Plan Info */}
        <div className="mt-4 text-center">
          <div className="text-xs text-gray-600">
            Current Plan: <span className="font-medium text-gray-900">
              {planInfo.hasProAccess 
                ? (planInfo.plan?.includes('BUSINESS') ? 'Business' : 'Pro')
                : 'Free'
              }
            </span>
            {planInfo.subscriptionExpiry && (
              <span className="text-xs text-gray-500 ml-2">
                • Expires {formatDate(planInfo.subscriptionExpiry)}
              </span>
            )}
          </div>
          {!planInfo.hasProAccess ? (
            <div className="text-xs text-blue-600 mt-1">
              Limits reset monthly • <button 
                onClick={() => window.location.href = '/pricing'}
                className="underline hover:no-underline"
              >
                Upgrade for unlimited
              </button>
            </div>
          ) : (
            <div className="text-xs text-green-600 mt-1">
              🎉 Enjoying unlimited access to all features
            </div>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900">Available Features</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div className={`flex items-center ${featureAccess.canUseCustomAlias ? 'text-green-600' : 'text-gray-400'}`}>
            <span className="mr-2">{featureAccess.canUseCustomAlias ? '✓' : '✗'}</span>
            Custom Aliases
            {featureAccess.canUseCustomAlias && <span className="ml-1 text-xs text-purple-600 font-medium">Pro</span>}
          </div>
          <div className={`flex items-center ${featureAccess.canUsePasswordProtection ? 'text-green-600' : 'text-gray-400'}`}>
            <span className="mr-2">{featureAccess.canUsePasswordProtection ? '✓' : '✗'}</span>
            Password Protection
            {featureAccess.canUsePasswordProtection && <span className="ml-1 text-xs text-purple-600 font-medium">Pro</span>}
          </div>
          <div className={`flex items-center ${featureAccess.canUseLinkExpiration ? 'text-green-600' : 'text-gray-400'}`}>
            <span className="mr-2">{featureAccess.canUseLinkExpiration ? '✓' : '✗'}</span>
            Link Expiration
            {featureAccess.canUseLinkExpiration && <span className="ml-1 text-xs text-purple-600 font-medium">Pro</span>}
          </div>
          <div className={`flex items-center ${featureAccess.canUseClickLimits ? 'text-green-600' : 'text-gray-400'}`}>
            <span className="mr-2">{featureAccess.canUseClickLimits ? '✓' : '✗'}</span>
            Click Limits
            {featureAccess.canUseClickLimits && <span className="ml-1 text-xs text-purple-600 font-medium">Pro</span>}
          </div>
          <div className={`flex items-center ${featureAccess.canUseCustomQRColors ? 'text-green-600' : 'text-gray-400'}`}>
            <span className="mr-2">{featureAccess.canUseCustomQRColors ? '✓' : '✗'}</span>
            Custom QR Colors
            {featureAccess.canUseCustomQRColors && <span className="ml-1 text-xs text-purple-600 font-medium">Pro</span>}
          </div>
          <div className={`flex items-center ${featureAccess.canUseAnalytics ? 'text-green-600' : 'text-gray-400'}`}>
            <span className="mr-2">{featureAccess.canUseAnalytics ? '✓' : '✗'}</span>
            Detailed Analytics
            {featureAccess.canUseAnalytics && <span className="ml-1 text-xs text-purple-600 font-medium">Pro</span>}
          </div>
          <div className={`flex items-center ${featureAccess.canUseCustomDomain ? 'text-green-600' : 'text-gray-400'}`}>
            <span className="mr-2">{featureAccess.canUseCustomDomain ? '✓' : '✗'}</span>
            Custom Domains
            {featureAccess.canUseCustomDomain && <span className="ml-1 text-xs text-purple-600 font-medium">Pro</span>}
          </div>
          <div className="flex items-center text-green-600">
            <span className="mr-2">✓</span>
            {planInfo?.hasProAccess 
              ? (planInfo.plan?.includes('BUSINESS') ? '500MB' : '100MB')
              : '10MB'
            } File Uploads
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
        {planInfo.plan === 'FREE' ? (
          <button
            onClick={() => window.location.href = '/pricing'}
            className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Pro
          </button>
        ) : (
          <>
            <button
              onClick={() => window.location.href = '/pricing'}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Manage Billing
            </button>
            {(planInfo.plan?.includes('PRO') || planInfo.plan?.includes('BUSINESS')) && (
              <button
                onClick={handleCancelSubscription}
                disabled={isLoading}
                className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                {isLoading ? 'Cancelling...' : 'Cancel Subscription'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    bio: user?.bio || '',
    website: user?.website || '',
    company: user?.company || '',
    jobTitle: user?.jobTitle || '',
    timezone: user?.timezone || 'Asia/Kolkata',
    language: user?.language || 'en',
    notifications: {
      email: true,
      push: true,
      marketing: false
    },
    privacy: {
      profileVisible: true,
      analyticsVisible: false
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as object),
          [child]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSave = () => {
    // Here you would typically save to your backend
    console.log('Saving profile data:', formData);
    setIsEditing(false);
    // You could also update the user context here
  };

  const handleAvatarChange = () => {
    // Handle avatar upload
    console.log('Avatar change requested');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center justify-center w-10 h-10 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
              <p className="text-gray-600">Manage your account information and preferences</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <motion.div 
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <img
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=3b82f6&color=fff&size=128`}
                    alt={formData.name}
                    className="w-24 h-24 rounded-full mx-auto"
                  />
                  {isEditing && (
                    <button
                      onClick={handleAvatarChange}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">{formData.name}</h2>
                <p className="text-gray-600 mb-2">{formData.email}</p>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {(user?.plan?.includes('PRO') || user?.plan?.includes('BUSINESS')) ? '👑 Pro/Business' : '🆓 Free Plan'}
                </div>
                
                {formData.bio && (
                  <p className="text-gray-600 text-sm mt-4 leading-relaxed">{formData.bio}</p>
                )}
                
                <div className="mt-6 space-y-2 text-sm text-gray-600">
                  {formData.location && (
                    <div className="flex items-center justify-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>{formData.location}</span>
                    </div>
                  )}
                  {formData.website && (
                    <div className="flex items-center justify-center space-x-2">
                      <Globe className="w-4 h-4" />
                      <a href={formData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {formData.website}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center justify-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {new Date(user?.createdAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Settings Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <motion.div 
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Mumbai, India"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    rows={3}
                    placeholder="Tell us about yourself..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>
            </motion.div>

            {/* Professional Information */}
            <motion.div 
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Your Company"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Software Engineer"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="https://yourwebsite.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>
            </motion.div>

            {/* Preferences */}
            <motion.div 
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <select
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Notification Settings */}
            <motion.div 
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Notification Preferences
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                    <p className="text-sm text-gray-600">Receive notifications via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="notifications.email"
                      checked={formData.notifications.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Push Notifications</h4>
                    <p className="text-sm text-gray-600">Receive push notifications in browser</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="notifications.push"
                      checked={formData.notifications.push}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Marketing Communications</h4>
                    <p className="text-sm text-gray-600">Receive updates about new features and offers</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="notifications.marketing"
                      checked={formData.notifications.marketing}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </motion.div>

            {/* Privacy Settings */}
            <motion.div 
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Privacy Settings
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Public Profile</h4>
                    <p className="text-sm text-gray-600">Make your profile visible to other users</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="privacy.profileVisible"
                      checked={formData.privacy.profileVisible}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Analytics Visibility</h4>
                    <p className="text-sm text-gray-600">Allow others to see your link analytics</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="privacy.analyticsVisible"
                      checked={formData.privacy.analyticsVisible}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </motion.div>

            {/* Subscription & Billing */}
            <motion.div 
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Subscription & Billing
              </h3>
              
              <SubscriptionSection />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;