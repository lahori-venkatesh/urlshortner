import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Lock, AlertCircle } from 'lucide-react';

const RedirectPage: React.FC = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (shortCode) {
      handleRedirect();
    }
  }, [shortCode]);

  const handleRedirect = async (passwordInput?: string) => {
    try {
      setLoading(true);
      setError(null);

      // Call backend API to get the original URL
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
      
      const response = await fetch(`${API_BASE_URL}/v1/urls/${shortCode}/redirect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: passwordInput || undefined,
          userAgent: navigator.userAgent,
          referrer: document.referrer,
        }),
      });

      if (response.status === 401) {
        // Password required
        setPasswordRequired(true);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        if (response.status === 404) {
          setError('Link not found or has expired');
        } else if (response.status === 403) {
          setError('Access denied. Please check your password.');
        } else {
          setError('An error occurred while processing your request');
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      
      if (data.success && data.data && data.data.originalUrl) {
        // Record the click and redirect
        setTimeout(() => {
          window.location.href = data.data.originalUrl;
        }, 1000);
      } else {
        setError('Invalid link or unable to redirect');
        setLoading(false);
      }

    } catch (err) {
      console.error('Redirect error:', err);
      setError('An error occurred while processing your request');
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      handleRedirect(password);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Redirecting...</h2>
          <p className="text-gray-600">Please wait while we redirect you to your destination</p>
        </div>
      </div>
    );
  }

  if (passwordRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-6">
            <Lock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Password Required</h2>
            <p className="text-gray-600">This link is password protected. Please enter the password to continue.</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Verifying...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default RedirectPage;