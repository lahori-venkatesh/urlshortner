import React, { useState } from 'react';

// Team Management Page - Complete Implementation
const TeamsPage = ({ hasPermission }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const [activeTab, setActiveTab] = useState('teams');

  // Mock team data
  const teams = [
    {
      id: 1,
      name: 'Marketing Team',
      description: 'Handles all marketing campaigns and content',
      owner: 'Sarah Wilson',
      members: 8,
      plan: 'Business',
      created: '2024-01-15',
      status: 'Active',
      domains: ['marketing.pebly.com', 'campaigns.pebly.com'],
      usage: { links: 1250, clicks: 45678, storage: '2.3 GB' }
    },
    {
      id: 2,
      name: 'Development Team',
      description: 'Software development and technical operations',
      owner: 'Mike Johnson',
      members: 12,
      plan: 'Enterprise',
      created: '2024-01-10',
      status: 'Active',
      domains: ['dev.pebly.com', 'api.pebly.com', 'staging.pebly.com'],
      usage: { links: 3450, clicks: 123456, storage: '8.7 GB' }
    },
    {
      id: 3,
      name: 'Sales Team',
      description: 'Customer acquisition and relationship management',
      owner: 'Emma Davis',
      members: 6,
      plan: 'Pro',
      created: '2024-01-20',
      status: 'Active',
      domains: ['sales.pebly.com'],
      usage: { links: 890, clicks: 23456, storage: '1.2 GB' }
    },
    {
      id: 4,
      name: 'Support Team',
      description: 'Customer support and success',
      owner: 'Alex Brown',
      members: 4,
      plan: 'Pro',
      created: '2024-01-25',
      status: 'Suspended',
      domains: ['help.pebly.com'],
      usage: { links: 234, clicks: 5678, storage: '0.5 GB' }
    }
  ];

  const teamMembers = [
    { id: 1, name: 'Sarah Wilson', email: 'sarah@company.com', role: 'Owner', team: 'Marketing Team', status: 'Active', lastActive: '2 min ago' },
    { id: 2, name: 'John Doe', email: 'john@company.com', role: 'Admin', team: 'Marketing Team', status: 'Active', lastActive: '1 hour ago' },
    { id: 3, name: 'Jane Smith', email: 'jane@company.com', role: 'Member', team: 'Marketing Team', status: 'Active', lastActive: '3 hours ago' },
    { id: 4, name: 'Mike Johnson', email: 'mike@company.com', role: 'Owner', team: 'Development Team', status: 'Active', lastActive: '5 min ago' },
    { id: 5, name: 'Lisa Chen', email: 'lisa@company.com', role: 'Admin', team: 'Development Team', status: 'Active', lastActive: '30 min ago' },
    { id: 6, name: 'Emma Davis', email: 'emma@company.com', role: 'Owner', team: 'Sales Team', status: 'Active', lastActive: '1 hour ago' },
    { id: 7, name: 'Alex Brown', email: 'alex@company.com', role: 'Owner', team: 'Support Team', status: 'Inactive', lastActive: '2 days ago' }
  ];

  const invitations = [
    { id: 1, email: 'newuser@company.com', team: 'Marketing Team', role: 'Member', invitedBy: 'Sarah Wilson', sent: '2024-01-30', status: 'Pending' },
    { id: 2, email: 'developer@company.com', team: 'Development Team', role: 'Admin', invitedBy: 'Mike Johnson', sent: '2024-01-29', status: 'Accepted' },
    { id: 3, email: 'sales@company.com', team: 'Sales Team', role: 'Member', invitedBy: 'Emma Davis', sent: '2024-01-28', status: 'Expired' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage teams, members, and organizational structure</p>
        </div>
        <div className="flex space-x-3">
          {hasPermission('teams', 'invite') && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Invite Members
            </button>
          )}
          {hasPermission('teams', 'create') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Team
            </button>
          )}
        </div>
      </div>

      {/* Team Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Teams</h3>
          <p className="text-2xl font-bold text-blue-600 mt-2">{teams.length}</p>
          <p className="text-sm text-green-600 mt-1">+2 this month</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Members</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">{teamMembers.length}</p>
          <p className="text-sm text-green-600 mt-1">+5 this month</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Teams</h3>
          <p className="text-2xl font-bold text-purple-600 mt-2">{teams.filter(t => t.status === 'Active').length}</p>
          <p className="text-sm text-gray-500 mt-1">75% active rate</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Invites</h3>
          <p className="text-2xl font-bold text-yellow-600 mt-2">{invitations.filter(i => i.status === 'Pending').length}</p>
          <p className="text-sm text-yellow-600 mt-1">Needs attention</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'teams', label: 'Teams', count: teams.length },
            { id: 'members', label: 'Members', count: teamMembers.length },
            { id: 'invitations', label: 'Invitations', count: invitations.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Teams Tab */}
      {activeTab === 'teams' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Team</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Owner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Members</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {teams.map((team) => (
                <tr key={team.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{team.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{team.description}</div>
                      <div className="text-xs text-gray-400 mt-1">{team.domains.length} domains</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{team.owner}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{team.members}</span>
                      <span className="ml-2 text-xs text-gray-500">members</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${team.plan === 'Enterprise' ? 'bg-purple-100 text-purple-800' :
                      team.plan === 'Business' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                      {team.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <div>{team.usage.links} links</div>
                      <div>{team.usage.clicks.toLocaleString()} clicks</div>
                      <div>{team.usage.storage}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${team.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {team.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800">View</button>
                      {hasPermission('teams', 'edit') && (
                        <button className="text-green-600 hover:text-green-800">Edit</button>
                      )}
                      {hasPermission('teams', 'delete') && (
                        <button className="text-red-600 hover:text-red-800">Suspend</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Team</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Last Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {teamMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">{member.name.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{member.team}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${member.role === 'Owner' ? 'bg-red-100 text-red-800' :
                      member.role === 'Admin' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${member.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{member.lastActive}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800">View</button>
                      {hasPermission('teams', 'edit') && (
                        <button className="text-green-600 hover:text-green-800">Edit Role</button>
                      )}
                      {hasPermission('teams', 'remove') && (
                        <button className="text-red-600 hover:text-red-800">Remove</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invitations Tab */}
      {activeTab === 'invitations' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Team</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Invited By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {invitations.map((invitation) => (
                <tr key={invitation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{invitation.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{invitation.team}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${invitation.role === 'Admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                      {invitation.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{invitation.invitedBy}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{invitation.sent}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${invitation.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      invitation.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                      {invitation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex space-x-2">
                      {invitation.status === 'Pending' && (
                        <>
                          <button className="text-blue-600 hover:text-blue-800">Resend</button>
                          <button className="text-red-600 hover:text-red-800">Cancel</button>
                        </>
                      )}
                      {invitation.status === 'Expired' && (
                        <button className="text-green-600 hover:text-green-800">Resend</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Team</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Team Name</label>
                <input type="text" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="Marketing Team" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" rows="3" placeholder="Team description..."></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Plan</label>
                <select className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  <option>Pro</option>
                  <option>Business</option>
                  <option>Enterprise</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Team Owner Email</label>
                <input type="email" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="owner@company.com" />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Create Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Members Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Invite Team Members</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Addresses</label>
                <textarea className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" rows="3" placeholder="user1@company.com&#10;user2@company.com&#10;user3@company.com"></textarea>
                <p className="text-xs text-gray-500 mt-1">Enter one email per line</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Team</label>
                <select className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  <option>Marketing Team</option>
                  <option>Development Team</option>
                  <option>Sales Team</option>
                  <option>Support Team</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                <select className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  <option>Member</option>
                  <option>Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Personal Message (Optional)</label>
                <textarea className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" rows="2" placeholder="Welcome to our team!"></textarea>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Send Invitations
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsPage;
