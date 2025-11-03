import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { User, UserPlan } from '../../../types';
import { adminApiEndpoints } from '../../../services/api';
import Button from '../../../components/common/Button';

interface UserFormProps {
  user?: User | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface UserFormData {
  name: string;
  email: string;
  plan: UserPlan;
  status: string;
  emailVerified: boolean;
  password?: string;
}

const UserForm: React.FC<UserFormProps> = ({ user, onSuccess, onCancel }) => {
  const isEditing = !!user;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<UserFormData>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      plan: user?.plan || 'FREE',
      status: user?.status || 'ACTIVE',
      emailVerified: user?.emailVerified || false,
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (data: UserFormData) => adminApiEndpoints.users.create(data),
    onSuccess: () => {
      toast.success('User created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create user');
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: (data: UserFormData) => adminApiEndpoints.users.update(user!.id, data),
    onSuccess: () => {
      toast.success('User updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update user');
    },
  });

  const onSubmit = (data: UserFormData) => {
    if (isEditing) {
      updateUserMutation.mutate(data);
    } else {
      createUserMutation.mutate(data);
    }
  };

  const isLoading = createUserMutation.isLoading || updateUserMutation.isLoading;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Full Name *
          </label>
          <input
            {...register('name', { required: 'Name is required' })}
            type="text"
            className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-primary-500"
            placeholder="Enter full name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-error-600">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email Address *
          </label>
          <input
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
            type="email"
            disabled={isEditing}
            className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Enter email address"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
          )}
        </div>

        {/* Password (only for new users) */}
        {!isEditing && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password *
            </label>
            <input
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
              })}
              type="password"
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-primary-500"
              placeholder="Enter password"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-error-600">{errors.password.message}</p>
            )}
          </div>
        )}

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

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status *
          </label>
          <select
            {...register('status', { required: 'Status is required' })}
            className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="PENDING_VERIFICATION">Pending Verification</option>
          </select>
          {errors.status && (
            <p className="mt-1 text-sm text-error-600">{errors.status.message}</p>
          )}
        </div>

        {/* Email Verified */}
        <div className="flex items-center">
          <input
            {...register('emailVerified')}
            type="checkbox"
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            Email Verified
          </label>
        </div>
      </div>

      {/* Plan Limits Info */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          Plan Limits for {watch('plan')}
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Links:</span>
            <span className="ml-1 font-medium text-gray-900 dark:text-white">
              {watch('plan') === 'FREE' ? '100' :
               watch('plan') === 'PRO' ? '1,000' :
               watch('plan') === 'BUSINESS' ? '10,000' : 'Unlimited'}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Domains:</span>
            <span className="ml-1 font-medium text-gray-900 dark:text-white">
              {watch('plan') === 'FREE' ? '0' :
               watch('plan') === 'PRO' ? '3' :
               watch('plan') === 'BUSINESS' ? '10' : 'Unlimited'}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Analytics:</span>
            <span className="ml-1 font-medium text-gray-900 dark:text-white">
              {watch('plan') === 'FREE' ? 'Basic' : 'Advanced'}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Support:</span>
            <span className="ml-1 font-medium text-gray-900 dark:text-white">
              {watch('plan') === 'FREE' ? 'Community' :
               watch('plan') === 'PRO' ? 'Email' :
               watch('plan') === 'BUSINESS' ? 'Priority' : 'Dedicated'}
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
        >
          {isEditing ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  );
};

export default UserForm;