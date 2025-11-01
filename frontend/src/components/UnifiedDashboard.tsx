import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Link, 
  QrCode, 
  Upload, 
  BarChart3, 
  Plus,
  X,
  Crown,
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
  Settings,
  Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import { useUpgradeModal } from '../context/ModalContext';
import DashboardOverview from './dashboard/DashboardOverview';
import TeamManagement from './TeamManagement';
import TeamSettings from './TeamSettings';
import CreateSection from './dashboard/CreateSection';
import LinksManager from './dashboard/LinksManager';
import QRManageSection from './dashboard/QRManageSection';
import FileToUrlManager from './dashboard/FileToUrlManager';
import AnalyticsSection from './dashboard/AnalyticsSection';
import CustomDomainManager from './CustomDomainManager';
// Removed unused import - UpgradeModal is now global

type SidebarSection = 'dashboard' | 'create' | 'links' | 'qr-codes' | 'file-to-url' | 'analytics' | 'domains' | 'team-members' | 'team-settings';
type CreateMode = 'url' | 'qr' | 'file';

const UnifiedDashboard: React.FC = () => {
  const { user } = useAuth();
  const { currentScope } = useTeam();
  const upgradeModal = useUpgradeModal();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<SidebarSection>('dashboard');
  const [createMode, setCreateMode] = useState<CreateMode>('url');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPro] = useState(user?.plan?.includes('PRO') || user?.plan?.includes('BUSINESS') || false);

  // Close sidebar on mobile when section changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [activeSection]);

  // Set active section based on current URL
  useEffect(() => {
    const path = location.pathname;
    if (path === '/dashboard') {
      setActiveSection('dashboard');
    } else if (path === '/dashboard/links') {
      setActiveSection('links');
    } else if (path === '/dashboard/qr-codes') {
      setActiveSection('qr-codes');
    } else if (path === '/dashboard/file-links') {
      setActiveSection('file-to-url');
    } else if (path === '/dashboard/analytics') {
      setActiveSection('analytics');
    } else if (path === '/dashboard/domains') {
      setActiveSection('domains');
    }
  }, [location.pathname]);

  // Check if returning from pricing page or navigating from profile
  useEffect(() => {
    const returnToDashboard = localStorage.getItem('returnToDashboard');
    const savedSection = localStorage.getItem('dashboardSection');
    
    if (returnToDashboard === 'true') {
      // Clear the return flags
      localStorage.removeItem('returnToDashboard');
      localStorage.removeItem('dashboardSection');
      
      // Restore the previous section if it exists
      if (savedSection && savedSection !== activeSection) {
        setActiveSection(savedSection as SidebarSection);
      }
      
      // Show a success message or notification if needed
      console.log('Returned to dashboard from pricing');
    }

    // Check if navigating from profile dropdown to analytics or other sections
    if (location.state?.activeSection) {
      setActiveSection(location.state.activeSection as SidebarSection);
      
      // Also handle createMode if provided
      if (location.state?.createMode) {
        setCreateMode(location.state.createMode as CreateMode);
      }
      
      // Only clear the state if there's no editQRData to preserve
      if (!location.state?.editQRData) {
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, navigate, activeSection]);

  const sidebarItems = [
    {
      id: 'create' as SidebarSection,
      label: 'Create',
      icon: Plus,
      description: currentScope.type === 'TEAM' ? 'New Team Content' : 'New Links & QR Codes',
      primary: true,
      submenu: [
        { id: 'url', label: 'Short Link', icon: Link },
        { id: 'qr', label: 'QR Code', icon: QrCode },
        { id: 'file', label: 'File to URL', icon: Upload }
      ]
    },
    {
      id: 'dashboard' as SidebarSection,
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: currentScope.type === 'TEAM' ? 'Team Overview & Stats' : 'Overview & Stats'
    },
    {
      id: 'links' as SidebarSection,
      label: currentScope.type === 'TEAM' ? 'Team Links' : 'My Links',
      icon: Link,
      description: currentScope.type === 'TEAM' ? 'Manage Team Links' : 'Manage Short Links'
    },
    {
      id: 'qr-codes' as SidebarSection,
      label: currentScope.type === 'TEAM' ? 'Team QR Codes' : 'My QR Codes',
      icon: QrCode,
      description: currentScope.type === 'TEAM' ? 'Manage Team QR Codes' : 'Manage QR Codes'
    },
    {
      id: 'file-to-url' as SidebarSection,
      label: currentScope.type === 'TEAM' ? 'Team Files' : 'My Files',
      icon: Upload,
      description: currentScope.type === 'TEAM' ? 'Team File Links' : 'File to URL Links'
    },
    {
      id: 'analytics' as SidebarSection,
      label: 'Analytics',
      icon: BarChart3,
      description: currentScope.type === 'TEAM' ? 'Team Performance' : 'Performance Insights'
    },
    // Custom Domains (Available for all users, with upgrade prompts for free users)
    {
      id: 'domains' as SidebarSection,
      label: 'Custom Domains',
      icon: Globe,
      description: currentScope.type === 'TEAM' ? 'Team Custom Domains' : 'Your Custom Domains',
      badge: !(user?.plan?.includes('PRO') || user?.plan?.includes('BUSINESS')) ? 'PRO' : undefined
    },
    // Team-specific sections
    ...(currentScope.type === 'TEAM' ? [
      {
        id: 'team-members' as SidebarSection,
        label: 'Members',
        icon: Users,
        description: 'Manage Team Members'
      },
      {
        id: 'team-settings' as SidebarSection,
        label: 'Team Settings',
        icon: Settings,
        description: 'Team Configuration'
      }
    ] : [])
  ];

  const handleCreateClick = (mode: CreateMode) => {
    setCreateMode(mode);
    setActiveSection('create');
  };

  const handleUpgradeClick = () => {
    // Store current dashboard state to return after upgrade
    localStorage.setItem('returnToDashboard', 'true');
    localStorage.setItem('dashboardSection', activeSection);
    
    // Navigate to dedicated pricing page
    navigate('/pricing');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardOverview onCreateClick={handleCreateClick} />;
      case 'create':
        return <CreateSection mode={createMode} onModeChange={setCreateMode} />;
      case 'links':
        return <LinksManager onCreateClick={() => {
          setCreateMode('url');
          setActiveSection('create');
        }} />;
      case 'qr-codes':
        return <QRManageSection onCreateClick={() => {
          setCreateMode('qr');
          setActiveSection('create');
        }} />;
      case 'file-to-url':
        return <FileToUrlManager onCreateClick={() => {
          setCreateMode('file');
          setActiveSection('create');
        }} />;
      case 'analytics':
        return <AnalyticsSection />;
      case 'domains':
        return <CustomDomainManager 
          ownerType={currentScope.type} 
          ownerId={currentScope.type === 'TEAM' ? currentScope.id : user?.id} 
        />;
      case 'team-members':
        return currentScope.type === 'TEAM' ? <TeamManagement teamId={currentScope.id} /> : <DashboardOverview onCreateClick={handleCreateClick} />;
      case 'team-settings':
        return currentScope.type === 'TEAM' ? <TeamSettings teamId={currentScope.id} /> : <DashboardOverview onCreateClick={handleCreateClick} />;
      default:
        return <DashboardOverview onCreateClick={handleCreateClick} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile: No sidebar, content takes full width */}
      {/* Desktop: Sidebar layout */}
      
      {/* Mobile Sidebar Overlay - Only for desktop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <div className={`
        hidden lg:block fixed left-0 z-20 bg-white shadow-xl border-r border-gray-200 transform transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? 'w-16' : 'w-64'}
        top-16 bottom-4 h-auto rounded-lg
      `}>
        <div className="flex flex-col h-full relative">
          {/* Mobile Header - Only close button */}
          <div className={`flex items-center justify-end p-4 h-16 lg:hidden`}>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop Collapse Toggle - Top of sidebar */}
          <div className="hidden lg:block p-4 pb-2">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`
                w-full flex items-center justify-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 group
                ${sidebarCollapsed ? '' : 'space-x-2'}
              `}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 group-hover:scale-110 transition-transform" />
              ) : (
                <>
                  <PanelLeftClose className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">Collapse</span>
                </>
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 pt-16 lg:pt-2 space-y-1 overflow-y-auto">
            {sidebarItems.map((item) => (
              <div key={item.id} className="relative">
                <div className="group">
                  <button
                    onClick={() => {
                      // Handle custom domains with upgrade check
                      if (item.id === 'domains') {
                        if (user?.plan?.includes('PRO') || user?.plan?.includes('BUSINESS')) {
                          setActiveSection(item.id);
                          navigate('/dashboard/domains');
                        } else {
                          upgradeModal.open(
                            'Custom Domains',
                            'Unlock custom domains and advanced features for your team',
                            false
                          );
                        }
                        return;
                      }
                      
                      setActiveSection(item.id);
                      // Navigate to the appropriate route
                      if (item.id === 'dashboard') {
                        navigate('/dashboard');
                      } else if (item.id === 'links') {
                        navigate('/dashboard/links');
                      } else if (item.id === 'qr-codes') {
                        navigate('/dashboard/qr-codes');
                      } else if (item.id === 'file-to-url') {
                        navigate('/dashboard/file-links');
                      } else if (item.id === 'analytics') {
                        navigate('/dashboard/analytics');
                      }
                    }}
                    className={`
                      w-full flex items-center px-3 py-3 rounded-xl text-left transition-all duration-200 group relative hover:shadow-md
                      ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}
                      ${item.primary 
                        ? activeSection === item.id
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-[1.02]'
                          : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-md hover:shadow-lg hover:transform hover:scale-[1.02]'
                        : activeSection === item.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <div className="relative">
                      <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${
                        !sidebarCollapsed && activeSection === item.id ? 'scale-110' : ''
                      }`} />
                    </div>
                    
                    {!sidebarCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate">{item.label}</span>
                          {(item as any).badge && (
                            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full font-medium">
                              {(item as any).badge}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs truncate mt-0.5 ${
                          item.primary 
                            ? 'text-blue-100' 
                            : activeSection === item.id 
                              ? 'text-blue-600' 
                              : 'text-gray-500'
                        }`}>
                          {item.description}
                        </p>
                      </div>
                    )}
                  </button>

                  {/* Tooltip for collapsed sidebar */}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-lg">
                      <div className="flex items-center space-x-2">
                        <span>{item.label}</span>
                      </div>
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  )}
                </div>

                {/* Submenu for Create */}
                {item.id === 'create' && activeSection === 'create' && item.submenu && !sidebarCollapsed && (
                  <div className="ml-8 mt-2 space-y-1 animate-in slide-in-from-left-2 duration-200">
                    {item.submenu.map((subItem) => (
                      <button
                        key={subItem.id}
                        onClick={() => setCreateMode(subItem.id as CreateMode)}
                        className={`
                          w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-all duration-200
                          ${createMode === subItem.id
                            ? 'bg-blue-100 text-blue-700 border border-blue-200 shadow-sm transform scale-[1.02]'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }
                        `}
                      >
                        <subItem.icon className={`w-4 h-4 transition-transform duration-200 ${
                          createMode === subItem.id ? 'scale-110' : ''
                        }`} />
                        <span className="font-medium">{subItem.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Upgrade Banner for Free Users */}
          {!isPro && (
            <div className="p-4 border-t border-gray-200">
              {!sidebarCollapsed ? (
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-xl shadow-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="w-4 h-4" />
                    <span className="font-semibold text-sm">Upgrade to Pro</span>
                  </div>
                  <p className="text-xs opacity-90 mb-3">
                    Unlock advanced analytics, unlimited QR codes, and more!
                  </p>
                  <button 
                    onClick={handleUpgradeClick}
                    className="w-full bg-white text-purple-600 py-2 px-3 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-all duration-200 hover:shadow-md transform hover:scale-[1.02]"
                  >
                    Upgrade Now
                  </button>
                </div>
              ) : (
                <div className="flex justify-center">
                  <button 
                    onClick={handleUpgradeClick}
                    className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl flex items-center justify-center hover:shadow-lg transition-all duration-200 transform hover:scale-110 group"
                    title="Upgrade to Pro"
                  >
                    <Crown className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden min-w-0 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      }`}>
        {/* Content Area - Mobile First */}
        <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8 lg:pt-6 lg:pb-8">
          {renderContent()}
        </main>
      </div>

      {/* Upgrade Modal is now mounted globally in App.tsx */}
    </div>
  );
};

export default UnifiedDashboard;