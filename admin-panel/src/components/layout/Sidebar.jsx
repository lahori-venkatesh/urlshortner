import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Home, Users, Globe, Link, QrCode, FileText,
  CreditCard, Ticket, Headphones, BarChart2,
  HardDrive, Monitor, Shield, LogOut, ChevronLeft, ChevronRight,
  Menu
} from 'lucide-react';

const Sidebar = ({ currentPage, setCurrentPage }) => {
  const { user, logout, hasPermission } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, resource: 'dashboard', action: 'read' },
    { id: 'users', label: 'Users', icon: Users, resource: 'users', action: 'read' },
    { id: 'teams', label: 'Teams', icon: Globe, resource: 'teams', action: 'read' },
    { id: 'domains', label: 'Domains', icon: Globe, resource: 'domains', action: 'read' },
    { id: 'links', label: 'Links', icon: Link, resource: 'links', action: 'read' },
    { id: 'qrcodes', label: 'QR Codes', icon: QrCode, resource: 'qr', action: 'read' },
    { id: 'files', label: 'Files', icon: FileText, resource: 'files', action: 'read' },
    { id: 'billing', label: 'Billing', icon: CreditCard, resource: 'billing', action: 'read' },
    { id: 'coupons', label: 'Coupons', icon: Ticket, resource: 'coupons', action: 'read' },
    { id: 'support', label: 'Support', icon: Headphones, resource: 'support', action: 'read' },
    { id: 'analytics', label: 'Analytics', icon: BarChart2, resource: 'analytics', action: 'read' },
    { id: 'resources', label: 'Resources', icon: HardDrive, resource: 'resources', action: 'read' },
    { id: 'system', label: 'System', icon: Monitor, resource: 'system', action: 'read' },
    { id: 'audit', label: 'Audit Logs', icon: Shield, resource: 'audit', action: 'read' },
  ];

  const filteredMenuItems = menuItems.filter(item =>
    hasPermission(item.resource, item.action)
  );

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      logout();
    }
  };

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg text-gray-600 dark:text-gray-300"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar Container */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40
        ${collapsed ? 'w-20' : 'w-64'}
        bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
        transition-all duration-300 ease-in-out
        flex flex-col
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* Logo Section */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-gray-800">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white truncate">
                Tinyslash
              </span>
            </div>
          )}
          {collapsed && (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-hide">
          {filteredMenuItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  setMobileOpen(false);
                }}
                className={`
                  w-full flex items-center
                  ${collapsed ? 'justify-center px-2' : 'px-3'}
                  py-2.5 rounded-lg transition-all duration-200 group
                  ${isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'}
                `}
                title={collapsed ? item.label : ''}
              >
                <item.icon
                  size={20}
                  className={`
                    flex-shrink-0 transition-colors
                    ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'}
                  `}
                />
                {!collapsed && (
                  <span className="ml-3 text-sm font-medium truncate">
                    {item.label}
                  </span>
                )}

                {/* Active Indicator Line */}
                {isActive && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <div className={`
            flex items-center 
            ${collapsed ? 'justify-center' : 'space-x-3'}
            p-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800
          `}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {user?.avatar}
            </div>

            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user?.name?.split(' ')[0]}
                </p>
                <p className="text-xs text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.role?.displayName}
                </p>
              </div>
            )}

            {!collapsed && (
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-white dark:hover:bg-gray-700 transition-all"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-gray-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
