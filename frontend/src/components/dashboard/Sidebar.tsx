import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Link as LinkIcon,
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
  Globe,
  ChevronRight,
  ChevronLeft,
  LogOut,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTeam } from '../../context/TeamContext';
import { useUpgradeModal } from '../../context/ModalContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

type SidebarSection = 'dashboard' | 'create' | 'links' | 'qr-codes' | 'file-to-url' | 'analytics' | 'domains' | 'team-members' | 'team-settings';
type CreateMode = 'url' | 'qr' | 'file';

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, collapsed, onToggleCollapse }) => {
  const { user, logout } = useAuth();
  const { currentScope } = useTeam();
  const upgradeModal = useUpgradeModal();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<SidebarSection>('dashboard');
  const [createMode, setCreateMode] = useState<CreateMode>('url');

  // Is user PRO or BUSINESS?
  const isPro = user?.plan?.includes('PRO') || user?.plan?.includes('BUSINESS') || false;

  // Sync active section with URL
  useEffect(() => {
    const path = location.pathname;
    if (path === '/dashboard') {
      if (!location.state?.activeSection) {
        setActiveSection('dashboard');
      }
    }
    else if (path.includes('/dashboard/links')) setActiveSection('links');
    else if (path.includes('/dashboard/qr-codes')) setActiveSection('qr-codes');
    else if (path.includes('/dashboard/file-links')) setActiveSection('file-to-url');
    else if (path.includes('/dashboard/analytics')) setActiveSection('analytics');
    else if (path.includes('/dashboard/domains')) setActiveSection('domains');
  }, [location.pathname, location.state]);

  const handleUpgradeClick = () => {
    localStorage.setItem('returnToDashboard', 'true');
    localStorage.setItem('dashboardSection', activeSection);
    navigate('/pricing');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Navigation Group Definitions
  const navigationGroups = [
    {
      title: 'Overview',
      items: [
        {
          id: 'dashboard' as SidebarSection,
          label: 'Dashboard',
          icon: LayoutDashboard,
        }
      ]
    },
    {
      title: 'Management',
      items: [
        {
          id: 'links' as SidebarSection,
          label: 'Links',
          icon: LinkIcon,
        },
        {
          id: 'qr-codes' as SidebarSection,
          label: 'QR Codes',
          icon: QrCode,
        },
        {
          id: 'file-to-url' as SidebarSection,
          label: 'Files',
          icon: Upload,
        }
      ]
    },
    {
      title: 'Intelligence',
      items: [
        {
          id: 'analytics' as SidebarSection,
          label: 'Analytics',
          icon: BarChart3,
          isPro: true,
          badge: !isPro ? 'PRO' : undefined
        }
      ]
    },
    {
      title: 'Workspace',
      items: [
        {
          id: 'domains' as SidebarSection,
          label: 'Domains',
          icon: Globe,
          isPro: false, // Available to verify but limited functionality
          badge: !isPro ? 'PRO' : undefined
        },
        ...(currentScope.type === 'TEAM' ? [
          {
            id: 'team-members' as SidebarSection,
            label: 'Members',
            icon: Users,
          },
          {
            id: 'team-settings' as SidebarSection,
            label: 'Settings',
            icon: Settings,
          }
        ] : [])
      ]
    }
  ];

  const handleItemClick = (item: any) => {
    if (item.id === 'analytics' && !isPro) {
      upgradeModal.open('Analytics', 'Unlock detailed analytics', false);
      return;
    }

    // Default navigation
    switch (item.id) {
      case 'dashboard': navigate('/dashboard'); break;
      case 'links': navigate('/dashboard/links'); break;
      case 'qr-codes': navigate('/dashboard/qr-codes'); break;
      case 'file-to-url': navigate('/dashboard/file-links'); break;
      case 'analytics': navigate('/dashboard/analytics'); break;
      case 'domains': navigate('/dashboard/domains'); break;
      case 'team-members': navigate('/dashboard/team/members'); break;
      case 'team-settings': navigate('/dashboard/team/settings'); break;
      default: break;
    }
  };

  const handleCreateClick = () => {
    setActiveSection('create');
    navigate('/dashboard', { state: { activeSection: 'create' } });
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <motion.aside
        initial={false}
        animate={{
          width: collapsed ? 80 : 280,
          translateX: isOpen ? 0 : window.innerWidth >= 1024 ? 0 : -300
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`
          fixed lg:relative inset-y-0 left-0 z-50
          bg-white border-r border-gray-200 text-gray-900
          flex flex-col h-screen shadow-xl lg:shadow-none
        `}
      >
        {/* Toggle Button - Hanging on the right edge */}
        <button
          onClick={onToggleCollapse}
          className={`
            hidden lg:flex absolute -right-3 top-9 z-50
            items-center justify-center w-6 h-6
            bg-white border border-gray-200 rounded-full shadow-sm
            text-gray-500 hover:text-gray-900 hover:bg-gray-50
            transition-colors
          `}
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Header Section - Modified to remove Logo */}
        {/* Only show Mobile Close header on mobile. On desktop, this area is removed or minimized. */}
        <div className="flex items-center justify-end p-4 lg:hidden h-16 border-b border-gray-100">
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Spacer for Desktop (since we removed header) or just padding */}
        <div className="hidden lg:block h-6"></div>

        {/* Create Button Area */}
        <div className="px-4 pb-4">
          <button
            onClick={handleCreateClick}
            className={`
               w-full flex items-center justify-center
               bg-gray-900 text-white
               hover:bg-black hover:shadow-lg
               transition-all duration-200 rounded-xl font-medium
               ${collapsed ? 'h-12 w-12 p-0' : 'h-12 px-4 space-x-2'}
             `}
          >
            <Plus className="w-6 h-6" />
            {!collapsed && <span>Create New</span>}
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
          {navigationGroups.map((group, groupIndex) => (
            <div key={group.title} className="mb-6 px-4">
              {!collapsed && (
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
                  {group.title}
                </div>
              )}
              {collapsed && groupIndex > 0 && <div className="h-px bg-gray-100 mx-2 my-2" />}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = activeSection === item.id;

                  return (
                    <div key={item.id} className="relative group">
                      <button
                        onClick={() => handleItemClick(item)}
                        className={`
                          w-full flex items-center
                          ${collapsed ? 'justify-center h-10 w-10 mx-auto rounded-lg' : 'px-3 py-2.5 rounded-lg space-x-3'}
                          transition-all duration-200
                          ${isActive
                            ? 'bg-blue-50 text-blue-600 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }
                        `}
                      >
                        <item.icon className={`${collapsed ? 'w-5 h-5' : 'w-5 h-5'} ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-900'}`} />

                        {!collapsed && (
                          <div className="flex-1 flex items-center justify-between">
                            <span>{item.label}</span>
                            {item.badge && (
                              <span className="text-[10px] bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 font-medium">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}

                        {collapsed && (
                          <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                            {item.label}
                          </div>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer / User / Collapse Section */}
        <div className="border-t border-gray-100 p-4 bg-gray-50/50">
          {!isPro && !collapsed && (
            <div className="mb-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Crown className="w-4 h-4 text-white" />
                </div>
                <button onClick={() => navigate('/pricing')} className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors">
                  Upgrade
                </button>
              </div>
              <h4 className="font-bold text-sm mb-1">Upgrade to Pro</h4>
              <p className="text-xs text-purple-100 leading-relaxed opacity-90">
                Get analytics, custom domains & more limits.
              </p>
            </div>
          )}

          {/* Footer content removed/simplified since toggle moved to top */}
          <div className="flex items-center justify-center">
            <span className="text-xs text-gray-400">© 2025 TinySlash</span>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
