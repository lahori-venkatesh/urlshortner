import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  GlobeAltIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import { adminApiEndpoints } from '../../services/api';
import { Domain, FilterOptions } from '../../types';
import DataTable, { Column } from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import DomainFilters from './components/DomainFilters';
import DomainTransferModal from './components/DomainTransferModal';

const DomainsPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({});
  const [selectedDomainIds, setSelectedDomainIds] = useState<string[]>([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferDomain, setTransferDomain] = useState<Domain | null>(null);

  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  // Fetch domains
  const { data: domainsData, isLoading } = useQuery({
    queryKey: ['domains', currentPage, pageSize, sortBy, sortOrder, search, filters],
    queryFn: () => adminApiEndpoints.domains.list({
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
  const verifyDomainMutation = useMutation({
    mutationFn: (id: string) => adminApiEndpoints.domains.verify(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['domains']);
      toast.success('Domain verification started');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to verify domain');
    },
  });

  const renewSslMutation = useMutation({
    mutationFn: (id: string) => adminApiEndpoints.domains.renewSsl(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['domains']);
      toast.success('SSL renewal started');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to renew SSL');
    },
  });

  const suspendDomainMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminApiEndpoints.domains.suspend(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['domains']);
      toast.success('Domain suspended successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to suspend domain');
    },
  });

  const reactivateDomainMutation = useMutation({
    mutationFn: (id: string) => adminApiEndpoints.domains.reactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['domains']);
      toast.success('Domain reactivated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reactivate domain');
    },
  });

  const deleteDomainMutation = useMutation({
    mutationFn: (id: string) => adminApiEndpoints.domains.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['domains']);
      toast.success('Domain deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete domain');
    },
  });

  const domains = domainsData?.data?.data?.content || [];
  const totalPages = domainsData?.data?.data?.totalPages || 0;
  const totalItems = domainsData?.data?.data?.totalElements || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">Active</Badge>;
      case 'SUSPENDED':
        return <Badge variant="error">Suspended</Badge>;
      case 'PENDING_DELETION':
        return <Badge variant="warning">Pending Deletion</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <Badge variant="success">Verified</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>;
      case 'FAILED':
        return <Badge variant="error">Failed</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getSslBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">Active</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>;
      case 'FAILED':
        return <Badge variant="error">Failed</Badge>;
      case 'EXPIRED':
        return <Badge variant="error">Expired</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const columns: Column<Domain>[] = [
    {
      key: 'domain',
      label: 'Domain',
      sortable: true,
      render: (_, domain) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mr-3">
            <GlobeAltIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {domain.domain}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {domain.cnameTarget}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'owner',
      label: 'Owner',
      render: (_, domain) => (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {domain.owner?.name}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {domain.owner?.email}
          </div>
          {domain.team && (
            <div className="text-xs text-primary-600 dark:text-primary-400">
              Team: {domain.team.name}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (status) => getStatusBadge(status),
    },
    {
      key: 'verificationStatus',
      label: 'Verification',
      sortable: true,
      render: (status) => getVerificationBadge(status),
    },
    {
      key: 'sslStatus',
      label: 'SSL',
      sortable: true,
      render: (status) => getSslBadge(status),
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
      key: 'verifiedAt',
      label: 'Verified',
      sortable: true,
      render: (date) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {date ? new Date(date).toLocaleDateString() : 'Not verified'}
        </div>
      ),
    },
  ];

  const handleSort = (newSortBy: string, newSortOrder: 'ASC' | 'DESC') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  const handleSuspendDomain = (domain: Domain) => {
    const reason = prompt('Please provide a reason for suspension:');
    if (reason) {
      suspendDomainMutation.mutate({ id: domain.id, reason });
    }
  };

  const handleDeleteDomain = (domain: Domain) => {
    if (window.confirm(`Are you sure you want to delete domain "${domain.domain}"? This action cannot be undone.`)) {
      deleteDomainMutation.mutate(domain.id);
    }
  };

  const handleTransferDomain = (domain: Domain) => {
    setTransferDomain(domain);
    setShowTransferModal(true);
  };

  const renderRowActions = (domain: Domain) => (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        icon={<EyeIcon className="w-4 h-4" />}
        onClick={() => window.open(`/domains/${domain.id}`, '_blank')}
      />
      
      {hasPermission('domains', 'verify') && domain.verificationStatus !== 'VERIFIED' && (
        <Button
          variant="ghost"
          size="sm"
          icon={<CheckCircleIcon className="w-4 h-4" />}
          onClick={() => verifyDomainMutation.mutate(domain.id)}
          loading={verifyDomainMutation.isLoading}
        />
      )}

      {hasPermission('domains', 'ssl') && (
        <Button
          variant="ghost"
          size="sm"
          icon={<ShieldCheckIcon className="w-4 h-4" />}
          onClick={() => renewSslMutation.mutate(domain.id)}
          loading={renewSslMutation.isLoading}
        />
      )}

      {hasPermission('domains', 'transfer') && (
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowRightIcon className="w-4 h-4" />}
          onClick={() => handleTransferDomain(domain)}
        />
      )}

      {hasPermission('domains', 'suspend') && domain.status === 'ACTIVE' && (
        <Button
          variant="ghost"
          size="sm"
          icon={<XCircleIcon className="w-4 h-4" />}
          onClick={() => handleSuspendDomain(domain)}
        />
      )}

      {hasPermission('domains', 'reactivate') && domain.status === 'SUSPENDED' && (
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowPathIcon className="w-4 h-4" />}
          onClick={() => reactivateDomainMutation.mutate(domain.id)}
          loading={reactivateDomainMutation.isLoading}
        />
      )}

      {hasPermission('domains', 'delete') && (
        <Button
          variant="ghost"
          size="sm"
          icon={<TrashIcon className="w-4 h-4" />}
          onClick={() => handleDeleteDomain(domain)}
        />
      )}
    </div>
  );

  const bulkActions = [
    {
      label: 'Verify Selected',
      action: (ids: string[]) => {
        ids.forEach(id => verifyDomainMutation.mutate(id));
      },
      variant: 'primary' as const,
    },
    {
      label: 'Renew SSL',
      action: (ids: string[]) => {
        ids.forEach(id => renewSslMutation.mutate(id));
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
            Domain Management
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage custom domains, SSL certificates, and DNS verification
          </p>
        </div>
      </div>

      {/* Domains Table */}
      <DataTable
        columns={columns}
        data={domains}
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
          placeholder: 'Search domains...',
        }}
        filters={<DomainFilters filters={filters} onFiltersChange={setFilters} />}
        actions={{
          bulk: { actions: bulkActions },
          row: renderRowActions,
        }}
        selectable={hasPermission('domains', 'bulk_actions')}
        onSelectionChange={setSelectedDomainIds}
        emptyState={
          <div className="text-center py-12">
            <GlobeAltIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No domains found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Custom domains will appear here once users add them.
            </p>
          </div>
        }
      />

      {/* Transfer Domain Modal */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title="Transfer Domain"
        size="md"
      >
        <DomainTransferModal
          domain={transferDomain}
          onSuccess={() => {
            setShowTransferModal(false);
            setTransferDomain(null);
            queryClient.invalidateQueries(['domains']);
          }}
          onCancel={() => {
            setShowTransferModal(false);
            setTransferDomain(null);
          }}
        />
      </Modal>
    </div>
  );
};

export default DomainsPage;