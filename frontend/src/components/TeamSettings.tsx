import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Users, 
  Shield, 
  Trash2, 
  Edit3, 
  Save, 
  X,
  AlertTriangle,
  Crown,
  Globe,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { useTeam } from '../context/TeamContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface TeamSettingsProps {
  teamId: string;
}

const TeamSettings: React.FC<TeamSettingsProps> = ({ teamId }) => {
  const { user } = useAuth();
  const { teams, updateTeam, deleteTeam } = useTeam();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  const [formData, setFormData] = useState({
    teamName: '',
    description: '',
    isPublic: false,
    allowMemberInvites: true,
    requireApproval: false
  });

  const team = teams.find(t => t.id === teamId);
  const userRole = team?.members.find(m => m.userId === user?.id)?.role;
  const canManageSettings = userRole === 'OWNER' || userRole === 'ADMIN';
  const canDeleteTeam = userRole === 'OWNER';

  useEffect(() => {
    if (team) {
      setFormData({
        teamName: team.teamName,
        description: team.description || '',
        isPublic: false, // This would come from team settings
        allowMemberInvites: true, // This would come from team settings
        requireApproval: false // This would come from team settings
      });
    }
  }, [team]);

  const handleSaveSettings = async () => {
    if (!canManageSettings) {
      toast.error('You do not have permission to modify team settings');
      return;
    }

    if (!formData.teamName.trim()) {
      toast.error('Team name is required');
      return;
    }

    try {
      await updateTeam(teamId, formData.teamName.trim(), formData.description.trim());
      toast.success('Team settings updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update team settings');
    }
  };

  const handleDeleteTeam = async () => {
    if (!canDeleteTeam) {
      toast.error('Only team owners can delete teams');
      return;
    }

    if (deleteConfirmText !== team?.teamName) {
      toast.error('Please type the team name exactly to confirm deletion');
      return;
    }

    setIsDeleting(true);
    
    try {
      await deleteTeam(teamId);
      toast.success('Team deleted successfully');
      // Navigation will be handled by the TeamContext
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete team');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    }
  };

  if (!team) {
    return <div className="text-center py-8 text-gray-500">Team not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Settings className="w-6 h-6 mr-2" />
            Team Settings
          </h2>
          <p className="text-gray-600 mt-1">
            Manage your team configuration and preferences
          </p>
        </div>
        
        {canManageSettings && (
          <div className="flex items-center space-x-3">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Settings</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Team Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.teamName}
                onChange={(e) => setFormData(prev => ({ ...prev, teamName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter team name"
              />
            ) : (
              <p className="text-gray-900 font-medium">{team.teamName}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team ID
            </label>
            <p className="text-gray-600 font-mono text-sm bg-gray-50 px-3 py-2 rounded-lg">
              {team.id}
            </p>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            {isEditing ? (
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter team description (optional)"
              />
            ) : (
              <p className="text-gray-600">
                {team.description || 'No description provided'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Team Statistics */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Statistics</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{team.members.length}</p>
            <p className="text-sm text-gray-600">Members</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Globe className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{team.totalUrls}</p>
            <p className="text-sm text-gray-600">URLs</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Eye className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{team.totalClicks}</p>
            <p className="text-sm text-gray-600">Clicks</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Crown className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {team.subscriptionPlan.includes('BUSINESS') ? 'Business' : 'Free'}
            </p>
            <p className="text-sm text-gray-600">Plan</p>
          </div>
        </div>
      </div>

      {/* Team Permissions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Permissions</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Public Team</h4>
              <p className="text-sm text-gray-600">Allow anyone to discover and request to join this team</p>
            </div>
            {isEditing ? (
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            ) : (
              <span className={`px-3 py-1 rounded-full text-sm ${formData.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {formData.isPublic ? 'Public' : 'Private'}
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Member Invites</h4>
              <p className="text-sm text-gray-600">Allow team members to invite new users</p>
            </div>
            {isEditing ? (
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allowMemberInvites}
                  onChange={(e) => setFormData(prev => ({ ...prev, allowMemberInvites: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            ) : (
              <span className={`px-3 py-1 rounded-full text-sm ${formData.allowMemberInvites ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {formData.allowMemberInvites ? 'Enabled' : 'Disabled'}
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Require Approval</h4>
              <p className="text-sm text-gray-600">Require admin approval for new member invitations</p>
            </div>
            {isEditing ? (
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requireApproval}
                  onChange={(e) => setFormData(prev => ({ ...prev, requireApproval: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            ) : (
              <span className={`px-3 py-1 rounded-full text-sm ${formData.requireApproval ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                {formData.requireApproval ? 'Required' : 'Not Required'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      {canDeleteTeam && (
        <div className="bg-white rounded-lg border border-red-200 p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Danger Zone
          </h3>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-red-900">Delete Team</h4>
                <p className="text-sm text-red-700 mt-1">
                  Permanently delete this team and all associated data. This action cannot be undone.
                </p>
                <ul className="text-sm text-red-600 mt-2 space-y-1">
                  <li>• All team URLs, QR codes, and files will be deleted</li>
                  <li>• All team members will lose access</li>
                  <li>• Analytics data will be permanently lost</li>
                </ul>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Team</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-red-900 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Delete Team
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                This action cannot be undone. Please confirm by typing the team name.
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <strong>{team.teamName}</strong> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={team.teamName}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTeam}
                  disabled={isDeleting || deleteConfirmText !== team.teamName}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Team'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default TeamSettings;