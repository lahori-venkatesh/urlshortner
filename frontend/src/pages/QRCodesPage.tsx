import React from 'react';
import { useNavigate } from 'react-router-dom';
import QRManageSection from '../components/dashboard/QRManageSection';
import Header from '../components/Header';

const QRCodesPage: React.FC = () => {
  const navigate = useNavigate();

  const handleCreateClick = () => {
    navigate('/dashboard', { state: { activeSection: 'create', createMode: 'qr' } });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50">
        <Header />
      </div>
      <main className="container mx-auto px-4 py-8 pt-20">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">QR Codes</h1>
          <p className="text-gray-600">Manage and track your QR code campaigns</p>
        </div>
        <QRManageSection onCreateClick={handleCreateClick} />
      </main>
    </div>
  );
};

export default QRCodesPage;