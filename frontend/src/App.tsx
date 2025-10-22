import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import AuthRedirect from './components/AuthRedirect';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import Home from './pages/Home';
import Analytics from './pages/Analytics';
import AnalyticsPage from './pages/AnalyticsPage';
import LinksPage from './pages/LinksPage';
import QRCodesPage from './pages/QRCodesPage';
import FileLinksPage from './pages/FileLinksPage';
import Pricing from './pages/Pricing';
import Profile from './pages/Profile';
import AccountSettings from './pages/AccountSettings';
import RedirectPage from './pages/RedirectPage';
import AuthCallback from './pages/AuthCallback';
import AdvancedQRGenerator from './components/AdvancedQRGenerator';
import CustomDomainManager from './components/CustomDomainManager';
import UnifiedDashboard from './components/UnifiedDashboard';
import FileViewer from './pages/FileViewer';
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
            {/* Individual Link Analytics */}
            <Route path="/analytics/:shortCode" element={
              <AuthRedirect requireAuth={true}>
                <Analytics />
              </AuthRedirect>
            } />
            
            {/* Separate Pages for Each Section */}
            <Route path="/links" element={
              <AuthRedirect requireAuth={true}>
                <LinksPage />
              </AuthRedirect>
            } />
            
            <Route path="/qr-codes" element={
              <AuthRedirect requireAuth={true}>
                <QRCodesPage />
              </AuthRedirect>
            } />
            
            <Route path="/file-links" element={
              <AuthRedirect requireAuth={true}>
                <FileLinksPage />
              </AuthRedirect>
            } />
            
            <Route path="/analytics" element={
              <AuthRedirect requireAuth={true}>
                <AnalyticsPage />
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