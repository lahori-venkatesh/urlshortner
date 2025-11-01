import React, { ReactElement, cloneElement } from 'react';
import { Lock, Crown, Zap, Sparkles, Shield, Palette, Upload } from 'lucide-react';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useUpgradeModal } from '../context/ModalContext';
import { useAuth } from '../context/AuthContext';

interface PremiumFieldProps {
  children: ReactElement;
  feature: keyof typeof FEATURE_CONFIG;
  label?: string;
  description?: string;
  requiredPlan?: 'Pro' | 'Business';
  className?: string;
  showBadge?: boolean;
  wrapperClassName?: string;
}

const FEATURE_CONFIG = {
  customAlias: { name: 'Custom Alias', description: 'Create memorable custom short links with branded aliases', icon: Zap, requiredPlan: 'Pro', featureKey: 'canUseCustomAlias' },
  passwordProtection: { name: 'Password Protection', description: 'Secure your links with passwords', icon: Lock, requiredPlan: 'Pro', featureKey: 'canUsePasswordProtection' },
  linkExpiration: { name: 'Link Expiration', description: 'Auto-disable links after a set time', icon: Sparkles, requiredPlan: 'Pro', featureKey: 'canUseLinkExpiration' },
  clickLimits: { name: 'Click Limits', description: 'Limit total clicks per link', icon: Shield, requiredPlan: 'Pro', featureKey: 'canUseClickLimits' },
  customDomain: { name: 'Custom Domains', description: 'Use branded domains for trust', icon: Crown, requiredPlan: 'Pro', featureKey: 'canUseCustomDomain' },
  customQRColors: { name: 'Custom QR Colors', description: 'Customize your QR colors to match your brand', icon: Palette, requiredPlan: 'Pro', featureKey: 'canUseCustomQRColors' },
  qrLogo: { name: 'QR Code Logo', description: 'Add your logo inside QR codes', icon: Upload, requiredPlan: 'Pro', featureKey: 'canUseQRLogo' },
  qrBranding: { name: 'QR Branding', description: 'Add brand text to QR codes', icon: Sparkles, requiredPlan: 'Pro', featureKey: 'canUseQRBranding' },
  advancedQRSettings: { name: 'Advanced QR Settings', description: 'Full control over QR customization', icon: Crown, requiredPlan: 'Pro', featureKey: 'canUseAdvancedQRSettings' },
  advancedFileSettings: { name: 'Advanced File Settings', description: 'Extra upload controls for files', icon: Crown, requiredPlan: 'Pro', featureKey: 'canUseAdvancedFileSettings' },
} as const;

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

  if (hasAccess) return <div className={wrapperClassName}>{children}</div>;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    upgradeModal.open(
      config.name,
      description || config.description,
      false
    );
  };

  const enhancedChild = cloneElement(children, {
    ...children.props,
    className: `${children.props.className || ''} ${className} cursor-pointer transition-all duration-200 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 text-purple-600 placeholder-purple-400 hover:from-purple-100 hover:to-blue-100 hover:border-purple-300 hover:shadow-md`,
    onClick: handleClick,
    readOnly: true,
    tabIndex: 0,
    'aria-label': `Premium feature locked. Upgrade to ${planName} to unlock ${config.name}`,
    placeholder: `Upgrade to ${planName} to unlock ${config.name.toLowerCase()}`,
    title: `Click to upgrade and unlock ${config.name}`
  });

  return (
    <div className={`relative ${wrapperClassName}`}>
      {showBadge && (
        <div className="flex items-center justify-between mb-2">
          {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
          <div
            role="button"
            tabIndex={0}
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 border border-purple-200 cursor-pointer hover:from-purple-200 hover:to-blue-200 transition-all duration-200 hover:shadow-sm"
            onClick={handleClick}
            title={`Click to upgrade to ${planName}`}
          >
            <IconComponent className="w-3 h-3 mr-1" />
            <span>{planName}</span>
          </div>
        </div>
      )}

      <div className="relative group">{enhancedChild}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <Lock className="w-4 h-4 text-purple-400 group-hover:text-purple-600 transition-all duration-200 group-hover:scale-110" />
        </div>

        <div className="absolute bottom-full left-0 mb-2 max-w-xs break-words px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
          <div className="flex items-center space-x-2">
            <IconComponent className="w-3 h-3" />
            <span>Click to unlock {config.name}</span>
          </div>
          <div className="absolute top-full left-5 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      </div>

      {description && (
        <p className="text-xs text-purple-600 mt-1 cursor-pointer hover:text-purple-800 transition-colors" onClick={handleClick}>
          💡 {description}
        </p>
      )}
    </div>
  );
};

export default PremiumField;
