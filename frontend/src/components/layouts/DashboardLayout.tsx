import React, { useState } from 'react';
import Header from '../Header';
import Sidebar from '../dashboard/Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Fixed Top Header */}
      <div className="flex-none z-40 bg-white border-b border-gray-200">
        <Header />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Desktop Only (Hidden on Mobile, rely on Header nav) */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main Content Area - Scrollable */}
        <main className="flex-1 overflow-y-auto w-full relative">
          <div className="p-4 sm:p-6 lg:p-8 mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
