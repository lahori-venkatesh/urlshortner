import React, { useState, useEffect } from 'react';
import { 
  Ticket, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  MessageSquare, 
  Search,
  Filter,
  Calendar,
  User,
  Tag,
  ArrowLeft,
  Send,
  Paperclip
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupportContext } from '../../context/SupportContext';
import { useAuth } from '../../context/AuthContext';

interface SupportTicketsProps {
  className?: string;
}

const SupportTickets: React.FC<SupportTicketsProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { 
    tickets, 
    isLoading, 
    searchTickets, 
    getTicketsByStatus, 
    addResponse,
    updateTicketStatus 
  } = useSupportContext();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in-progress' | 'resolved' | 'closed'>('all');
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');

  const filteredTickets = searchQuery 
    ? searchTickets(searchQuery)
    : statusFilter === 'all' 
      ? tickets 
      : getTicketsByStatus(statusFilter);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'closed':
        return <CheckCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Ticket className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-orange-100 text-orange-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'payment':
        return '💳';
      case 'technical':
        return '🔧';
      case 'account':
        return '👤';
      case 'general':
        return '💬';
      default:
        return '📋';
    }
  };

  const handleSendMessage = async (ticketId: string) => {
    if (!newMessage.trim()) return;

    try {
      await addResponse(ticketId, newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (selectedTicket) {
    const ticket = tickets.find(t => t.id === selectedTicket);
    if (!ticket) return null;

    return (
      <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 ${className}`}>
        {/* Ticket Detail Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setSelectedTicket(null)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Tickets</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                {ticket.status.replace('-', ' ').toUpperCase()}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                {ticket.priority.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="text-2xl">{getCategoryIcon(ticket.category)}</div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{ticket.subject}</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Created {formatDate(ticket.createdAt)}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Tag className="w-4 h-4" />
                  <span className="capitalize">{ticket.category}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>{ticket.responses.length} responses</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-96">
          {/* Original Message */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <User className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-900">{user?.name || 'You'}</span>
              <span className="text-sm text-gray-500">{formatDate(ticket.createdAt)}</span>
            </div>
            <p className="text-gray-700">{ticket.message}</p>
          </div>

          {/* Responses */}
          {ticket.responses.map((response) => (
            <div
              key={response.id}
              className={`p-4 rounded-lg ${
                response.sender === 'user' 
                  ? 'bg-blue-50 ml-8' 
                  : 'bg-green-50 mr-8'
              }`}
            >
              <div className="flex items-center space-x-2 mb-2">
                <User className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-gray-900">
                  {response.sender === 'user' ? 'You' : response.senderName}
                </span>
                <span className="text-sm text-gray-500">{formatDate(response.timestamp)}</span>
                {response.sender === 'agent' && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    Support Agent
                  </span>
                )}
              </div>
              <p className="text-gray-700">{response.message}</p>
            </div>
          ))}
        </div>

        {/* Reply Section */}
        {ticket.status !== 'closed' && (
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your reply..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              <div className="flex flex-col space-y-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-lg">
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleSendMessage(ticket.id)}
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Support Tickets</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tickets..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="divide-y divide-gray-200">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-8 text-center">
            <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
            <p className="text-gray-600">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'You haven\'t created any support tickets yet.'
              }
            </p>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => setSelectedTicket(ticket.id)}
            >
              <div className="flex items-start space-x-4">
                <div className="text-2xl">{getCategoryIcon(ticket.category)}</div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {ticket.subject}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('-', ' ')}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {ticket.message}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center space-x-1">
                      {getStatusIcon(ticket.status)}
                      <span>#{ticket.id.slice(-6)}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(ticket.createdAt)}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MessageSquare className="w-3 h-3" />
                      <span>{ticket.responses.length} responses</span>
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default SupportTickets;