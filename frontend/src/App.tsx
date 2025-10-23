import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import AuthRedirect from './components/AuthRedirect';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import Home from './pages/Home';
import Analytics from './pages/Analytics';
import Pricing from './pages/Pricing';
import Profile from './pages/Profile';
import AccountSettings from './pages/AccountSettings';
import RedirectPage from './pages/RedirectPage';
import AuthCallback from './pages/AuthCallback';
import AdvancedQRGenerator from './components/AdvancedQRGenerator';
import CustomDomainManager from './components/CustomDomainManager';
import UnifiedDashboard from './components/UnifiedDashboard';
import FileViewer from './pages/FileViewer';
import QRAnalyticsPage from './pages/QRAnalyticsPage';
import QREditPage from './pages/QREditPage';
import FileAnalyticsPage from './pages/FileAnalyticsPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <Routes>
            <Route path="/" element={
              <AuthRedirect>
                <LandingPage />
              </AuthRedirect>
            } />
            <Route path="/app" element={
              <AuthRedirect requireAuth={true}>
                <div className="min-h-screen bg-gray-50">
                  <div className="sticky top-0 z-50">
                    <Header />
                  </div>
                  <main>
                    <Home />
                  </main>
                </div>
              </AuthRedirect>
            } />
            {/* Dashboard Routes */}
            <Route path="/dashboard" element={
              <AuthRedirect requireAuth={true}>
                <div className="min-h-screen bg-gray-50">
                  <div className="sticky top-0 z-50">
                    <Header />
                  </div>
                  <UnifiedDashboard />
                </div>
              </AuthRedirect>
            } />
            
            <Route path="/dashboard/links" element={
              <AuthRedirect requireAuth={true}>
                <div className="min-h-screen bg-gray-50">
                  <div className="sticky top-0 z-50">
                    <Header />
                  </div>
                  <UnifiedDashboard />
                </div>
              </AuthRedirect>
            } />
            
            <Route path="/dashboard/qr-codes" element={
              <AuthRedirect requireAuth={true}>
                <div className="min-h-screen bg-gray-50">
                  <div className="sticky top-0 z-50">
                    <Header />
                  </div>
                  <UnifiedDashboard />
                </div>
              </AuthRedirect>
            } />
            
            <Route path="/dashboard/file-links" element={
              <AuthRedirect requireAuth={true}>
                <div className="min-h-screen bg-gray-50">
                  <div className="sticky top-0 z-50">
                    <Header />
                  </div>
                  <UnifiedDashboard />
                </div>
              </AuthRedirect>
            } />
            
            <Route path="/dashboard/analytics" element={
              <AuthRedirect requireAuth={true}>
                <div className="min-h-screen bg-gray-50">
                  <div className="sticky top-0 z-50">
                    <Header />
                  </div>
                  <UnifiedDashboard />
                </div>
              </AuthRedirect>
            } />
            
            {/* Individual Analytics Routes */}
            <Route path="/dashboard/links/analytics/:shortCode" element={
              <AuthRedirect requireAuth={true}>
                <Analytics />
              </AuthRedirect>
            } />
            
            <Route path="/dashboard/qr-codes/analytics/:qrCode" element={
              <AuthRedirect requireAuth={true}>
                <QRAnalyticsPage />
              </AuthRedirect>
            } />
            
            <Route path="/dashboard/qr-codes/edit/:qrCode" element={
              <AuthRedirect requireAuth={true}>
                <QREditPage />
              </AuthRedirect>
            } />
            
            <Route path="/dashboard/file-links/analytics/:fileCode" element={
              <AuthRedirect requireAuth={true}>
                <FileAnalyticsPage />
              </AuthRedirect>
            } />
            
            {/* Legacy Individual Link Analytics */}
            <Route path="/analytics/:shortCode" element={
              <AuthRedirect requireAuth={true}>
                <Analytics />
              </AuthRedirect>
            } />
            
            {/* Legacy QR Generator Route */}
            <Route path="/qr-generator" element={
              <div className="min-h-screen bg-gray-50">
                <Header />
                <main className="container mx-auto px-4 py-8">
                  <AdvancedQRGenerator />
                </main>
              </div>
            } />
            
            <Route path="/domains" element={
              <div className="min-h-screen bg-gray-50">
                <Header />
                <main className="container mx-auto px-4 py-8">
                  <CustomDomainManager />
                </main>
              </div>
            } />
            <Route path="/pricing" element={
              <AuthRedirect requireAuth={true}>
                <Pricing />
              </AuthRedirect>
            } />
            <Route path="/profile" element={
              <AuthRedirect requireAuth={true}>
                <Profile />
              </AuthRedirect>
            } />
            <Route path="/account-settings" element={
              <AuthRedirect requireAuth={true}>
                <AccountSettings />
              </AuthRedirect>
            } />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/file/:fileId" element={<FileViewer />} />
            <Route path="/:shortCode" element={<RedirectPage />} />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;