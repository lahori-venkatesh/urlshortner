import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface AuthRedirectProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

const AuthRedirect: React.FC<AuthRedirectProps> = ({ 
  children, 
  redirectTo = '/dashboard', 
  requireAuth = false 
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Don't redirect while still loading authentication state
    if (isLoading) {
      console.log('AuthRedirect: Still loading authentication state...');
      return;
    }

    console.log('AuthRedirect: Auth loaded. isAuthenticated:', isAuthenticated, 'requireAuth:', requireAuth);

    if (requireAuth && !isAuthenticated) {
      console.log('AuthRedirect: Redirecting to landing page - auth required but not authenticated');
      // Redirect to landing page if auth is required but user is not authenticated
      navigate('/');
    } else if (!requireAuth && isAuthenticated && window.location.pathname === '/') {
      console.log('AuthRedirect: Redirecting authenticated user to dashboard');
      // Redirect authenticated users away from landing page to dashboard
      navigate(redirectTo);
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo, requireAuth]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthRedirect;