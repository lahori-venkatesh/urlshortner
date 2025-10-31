import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import toast from 'react-hot-toast';
import { debugInviteContext, validateInviteRequest } from '../utils/inviteValidation';

const InviteTestComponent: React.FC = () => {
  const { user } = useAuth();
  const { teams, inviteUser } = useTeam();
  const [testEmail, setTestEmail] = useState('venkateshlahori970@gmail.com');
  const [testRole, setTestRole] = useState('MEMBER');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTestInvite = async () => {
    if (!selectedTeamId) {
      toast.error('Please select a team');
      return;
    }

    setIsLoading(true);
    
    try {
      // Debug context
      debugInviteContext();
      
      // Validate request
      const validation = validateInviteRequest(selectedTeamId, testEmail, testRole, user?.id);
      
      if (!validation.isValid) {
        toast.error(validation.errors.join(', '));
        return;
      }
      
      console.log('🧪 Testing invite with:', {
        teamId: selectedTeamId,
        email: testEmail,
        role: testRole,
        userId: user?.id
      });
      
      await inviteUser(selectedTeamId, testEmail, testRole as any);
      toast.success('Test invite sent successfully!');
      
    } catch (error: any) {
      console.error('❌ Test invite failed:', error);
      toast.error(error.message || 'Test invite failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectAPITest = async () => {
    if (!selectedTeamId) {
      toast.error('Please select a team');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token || !user?.id) {
      toast.error('Authentication required');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/v1/teams/${selectedTeamId}/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          email: testEmail,
          role: testRole
        })
      });

      const data = await response.json();
      
      console.log('🧪 Direct API test result:', {
        status: response.status,
        statusText: response.statusText,
        data
      });

      if (response.ok) {
        toast.success('Direct API test successful!');
      } else {
        toast.error(`API test failed: ${data.message || response.statusText}`);
      }

    } catch (error: any) {
      console.error('❌ Direct API test failed:', error);
      toast.error('Direct API test failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div className="p-4 text-red-600">Please log in to test invite functionality</div>;
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🧪 Invite Test Component</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Team
          </label>
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a team...</option>
            {teams.map(team => (
              <option key={team.id} value={team.id}>
                {team.teamName} ({team.id.substring(0, 8)}...)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Test Email
          </label>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            value={testRole}
            onChange={(e) => setTestRole(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
            <option value="VIEWER">Viewer</option>
          </select>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleTestInvite}
            disabled={isLoading || !selectedTeamId}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Invite (via Context)'}
          </button>

          <button
            onClick={handleDirectAPITest}
            disabled={isLoading || !selectedTeamId}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Direct API Call'}
          </button>

          <button
            onClick={() => {
              debugInviteContext();
              console.log('Current teams:', teams);
              console.log('Selected team ID:', selectedTeamId);
              console.log('User:', user);
            }}
            className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
          >
            Debug Context
          </button>
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
        <p><strong>User ID:</strong> {user.id}</p>
        <p><strong>Teams:</strong> {teams.length}</p>
        <p><strong>Selected Team:</strong> {selectedTeamId || 'None'}</p>
      </div>
    </div>
  );
};

export default InviteTestComponent;