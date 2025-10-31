import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';

const AuthTest: React.FC = () => {
  const { user, token, isAuthenticated, login, logout } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runAuthTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      addResult('Starting authentication tests...');
      
      // Test 1: Register a new user
      addResult('Test 1: Registering new user...');
      const testEmail = `test${Date.now()}@example.com`;
      const testPassword = 'testpassword123';
      
      try {
        const registerResponse = await api.signup({
          email: testEmail,
          password: testPassword,
          firstName: 'Test',
          lastName: 'User'
        });
        
        if (registerResponse.success && registerResponse.token) {
          addResult('✅ Registration successful with token');
        } else {
          addResult('❌ Registration failed: ' + registerResponse.message);
        }
      } catch (error: any) {
        addResult('❌ Registration error: ' + error.message);
      }
      
      // Test 2: Login with the same user
      addResult('Test 2: Logging in with test user...');
      try {
        const loginResponse = await api.login({
          email: testEmail,
          password: testPassword
        });
        
        if (loginResponse.success && loginResponse.token) {
          addResult('✅ Login successful with token');
          
          // Test 3: Validate the token
          addResult('Test 3: Validating token...');
          try {
            const validateResponse = await api.validateToken(loginResponse.token);
            if (validateResponse.success) {
              addResult('✅ Token validation successful');
            } else {
              addResult('❌ Token validation failed: ' + validateResponse.message);
            }
          } catch (error: any) {
            addResult('❌ Token validation error: ' + error.message);
          }
          
        } else {
          addResult('❌ Login failed: ' + loginResponse.message);
        }
      } catch (error: any) {
        addResult('❌ Login error: ' + error.message);
      }
      
      // Test 4: Test current user authentication
      addResult('Test 4: Testing current user authentication...');
      if (isAuthenticated && token) {
        try {
          const validateResponse = await api.validateToken(token);
          if (validateResponse.success) {
            addResult('✅ Current user token is valid');
          } else {
            addResult('❌ Current user token is invalid: ' + validateResponse.message);
          }
        } catch (error: any) {
          addResult('❌ Current user token validation error: ' + error.message);
        }
      } else {
        addResult('ℹ️ No current user authenticated');
      }
      
      addResult('Authentication tests completed!');
      
    } catch (error: any) {
      addResult('❌ Test suite error: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const testLogin = async () => {
    try {
      await login('test@example.com', 'password123');
      addResult('✅ Login test successful');
    } catch (error: any) {
      addResult('❌ Login test failed: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Authentication Test Page</h1>
        
        {/* Current Auth Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Authentication Status</h2>
          <div className="space-y-2">
            <p><strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
            <p><strong>User:</strong> {user ? user.email : 'None'}</p>
            <p><strong>Token:</strong> {token ? `${token.substring(0, 20)}...` : 'None'}</p>
          </div>
          
          <div className="mt-4 space-x-4">
            <button
              onClick={testLogin}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Test Login
            </button>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
        
        {/* Test Runner */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Tests</h2>
          <button
            onClick={runAuthTests}
            disabled={isRunning}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {isRunning ? 'Running Tests...' : 'Run Authentication Tests'}
          </button>
        </div>
        
        {/* Test Results */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p>No tests run yet. Click "Run Authentication Tests" to start.</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index}>{result}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthTest;