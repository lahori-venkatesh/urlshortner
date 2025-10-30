import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, 
  CheckCircle, 
  Copy, 
  ExternalLink, 
  ArrowRight, 
  ArrowLeft,
  Shield,
  Zap,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface CustomDomainOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  context?: 'individual' | 'team';
  teamId?: string;
}

const CustomDomainOnboarding: React.FC<CustomDomainOnboardingProps> = ({
  isOpen,
  onClose,
  onComplete,
  context = 'individual',
  teamId
}) => {
  const { user, token } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [domainName, setDomainName] = useState('');
  const [verificationMethod, setVerificationMethod] = useState<'dns' | 'file'>('dns');
  const [isCreating, setIsCreating] = useState(false);
  const [createdDomain, setCreatedDomain] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const steps = [
    { id: 1, title: 'Enter Domain', description: 'Add your custom domain' },
    { id: 2, title: 'Verify Ownership', description: 'Prove you own the domain' },
    { id: 3, title: 'Setup Complete', description: 'Start using your domain' }
  ];

  const handleCreateDomain = async () => {
    if (!domainName.trim()) {
      toast.error('Please enter a domain name');
      return;
    }

    setIsCreating(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/v1/domains`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          domainName: domainName.trim(),
          ownerType: context === 'team' ? 'TEAM' : 'USER',
          ownerId: context === 'team' ? teamId : user?.id
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setCreatedDomain(result.domain);
        setCurrentStep(2);
        toast.success('Domain created! Now let\'s verify ownership.');
      } else {
        throw new Error(result.message || 'Failed to create domain');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create domain');
    } finally {
      setIsCreating(false);
    }
  };

  const handleVerifyDomain = async () => {
    if (!createdDomain) return;

    setIsVerifying(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/v1/domains/${createdDomain.id}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success && result.verified) {
        setCurrentStep(3);
        toast.success('Domain verified successfully!');
      } else {
        toast.error('Domain verification failed. Please check your DNS settings.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Globe className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Add Your Custom Domain</h3>
        <p className="text-gray-600">
          Enter the domain you want to use for your {context === 'team' ? 'team\'s' : ''} short links
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Domain Name
          </label>
          <input
            type="text"
            placeholder="go.yourbrand.com"
            value={domainName}
            onChange={(e) => setDomainName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Example: go.yourbrand.com, links.company.com, short.mydomain.com
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Requirements:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• You must own and control the domain</li>
            <li>• Domain should be a subdomain (e.g., go.yourdomain.com)</li>
            <li>• DNS access is required for verification</li>
          </ul>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onClose}
          className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleCreateDomain}
          disabled={!domainName.trim() || isCreating}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
        >
          {isCreating ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="w-16 h-16 text-orange-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Verify Domain Ownership</h3>
        <p className="text-gray-600">
          Add this DNS record to verify you own {createdDomain?.domainName}
        </p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">DNS Configuration</h4>
        
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Type</span>
              <p className="text-gray-900 font-mono">CNAME</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Name</span>
              <p className="text-gray-900 font-mono">{createdDomain?.domainName}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Value</span>
              <div className="flex items-center space-x-2">
                <p className="text-gray-900 font-mono text-xs">{createdDomain?.cnameTarget}</p>
                <button
                  onClick={() => copyToClipboard(createdDomain?.cnameTarget || '')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-900">DNS Propagation</h4>
            <p className="text-sm text-yellow-800 mt-1">
              DNS changes can take up to 24 hours to propagate. You can verify once the DNS record is active.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">How to add this record:</h4>
        <ol className="text-sm text-gray-600 space-y-2">
          <li>1. Log in to your domain registrar or DNS provider</li>
          <li>2. Navigate to DNS management or DNS records</li>
          <li>3. Add a new CNAME record with the values above</li>
          <li>4. Save the changes and wait for propagation</li>
          <li>5. Click "Verify Domain" below to check</li>
        </ol>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(1)}
          className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>
        <button
          onClick={handleVerifyDomain}
          disabled={isVerifying}
          className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center"
        >
          {isVerifying ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              Verify Domain
              <CheckCircle className="w-4 h-4 ml-2" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 text-center">
      <div>
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Domain Setup Complete!</h3>
        <p className="text-gray-600">
          Your custom domain {createdDomain?.domainName} is now ready to use
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-2">What's Next?</h4>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• SSL certificate will be automatically provisioned</li>
          <li>• You can now create short links with your domain</li>
          <li>• Analytics will track your custom domain performance</li>
        </ul>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => {
            onComplete();
            onClose();
          }}
          className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
        >
          <Zap className="w-4 h-4 mr-2" />
          Start Creating Links
        </button>
        
        <button
          onClick={() => window.location.href = '/dashboard?section=domains'}
          className="w-full bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
        >
          <Globe className="w-4 h-4 mr-2" />
          Manage All Domains
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Add Custom Domain
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ExternalLink className="w-6 h-6" />
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${currentStep >= step.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {currentStep > step.id ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    step.id
                  )}
                </div>
                <div className="ml-2 hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{step.title}</p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-gray-400 mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>
      </motion.div>
    </div>
  );
};

export default CustomDomainOnboarding;