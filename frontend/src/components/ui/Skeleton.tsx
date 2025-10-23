import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width = 'w-full', 
  height = 'h-4' 
}) => {
  return (
    <div 
      className={`animate-pulse bg-gray-200 rounded ${width} ${height} ${className}`}
    />
  );
};

// Specific skeleton components for dashboard
export const StatCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-4">
      <Skeleton width="w-12" height="h-12" className="rounded-lg" />
      <Skeleton width="w-8" height="h-8" className="rounded" />
    </div>
    <Skeleton width="w-16" height="h-8" className="mb-2" />
    <Skeleton width="w-24" height="h-4" />
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-6">
      <Skeleton width="w-32" height="h-6" />
      <Skeleton width="w-20" height="h-4" />
    </div>
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-end space-x-2">
          <Skeleton width="w-8" height={`h-${Math.floor(Math.random() * 20) + 8}`} />
          <Skeleton width="w-8" height={`h-${Math.floor(Math.random() * 16) + 6}`} />
          <Skeleton width="w-8" height={`h-${Math.floor(Math.random() * 24) + 10}`} />
          <Skeleton width="w-8" height={`h-${Math.floor(Math.random() * 18) + 8}`} />
        </div>
      ))}
    </div>
  </div>
);

export const ActivitySkeleton: React.FC = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-6">
      <Skeleton width="w-32" height="h-6" />
      <Skeleton width="w-16" height="h-4" />
    </div>
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton width="w-10" height="h-10" className="rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton width="w-3/4" height="h-4" />
            <Skeleton width="w-1/2" height="h-3" />
          </div>
          <Skeleton width="w-16" height="h-4" />
        </div>
      ))}
    </div>
  </div>
);

export const TableSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-6">
      <Skeleton width="w-40" height="h-6" />
      <Skeleton width="w-24" height="h-8" className="rounded-lg" />
    </div>
    <div className="space-y-4">
      {/* Table Header */}
      <div className="grid grid-cols-4 gap-4 pb-4 border-b border-gray-100">
        <Skeleton width="w-20" height="h-4" />
        <Skeleton width="w-16" height="h-4" />
        <Skeleton width="w-24" height="h-4" />
        <Skeleton width="w-12" height="h-4" />
      </div>
      {/* Table Rows */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="grid grid-cols-4 gap-4 py-3">
          <Skeleton width="w-full" height="h-4" />
          <Skeleton width="w-12" height="h-4" />
          <Skeleton width="w-20" height="h-4" />
          <Skeleton width="w-8" height="h-4" />
        </div>
      ))}
    </div>
  </div>
);