import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Link, 
  Copy, 
  ExternalLink, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Filter,
  Calendar,
  BarChart3,
  Download,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
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
  const [links, setLinks] = useState<ShortenedLink[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'clicks' | 'url'>('date');
  const [filterBy, setFilterBy] = useState<'all' | 'url' | 'qr' | 'file'>('all');

  useEffect(() => {
    // Load links from backend API only - no localStorage
    loadLinksFromBackend();
  }, [user]);

  const loadLinksFromBackend = async () => {
    if (!user?.id) {
      console.log('No user ID available for loading links');
      setLinks([]);
      return;
    }

    try {
      console.log('Loading links from backend for user:', user.id);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
      const response = await fetch(`${apiUrl}/v1/urls/user/${user.id}`);
      const result = await response.json();
      
      if (result.success) {
        const formattedLinks = result.data.map((link: any) => ({
          id: link.id,
          shortUrl: link.shortUrl,
          originalUrl: link.originalUrl,
          shortCode: link.shortCode,
          clicks: link.totalClicks || 0,
          createdAt: link.createdAt,
          title: link.title,
          tags: link.tags || [],
          type: 'url'
        }));
        setLinks(formattedLinks);
        console.log(`Loaded ${formattedLinks.length} links from backend`);
      } else {
        console.error('Failed to load links:', result.message);
        setLinks([]);
      }
    } catch (error) {
      console.error('Failed to load links from backend:', error);
      setLinks([]);
    }
  };

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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const deleteLink = async (linkId: string) => {
    if (!window.confirm('Are you sure you want to delete this link? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('Deleting link from backend:', linkId);
      
      // Find the link to get its shortCode
      const linkToDelete = links.find(link => link.id === linkId);
      if (!linkToDelete) {
        toast.error('Link not found');
        return;
      }

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
      const response = await fetch(`${apiUrl}/v1/urls/${linkToDelete.shortCode}?userId=${user?.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        // Remove from local state only after successful backend deletion
        const updatedLinks = links.filter(link => link.id !== linkId);
        setLinks(updatedLinks);
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
      const response = await fetch(`${apiUrl}/v1/urls/${linkToUpdate.shortCode}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle,
          userId: user?.id
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Update local state
        const updatedLinks = links.map(link => 
          link.id === linkId ? { ...link, title: newTitle } : link
        );
        setLinks(updatedLinks);
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
      const response = await fetch(`${apiUrl}/v1/urls/${linkToUpdate.shortCode}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tags: newTags,
          userId: user?.id
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Update local state
        const updatedLinks = links.map(link => 
          link.id === linkId ? { ...link, tags: newTags } : link
        );
        setLinks(updatedLinks);
        toast.success('Tags updated successfully');
      } else {
        toast.error(result.message || 'Failed to update tags');
      }
    } catch (error) {
      console.error('Failed to update tags:', error);
      toast.error('Failed to update tags');
    }
  };

  if (links.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Links Manager</h2>
            <p className="text-blue-100">
              Manage and track your short links
            </p>
          </div>
          <button
            onClick={onCreateClick}
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create Link</span>
          </button>
        </div>
      </div>

      {/* Header & Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search links..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
          <div className="space-y-4">
            {filteredLinks.map((link) => (
              <div key={link.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
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
                    
                    <div className="flex items-center space-x-2 mb-1">
                      <code className="text-blue-600 font-mono text-sm">{link.shortUrl}</code>
                    </div>
                    
                    <p className="text-sm text-gray-600 truncate mb-2">{link.originalUrl}</p>
                    
                    {/* Tags */}
                    {link.tags && link.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {link.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>{link.clicks} clicks</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(link.createdAt).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ml-4 flex items-center space-x-2">
                    {/* Direct Analytics Button */}
                    <button
                      onClick={() => {
                        const shortCode = link.shortUrl.split('/').pop();
                        window.open(`/analytics/${shortCode}`, '_blank');
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Analytics"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>
                    
                    <LinkActions
                      link={link}
                      onEdit={editLink}
                      onDelete={deleteLink}
                      onUpdateTags={updateTags}
                      showQRCode={true}
                    />
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