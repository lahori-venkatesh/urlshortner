import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  UserGroupIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  UserPlusIcon,
  ArrowDownTrayIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import { adminApiEndpoints } from '../../services/api';
import { Team, FilterOptions } from '../../types';
import DataTable, { Column } from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import TeamFilters from './components/TeamFilters';
import TeamForm from './components/TeamForm';
import TeamTransferModal from './components/TeamTransferModal';

const TeamsPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({});
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTeam, setTransferTeam] = useState<Team | null>(null);

  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  // Fetch teams
  const { data: teamsData, isLoading } = useQuery({
    queryKey: ['teams', currentPage, pageSize, sortBy, sortOrder, search, filters],
    queryFn: () => adminApiEndpoints.teams.list({
      page: currentPage - 1,
      size: pageSize,
      sortBy,
      sortOrder,
      search,
      ...filters,
    }),
    keepPreviousData: true,
  });

  // Mutations
  const deleteTeamMutation = useMutation({
    mutationFn: (id: string) => adminApiEndpoints.teams.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['teams']);
      toast.success('Team deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete team');
    },
  });

  const teams = teamsData?.data?.data?.content || [];
  const totalPages = teamsData?.data?.data?.totalPages || 0;
  const totalItems = teamsData?.data?.data?.totalElements || 0;

  const columns: Column<Team>[] = [
    {
      key: 'name',
      label: 'Team',
      sortable: true,
      render: (_, team) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mr-3">
            <BuildingOfficeIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {team.name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {team.members?.length || 0} members
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'owner',
      label: 'Owner',
      render: (_, team) => (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {team.owner?.name}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {team.owner?.email}
          </div>
        </div>
      ),
    },
    {
      key: 'plan',
      label: 'Plan',
      sortable: true,
      render: (plan) => (
        <Badge
          variant={
            plan === 'ENTERPRISE' ? 'info' :
            plan === 'BUSINESS' ? 'success' :
            plan === 'PRO' ? 'warning' : 'default'
          }
        >
          {plan}
        </Badge>
      ),
    },
    {
      key: 'usage',
      label: 'Usage',
      render: (_, team) => (
        <div className="text-sm">
          <div className="text-gray-900 dark:text-white">
            {team.usage?.linksCreated || 0} / {team.usage?.linksLimit || 0} links
          </div>
          <div className="text-gray-500 dark:text-gray-400">
            {team.usage?.membersCount || 0} / {team.usage?.membersLimit || 0} members
          </div>
          <div className="text-gray-500 dark:text-gray-400">
            {team.usage?.domainsUsed || 0} / {team.usage?.domainsLimit || 0} domains
          </div>
        </div>
      ),
    },
    {
      key: 'domains',
      label: 'Domains',
      render: (_, team) => (
        <div className="text-sm">
          {team.domains?.length > 0 ? (
            <div className="space-y-1">
              {team.domains.slice(0, 2).map((domain, index) => (
                <div key={index} className="text-gray-900 dark:text-white">
                  {domain.domain}
                </div>
              ))}
              {team.domains.length > 2 && (
                <div className="text-gray-500 dark:text-gray-400">
                  +{team.domains.length - 2} more
                </div>
              )}
            </div>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">No domains</span>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (date) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(date).toLocaleDateString()}
        </div>
      ),
    },
  ];

  const handleSort = (newSortBy: string, newSortOrder: 'ASC' | 'DESC') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  const handleDeleteTeam = (team: Team) => {
    if (window.confirm(`Are you sure you want to delete team "${team.name}"? This action cannot be undone.`)) {
      deleteTeamMutation.mutate(team.id);
    }
  };

  const handleTransferOwnership = (team: Team) => {
    setTransferTeam(team);
    setShowTransferModal(true);
  };

  const renderRowActions = (team: Team) => (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        icon={<EyeIcon className="w-4 h-4" />}
        onClick={() => window.open(`/teams/${team.id}`, '_blank')}
      />
      
      {hasPermission('teams', 'update') && (
        <Button
          variant="ghost"
          size="sm"
          icon={<PencilIcon className="w-4 h-4" />}
          onClick={() => {
            setEditingTeam(team);
            setShowTeamForm(true);
          }}
        />
      )}

      {hasPermission('teams', 'transfer') && (
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowPathIcon className="w-4 h-4" />}
          onClick={() => handleTransferOwnership(team)}
        />
      )}

      {hasPermission('teams', 'delete') && (
        <Button
          variant="ghost"
          size="sm"
          icon={<TrashIcon className="w-4 h-4" />}
          onClick={() => handleDeleteTeam(team)}
        />
      )}
    </div>
  );

  const bulkActions = [
    {
      label: 'Export Selected',
      action: (ids: string[]) => {
        toast.success('Export started');
      },
      variant: 'secondary' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Team Management
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage team accounts, members, and permissions
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasPermission('teams', 'export') && (
            <Button
              variant="secondary"
              icon={<ArrowDownTrayIcon className="w-4 h-4" />}
              onClick={() => toast.success('Export started')}
            >
              Export All
            </Button>
          )}
          {hasPermission('teams', 'create') && (
            <Button
              variant="primary"
              icon={<UserPlusIcon className="w-4 h-4" />}
              onClick={() => {
                setEditingTeam(null);
                setShowTeamForm(true);
              }}
            >
              Create Team
            </Button>
          )}
        </div>
      </div>

      {/* Teams Table */}
      <DataTable
        columns={columns}
        data={teams}
        loading={isLoading}
        pagination={{
          currentPage,
          totalPages,
          totalItems,
          pageSize,
          onPageChange: setCurrentPage,
        }}
        sorting={{
          sortBy,
          sortOrder,
          onSort: handleSort,
        }}
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Search teams by name...',
        }}
        filters={<TeamFilters filters={filters} onFiltersChange={setFilters} />}
        actions={{
          bulk: { actions: bulkActions },
          row: renderRowActions,
        }}
        selectable={hasPermission('teams', 'bulk_actions')}
        onSelectionChange={setSelectedTeamIds}
        emptyState={
          <div className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No teams found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating a new team.
            </p>
          </div>
        }
      />

      {/* Team Form Modal */}
      <Modal
        isOpen={showTeamForm}
        onClose={() => setShowTeamForm(false)}
        title={editingTeam ? 'Edit Team' : 'Create Team'}
        size="lg"
      >
        <TeamForm
          team={editingTeam}
          onSuccess={() => {
            setShowTeamForm(false);
            queryClient.invalidateQueries(['teams']);
          }}
          onCancel={() => setShowTeamForm(false)}
        />
      </Modal>

      {/* Transfer Ownership Modal */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title="Transfer Team Ownership"
        size="md"
      >
        <TeamTransferModal
          team={transferTeam}
          onSuccess={() => {
            setShowTransferModal(false);
            setTransferTeam(null);
            queryClient.invalidateQueries(['teams']);
          }}
          onCancel={() => {
            setShowTransferModal(false);
            setTransferTeam(null);
          }}
        />
      </Modal>
    </div>
  );
};

export default TeamsPage;