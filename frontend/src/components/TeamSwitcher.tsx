import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Crown, 
  ChevronRight, 
  Building2,
  User,
  Check
} from 'lucide-react';
import { useTeam } from '../context/TeamContext';
import { useAuth } from '../context/AuthContext';
import CreateTeamModal from './CreateTeamModal';

interface TeamSwitcherProps {
  onClose?: () => void;
}

const TeamSwitcher: React.FC<TeamSwitcherProps> = ({ onClose }) => {
  const { user } = useAuth();
  const { teams, currentScope, switchToPersonal, switchToTeam } = useTeam();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleSwitchToPersonal = () => {
    switchToPersonal();
    onClose?.();
  };

  const handleSwitchToTeam = (teamId: string) => {
    switchToTeam(teamId);
    onClose?.();
  };

  const handleCreateTeam = () => {
    setShowCreateModal(true);
  };

  const getRoleBadge = (role: string) => {
    const roleColors = {
      OWNER: 'bg-purple-100 text-purple-700',
      ADMIN: 'bg-blue-100 text-blue-700',
      MEMBER: 'bg-green-100 text-green-700',
      VIEWER: 'bg-gray-100 text-gray-700'
    };
    
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${roleColors[role as keyof typeof roleColors] || roleColors.MEMBER}`}>
        {role}
      </span>
    );
  };

  return (
    <>
      <div className="py-2">
        <div className="px-4 py-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            My Workspaces
          </p>
        </div>
        
        {/* Personal Workspace */}
        <button
          onClick={handleSwitchToPersonal}
          className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
            currentScope.type === 'USER' ? 'bg-blue-50 border-r-2 border-blue-500' : ''
          }`}
        >
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Personal Workspace</p>
              <p className="text-xs text-gray-500">Your individual account</p>
            </div>
          </div>
          {currentScope.type === 'USER' && (
            <Check className="w-4 h-4 text-blue-600" />
          )}
        </button>

        {/* Team Workspaces */}
        {teams.length > 0 && (
          <div className="mt-2">
            {teams.map((team) => {
              const userMember = team.members.find(m => m.userId === user?.id);
              const isCurrentTeam = currentScope.type === 'TEAM' && currentScope.id === team.id;
              
              return (
                <button
                  key={team.id}
                  onClick={() => handleSwitchToTeam(team.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                    isCurrentTeam ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center mr-3">
                      {team.logoUrl ? (
                        <img 
                          src={team.logoUrl} 
                          alt={team.teamName}
                          className="w-6 h-6 rounded"
                        />
                      ) : (
                        <Building2 className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{team.teamName}</p>
                        {userMember && getRoleBadge(userMember.role)}
                      </div>
                      <p className="text-xs text-gray-500">
                        {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                        {team.subscriptionPlan.includes('BUSINESS') && (
                          <Crown className="w-3 h-3 text-yellow-500 inline ml-1" />
                        )}
                      </p>
                    </div>
                  </div>
                  {isCurrentTeam && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Create New Team */}
        <div className="mt-2 border-t border-gray-100 pt-2">
          <button
            onClick={handleCreateTeam}
            className="w-full flex items-center px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <Plus className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-medium">Create New Team</p>
              <p className="text-xs text-gray-500">Start collaborating with others</p>
            </div>
            <ChevronRight className="w-4 h-4 ml-auto" />
          </button>
        </div>
      </div>

      {/* Create Team Modal */}
      <CreateTeamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          onClose?.();
        }}
      />
    </>
  );
};

export default TeamSwitcher;