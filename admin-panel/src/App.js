import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/auth/LoginPage';

// Page Components
import DashboardPage from './pages/dashboard/DashboardPage';
import UsersPage from './pages/users/UsersPage';
import TeamsPage from './pages/teams/TeamsPage';
import DomainsPage from './pages/domains/DomainsPage';
import LinksPage from './pages/links/LinksPage';
import QRCodeManagementPage from './pages/qrcodes/QRCodeManagementPage';
import FileManagementPage from './pages/files/FileManagementPage';
import BillingPage from './pages/billing/BillingPage';
import CouponsPage from './pages/coupons/CouponsPage';
import SupportPage from './pages/support/SupportPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import ResourceManagementPage from './pages/resources/ResourceManagementPage';
import SystemHealthPage from './pages/system/SystemHealthPage';
import AuditLogsPage from './pages/audit/AuditLogsPage';

const AppContent = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { isAuthenticated, user, login, hasPermission } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

  // Check if user has permission to access current page
  const checkPageAccess = (page) => {
    const pagePermissions = {
      dashboard: { resource: 'dashboard', action: 'read' },
      users: { resource: 'users', action: 'read' },
      teams: { resource: 'teams', action: 'read' },
      domains: { resource: 'domains', action: 'read' },
      links: { resource: 'links', action: 'read' },
      qrcodes: { resource: 'qr', action: 'read' },
      files: { resource: 'files', action: 'read' },
      billing: { resource: 'billing', action: 'read' },
      coupons: { resource: 'coupons', action: 'read' },
      support: { resource: 'support', action: 'read' },
      analytics: { resource: 'analytics', action: 'read' },
      resources: { resource: 'resources', action: 'read' },
      system: { resource: 'system', action: 'read' },
      audit: { resource: 'audit', action: 'read' }
    };

    const permission = pagePermissions[page];
    return permission ? hasPermission(permission.resource, permission.action) : false;
  };

  const renderPage = () => {
    // Check access before rendering
    if (!checkPageAccess(currentPage)) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Access Denied</h3>
            <p className="text-gray-600 dark:text-gray-400">You don't have permission to access this page.</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Current role: <span className="font-medium">{user.role.displayName}</span>
            </p>
          </div>
        </div>
      );
    }

    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage hasPermission={hasPermission} user={user} />;
      case 'users':
        return <UsersPage hasPermission={hasPermission} />;
      case 'teams':
        return <TeamsPage hasPermission={hasPermission} />;
      case 'domains':
        return <DomainsPage hasPermission={hasPermission} />;
      case 'links':
        return <LinksPage hasPermission={hasPermission} />;
      case 'qrcodes':
        return <QRCodeManagementPage hasPermission={hasPermission} />;
      case 'files':
        return <FileManagementPage hasPermission={hasPermission} />;
      case 'billing':
        return <BillingPage hasPermission={hasPermission} />;
      case 'coupons':
        return <CouponsPage hasPermission={hasPermission} />;
      case 'support':
        return <SupportPage hasPermission={hasPermission} />;
      case 'analytics':
        return <AnalyticsPage hasPermission={hasPermission} />;
      case 'resources':
        return <ResourceManagementPage hasPermission={hasPermission} />;
      case 'system':
        return <SystemHealthPage hasPermission={hasPermission} />;
      case 'audit':
        return <AuditLogsPage hasPermission={hasPermission} />;
      default:
        return <DashboardPage hasPermission={hasPermission} user={user} />;
    }
  };

  return (
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;