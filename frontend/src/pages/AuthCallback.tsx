import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { googleAuthService } from '../services/googleAuth';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          throw new Error(`OAuth error: ${error}`);
        }

        if (!code) {
          throw new Error('No authorization code received');
        }

        setMessage('Exchanging authorization code...');
        
        // Handle the OAuth callback
        const authResponse = await googleAuthService.handleCallback(code);
        
        setMessage('Setting up your account...');
        
        // The response now contains both user info and tokens
        if (authResponse.user) {
          // Store user info
          googleAuthService.storeUserInfo(authResponse.user);
          
          // Update auth context with the user data from backend
          const userData = {
            id: authResponse.user.id,
            name: `${authResponse.user.firstName} ${authResponse.user.lastName}`,
            email: authResponse.user.email,
            plan: authResponse.user.subscriptionPlan || 'free',
            avatar: authResponse.user.profilePicture,
            picture: authResponse.user.profilePicture,
            createdAt: new Date().toISOString(),
            timezone: 'Asia/Kolkata',
            language: 'en',
            isAuthenticated: true,
            authProvider: 'google' as 'google'
          };
          
          console.log('Setting user data:', userData);
          setUser(userData);

          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          
          toast.success('Successfully signed in with Google!');
          
          // Redirect immediately after setting user
          console.log('Redirecting to dashboard...');
          navigate('/dashboard', { replace: true });

        } else {
          throw new Error('Invalid response from authentication server');
        }

      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        
        let errorMessage = 'Authentication failed';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        
        // Add more specific error messages
        if (errorMessage.includes('Failed to exchange code')) {
          errorMessage = 'Failed to verify with Google. Please check your internet connection and try again.';
        } else if (errorMessage.includes('Authentication failed')) {
          errorMessage = 'Google authentication failed. Please ensure you have the correct permissions and try again.';
        }
        
        setMessage(errorMessage);
        toast.error(errorMessage);
        
        // Redirect to home page after error
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 5000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, setUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          {status === 'loading' && (
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          )}
          
          {status === 'success' && (
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          )}
          
          {status === 'error' && (
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {status === 'loading' && 'Authenticating...'}
          {status === 'success' && 'Welcome to Pebly!'}
          {status === 'error' && 'Authentication Failed'}
        </h2>

        <p className="text-gray-600 mb-6">
          {message}
        </p>

        {status === 'loading' && (
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        )}

        {status === 'error' && (
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </button>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;