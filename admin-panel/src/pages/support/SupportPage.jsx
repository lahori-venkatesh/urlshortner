import React, { useState } from 'react';

// Complete Support Ticket Management Page - Matching User-Side Functionality
const SupportPage = ({ hasPermission }) => {
  const [activeTab, setActiveTab] = useState('tickets');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketDetail, setShowTicketDetail] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState([]);

  // Mock comprehensive support ticket data matching user-side structure exactly
  const supportTickets = [
    {
      id: 'ticket_001',
      userId: 'usr_001',
      category: 'technical',
      subject: 'Custom domain verification failing',
      message: 'I have added the CNAME record as instructed but my domain verification keeps failing. I have waited 24 hours for DNS propagation. Can you please help me troubleshoot this issue?',
      priority: 'high',
      status: 'open',
      createdAt: '2024-01-30T09:15:00Z',
      updatedAt: '2024-01-30T14:30:00Z',
      assignedAgent: 'Sarah Wilson',
      assignedTo: 'support@pebly.com',
      userName: 'John Doe',
      userEmail: 'john@company.com',
      userPlan: 'Business',
      currentPage: '/domains',
      responseTime: '2h 5m',
      resolutionTime: null,
      attachments: ['att_001'],
      tags: ['domain', 'dns'],
      responses: [
        {
          id: 'resp_001',
          ticketId: 'ticket_001',
          message: 'Thank you for contacting support. I can see the CNAME record is correctly configured. Let me check our verification system and get back to you shortly.',
          sender: 'agent',
          senderName: 'Sarah Wilson',
          timestamp: '2024-01-30T11:20:00Z',
          attachments: []
        }
      ],
      metadata: {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        ipAddress: '192.168.1.100',
        sessionId: 'sess_abc123',
        referrer: 'https://tinyslash.com/domains'
      }
    },
    {
      id: 'ticket_002',
      userId: 'usr_002',
      category: 'payment',
      subject: 'Billing issue - charged twice for Pro plan',
      message: 'I was charged twice for my Pro plan subscription this month. Please refund the duplicate charge. Transaction IDs: TXN123 and TXN124. I have attached the payment receipts for both charges.',
      priority: 'medium',
      status: 'in-progress',
      createdAt: '2024-01-29T16:45:00Z',
      updatedAt: '2024-01-30T10:15:00Z',
      assignedAgent: 'Mike Johnson',
      assignedTo: 'billing@pebly.com',
      userName: 'Jane Smith',
      userEmail: 'jane@startup.com',
      userPlan: 'Pro',
      currentPage: '/billing',
      responseTime: '45m',
      resolutionTime: null,
      attachments: ['att_002'],
      tags: ['billing', 'refund'],
      responses: [
        {
          id: 'resp_002',
          ticketId: 'ticket_002',
          message: 'I have located both transactions and initiated a refund for the duplicate charge. You should see the refund in 3-5 business days. I will follow up to ensure the refund is processed correctly.',
          sender: 'agent',
          senderName: 'Mike Johnson',
          timestamp: '2024-01-30T10:15:00Z',
          attachments: []
        }
      ],
      metadata: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ipAddress: '203.0.113.45',
        sessionId: 'sess_def456',
        referrer: 'https://tinyslash.com/billing'
      }
    },
    {
      id: 'ticket_003',
      userId: 'usr_003',
      category: 'technical',
      subject: 'QR code not generating with logo',
      message: 'When I try to generate QR codes with my company logo, the generation fails. Works fine without logo. Error message says "Invalid image format". I have attached my logo file.',
      priority: 'low',
      status: 'resolved',
      createdAt: '2024-01-28T14:20:00Z',
      updatedAt: '2024-01-29T09:30:00Z',
      assignedAgent: 'Emma Davis',
      assignedTo: 'tech@pebly.com',
      userName: 'Alex Brown',
      userEmail: 'alex@agency.com',
      userPlan: 'Business',
      currentPage: '/qr-generator',
      responseTime: '1h 15m',
      resolutionTime: '18h 10m',
      attachments: ['att_003'],
      tags: ['qr-code', 'bug'],
      responses: [
        {
          id: 'resp_003',
          ticketId: 'ticket_003',
          message: 'I found the issue - your logo needs to be in PNG format with transparent background. I have converted it for you and the QR code generation should work now. Please try again and let me know if you need any further assistance.',
          sender: 'agent',
          senderName: 'Emma Davis',
          timestamp: '2024-01-29T09:30:00Z',
          attachments: []
        }
      ],
      metadata: {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
        ipAddress: '198.51.100.23',
        sessionId: 'sess_ghi789',
        referrer: 'https://tinyslash.com/qr'
      }
    },
    {
      id: 'ticket_004',
      userId: 'usr_004',
      category: 'general',
      subject: 'Need help with team collaboration features',
      message: 'I am trying to set up team collaboration for my organization but having trouble understanding the permission system. Can someone guide me through the process of adding team members and setting up proper access controls?',
      priority: 'medium',
      status: 'open',
      createdAt: '2024-01-27T11:30:00Z',
      updatedAt: '2024-01-30T15:45:00Z',
      assignedAgent: 'Support Team',
      assignedTo: 'support@pebly.com',
      userName: 'Lisa Chen',
      userEmail: 'lisa@techcorp.com',
      userPlan: 'Business',
      currentPage: '/teams',
      responseTime: '30m',
      resolutionTime: null,
      attachments: [],
      tags: ['feature-request', 'help'],
      responses: [
        {
          id: 'resp_004',
          ticketId: 'ticket_004',
          message: 'I would be happy to help you set up team collaboration. Let me schedule a quick call to walk you through the process. What time works best for you this week?',
          sender: 'agent',
          senderName: 'Support Team',
          timestamp: '2024-01-30T15:45:00Z',
          attachments: []
        }
      ],
      metadata: {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        ipAddress: '172.16.0.1',
        sessionId: 'sess_jkl012',
        referrer: 'https://tinyslash.com/teams'
      }
    }
  ];

  // Support analytics matching user-side structure
  const supportStats = {
    totalTickets: supportTickets.length,
    openTickets: supportTickets.filter(t => t.status === 'open').length,
    inProgressTickets: supportTickets.filter(t => t.status === 'in-progress').length,
    resolvedTickets: supportTickets.filter(t => t.status === 'resolved').length,
    closedTickets: supportTickets.filter(t => t.status === 'closed').length,
    avgResponseTime: '1h 24m',
    avgResolutionTime: '4h 32m',
    satisfactionScore: 4.7,
    unreadCount: supportTickets.filter(t =>
      t.responses.some(r => r.sender === 'user' && new Date(r.timestamp) > new Date(t.updatedAt))
    ).length,
    categories: {
      payment: supportTickets.filter(t => t.category === 'payment').length,
      technical: supportTickets.filter(t => t.category === 'technical').length,
      account: supportTickets.filter(t => t.category === 'account').length,
      general: supportTickets.filter(t => t.category === 'general').length
    },
    priorities: {
      urgent: supportTickets.filter(t => t.priority === 'urgent').length,
      high: supportTickets.filter(t => t.priority === 'high').length,
      medium: supportTickets.filter(t => t.priority === 'medium').length,
      low: supportTickets.filter(t => t.priority === 'low').length
    }
  };

  // Category functions matching user-side exactly
  const getCategoryColor = (category) => {
    switch (category) {
      case 'payment': return 'bg-green-100 text-green-800';
      case 'technical': return 'bg-blue-100 text-blue-800';
      case 'account': return 'bg-purple-100 text-purple-800';
      case 'general': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'payment': return '💳';
      case 'technical': return '🔧';
      case 'account': return '👤';
      case 'general': return '💬';
      default: return '📋';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-orange-100 text-orange-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return '🔴';
      case 'in-progress': return '🔵';
      case 'resolved': return '✅';
      case 'closed': return '⚫';
      default: return '📋';
    }
  };

  const filteredTickets = supportTickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    const matchesCategory = filterCategory === 'all' || ticket.category === filterCategory;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Support Tickets</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage customer support requests and communications</p>
        </div>
        <div className="flex space-x-3">
          {hasPermission('support', 'export') && (
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Export Report
            </button>
          )}
          {hasPermission('support', 'create') && (
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Create Ticket
            </button>
          )}
        </div>
      </div>

      {/* Support Analytics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tickets</h3>
          <p className="text-2xl font-bold text-blue-600 mt-1">{supportStats.totalTickets}</p>
          <p className="text-xs text-gray-500 mt-1">All time</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Open</h3>
          <p className="text-2xl font-bold text-orange-600 mt-1">{supportStats.openTickets}</p>
          <p className="text-xs text-orange-600 mt-1">Needs attention</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">In Progress</h3>
          <p className="text-2xl font-bold text-blue-600 mt-1">{supportStats.inProgressTickets}</p>
          <p className="text-xs text-blue-600 mt-1">Being handled</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Resolved</h3>
          <p className="text-2xl font-bold text-green-600 mt-1">{supportStats.resolvedTickets}</p>
          <p className="text-xs text-green-600 mt-1">Completed</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Unread</h3>
          <p className="text-2xl font-bold text-red-600 mt-1">{supportStats.unreadCount}</p>
          <p className="text-xs text-red-600 mt-1">New responses</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Response</h3>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{supportStats.avgResponseTime}</p>
          <p className="text-xs text-indigo-600 mt-1">Response time</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Resolution</h3>
          <p className="text-2xl font-bold text-pink-600 mt-1">{supportStats.avgResolutionTime}</p>
          <p className="text-xs text-pink-600 mt-1">Resolution time</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Satisfaction</h3>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{supportStats.satisfactionScore}/5</p>
          <p className="text-xs text-yellow-600 mt-1">Customer rating</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Categories</option>
              <option value="payment">💳 Payment</option>
              <option value="technical">🔧 Technical</option>
              <option value="account">👤 Account</option>
              <option value="general">💬 General</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Agent</label>
            <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
              <option value="all">All Agents</option>
              <option value="sarah">Sarah Wilson</option>
              <option value="mike">Mike Johnson</option>
              <option value="emma">Emma Davis</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ticket</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Agent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Response Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{getCategoryIcon(ticket.category)}</div>
                    <div>
                      <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        #{ticket.id.slice(-6)}
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
                        {ticket.subject}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Created: {new Date(ticket.createdAt).toLocaleDateString()}
                      </div>
                      {ticket.attachments && ticket.attachments.length > 0 && (
                        <div className="text-xs text-purple-600 mt-1">
                          📎 {ticket.attachments.length} attachment{ticket.attachments.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">
                        {ticket.userName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {ticket.userName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {ticket.userEmail}
                      </div>
                      <div className="text-xs text-gray-400">
                        {ticket.userPlan} Plan
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(ticket.category)}`}>
                    {ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(ticket.status)}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {ticket.assignedAgent}
                  </div>
                  <div className="text-xs text-gray-500">
                    {ticket.assignedTo}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {ticket.responseTime}
                  </div>
                  <div className="text-xs text-gray-500">
                    Last: {ticket.lastResponseAt}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setShowTicketDetail(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View
                    </button>
                    {hasPermission('support', 'respond') && (
                      <button className="text-green-600 hover:text-green-800 text-sm">
                        Reply
                      </button>
                    )}
                    {hasPermission('support', 'resolve') && ticket.status !== 'RESOLVED' && (
                      <button className="text-purple-600 hover:text-purple-800 text-sm">
                        Resolve
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Support Categories Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tickets by Category</h3>
          <div className="space-y-3">
            {Object.entries(supportStats.categories).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(category)} mr-3`}>
                    {category.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{count} tickets</div>
                  <div className="text-xs text-gray-500">
                    {((count / supportStats.totalTickets) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Agent Performance</h3>
          <div className="space-y-3">
            {[
              { agent: 'Sarah Wilson', tickets: 15, avgResponse: '1h 12m', satisfaction: 4.8 },
              { agent: 'Mike Johnson', tickets: 12, avgResponse: '1h 45m', satisfaction: 4.6 },
              { agent: 'Emma Davis', tickets: 8, avgResponse: '58m', satisfaction: 4.9 },
              { agent: 'Tech Lead', tickets: 3, avgResponse: '2h 15m', satisfaction: 4.5 }
            ].map((agent, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {agent.agent}
                  </div>
                  <div className="text-xs text-gray-500">
                    {agent.tickets} tickets • {agent.avgResponse} avg response
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-yellow-600">
                    {agent.satisfaction}/5
                  </div>
                  <div className="text-xs text-gray-500">satisfaction</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ticket Detail Modal */}
      {showTicketDetail && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex">
              {/* Ticket Details */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedTicket.id}: {selectedTicket.subject}
                    </h2>
                    <div className="flex items-center space-x-3 mt-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedTicket.status)}`}>
                        {selectedTicket.status.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                        {selectedTicket.priority}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(selectedTicket.category)}`}>
                        {selectedTicket.category.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTicketDetail(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {/* Customer Info */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">{selectedTicket.userName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">{selectedTicket.userEmail}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Plan:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">{selectedTicket.userPlan}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">User ID:</span>
                      <span className="ml-2 text-gray-900 dark:text-white font-mono">{selectedTicket.userId}</span>
                    </div>
                  </div>
                </div>

                {/* Conversation */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Conversation</h3>
                  {selectedTicket.responses.map((response) => (
                    <div key={response.id} className={`flex ${response.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-3xl p-4 rounded-lg ${response.sender === 'user'
                        ? 'bg-gray-100 dark:bg-gray-700'
                        : 'bg-blue-100 dark:bg-blue-900'
                        }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {response.senderName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {response.timestamp}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 dark:text-gray-200">
                          {response.message}
                        </p>
                        {response.attachments.length > 0 && (
                          <div className="mt-2">
                            {response.attachments.map((attId) => {
                              const attachment = selectedTicket.attachments.find(a => a.id === attId);
                              return attachment ? (
                                <div key={attId} className="text-xs text-blue-600 dark:text-blue-400">
                                  📎 {attachment.fileName} ({attachment.fileSize})
                                </div>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Form */}
                {hasPermission('support', 'respond') && (
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Reply to Customer</h4>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      rows="4"
                      placeholder="Type your response..."
                    />
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex space-x-2">
                        <button className="text-sm text-gray-600 hover:text-gray-800">
                          📎 Attach File
                        </button>
                        <button className="text-sm text-gray-600 hover:text-gray-800">
                          📝 Use Template
                        </button>
                      </div>
                      <div className="flex space-x-2">
                        <button className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">
                          Save Draft
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          Send Reply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Ticket Metadata Sidebar */}
              <div className="w-80 bg-gray-50 dark:bg-gray-900 p-6 border-l border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ticket Details</h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-500">Assigned Agent</label>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedTicket.assignedAgent}</p>
                  </div>

                  <div>
                    <label className="text-sm text-gray-500">Response Time</label>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedTicket.responseTime}</p>
                  </div>

                  <div>
                    <label className="text-sm text-gray-500">Created</label>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedTicket.createdAt}</p>
                  </div>

                  <div>
                    <label className="text-sm text-gray-500">Last Updated</label>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedTicket.updatedAt}</p>
                  </div>

                  <div>
                    <label className="text-sm text-gray-500">Tags</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedTicket.tags && selectedTicket.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {selectedTicket.metadata && (
                    <div>
                      <label className="text-sm text-gray-500">Technical Info</label>
                      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 mt-1">
                        <div>IP: {selectedTicket.metadata.ipAddress}</div>
                        <div>Session: {selectedTicket.metadata.sessionId}</div>
                        <div>Referrer: {selectedTicket.metadata.referrer}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="mt-6 space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Quick Actions</h4>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                    Change Priority
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                    Reassign Agent
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                    Add Internal Note
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded">
                    Mark as Resolved
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportPage;
