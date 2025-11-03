import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  UserIcon,
  CreditCardIcon,
  LinkIcon,
  GlobeAltIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  NoSymbolIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import { adminApiEndpoints } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import LineChart from '../../components/charts/LineChart';
import MetricCard from '../../components/charts/MetricCard';
import DataTable, { Column } from '../../components/common/DataTable';

const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  
  const [showImpersonateModal, setShowImpersonateModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

  // Fetch user data
  const { data: userData, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => adminApiEndpoints.users.get(id!),
    enabled: !!id,
  });

  // Fetch user analytics
  const { data: analyticsData } = useQuery({
    queryKey: ['user-analytics', id],
    queryFn: () => adminApiEndpoints.analytics.users({ userId: id }),
    enabled: !!id,
  });

  // Mutations
  const suspendMutation = useMutation({
    mutationFn: ({ reason }: { reason: string }) =>
      adminApiEndpoints.users.suspend(id!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['user', id]);
      toast.success('User suspended successfully');
      setShowSuspendModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to suspend user');
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: () => adminApiEndpoints.users.reactivate(id!),
    onSuccess: () => {
      queryClient.invalidateQueries(['user', id]);
      toast.success('User reactivated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reactivate user');
    },
  });

  const impersonateMutation = useMutation({
    mutationFn: () => adminApiEndpoints.users.impersonate(id!),
    onSuccess: (response) => {
      const impersonationUrl = response.data.data.url;
      window.open(impersonationUrl, '_blank');
      setShowImpersonateModal(false);
      toast.success('Impersonation session started');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to start impersonation');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!userData?.data?.data) {
    return (
      <div className="text-center py-12">
        <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          User not found
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          The user you're looking for doesn't exist or has been deleted.
        </p>
        <Button
          variant="primary"
          className="mt-4"
          onClick={() => navigate('/users')}
        >
          Back to Users
        </Button>
      </div>
    );
  }

  const user = userData.data.data;
  const analytics = analyticsData?.data?.data;

  // Sample data for charts
  const activityData = [
    {
      name: 'Links Created',
      data: [
        { x: '2024-01-01', y: 5 },
        { x: '2024-01-02', y: 8 },
        { x: '2024-01-03', y: 12 },
        { x: '2024-01-04', y: 6 },
        { x: '2024-01-05', y: 15 },
        { x: '2024-01-06', y: 10 },
        { x: '2024-01-07', y: 18 },
      ],
    },
  ];

  const handleSuspend = () => {
    if (!suspendReason.trim()) {
      toast.error('Please provide a reason for suspension');
      return;
    }
    suspendMutation.mutate({ reason: suspendReason });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeftIcon className="w-4 h-4" />}
            onClick={() => navigate('/users')}
          >
            Back to Users
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {user.name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user.email}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {hasPermission('users', 'impersonate') && user.status === 'ACTIVE' && (
            <Button
              variant="secondary"
              icon={<UserIcon className="w-4 h-4" />}
              onClick={() => setShowImpersonateModal(true)}
            >
              Impersonate
            </Button>
          )}
          
          {hasPermission('users', 'update') && (
            <Button
              variant="secondary"
              icon={<PencilIcon className="w-4 h-4" />}
              onClick={() => navigate(`/users/${id}/edit`)}
            >
              Edit User
            </Button>
          )}

          {hasPermission('users', 'suspend') && user.status === 'ACTIVE' && (
            <Button
              variant="danger"
              icon={<NoSymbolIcon className="w-4 h-4" />}
              onClick={() => setShowSuspendModal(true)}
            >
              Suspend
            </Button>
          )}

          {hasPermission('users', 'reactivate') && user.status === 'SUSPENDED' && (
            <Button
              variant="primary"
              icon={<CheckCircleIcon className="w-4 h-4" />}
              onClick={() => reactivateMutation.mutate()}
              loading={reactivateMutation.isLoading}
            >
              Reactivate
            </Button>
          )}
        </div>
      </div>

      {/* User Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info */}
        <Card className="lg:col-span-2">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mr-4">
                <span className="text-primary-600 dark:text-primary-400 font-bold text-xl">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {user.name}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant={
                      user.plan === 'ENTERPRISE' ? 'info' :
                      user.plan === 'BUSINESS' ? 'success' :
                      user.plan === 'PRO' ? 'warning' : 'default'
                    }
                  >
                    {user.plan}
                  </Badge>
                  <Badge
                    variant={
                      user.status === 'ACTIVE' ? 'success' :
                      user.status === 'SUSPENDED' ? 'error' :
                      user.status === 'PENDING_VERIFICATION' ? 'warning' : 'default'
                    }
                  >
                    {user.status.replace('_', ' ')}
                  </Badge>
                  {user.emailVerified && (
                    <Badge variant="success" size="sm">
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Account Details
              </h4>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Created</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Last Login</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </dd>
                </div>
              </dl>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Subscription
              </h4>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Status</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.subscription?.status || 'No subscription'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Next Billing</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.subscription?.currentPeriodEnd 
                      ? new Date(user.subscription.currentPeriodEnd).toLocaleDateString()
                      : 'N/A'
                    }
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </Card>

        {/* Usage Stats */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Usage Statistics
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500 dark:text-gray-400">Links</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {user.usage?.linksCreated || 0} / {user.usage?.linksLimit || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      ((user.usage?.linksCreated || 0) / (user.usage?.linksLimit || 1)) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500 dark:text-gray-400">Domains</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {user.usage?.domainsUsed || 0} / {user.usage?.domainsLimit || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-success-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      ((user.usage?.domainsUsed || 0) / (user.usage?.domainsLimit || 1)) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user.usage?.clicksThisMonth || 0}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Clicks this month
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Links"
          value={user.usage?.linksCreated || 0}
          icon={<LinkIcon className="w-6 h-6" />}
        />
        <MetricCard
          title="Total Clicks"
          value={analytics?.totalClicks || 0}
          icon={<CursorArrowRaysIcon className="w-6 h-6" />}
        />
        <MetricCard
          title="Domains"
          value={user.usage?.domainsUsed || 0}
          icon={<GlobeAltIcon className="w-6 h-6" />}
        />
        <MetricCard
          title="Account Age"
          value={`${Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days`}
          icon={<ClockIcon className="w-6 h-6" />}
        />
      </div>

      {/* Activity Chart */}
      <LineChart
        title="User Activity (Last 7 Days)"
        data={activityData}
        height={300}
      />

      {/* Modals */}
      <Modal
        isOpen={showImpersonateModal}
        onClose={() => setShowImpersonateModal(false)}
        title="Impersonate User"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center p-4 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
            <ExclamationTriangleIcon className="w-5 h-5 text-warning-600 dark:text-warning-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-warning-800 dark:text-warning-200">
                Security Warning
              </p>
              <p className="text-sm text-warning-700 dark:text-warning-300">
                This action will be logged for security purposes. Only impersonate users when necessary for support.
              </p>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You are about to impersonate <strong>{user.name}</strong> ({user.email}). 
            This will open a new tab with their account session.
          </p>

          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowImpersonateModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="warning"
              onClick={() => impersonateMutation.mutate()}
              loading={impersonateMutation.isLoading}
            >
              Start Impersonation
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showSuspendModal}
        onClose={() => setShowSuspendModal(false)}
        title="Suspend User"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center p-4 bg-error-50 dark:bg-error-900/20 rounded-lg">
            <ExclamationTriangleIcon className="w-5 h-5 text-error-600 dark:text-error-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-error-800 dark:text-error-200">
                Suspend User Account
              </p>
              <p className="text-sm text-error-700 dark:text-error-300">
                This will prevent the user from accessing their account and services.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reason for suspension *
            </label>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              rows={3}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-primary-500"
              placeholder="Please provide a detailed reason for suspending this user..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowSuspendModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleSuspend}
              loading={suspendMutation.isLoading}
            >
              Suspend User
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserDetailPage;