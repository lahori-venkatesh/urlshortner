import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import * as api from '../services/api';

export interface TeamMember {
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  joinedAt: string;
  isActive: boolean;
  name?: string;
  email?: string;
  profilePicture?: string;
}

export interface Team {
  id: string;
  teamName: string;
  ownerId: string;
  description?: string;
  logoUrl?: string;
  subscriptionPlan: string;
  subscriptionExpiry?: string;
  isActive: boolean;
  totalUrls: number;
  totalQrCodes: number;
  totalFiles: number;
  totalClicks: number;
  memberLimit: number;
  linkQuota: number;
  createdAt: string;
  updatedAt: string;
  members: TeamMember[];
}

export interface WorkspaceScope {
  type: 'USER' | 'TEAM';
  id: string;
  name: string;
  role?: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
}

interface TeamContextType {
  teams: Team[];
  currentScope: WorkspaceScope;
  isLoading: boolean;
  error: string | null;
  
  // Team management
  createTeam: (teamName: string, description?: string) => Promise<Team>;
  updateTeam: (teamId: string, teamName: string, description?: string) => Promise<Team>;
  deleteTeam: (teamId: string) => Promise<void>;
  
  // Member management
  inviteUser: (teamId: string, email: string, role: 'ADMIN' | 'MEMBER' | 'VIEWER') => Promise<void>;
  removeMember: (teamId: string, memberUserId: string) => Promise<void>;
  updateMemberRole: (teamId: string, memberUserId: string, role: 'ADMIN' | 'MEMBER' | 'VIEWER') => Promise<void>;
  
  // Workspace switching
  switchToPersonal: () => void;
  switchToTeam: (teamId: string) => void;
  
  // Data fetching
  refreshTeams: () => Promise<void>;
  getTeamMembers: (teamId: string) => Promise<TeamMember[]>;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
};

export const TeamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentScope, setCurrentScope] = useState<WorkspaceScope>({
    type: 'USER',
    id: user?.id || '',
    name: 'Personal Workspace'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize scope when user changes
  useEffect(() => {
    if (user) {
      setCurrentScope({
        type: 'USER',
        id: user.id,
        name: 'Personal Workspace'
      });
    }
  }, [user]);

  // Load teams when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshTeams();
    }
  }, [isAuthenticated, user]);

  const refreshTeams = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.getUserTeams();
      if (response.success) {
        setTeams(response.teams || []);
      } else {
        setError(response.message || 'Failed to load teams');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load teams');
    } finally {
      setIsLoading(false);
    }
  };

  const createTeam = async (teamName: string, description?: string): Promise<Team> => {
    try {
      const response = await api.createTeam({ teamName, description });
      if (response.success) {
        await refreshTeams();
        return response.team;
      } else {
        throw new Error(response.message || 'Failed to create team');
      }
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create team');
    }
  };

  const updateTeam = async (teamId: string, teamName: string, description?: string): Promise<Team> => {
    try {
      const response = await api.updateTeam(teamId, { teamName, description });
      if (response.success) {
        await refreshTeams();
        return response.team;
      } else {
        throw new Error(response.message || 'Failed to update team');
      }
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update team');
    }
  };

  const deleteTeam = async (teamId: string): Promise<void> => {
    try {
      const response = await api.deleteTeam(teamId);
      if (response.success) {
        // Switch to personal workspace if current team is deleted
        if (currentScope.type === 'TEAM' && currentScope.id === teamId) {
          switchToPersonal();
        }
        await refreshTeams();
      } else {
        throw new Error(response.message || 'Failed to delete team');
      }
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete team');
    }
  };

  const inviteUser = async (teamId: string, email: string, role: 'ADMIN' | 'MEMBER' | 'VIEWER'): Promise<void> => {
    try {
      const response = await api.inviteUserToTeam(teamId, { email, role });
      if (!response.success) {
        throw new Error(response.message || 'Failed to invite user');
      }
    } catch (err: any) {
      throw new Error(err.message || 'Failed to invite user');
    }
  };

  const removeMember = async (teamId: string, memberUserId: string): Promise<void> => {
    try {
      const response = await api.removeTeamMember(teamId, memberUserId);
      if (response.success) {
        await refreshTeams();
      } else {
        throw new Error(response.message || 'Failed to remove member');
      }
    } catch (err: any) {
      throw new Error(err.message || 'Failed to remove member');
    }
  };

  const updateMemberRole = async (teamId: string, memberUserId: string, role: 'ADMIN' | 'MEMBER' | 'VIEWER'): Promise<void> => {
    try {
      const response = await api.updateTeamMemberRole(teamId, memberUserId, { role });
      if (response.success) {
        await refreshTeams();
      } else {
        throw new Error(response.message || 'Failed to update member role');
      }
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update member role');
    }
  };

  const switchToPersonal = () => {
    if (user) {
      setCurrentScope({
        type: 'USER',
        id: user.id,
        name: 'Personal Workspace'
      });
    }
  };

  const switchToTeam = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (team && user) {
      const member = team.members.find(m => m.userId === user.id);
      setCurrentScope({
        type: 'TEAM',
        id: teamId,
        name: team.teamName,
        role: member?.role
      });
    }
  };

  const getTeamMembers = async (teamId: string): Promise<TeamMember[]> => {
    try {
      const response = await api.getTeamMembers(teamId);
      if (response.success) {
        return response.members || [];
      } else {
        throw new Error(response.message || 'Failed to get team members');
      }
    } catch (err: any) {
      throw new Error(err.message || 'Failed to get team members');
    }
  };

  return (
    <TeamContext.Provider value={{
      teams,
      currentScope,
      isLoading,
      error,
      createTeam,
      updateTeam,
      deleteTeam,
      inviteUser,
      removeMember,
      updateMemberRole,
      switchToPersonal,
      switchToTeam,
      refreshTeams,
      getTeamMembers
    }}>
      {children}
    </TeamContext.Provider>
  );
};