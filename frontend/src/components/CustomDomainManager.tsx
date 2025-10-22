import React, { useState, useEffect } from 'react';
import { Globe, Plus, CheckCircle, AlertCircle, Clock, Settings, Trash2, Copy, ExternalLink } from 'lucide-react';

interface CustomDomain {
  id: string;
  domain: string;
  status: 'pending' | 'active' | 'failed' | 'verifying';
  isDefault: boolean;
  sslEnabled: boolean;
  createdAt: string;
  verificationMethod: 'dns' | 'file';
  dnsRecords?: DNSRecord[];
  linksCount: number;
}

interface DNSRecord {
  type: 'CNAME' | 'A' | 'TXT';
  name: string;
  value: string;
  ttl: number;
}

const CustomDomainManager: React.FC = () => {
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [verificationMethod, setVerificationMethod] = useState<'dns' | 'file'>('dns');
  const [showVerificationModal, setShowVerificationModal] = useState<CustomDomain | null>(null);

  // Load domains from backend API
  useEffect(() => {
    loadDomainsFromBackend();
  }, []);

  const loadDomainsFromBackend = async () => {
    try {
      // TODO: Implement backend API call to load custom domains
      console.log('Loading domains from backend...');
      setDomains([]);
    } catch (error) {
      console.error('Failed to load domains from backend:', error);
      setDomains([]);
    }
  };

  const addDomain = async () => {
    if (!newDomain.trim()) return;

    const domain = newDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    // Validate domain format
    if (!isValidDomain(domain)) {
      const { toast } = await import('react-hot-toast');
      toast.error('Please enter a valid domain name');
      return;
    }

    // Check if domain already exists
    if (domains.some(d => d.domain === domain)) {
      const { toast } = await import('react-hot-toast');
      toast.error('Domain already exists');
      return;
    }

    const newCustomDomain: CustomDomain = {
      id: Date.now().toString(),
      domain,
      status: 'pending',
      isDefault: domains.length === 0, // First domain becomes default
      sslEnabled: false,
      createdAt: new Date().toISOString(),
      verificationMethod,
      dnsRecords: generateDNSRecords(domain),
      linksCount: 0
    };

    const updatedDomains = [...domains, newCustomDomain];
    setDomains(updatedDomains);
    // TODO: Save to backend API instead of localStorage

    setNewDomain('');
    setIsAddingDomain(false);
    setShowVerificationModal(newCustomDomain);

    const { toast } = await import('react-hot-toast');
    toast.success('Domain added! Please complete verification.');
  };

  const generateDNSRecords = (domain: string): DNSRecord[] => {
    return [
      {
        type: 'CNAME',
        name: domain,
        value: 'pebly.vercel.app',
        ttl: 300
      },
      {
        type: 'TXT',
        name: `_pebly-verification.${domain}`,
        value: `pebly-verification=${generateVerificationToken()}`,
        ttl: 300
      }
    ];
  };

  const generateVerificationToken = (): string => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const isValidDomain = (domain: string): boolean => {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
    return domainRegex.test(domain) && domain.includes('.');
  };

  const verifyDomain = async (domainId: string) => {
    const domain = domains.find(d => d.id === domainId);
    if (!domain) return;

    // Update status to verifying
    const updatedDomains = domains.map(d => 
      d.id === domainId ? { ...d, status: 'verifying' as const } : d
    );
    setDomains(updatedDomains);
    // TODO: Save to backend API instead of localStorage

    // Simulate verification process
    setTimeout(async () => {
      const success = Math.random() > 0.3; // 70% success rate for demo
      
      const finalDomains = domains.map(d => 
        d.id === domainId ? { 
          ...d, 
          status: success ? 'active' as const : 'failed' as const,
          sslEnabled: success 
        } : d
      );
      
      setDomains(finalDomains);
      // TODO: Save to backend API instead of localStorage

      const { toast } = await import('react-hot-toast');
      if (success) {
        toast.success('Domain verified successfully!');
      } else {
        toast.error('Domain verification failed. Please check your DNS settings.');
      }
    }, 3000);
  };

  const setDefaultDomain = (domainId: string) => {
    const updatedDomains = domains.map(d => ({
      ...d,
      isDefault: d.id === domainId
    }));
    setDomains(updatedDomains);
    // TODO: Save to backend API instead of localStorage
  };

  const deleteDomain = async (domainId: string) => {
    const domain = domains.find(d => d.id === domainId);
    if (domain && domain.linksCount > 0) {
      const { toast } = await import('react-hot-toast');
      toast.error(`Cannot delete domain with ${domain.linksCount} active links`);
      return;
    }

    const updatedDomains = domains.filter(d => d.id !== domainId);
    
    // If deleted domain was default, make first remaining domain default
    if (domain?.isDefault && updatedDomains.length > 0) {
      updatedDomains[0].isDefault = true;
    }

    setDomains(updatedDomains);
    // TODO: Save to backend API instead of localStorage

    const { toast } = await import('react-hot-toast');
    toast.success('Domain deleted successfully');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      const { toast } = await import('react-hot-toast');
      toast.success('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getStatusIcon = (status: CustomDomain['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'verifying':
        return <Clock className="w-5 h-5 text-yellow-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: CustomDomain['status']) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'failed':
        return 'Verification Failed';
      case 'verifying':
        return 'Verifying...';
      default:
        return 'Pending Verification';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Globe className="w-6 h-6 mr-2" />
              Custom Domains
            </h2>
            <p className="text-gray-600 mt-1">
              Use your own branded domains for short links
            </p>
          </div>
          <button
            onClick={() => setIsAddingDomain(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Domain
          </button>
        </div>

        {/* Add Domain Form */}
        {isAddingDomain && (
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
        {domains.length === 0 ? (
          <div className="text-center py-12">
            <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No custom domains</h3>
            <p className="text-gray-500 mb-4">Add your first custom domain to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {domains.map((domain) => (
              <div key={domain.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(domain.status)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">{domain.domain}</h3>
                        {domain.isDefault && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            Default
                          </span>
                        )}
                        {domain.sslEnabled && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            SSL
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {getStatusText(domain.status)} • {domain.linksCount} links • 
                        Added {new Date(domain.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {domain.status === 'pending' && (
                      <button
                        onClick={() => setShowVerificationModal(domain)}
                        className="text-blue-600 hover:text-blue-800 px-3 py-1 text-sm border border-blue-600 rounded hover:bg-blue-50 transition-colors"
                      >
                        Setup
                      </button>
                    )}
                    {domain.status === 'failed' && (
                      <button
                        onClick={() => verifyDomain(domain.id)}
                        className="text-yellow-600 hover:text-yellow-800 px-3 py-1 text-sm border border-yellow-600 rounded hover:bg-yellow-50 transition-colors"
                      >
                        Retry
                      </button>
                    )}
                    {domain.status === 'active' && !domain.isDefault && (
                      <button
                        onClick={() => setDefaultDomain(domain.id)}
                        className="text-green-600 hover:text-green-800 px-3 py-1 text-sm border border-green-600 rounded hover:bg-green-50 transition-colors"
                      >
                        Set Default
                      </button>
                    )}
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
                Verify Domain: {showVerificationModal.domain}
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
                  Add the following DNS records to your domain's DNS settings:
                </p>
                
                {showVerificationModal.dnsRecords?.map((record, index) => (
                  <div key={index} className="bg-white rounded border p-3 mb-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Type:</span>
                        <div className="font-mono">{record.type}</div>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-gray-600">Name:</span>
                        <div className="font-mono break-all">{record.name}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">TTL:</span>
                        <div className="font-mono">{record.ttl}</div>
                      </div>
                      <div className="md:col-span-4">
                        <span className="font-medium text-gray-600">Value:</span>
                        <div className="flex items-center space-x-2">
                          <code className="flex-1 bg-gray-100 p-2 rounded text-xs break-all">
                            {record.value}
                          </code>
                          <button
                            onClick={() => copyToClipboard(record.value)}
                            className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-100 rounded"
                            title="Copy value"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">Important Notes</h4>
                <ul className="text-yellow-800 text-sm space-y-1">
                  <li>• DNS changes can take up to 24 hours to propagate</li>
                  <li>• Make sure to add both CNAME and TXT records</li>
                  <li>• Remove any existing A records for the domain</li>
                  <li>• Contact your DNS provider if you need help</li>
                </ul>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    verifyDomain(showVerificationModal.id);
                    setShowVerificationModal(null);
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Verify Domain
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
    </div>
  );
};

export default CustomDomainManager;