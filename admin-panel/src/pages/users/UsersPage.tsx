import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  UserIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  UserPlusIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import { adminApiEndpoints } from '../../services/api';
import { User, FilterOptions } from '../../types';
import DataTable, { Column } from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import UserFilters from './components/UserFilters';
import UserForm from './components/UserForm';
import UserBulkActions from './components/UserBulkActions';

const UsersPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({});
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  // Fetch users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', currentPage, pageSize, sortBy, sortOrder, search, filters],
    queryFn: () => adminApiEndpoints.users.list({
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
  const suspendUserMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminApiEndpoints.users.suspend(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('User suspended successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to suspend user');
    },
  });

  const reactivateUserMutation = useMutation({
    mutationFn: (id: string) => adminApiEndpoints.users.reactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('User reactivated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reactivate user');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => adminApiEndpoints.users.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('User deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    },
  });

  const users = usersData?.data?.data?.content || [];
  const totalPages = usersData?.data?.data?.totalPages || 0;
  const totalItems = usersData?.data?.data?.totalElements || 0;

  const columns: Column<User>[] = [
    {
      key: 'name',
      label: 'User',
      sortable: true,
      render: (_, user) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mr-3">
            <span className="text-primary-600 dark:text-primary-400 font-medium text-sm">
              {user.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {user.name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {user.email}
            </div>
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
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (status) => (
        <Badge
          variant={
            status === 'ACTIVE' ? 'success' :
            status === 'SUSPENDED' ? 'error' :
            status === 'PENDING_VERIFICATION' ? 'warning' : 'default'
          }
        >
          {status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'usage',
      label: 'Usage',
      render: (_, user) => (
        <div className="text-sm">
          <div className="text-gray-900 dark:text-white">
            {user.usage?.linksCreated || 0} / {user.usage?.linksLimit || 0} links
          </div>
          <div className="text-gray-500 dark:text-gray-400">
            {user.usage?.domainsUsed || 0} / {user.usage?.domainsLimit || 0} domains
          </div>
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
    {
      key: 'lastLogin',
      label: 'Last Login',
      sortable: true,
      render: (date) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {date ? new Date(date).toLocaleDateString() : 'Never'}
        </div>
      ),
    },
  ];

  const handleSort = (newSortBy: string, newSortOrder: 'ASC' | 'DESC') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  const handleSuspendUser = (user: User) => {
    const reason = prompt('Please provide a reason for suspension:');
    if (reason) {
      suspendUserMutation.mutate({ id: user.id, reason });
    }
  };

  const handleDeleteUser = (user: User) => {
    if (window.confirm(`Are you sure you want to delete user "${user.name}"? This action cannot be undone.`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const renderRowActions = (user: User) => (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        icon={<EyeIcon className="w-4 h-4" />}
        onClick={() => window.open(`/users/${user.id}`, '_blank')}
      />
      
      {hasPermission('users', 'update') && (
        <Button
          variant="ghost"
          size="sm"
          icon={<PencilIcon className="w-4 h-4" />}
          onClick={() => {
            setEditingUser(user);
            setShowUserForm(true);
          }}
        />
      )}

      {hasPermission('users', 'suspend') && user.status === 'ACTIVE' && (
        <Button
          variant="ghost"
          size="sm"
          icon={<NoSymbolIcon className="w-4 h-4" />}
          onClick={() => handleSuspendUser(user)}
        />
      )}

      {hasPermission('users', 'reactivate') && user.status === 'SUSPENDED' && (
        <Button
          variant="ghost"
          size="sm"
          icon={<CheckCircleIcon className="w-4 h-4" />}
          onClick={() => reactivateUserMutation.mutate(user.id)}
        />
      )}

      {hasPermission('users', 'delete') && (
        <Button
          variant="ghost"
          size="sm"
          icon={<TrashIcon className="w-4 h-4" />}
          onClick={() => handleDeleteUser(user)}
        />
      )}
    </div>
  );

  const bulkActions = [
    {
      label: 'Suspend Selected',
      action: (ids: string[]) => setShowBulkActions(true),
      variant: 'danger' as const,
    },
    {
      label: 'Export Selected',
      action: (ids: string[]) => {
        // Handle export
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
            User Management
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage user accounts, subscriptions, and permissions
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasPermission('users', 'export') && (
            <Button
              variant="secondary"
              icon={<ArrowDownTrayIcon className="w-4 h-4" />}
              onClick={() => {
                // Handle export all
                toast.success('Export started');
              }}
            >
              Export All
            </Button>
          )}
          {hasPermission('users', 'create') && (
            <Button
              variant="primary"
              icon={<UserPlusIcon className="w-4 h-4" />}
              onClick={() => {
                setEditingUser(null);
                setShowUserForm(true);
              }}
            >
              Add User
            </Button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <DataTable
        columns={columns}
        data={users}
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
          placeholder: 'Search users by name or email...',
        }}
        filters={<UserFilters filters={filters} onFiltersChange={setFilters} />}
        actions={{
          bulk: { actions: bulkActions },
          row: renderRowActions,
        }}
        selectable={hasPermission('users', 'bulk_actions')}
        onSelectionChange={setSelectedUserIds}
        emptyState={
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No users found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating a new user account.
            </p>
          </div>
        }
      />

      {/* User Form Modal */}
      <Modal
        isOpen={showUserForm}
        onClose={() => setShowUserForm(false)}
        title={editingUser ? 'Edit User' : 'Create User'}
        size="lg"
      >
        <UserForm
          user={editingUser}
          onSuccess={() => {
            setShowUserForm(false);
            queryClient.invalidateQueries(['users']);
          }}
          onCancel={() => setShowUserForm(false)}
        />
      </Modal>

      {/* Bulk Actions Modal */}
      <Modal
        isOpen={showBulkActions}
        onClose={() => setShowBulkActions(false)}
        title="Bulk Actions"
        size="md"
      >
        <UserBulkActions
          selectedUserIds={selectedUserIds}
          onSuccess={() => {
            setShowBulkActions(false);
            setSelectedUserIds([]);
            queryClient.invalidateQueries(['users']);
          }}
          onCancel={() => setShowBulkActions(false)}
        />
      </Modal>
    </div>
  );
};

export default UsersPage;