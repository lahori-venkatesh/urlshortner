import React from 'react';
import { useAuth } from '../context/AuthContext';


const QRGenerator: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          QR Code Generator
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Please log in to access the advanced QR code generator
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

  return (
    <div className="max-w-7xl mx-auto">
     
    </div>
  );
};

export default QRGenerator;