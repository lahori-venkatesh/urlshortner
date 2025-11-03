import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApiEndpoints } from '../../../services/api';
import Button from '../../../components/common/Button';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface UserBulkActionsProps {
  selectedUserIds: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

const UserBulkActions: React.FC<UserBulkActionsProps> = ({
  selectedUserIds,
  onSuccess,
  onCancel,
}) => {
  const [action, setAction] = useState<string>('');
  const [reason, setReason] = useState('');

  const bulkActionMutation = useMutation({
    mutationFn: ({ action, userIds, data }: { action: string; userIds: string[]; data?: any }) =>
      adminApiEndpoints.users.bulkAction(action, userIds, data),
    onSuccess: (_, variables) => {
      const actionLabels: Record<string, string> = {
        suspend: 'suspended',
        reactivate: 'reactivated',
        delete: 'deleted',
        export: 'exported',
        send_email: 'emailed',
      };
      toast.success(`Users ${actionLabels[variables.action] || 'updated'} successfully`);
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Bulk action failed');
    },
  });

  const handleSubmit = () => {
    if (!action) {
      toast.error('Please select an action');
      return;
    }

    if ((action === 'suspend' || action === 'delete') && !reason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    const data = reason ? { reason } : undefined;
    bulkActionMutation.mutate({ action, userIds: selectedUserIds, data });
  };

  const getActionDescription = () => {
    switch (action) {
      case 'suspend':
        return 'This will suspend all selected users and prevent them from accessing their accounts.';
      case 'reactivate':
        return 'This will reactivate all selected suspended users.';
      case 'delete':
        return 'This will permanently delete all selected users and their data. This action cannot be undone.';
      case 'export':
        return 'This will export the data of all selected users to a CSV file.';
      case 'send_email':
        return 'This will send a notification email to all selected users.';
      default:
        return '';
    }
  };

  const isDangerous = action === 'suspend' || action === 'delete';

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          You have selected <span className="font-medium">{selectedUserIds.length}</span> users
        </p>
      </div>

      {/* Action Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Action
        </label>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="">Choose an action...</option>
          <option value="suspend">Suspend Users</option>
          <option value="reactivate">Reactivate Users</option>
          <option value="export">Export User Data</option>
          <option value="send_email">Send Notification Email</option>
          <option value="delete">Delete Users</option>
        </select>
      </div>

      {/* Action Description */}
      {action && (
        <div className={`p-4 rounded-lg ${isDangerous ? 'bg-error-50 dark:bg-error-900/20' : 'bg-primary-50 dark:bg-primary-900/20'}`}>
          {isDangerous && (
            <div className="flex items-center mb-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-error-600 dark:text-error-400 mr-2" />
              <span className="text-sm font-medium text-error-800 dark:text-error-200">
                Warning: This action is irreversible
              </span>
            </div>
          )}
          <p className={`text-sm ${isDangerous ? 'text-error-700 dark:text-error-300' : 'text-primary-700 dark:text-primary-300'}`}>
            {getActionDescription()}
          </p>
        </div>
      )}

      {/* Reason Input */}
      {(action === 'suspend' || action === 'delete') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Reason *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-primary-500"
            placeholder="Please provide a reason for this action..."
          />
        </div>
      )}

      {/* Email Template Selection */}
      {action === 'send_email' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Template
          </label>
          <select className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-primary-500">
            <option value="welcome">Welcome Email</option>
            <option value="notification">General Notification</option>
            <option value="security">Security Alert</option>
            <option value="maintenance">Maintenance Notice</option>
          </select>
        </div>
      )}

      {/* Confirmation */}
      {action && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="confirm"
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="confirm" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              I understand the consequences of this action
            </label>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={bulkActionMutation.isLoading}
        >
          Cancel
        </Button>
        <Button
          variant={isDangerous ? 'danger' : 'primary'}
          onClick={handleSubmit}
          loading={bulkActionMutation.isLoading}
          disabled={!action}
        >
          Execute Action
        </Button>
      </div>
    </div>
  );
};

export default UserBulkActions;