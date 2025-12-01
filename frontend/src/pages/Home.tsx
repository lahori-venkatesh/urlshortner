import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import UnifiedDashboard from '../components/UnifiedDashboard';

const Home: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to TinySlash
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Please log in to access the URL shortener
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Landing Page
        </button>
      </div>
    );
  }

  return <UnifiedDashboard />;
};

export default Home;