import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Team, User } from '../../../types';
import { adminApiEndpoints } from '../../../services/api';
import Button from '../../../components/common/Button';
import { MagnifyingGlassIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface TeamTransferModalProps {
  team: Team | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const TeamTransferModal: React.FC<TeamTransferModalProps> = ({
  team,
  onSuccess,
  onCancel,
}) => {
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [confirmText, setConfirmText] = useState('');

  // Search users
  const { data: usersData, isLoading: searchingUsers } = useQuery({
    queryKey: ['users-search', userSearch],
    queryFn: () => adminApiEndpoints.users.list({
      search: userSearch,
      size: 10,
    }),
    enabled: userSearch.length > 2,
  });

  const transferMutation = useMutation({
    mutationFn: (newOwnerId: string) => 
      adminApiEndpoints.teams.transferOwnership(team!.id, newOwnerId),
    onSuccess: () => {
      toast.success('Team ownership transferred successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to transfer ownership');
    },
  });

  const handleTransfer = () => {
    if (!selectedUser) {
      toast.error('Please select a new owner');
      return;
    }

    if (confirmText !== team?.name) {
      toast.error('Please type the team name to confirm');
      return;
    }

    transferMutation.mutate(selectedUser.id);
  };

  const searchResults = usersData?.data?.data?.content || [];
  const isConfirmValid = confirmText === team?.name;

  if (!team) return null;

  return (
    <div className="space-y-6">
      {/* Warning */}
      <div className="flex items-center p-4 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
        <ExclamationTriangleIcon className="w-5 h-5 text-warning-600 dark:text-warning-400 mr-3" />
        <div>
          <p className="text-sm font-medium text-warning-800 dark:text-warning-200">
            Transfer Team Ownership
          </p>
          <p className="text-sm text-warning-700 dark:text-warning-300">
            This action will transfer full ownership of the team to another user. The current owner will become a regular member.
          </p>
        </div>
      </div>

      {/* Current Owner */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Current Owner
        </label>
        <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mr-3">
            <span className="text-primary-600 dark:text-primary-400 font-medium">
              {team.owner?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {team.owner?.name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {team.owner?.email}
            </div>
          </div>
        </div>
      </div>

      {/* New Owner Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          New Owner *
        </label>
        
        {selectedUser ? (
          <div className="flex items-center justify-between p-3 bg-success-50 dark:bg-success-900/20 rounded-lg border border-success-300 dark:border-success-600">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-success-100 dark:bg-success-900 rounded-full flex items-center justify-center mr-3">
                <span className="text-success-600 dark:text-success-400 font-medium">
                  {selectedUser.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="text-sm font-medium text-success-900 dark:text-success-100">
                  {selectedUser.name}
                </div>
                <div className="text-sm text-success-700 dark:text-success-300">
                  {selectedUser.email}
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedUser(null)}
            >
              Change
            </Button>
          </div>
        ) : (
          <div className="relative">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search for a user to transfer ownership to..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            
            {userSearch.length > 2 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchingUsers ? (
                  <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults
                    .filter((user: User) => user.id !== team.owner?.id)
                    .map((user: User) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          setSelectedUser(user);
                          setUserSearch('');
                        }}
                        className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center"
                      >
                        <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mr-3">
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
                      </button>
                    ))
                ) : (
                  <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                    No users found
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Confirm Transfer
        </label>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Type <strong>{team.name}</strong> to confirm the ownership transfer:
        </p>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={team.name}
          className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-primary-500"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={transferMutation.isLoading}
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={handleTransfer}
          loading={transferMutation.isLoading}
          disabled={!selectedUser || !isConfirmValid}
        >
          Transfer Ownership
        </Button>
      </div>
    </div>
  );
};

export default TeamTransferModal;