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
  redirectTo = '/app', 
  requireAuth = false 
}) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (requireAuth && !isAuthenticated) {
      // Redirect to landing page if auth is required but user is not authenticated
      navigate('/');
    } else if (!requireAuth && isAuthenticated && window.location.pathname === '/') {
      // Redirect authenticated users away from landing page to dashboard
      navigate(redirectTo);
    }
  }, [isAuthenticated, navigate, redirectTo, requireAuth]);

  return <>{children}</>;
};

export default AuthRedirect;