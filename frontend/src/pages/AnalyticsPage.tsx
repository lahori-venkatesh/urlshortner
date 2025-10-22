import React from 'react';
import AnalyticsSection from '../components/dashboard/AnalyticsSection';
import Header from '../components/Header';

const AnalyticsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50">
        <Header />
      </div>
      <main className="container mx-auto px-4 py-8 pt-20">
        <AnalyticsSection />
      </main>
    </div>
  );
};

export default AnalyticsPage;