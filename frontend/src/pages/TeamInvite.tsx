import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Check, X, Loader2, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import * as api from '../services/api';
import toast from 'react-hot-toast';

const TeamInvite: React.FC = () => {
  const { inviteToken } = useParams<{ inviteToken: string }>();
  const { user, isAuthenticated } = useAuth();
  const { refreshTeams, switchToTeam } = useTeam();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [inviteData, setInviteData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      // Store invite token and redirect to login
      localStorage.setItem('pendingInviteToken', inviteToken || '');
      navigate('/', { state: { message: 'Please sign in to accept the team invitation' } });
      return;
    }

    loadInviteData();
  }, [isAuthenticated, inviteToken]);

  const loadInviteData = async () => {
    if (!inviteToken) {
      setError('Invalid invite link');
      setIsLoading(false);
      return;
    }

    try {
      // For now, we'll accept the invite directly since we don't have a separate endpoint to get invite details
      // In a production app, you'd want a separate endpoint to get invite details first
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load invitation details');
      setIsLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!inviteToken) return;

    setIsAccepting(true);
    
    try {
      const response = await api.acceptTeamInvite(inviteToken);
      
      if (response.success) {
        toast.success('Successfully joined the team!');
        
        // Refresh teams and switch to the new team
        await refreshTeams();
        
        if (response.team) {
          switchToTeam(response.team.id);
          navigate('/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        throw new Error(response.message || 'Failed to accept invitation');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept invitation');
      setError(err.message || 'Failed to accept invitation');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = () => {
    navigate('/dashboard');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Team Invitation</h1>
          <p className="text-gray-600">
            You've been invited to join a team on Pebly
          </p>
        </div>

        {/* User Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=3b82f6&color=fff`}
              alt={user?.name}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="font-medium text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Invitation Details */}
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Crown className="w-3 h-3 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-900">Team Benefits</h4>
                <ul className="text-xs text-blue-700 mt-1 space-y-1">
                  <li>• Collaborate on links and QR codes</li>
                  <li>• Shared analytics and insights</li>
                  <li>• Team-wide content management</li>
                  <li>• Role-based permissions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleAcceptInvite}
            disabled={isAccepting}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isAccepting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Accepting...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Accept Invitation</span>
              </>
            )}
          </button>
          
          <button
            onClick={handleDecline}
            disabled={isAccepting}
            className="w-full px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Maybe Later
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            By accepting, you agree to collaborate with this team on Pebly
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default TeamInvite;