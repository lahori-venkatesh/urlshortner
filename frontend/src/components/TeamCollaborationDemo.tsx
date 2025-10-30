import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Crown, 
  Shield, 
  Eye, 
  Link, 
  QrCode, 
  Upload,
  BarChart3,
  Plus,
  Settings,
  Check
} from 'lucide-react';
import { useTeam } from '../context/TeamContext';
import { useAuth } from '../context/AuthContext';

const TeamCollaborationDemo: React.FC = () => {
  const { user } = useAuth();
  const { currentScope, teams } = useTeam();
  const [activeDemo, setActiveDemo] = useState<'overview' | 'switching' | 'permissions' | 'collaboration'>('overview');

  const demoSections = [
    {
      id: 'overview',
      title: 'Team Overview',
      description: 'See how teams work in Pebly',
      icon: Users
    },
    {
      id: 'switching',
      title: 'Workspace Switching',
      description: 'Switch between personal and team workspaces',
      icon: Settings
    },
    {
      id: 'permissions',
      title: 'Role Permissions',
      description: 'Understand different team roles',
      icon: Shield
    },
    {
      id: 'collaboration',
      title: 'Team Collaboration',
      description: 'Create and manage team content',
      icon: BarChart3
    }
  ];

  const rolePermissions = [
    {
      role: 'OWNER',
      icon: Crown,
      color: 'purple',
      permissions: [
        'Full team control',
        'Manage billing & subscription',
        'Add/remove any member',
        'Change member roles',
        'Delete team',
        'Create & edit all content'
      ]
    },
    {
      role: 'ADMIN',
      icon: Shield,
      color: 'blue',
      permissions: [
        'Invite new members',
        'Remove members (except owner)',
        'Create & edit all content',
        'View team analytics',
        'Manage team settings'
      ]
    },
    {
      role: 'MEMBER',
      icon: Users,
      color: 'green',
      permissions: [
        'Create team content',
        'Edit own content',
        'View team analytics',
        'Collaborate with team'
      ]
    },
    {
      role: 'VIEWER',
      icon: Eye,
      color: 'gray',
      permissions: [
        'View team content',
        'View team analytics',
        'Read-only access'
      ]
    }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Team Collaboration</h3>
        <p className="text-gray-600">
          Work together with your team to create, manage, and analyze links, QR codes, and files.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold">Team Workspaces</h4>
              <p className="text-blue-100 text-sm">Separate spaces for team collaboration</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-blue-100">
            <li className="flex items-center space-x-2">
              <Check className="w-4 h-4" />
              <span>Shared content creation</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="w-4 h-4" />
              <span>Team analytics & insights</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="w-4 h-4" />
              <span>Role-based permissions</span>
            </li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Current Status</h4>
              <p className="text-gray-600 text-sm">Your workspace information</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Current Workspace:</span>
              <span className="font-medium text-gray-900">{currentScope.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Workspace Type:</span>
              <span className="font-medium text-gray-900">
                {currentScope.type === 'TEAM' ? 'Team' : 'Personal'}
              </span>
            </div>
            {currentScope.type === 'TEAM' && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Your Role:</span>
                <span className="font-medium text-gray-900">{currentScope.role}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Teams Joined:</span>
              <span className="font-medium text-gray-900">{teams.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSwitching = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Workspace Switching</h3>
        <p className="text-gray-600">
          Seamlessly switch between your personal workspace and team workspaces.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Settings className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">How to Switch Workspaces</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
              <li>Click on your profile picture in the top-right corner</li>
              <li>Look for the "My Workspaces" section in the dropdown</li>
              <li>Click on any workspace to switch to it</li>
              <li>The dashboard will automatically update to show that workspace's content</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h5 className="font-medium text-gray-900">Personal Workspace</h5>
              <p className="text-xs text-gray-500">Your individual account</p>
            </div>
          </div>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Your personal links & QR codes</li>
            <li>• Individual analytics</li>
            <li>• Private content</li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h5 className="font-medium text-gray-900">Team Workspace</h5>
              <p className="text-xs text-gray-500">Collaborative environment</p>
            </div>
          </div>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Shared team content</li>
            <li>• Team analytics</li>
            <li>• Member collaboration</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderPermissions = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Role Permissions</h3>
        <p className="text-gray-600">
          Different roles have different levels of access and control within teams.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rolePermissions.map((role) => {
          const IconComponent = role.icon;
          const colorClasses = {
            purple: 'bg-purple-100 text-purple-700 border-purple-200',
            blue: 'bg-blue-100 text-blue-700 border-blue-200',
            green: 'bg-green-100 text-green-700 border-green-200',
            gray: 'bg-gray-100 text-gray-700 border-gray-200'
          };

          return (
            <div key={role.role} className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[role.color as keyof typeof colorClasses]}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{role.role}</h4>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colorClasses[role.color as keyof typeof colorClasses]}`}>
                    {role.role}
                  </div>
                </div>
              </div>
              <ul className="space-y-2">
                {role.permissions.map((permission, index) => (
                  <li key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>{permission}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderCollaboration = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Team Collaboration</h3>
        <p className="text-gray-600">
          Create and manage content together with your team members.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Link className="w-6 h-6 text-blue-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Team Links</h4>
          <p className="text-sm text-gray-600 mb-4">
            Create short links that belong to your team workspace.
          </p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• Shared with all team members</li>
            <li>• Team-wide analytics</li>
            <li>• Collaborative management</li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <QrCode className="w-6 h-6 text-purple-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Team QR Codes</h4>
          <p className="text-sm text-gray-600 mb-4">
            Generate QR codes for team campaigns and projects.
          </p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• Branded team QR codes</li>
            <li>• Shared scan analytics</li>
            <li>• Team customization</li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <Upload className="w-6 h-6 text-green-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Team Files</h4>
          <p className="text-sm text-gray-600 mb-4">
            Upload and share files within your team workspace.
          </p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• Team file sharing</li>
            <li>• Access control</li>
            <li>• Download analytics</li>
          </ul>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl p-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold mb-2">Team Analytics</h4>
            <p className="text-green-100 text-sm">
              Get insights into your team's performance with shared analytics, member activity tracking, 
              and collaborative reporting features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeDemo) {
      case 'overview': return renderOverview();
      case 'switching': return renderSwitching();
      case 'permissions': return renderPermissions();
      case 'collaboration': return renderCollaboration();
      default: return renderOverview();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Navigation */}
      <div className="flex flex-wrap gap-2 mb-8">
        {demoSections.map((section) => {
          const IconComponent = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveDemo(section.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeDemo === section.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              <span className="text-sm font-medium">{section.title}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <motion.div
        key={activeDemo}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderContent()}
      </motion.div>
    </div>
  );
};

export default TeamCollaborationDemo;