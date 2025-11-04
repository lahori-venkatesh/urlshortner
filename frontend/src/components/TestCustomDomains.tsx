import React from 'react';

const TestCustomDomains: React.FC = () => {
  console.log('🧪 TestCustomDomains component rendered');
  
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">Test Custom Domains</h1>
        <p className="text-gray-600 mt-2">
          This is a test component to verify routing is working.
        </p>
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">✅ If you can see this, the routing is working correctly.</p>
        </div>
      </div>
    </div>
  );
};

export default TestCustomDomains;