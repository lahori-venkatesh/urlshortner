import React from 'react';
import { useNavigate } from 'react-router-dom';
import LinksManager from '../components/dashboard/LinksManager';
import Header from '../components/Header';

const LinksPage: React.FC = () => {
  const navigate = useNavigate();

  const handleCreateClick = () => {
    navigate('/dashboard', { state: { activeSection: 'create', createMode: 'url' } });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50">
        <Header />
      </div>
      <main className="container mx-auto px-4 py-8 pt-20">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Short Links</h1>
          <p className="text-gray-600">Manage and analyze your shortened URLs</p>
        </div>
        <LinksManager onCreateClick={handleCreateClick} />
      </main>
    </div>
  );
};

export default LinksPage;