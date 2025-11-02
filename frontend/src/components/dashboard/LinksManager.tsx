import React, { useState } from 'react';
import { 
  Link, 
  ExternalLink, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Filter,
  Calendar,
  BarChart3,
  Download,
  Plus,
  RefreshCw,
  Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useUserUrls } from '../../hooks/useDashboardData';
import { TableSkeleton } from '../ui/Skeleton';
import LinkActions from '../LinkActions';

interface ShortenedLink {
  id: string;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  clicks: number;
  createdAt: string;
  customDomain?: string;
  type: 'url' | 'qr' | 'file';
  tags?: string[];
  title?: string;
}

interface LinksManagerProps {
  onCreateClick?: () => void;
}

const LinksManager: React.FC<LinksManagerProps> = ({ onCreateClick }) => {
  const { user } = useAuth();
  
  // Use React Query for fast loading with caching
  const { data: rawLinks, isLoading, isFetching, error, refetch } = useUserUrls();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'clicks' | 'url'>('date');
  const [filterBy, setFilterBy] = useState<'all' | 'url' | 'qr' | 'file'>('all');

  // Format the raw data from API
  const links: ShortenedLink[] = rawLinks ? rawLinks.map((link: any) => ({
    id: link.id,
    shortUrl: link.shortUrl,
    originalUrl: link.originalUrl,
    shortCode: link.shortCode,
    clicks: link.totalClicks || 0,
    createdAt: link.createdAt,
    title: link.title,
    tags: link.tags || [],
    type: 'url' as const
  })) : [];

  const filteredLinks = links
    .filter(link => {
      const matchesSearch = link.shortUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           link.originalUrl.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterBy === 'all' || link.type === filterBy;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'clicks':
          return b.clicks - a.clicks;
        case 'url':
          return a.shortUrl.localeCompare(b.shortUrl);
        default:
          return 0;
      }
    });

  const handleRefresh = () => {
    refetch();
    toast.success('Links refreshed!');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy link');
    }
  };

  const deleteLink = async (linkId: string) => {
    if (!window.confirm('Are you sure you want to delete this link? This action cannot be undone.')) {
      return;
    }

    try {
      const linkToDelete = links.find(link => link.id === linkId);
      if (!linkToDelete) {
        toast.error('Link not found');
        return;
      }

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${apiUrl}/v1/urls/${linkToDelete.shortCode}?userId=${user?.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        // Refresh the data after successful deletion
        refetch();
        toast.success('Link deleted successfully');
      } else {
        toast.error(result.message || 'Failed to delete link');
      }
    } catch (error) {
      console.error('Failed to delete link:', error);
      toast.error('Failed to delete link');
    }
  };

  const editLink = (linkId: string) => {
    // Navigate to create page with edit mode
    const linkToEdit = links.find(link => link.id === linkId);
    if (linkToEdit) {
      // For now, show a simple prompt to edit the title
      const newTitle = window.prompt('Enter new title for this link:', linkToEdit.title || '');
      if (newTitle !== null) {
        updateLinkTitle(linkId, newTitle);
      }
    }
  };

  const updateLinkTitle = async (linkId: string, newTitle: string) => {
    try {
      const linkToUpdate = links.find(link => link.id === linkId);
      if (!linkToUpdate) {
        toast.error('Link not found');
        return;
      }

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${apiUrl}/v1/urls/${linkToUpdate.shortCode}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle,
          userId: user?.id
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Refresh the data after successful update
        refetch();
        toast.success('Link updated successfully');
      } else {
        toast.error(result.message || 'Failed to update link');
      }
    } catch (error) {
      console.error('Failed to update link:', error);
      toast.error('Failed to update link');
    }
  };

  const updateTags = async (linkId: string, newTags: string[]) => {
    try {
      const linkToUpdate = links.find(link => link.id === linkId);
      if (!linkToUpdate) {
        toast.error('Link not found');
        return;
      }

      console.log('Updating tags in backend:', linkId, newTags);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${apiUrl}/v1/urls/${linkToUpdate.shortCode}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tags: newTags,
          userId: user?.id
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Refresh the data after successful update
        refetch();
        toast.success('Tags updated successfully');
      } else {
        toast.error(result.message || 'Failed to update tags');
      }
    } catch (error) {
      console.error('Failed to update tags:', error);
      toast.error('Failed to update tags');
    }
  };

  // Handle error state
  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-red-600 mb-4">Failed to load links</div>
        <button 
          onClick={handleRefresh}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Show skeleton loading when no cached data
  if (isLoading && !rawLinks) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-8 bg-white/20 rounded w-48 mb-2"></div>
              <div className="h-4 bg-white/20 rounded w-64"></div>
            </div>
            <div className="h-12 w-32 bg-white/20 rounded-lg"></div>
          </div>
        </div>
        
        {/* Table Skeleton */}
        <TableSkeleton />
      </div>
    );
  }

  // Show empty state only when we have data but no links
  if (rawLinks && links.length === 0 && !searchTerm && filterBy === 'all') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Links Manager</h2>
              <p className="text-blue-100">Manage and track your short links</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isFetching}
              className="bg-white/10 text-white px-3 py-2 rounded-lg hover:bg-white/20 transition-colors flex items-center space-x-2 disabled:opacity-50 mr-4"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isFetching ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <button
              onClick={onCreateClick}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Link</span>
            </button>
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <Link className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Links Yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first short link to start tracking clicks and managing your URLs.
          </p>
          <button 
            onClick={onCreateClick}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Links Manager</h2>
            <p className="text-blue-100 text-sm sm:text-base">
              Manage and track your short links ({filteredLinks.length} links)
            </p>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isFetching}
              className="bg-white/10 text-white px-2 sm:px-3 py-2 rounded-lg hover:bg-white/20 transition-colors flex items-center space-x-1 sm:space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline text-sm">{isFetching ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <button
              onClick={onCreateClick}
              className="bg-white text-blue-600 px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Create Link</span>
              <span className="xs:hidden">Create</span>
            </button>
          </div>
        </div>
      </div>

      {/* Header & Controls */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search links..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 sm:px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm"
            >
              <option value="date">Sort by Date</option>
              <option value="clicks">Sort by Clicks</option>
              <option value="url">Sort by URL</option>
            </select>

            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Types</option>
              <option value="url">URL Links</option>
              <option value="qr">QR Codes</option>
              <option value="file">File Links</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">{links.length}</div>
            <div className="text-sm text-gray-600">Total Links</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">
              {links.reduce((sum, link) => sum + link.clicks, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Clicks</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">
              {links.filter(link => link.type === 'qr').length}
            </div>
            <div className="text-sm text-gray-600">QR Codes</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {links.filter(link => link.type === 'file').length}
            </div>
            <div className="text-sm text-gray-600">File Links</div>
          </div>
        </div>
      </div>

      {/* Links List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Your Links ({filteredLinks.length})
        </h3>
        
        {filteredLinks.length === 0 ? (
          <div className="text-center py-8">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No links found matching your criteria</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLinks.map((link) => (
              <div key={link.id} className="border border-gray-200 rounded-xl p-3 sm:p-4 hover:shadow-md transition-shadow bg-white">
                {/* Mobile-First Layout */}
                <div className="flex flex-col space-y-3">
                  {/* Header Row - Type and Domain */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        link.type === 'url' ? 'bg-blue-500' : 
                        link.type === 'qr' ? 'bg-purple-500' : 'bg-green-500'
                      }`} />
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        {link.type === 'url' ? 'Short Link' : link.type === 'qr' ? 'QR Code' : 'File Link'}
                      </span>
                      {link.customDomain && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Custom Domain
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Eye className="w-3 h-3" />
                      <span>{link.clicks}</span>
                    </div>
                  </div>
                  
                  {/* Short URL - Prominent Display */}
                  <div className="flex items-center justify-between">
                    <code className="text-blue-600 font-mono text-sm sm:text-base font-medium flex-1 truncate">
                      {link.shortUrl}
                    </code>
                    <button
                      onClick={() => copyToClipboard(link.shortUrl)}
                      className="ml-2 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors touch-manipulation"
                      title="Copy Link"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Original URL - Truncated */}
                  <p className="text-sm text-gray-600 truncate">{link.originalUrl}</p>
                  
                  {/* Tags */}
                  {link.tags && link.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {link.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {tag}
                        </span>
                      ))}
                      {link.tags.length > 3 && (
                        <span className="text-xs text-gray-500">+{link.tags.length - 3} more</span>
                      )}
                    </div>
                  )}
                  
                  {/* Bottom Row - Date and Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(link.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    {/* Touch-Friendly Action Buttons */}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          const shortCode = link.shortUrl.split('/').pop();
                          // Navigate to analytics page with shortCode and userId
                          window.open(`/dashboard/analytics/url/${shortCode}?userId=${user?.id}`, '_blank');
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors touch-manipulation"
                        title="Analytics"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => editLink(link.id)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors touch-manipulation"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => deleteLink(link.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LinksManager;