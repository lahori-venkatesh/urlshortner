import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Settings, 
  UserPlus, 
  Crown, 
  Shield, 
  Eye, 
  MoreVertical,
  Mail,
  Calendar,
  Trash2,
  Edit3
} from 'lucide-react';
import { useTeam } from '../context/TeamContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { validateInviteRequest, debugInviteContext } from '../utils/inviteValidation';

interface TeamManagementProps {
  teamId: string;
}

const TeamManagement: React.FC<TeamManagementProps> = ({ teamId }) => {
  const { user } = useAuth();
  const { teams, getTeamMembers, inviteUser, removeMember, updateMemberRole } = useTeam();
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'MEMBER' });
  const [isInviting, setIsInviting] = useState(false);

  const team = teams.find(t => t.id === teamId);
  const userRole = team?.members.find(m => m.userId === user?.id)?.role;

  useEffect(() => {
    loadMembers();
  }, [teamId]);

  const loadMembers = async () => {
    try {
      setIsLoading(true);
      const teamMembers = await getTeamMembers(teamId);
      setMembers(teamMembers);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load team members');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Debug current context
    debugInviteContext();
    
    console.log('🔍 Invite form submission:', { 
      teamId, 
      email: inviteForm.email, 
      role: inviteForm.role,
      userId: user?.id 
    });
    
    // Comprehensive validation
    const validation = validateInviteRequest(
      teamId,
      inviteForm.email,
      inviteForm.role,
      user?.id
    );
    
    // Show warnings
    validation.warnings.forEach(warning => {
      console.warn('⚠️ Invite warning:', warning);
    });
    
    // Handle validation errors
    if (!validation.isValid) {
      const errorMessage = validation.errors.join(', ');
      console.error('❌ Validation failed:', validation.errors);
      toast.error(errorMessage);
      return;
    }

    setIsInviting(true);
    
    try {
      console.log('🚀 Calling inviteUser with validated data...');
      await inviteUser(teamId, inviteForm.email.trim(), inviteForm.role as any);
      
      console.log('✅ Invite successful');
      toast.success('Invitation sent successfully!');
      setInviteForm({ email: '', role: 'MEMBER' });
      setShowInviteModal(false);
      
      // Reload members to show any updates
      loadMembers();
      
    } catch (error: any) {
      console.error('❌ Invite failed:', error);
      
      // Provide more specific error messages
      let errorMessage = error.message || 'Failed to send invitation';
      
      if (errorMessage.includes('already a team member')) {
        errorMessage = 'This user is already a member of the team.';
      } else if (errorMessage.includes('Invite already sent')) {
        errorMessage = 'An invitation has already been sent to this email address.';
      } else if (errorMessage.includes('Insufficient permissions')) {
        errorMessage = 'You do not have permission to invite members to this team.';
      } else if (errorMessage.includes('Team not found')) {
        errorMessage = 'Team not found. Please refresh the page and try again.';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberUserId: string, memberName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
      return;
    }

    try {
      await removeMember(teamId, memberUserId);
      toast.success('Member removed successfully');
      loadMembers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove member');
    }
  };

  const handleUpdateRole = async (memberUserId: string, newRole: string, memberName: string) => {
    try {
      await updateMemberRole(teamId, memberUserId, newRole as any);
      toast.success(`${memberName}'s role updated to ${newRole}`);
      loadMembers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update role');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER': return <Crown className="w-4 h-4 text-purple-600" />;
      case 'ADMIN': return <Shield className="w-4 h-4 text-blue-600" />;
      case 'MEMBER': return <Users className="w-4 h-4 text-green-600" />;
      case 'VIEWER': return <Eye className="w-4 h-4 text-gray-600" />;
      default: return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'ADMIN': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'MEMBER': return 'bg-green-100 text-green-700 border-green-200';
      case 'VIEWER': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const canManageMembers = userRole === 'OWNER' || userRole === 'ADMIN';
  const canChangeRoles = userRole === 'OWNER';

  if (!team) {
    return <div className="text-center py-8 text-gray-500">Team not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Members</h2>
          <p className="text-gray-600 mt-1">
            Manage your team members and their permissions
          </p>
        </div>
        
        {canManageMembers && (
          <div className="flex space-x-2">
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Member</span>
            </button>
            
            {/* Debug button - remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={() => {
                  debugInviteContext();
                  console.log('🔍 Team Context:', { teamId, team, userRole, canManageMembers });
                }}
                className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm"
                title="Debug invite context"
              >
                Debug
              </button>
            )}
          </div>
        )}
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Members</p>
              <p className="text-xl font-semibold text-gray-900">{members.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Admins</p>
              <p className="text-xl font-semibold text-gray-900">
                {members.filter(m => m.role === 'ADMIN' || m.role === 'OWNER').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Crown className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Plan</p>
              <p className="text-xl font-semibold text-gray-900">
                {team.subscriptionPlan.includes('BUSINESS') ? 'Business' : 'Free'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Members ({members.length})</h3>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading members...</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {members.map((member) => (
              <div key={member.userId} className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <img
                    src={member.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'User')}&background=3b82f6&color=fff`}
                    alt={member.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900">{member.name}</p>
                      {member.userId === user?.id && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">You</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{member.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getRoleColor(member.role)}`}>
                    {getRoleIcon(member.role)}
                    <span className="text-sm font-medium">{member.role}</span>
                  </div>
                  
                  {canManageMembers && member.userId !== user?.id && member.role !== 'OWNER' && (
                    <div className="relative">
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member.userId, e.target.value, member.name)}
                        disabled={!canChangeRoles && member.role === 'ADMIN'}
                        className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                      >
                        <option value="MEMBER">Member</option>
                        <option value="ADMIN">Admin</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                    </div>
                  )}
                  
                  {canManageMembers && member.userId !== user?.id && member.role !== 'OWNER' && (
                    <button
                      onClick={() => handleRemoveMember(member.userId, member.name)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Invite Team Member</h3>
              <p className="text-sm text-gray-600 mt-1">Send an invitation to join your team</p>
            </div>
            
            <form onSubmit={handleInviteUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isInviting}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isInviting}
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                  <option value="VIEWER">Viewer</option>
                </select>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  disabled={isInviting}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting || !inviteForm.email.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {isInviting ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;