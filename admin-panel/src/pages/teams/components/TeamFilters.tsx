import React from 'react';
import { FilterOptions } from '../../../types';
import Button from '../../../components/common/Button';

interface TeamFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

const TeamFilters: React.FC<TeamFiltersProps> = ({ filters, onFiltersChange }) => {
  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && value !== null
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Plan Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Plan
        </label>
        <select
          value={filters.plan || ''}
          onChange={(e) => handleFilterChange('plan', e.target.value || undefined)}
          className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="">All Plans</option>
          <option value="FREE">Free</option>
          <option value="PRO">Pro</option>
          <option value="BUSINESS">Business</option>
          <option value="ENTERPRISE">Enterprise</option>
        </select>
      </div>

      {/* Member Count Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Member Count
        </label>
        <select
          value={filters.memberCount || ''}
          onChange={(e) => handleFilterChange('memberCount', e.target.value || undefined)}
          className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="">Any Size</option>
          <option value="1">1 member</option>
          <option value="2-5">2-5 members</option>
          <option value="6-10">6-10 members</option>
          <option value="11-25">11-25 members</option>
          <option value="26+">26+ members</option>
        </select>
      </div>

      {/* Date From */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Created From
        </label>
        <input
          type="date"
          value={filters.dateFrom ? new Date(filters.dateFrom).toISOString().split('T')[0] : ''}
          onChange={(e) => handleFilterChange('dateFrom', e.target.value ? new Date(e.target.value) : undefined)}
          className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-primary-500"
        />
      </div>

      {/* Date To */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Created To
        </label>
        <input
          type="date"
          value={filters.dateTo ? new Date(filters.dateTo).toISOString().split('T')[0] : ''}
          onChange={(e) => handleFilterChange('dateTo', e.target.value ? new Date(e.target.value) : undefined)}
          className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-primary-500"
        />
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex items-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={clearFilters}
            className="w-full"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default TeamFilters;