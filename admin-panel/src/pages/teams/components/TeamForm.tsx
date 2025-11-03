import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Team, UserPlan, User } from '../../../types';
import { adminApiEndpoints } from '../../../services/api';
import Button from '../../../components/common/Button';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface TeamFormProps {
  team?: Team | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface TeamFormData {
  name: string;
  plan: UserPlan;
  ownerId: string;
}

const TeamForm: React.FC<TeamFormProps> = ({ team, onSuccess, onCancel }) => {
  const isEditing = !!team;
  const [ownerSearch, setOwnerSearch] = useState('');
  const [selectedOwner, setSelectedOwner] = useState<User | null>(team?.owner || null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<TeamFormData>({
    defaultValues: {
      name: team?.name || '',
      plan: team?.plan || 'FREE',
      ownerId: team?.owner?.id || '',
    },
  });

  // Search users for owner selection
  const { data: usersData, isLoading: searchingUsers } = useQuery({
    queryKey: ['users-search', ownerSearch],
    queryFn: () => adminApiEndpoints.users.list({
      search: ownerSearch,
      size: 10,
    }),
    enabled: ownerSearch.length > 2,
  });

  const createTeamMutation = useMutation({
    mutationFn: (data: TeamFormData) => adminApiEndpoints.teams.create(data),
    onSuccess: () => {
      toast.success('Team created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create team');
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: (data: TeamFormData) => adminApiEndpoints.teams.update(team!.id, data),
    onSuccess: () => {
      toast.success('Team updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update team');
    },
  });

  const onSubmit = (data: TeamFormData) => {
    if (!selectedOwner) {
      toast.error('Please select a team owner');
      return;
    }

    const formData = {
      ...data,
      ownerId: selectedOwner.id,
    };

    if (isEditing) {
      updateTeamMutation.mutate(formData);
    } else {
      createTeamMutation.mutate(formData);
    }
  };

  const handleOwnerSelect = (user: User) => {
    setSelectedOwner(user);
    setValue('ownerId', user.id);
    setOwnerSearch('');
  };

  const isLoading = createTeamMutation.isLoading || updateTeamMutation.isLoading;
  const searchResults = usersData?.data?.data?.content || [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team Name */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Team Name *
          </label>
          <input
            {...register('name', { required: 'Team name is required' })}
            type="text"
            className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-primary-500"
            placeholder="Enter team name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-error-600">{errors.name.message}</p>
          )}
        </div>

        {/* Plan */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Plan *
          </label>
          <select
            {...register('plan', { required: 'Plan is required' })}
            className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="FREE">Free</option>
            <option value="PRO">Pro</option>
            <option value="BUSINESS">Business</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
          {errors.plan && (
            <p className="mt-1 text-sm text-error-600">{errors.plan.message}</p>
          )}
        </div>

        {/* Owner Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Team Owner *
          </label>
          
          {selectedOwner ? (
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mr-3">
                  <span className="text-primary-600 dark:text-primary-400 font-medium text-sm">
                    {selectedOwner.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedOwner.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedOwner.email}
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={<XMarkIcon className="w-4 h-4" />}
                onClick={() => {
                  setSelectedOwner(null);
                  setValue('ownerId', '');
                }}
              />
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={ownerSearch}
                  onChange={(e) => setOwnerSearch(e.target.value)}
                  placeholder="Search for a user to be the owner..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              
              {ownerSearch.length > 2 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchingUsers ? (
                    <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                      Searching...
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((user: User) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleOwnerSelect(user)}
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
      </div>

      {/* Plan Limits Info */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          Plan Limits for {watch('plan')}
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Members:</span>
            <span className="ml-1 font-medium text-gray-900 dark:text-white">
              {watch('plan') === 'FREE' ? '1' :
               watch('plan') === 'PRO' ? '5' :
               watch('plan') === 'BUSINESS' ? '25' : 'Unlimited'}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Links:</span>
            <span className="ml-1 font-medium text-gray-900 dark:text-white">
              {watch('plan') === 'FREE' ? '100' :
               watch('plan') === 'PRO' ? '5,000' :
               watch('plan') === 'BUSINESS' ? '50,000' : 'Unlimited'}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Domains:</span>
            <span className="ml-1 font-medium text-gray-900 dark:text-white">
              {watch('plan') === 'FREE' ? '0' :
               watch('plan') === 'PRO' ? '5' :
               watch('plan') === 'BUSINESS' ? '25' : 'Unlimited'}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Analytics:</span>
            <span className="ml-1 font-medium text-gray-900 dark:text-white">
              {watch('plan') === 'FREE' ? 'Basic' : 'Advanced'}
            </span>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
          disabled={!selectedOwner}
        >
          {isEditing ? 'Update Team' : 'Create Team'}
        </Button>
      </div>
    </form>
  );
};

export default TeamForm;