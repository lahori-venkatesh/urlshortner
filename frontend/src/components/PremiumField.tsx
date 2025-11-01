import React, { ReactElement, cloneElement } from 'react';
import { Lock, Crown, Zap, Sparkles, Shield, Palette, Upload } from 'lucide-react';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useUpgradeModal } from '../context/ModalContext';
import { useAuth } from '../context/AuthContext';

interface PremiumFieldProps {
  children: ReactElement;
  feature: 'customAlias' | 'passwordProtection' | 'linkExpiration' | 'clickLimits' | 'customDomain' | 'customQRColors' | 'qrLogo' | 'qrBranding' | 'advancedQRSettings' | 'advancedFileSettings';
  label?: string;
  description?: string;
  requiredPlan?: 'Pro' | 'Business';
  className?: string;
  showBadge?: boolean;
  wrapperClassName?: string;
}

const FEATURE_CONFIG = {
  customAlias: {
    name: 'Custom Alias',
    description: 'Create memorable custom short links with your own branded aliases',
    icon: Zap,
    requiredPlan: 'Pro' as const,
    featureKey: 'canUseCustomAlias' as const
  },
  passwordProtection: {
    name: 'Password Protection',
    description: 'Secure your links with password protection. Only users with the password can access your content',
    icon: Lock,
    requiredPlan: 'Pro' as const,
    featureKey: 'canUsePasswordProtection' as const
  },
  linkExpiration: {
    name: 'Link Expiration',
    description: 'Set expiration dates for your links to automatically disable them after a certain time period',
    icon: Sparkles,
    requiredPlan: 'Pro' as const,
    featureKey: 'canUseLinkExpiration' as const
  },
  clickLimits: {
    name: 'Click Limits',
    description: 'Control the maximum number of clicks your links can receive before they become inactive',
    icon: Shield,
    requiredPlan: 'Pro' as const,
    featureKey: 'canUseClickLimits' as const
  },
  customDomain: {
    name: 'Custom Domains',
    description: 'Use your own branded domains for professional short links that build trust',
    icon: Crown,
    requiredPlan: 'Pro' as const,
    featureKey: 'canUseCustomDomain' as const
  },
  customQRColors: {
    name: 'Custom QR Colors',
    description: 'Customize your QR code colors to match your brand identity',
    icon: Palette,
    requiredPlan: 'Pro' as const,
    featureKey: 'canUseCustomQRColors' as const
  },
  qrLogo: {
    name: 'QR Code Logo',
    description: 'Add your company logo to QR codes for better brand recognition',
    icon: Upload,
    requiredPlan: 'Pro' as const,
    featureKey: 'canUseQRLogo' as const
  },
  qrBranding: {
    name: 'QR Code Branding',
    description: 'Add custom text and branding to your QR codes',
    icon: Sparkles,
    requiredPlan: 'Pro' as const,
    featureKey: 'canUseQRBranding' as const
  },
  advancedQRSettings: {
    name: 'Advanced QR Settings',
    description: 'Access advanced QR code customization options',
    icon: Crown,
    requiredPlan: 'Pro' as const,
    featureKey: 'canUseAdvancedQRSettings' as const
  },
  advancedFileSettings: {
    name: 'Advanced File Settings',
    description: 'Use premium features for file uploads including custom settings',
    icon: Crown,
    requiredPlan: 'Pro' as const,
    featureKey: 'canUseAdvancedFileSettings' as const
  }
};

const PremiumField: React.FC<PremiumFieldProps> = ({
  children,
  feature,
  label,
  description,
  requiredPlan,
  className = '',
  showBadge = true,
  wrapperClassName = ''
}) => {
  const { user } = useAuth();
  const featureAccess = useFeatureAccess(user);
  const upgradeModal = useUpgradeModal();

  const config = FEATURE_CONFIG[feature];
  const hasAccess = featureAccess[config.featureKey];
  const IconComponent = config.icon;
  const planName = requiredPlan || config.requiredPlan;

  // If user has access, render normally
  if (hasAccess) {
    return (
      <div className={wrapperClassName}>
        {children}
      </div>
    );
  }

  // Premium field wrapper for locked features
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    upgradeModal.open(
      config.name,
      description || config.description,
      false
    );
  };

  // Clone the child element and add premium styling
  const enhancedChild = cloneElement(children, {
    ...children.props,
    className: `${children.props.className || ''} ${className} cursor-pointer transition-all duration-200 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 text-purple-600 placeholder-purple-400 hover:from-purple-100 hover:to-blue-100 hover:border-purple-300 hover:shadow-md`,
    onClick: handleClick,
    onFocus: handleClick,
    readOnly: true,
    disabled: false, // Keep clickable
    placeholder: `Upgrade to ${planName} to unlock ${config.name.toLowerCase()}`,
    title: `Click to upgrade and unlock ${config.name}`
  });

  return (
    <div className={`relative ${wrapperClassName}`}>
      {/* Premium Badge */}
      {showBadge && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <label className="block text-sm font-medium text-gray-700">
              {label}
            </label>
          )}
          <div 
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 border border-purple-200 cursor-pointer hover:from-purple-200 hover:to-blue-200 transition-all duration-200 hover:shadow-sm"
            onClick={handleClick}
            title={`Click to upgrade to ${planName}`}
          >
            <IconComponent className="w-3 h-3 mr-1" />
            <span>{planName}</span>
          </div>
        </div>
      )}

      {/* Enhanced Input Field */}
      <div className="relative group">
        {enhancedChild}
        
        {/* Lock Overlay */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <div className="flex items-center space-x-1">
            <Lock className="w-4 h-4 text-purple-400 group-hover:text-purple-600 transition-colors" />
            <span className="text-xs text-purple-500 font-medium hidden sm:inline">
              {planName}
            </span>
          </div>
        </div>

        {/* Hover Tooltip */}
        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
          <div className="flex items-center space-x-2">
            <IconComponent className="w-3 h-3" />
            <span>Click to unlock {config.name}</span>
          </div>
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>

      {/* Subtle Description */}
      {description && (
        <p className="text-xs text-purple-600 mt-1 cursor-pointer hover:text-purple-800 transition-colors" onClick={handleClick}>
          💡 {description}
        </p>
      )}
    </div>
  );
};

export default PremiumField;