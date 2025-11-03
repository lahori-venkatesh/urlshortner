# BitaURL - Admin Panel Documentation

## 🎯 Overview

The BitaURL Admin Panel is a comprehensive administrative interface designed for platform management, user oversight, and business intelligence. Built with React and TypeScript, it provides enterprise-grade tools for monitoring, managing, and scaling the BitaURL platform.

## 🏗️ Architecture

### Technology Stack
- **React 18** - Modern React with concurrent features
- **TypeScript** - Type safety and enhanced developer experience
- **Tailwind CSS** - Utility-first styling framework
- **Recharts** - Data visualization and analytics charts
- **React Router v6** - Client-side routing and navigation
- **Axios** - HTTP client with request/response interceptors
- **React Hook Form** - Form handling and validation
- **Date-fns** - Date manipulation and formatting

### Project Structure
```
admin-panel/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── favicon.ico
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components
│   │   ├── charts/         # Chart components
│   │   ├── tables/         # Data table components
│   │   ├── forms/          # Form components
│   │   └── modals/         # Modal components
│   ├── pages/              # Page components
│   │   ├── dashboard/      # Dashboard overview
│   │   ├── users/          # User management
│   │   ├── teams/          # Team management
│   │   ├── urls/           # URL management
│   │   ├── domains/        # Domain management
│   │   ├── billing/        # Billing & payments
│   │   ├── support/        # Support tickets
│   │   ├── analytics/      # Analytics & reports
│   │   ├── system/         # System health
│   │   └── settings/       # Admin settings
│   ├── hooks/              # Custom React hooks
│   ├── context/            # React Context providers
│   ├── services/           # API service layer
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript definitions
│   └── constants/          # Application constants
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## 🔐 Role-Based Access Control

### Admin Role Hierarchy
```typescript
export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',      // Full platform access
  ADMIN = 'ADMIN',                  // General administration
  SUPPORT_ADMIN = 'SUPPORT_ADMIN',  // Support and tickets only
  BILLING_ADMIN = 'BILLING_ADMIN',  // Billing and payments only
  TECH_ADMIN = 'TECH_ADMIN',        // Technical monitoring only
  CONTENT_MODERATOR = 'CONTENT_MODERATOR', // Content moderation
  AUDITOR = 'AUDITOR'               // Read-only access
}

export interface AdminPermissions {
  users: {
    read: boolean;
    write: boolean;
    delete: boolean;
    impersonate: boolean;
  };
  billing: {
    read: boolean;
    write: boolean;
    refund: boolean;
  };
  support: {
    read: boolean;
    write: boolean;
    assign: boolean;
  };
  system: {
    read: boolean;
    write: boolean;
    maintenance: boolean;
  };
}
```

### Permission System Implementation
```typescript
// Permission checking hook
export const usePermissions = () => {
  const { admin } = useAuth();
  
  const hasPermission = (resource: string, action: string): boolean => {
    if (!admin?.role) return false;
    
    const rolePermissions = ROLE_PERMISSIONS[admin.role];
    return rolePermissions.includes(`${resource}:${action}`) || 
           rolePermissions.includes(`${resource}:*`) ||
           rolePermissions.includes('*');
  };
  
  const canAccess = (page: string): boolean => {
    const pagePermissions = PAGE_PERMISSIONS[page];
    return pagePermissions.some(permission => 
      hasPermission(permission.resource, permission.action)
    );
  };
  
  return { hasPermission, canAccess };
};

// Permission-based component rendering
export const ProtectedComponent: React.FC<{
  resource: string;
  action: string;
  children: React.ReactNode;
}> = ({ resource, action, children }) => {
  const { hasPermission } = usePermissions();
  
  if (!hasPermission(resource, action)) {
    return null;
  }
  
  return <>{children}</>;
};
```

## 📊 Dashboard Components

### Main Dashboard
```typescript
export const Dashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await adminApi.getDashboardMetrics(timeRange);
        setMetrics(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [timeRange]);
  
  if (loading) return <DashboardSkeleton />;
  
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={metrics?.totalUsers || 0}
          change={metrics?.userGrowth || 0}
          icon="👥"
          color="blue"
        />
        <MetricCard
          title="Active URLs"
          value={metrics?.activeUrls || 0}
          change={metrics?.urlGrowth || 0}
          icon="🔗"
          color="green"
        />
        <MetricCard
          title="Monthly Revenue"
          value={`$${metrics?.monthlyRevenue || 0}`}
          change={metrics?.revenueGrowth || 0}
          icon="💰"
          color="purple"
        />
        <MetricCard
          title="System Uptime"
          value={`${metrics?.uptime || 0}%`}
          change={0}
          icon="⚡"
          color="orange"
        />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserGrowthChart data={metrics?.userGrowthData} />
        <RevenueChart data={metrics?.revenueData} />
      </div>
      
      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentUsers users={metrics?.recentUsers} />
        <SystemAlerts alerts={metrics?.systemAlerts} />
      </div>
    </div>
  );
};
```

### Analytics Charts
```typescript
export const UserGrowthChart: React.FC<{ data: UserGrowthData[] }> = ({ data }) => {
  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold mb-4">User Growth</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(date) => format(new Date(date), 'MMM dd')}
          />
          <YAxis />
          <Tooltip 
            labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
          />
          <Line 
            type="monotone" 
            dataKey="totalUsers" 
            stroke="#3b82f6" 
            strokeWidth={2}
            name="Total Users"
          />
          <Line 
            type="monotone" 
            dataKey="newUsers" 
            stroke="#10b981" 
            strokeWidth={2}
            name="New Users"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const RevenueChart: React.FC<{ data: RevenueData[] }> = ({ data }) => {
  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold mb-4">Revenue Overview</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="month" 
            tickFormatter={(month) => format(new Date(month), 'MMM')}
          />
          <YAxis tickFormatter={(value) => `$${value}`} />
          <Tooltip 
            formatter={(value) => [`$${value}`, 'Revenue']}
            labelFormatter={(month) => format(new Date(month), 'MMMM yyyy')}
          />
          <Bar dataKey="revenue" fill="#8b5cf6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
```

## 👥 User Management

### User List Component
```typescript
export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    plan: 'all',
    status: 'all',
    role: 'all'
  });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  const { hasPermission } = usePermissions();
  
  useEffect(() => {
    fetchUsers();
  }, [filters]);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getUsers(filters);
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleBulkAction = async (action: BulkAction) => {
    if (selectedUsers.length === 0) return;
    
    try {
      await adminApi.bulkUserAction(action, selectedUsers);
      await fetchUsers();
      setSelectedUsers([]);
      toast.success(`${action} completed successfully`);
    } catch (error) {
      toast.error(`Failed to ${action} users`);
    }
  };
  
  const handleUserImpersonation = async (userId: string) => {
    if (!hasPermission('users', 'impersonate')) {
      toast.error('You do not have permission to impersonate users');
      return;
    }
    
    try {
      const response = await adminApi.impersonateUser(userId);
      // Open user dashboard in new tab
      window.open(`${process.env.REACT_APP_USER_URL}?token=${response.token}`, '_blank');
    } catch (error) {
      toast.error('Failed to impersonate user');
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex space-x-3">
          {selectedUsers.length > 0 && (
            <BulkActionDropdown
              selectedCount={selectedUsers.length}
              onAction={handleBulkAction}
            />
          )}
          <ExportButton onExport={() => adminApi.exportUsers(filters)} />
        </div>
      </div>
      
      {/* Filters */}
      <UserFilters filters={filters} onChange={setFilters} />
      
      {/* User Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <UserTable
          users={users}
          loading={loading}
          selectedUsers={selectedUsers}
          onSelectionChange={setSelectedUsers}
          onImpersonate={handleUserImpersonation}
          onEdit={(user) => setEditingUser(user)}
          onDelete={(userId) => handleDeleteUser(userId)}
        />
      </div>
    </div>
  );
};
```

### User Details Modal
```typescript
export const UserDetailsModal: React.FC<{
  user: User;
  isOpen: boolean;
  onClose: () => void;
}> = ({ user, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'activity' | 'billing'>('profile');
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  
  useEffect(() => {
    if (isOpen && user) {
      fetchUserActivity();
    }
  }, [isOpen, user]);
  
  const fetchUserActivity = async () => {
    try {
      const response = await adminApi.getUserActivity(user.id);
      setUserActivity(response.data);
    } catch (error) {
      console.error('Failed to fetch user activity:', error);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <img
              src={user.avatar || '/default-avatar.png'}
              alt={user.name}
              className="w-12 h-12 rounded-full"
            />
            <div>
              <h2 className="text-xl font-semibold">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
          <UserStatusBadge status={user.status} />
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'profile', label: 'Profile' },
              { id: 'activity', label: 'Activity' },
              { id: 'billing', label: 'Billing' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'profile' && <UserProfileTab user={user} />}
        {activeTab === 'activity' && <UserActivityTab activity={userActivity} />}
        {activeTab === 'billing' && <UserBillingTab user={user} />}
      </div>
    </Modal>
  );
};
```

## 🎫 Support Ticket Management

### Support Dashboard
```typescript
export const SupportDashboard: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filters, setFilters] = useState<TicketFilters>({
    status: 'all',
    priority: 'all',
    category: 'all',
    assignee: 'all'
  });
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  
  useEffect(() => {
    fetchTickets();
  }, [filters]);
  
  const fetchTickets = async () => {
    try {
      const response = await adminApi.getSupportTickets(filters);
      setTickets(response.data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    }
  };
  
  const handleTicketUpdate = async (ticketId: string, updates: Partial<SupportTicket>) => {
    try {
      await adminApi.updateSupportTicket(ticketId, updates);
      await fetchTickets();
      toast.success('Ticket updated successfully');
    } catch (error) {
      toast.error('Failed to update ticket');
    }
  };
  
  const handleTicketReply = async (ticketId: string, message: string) => {
    try {
      await adminApi.replyToTicket(ticketId, message);
      await fetchTickets();
      toast.success('Reply sent successfully');
    } catch (error) {
      toast.error('Failed to send reply');
    }
  };
  
  return (
    <div className="flex h-full">
      {/* Ticket List */}
      <div className="w-1/3 border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Support Tickets</h2>
          <TicketFilters filters={filters} onChange={setFilters} />
        </div>
        
        <div className="overflow-y-auto">
          {tickets.map((ticket) => (
            <TicketListItem
              key={ticket.id}
              ticket={ticket}
              isSelected={selectedTicket?.id === ticket.id}
              onClick={() => setSelectedTicket(ticket)}
            />
          ))}
        </div>
      </div>
      
      {/* Ticket Details */}
      <div className="flex-1">
        {selectedTicket ? (
          <TicketDetails
            ticket={selectedTicket}
            onUpdate={handleTicketUpdate}
            onReply={handleTicketReply}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a ticket to view details
          </div>
        )}
      </div>
    </div>
  );
};
```

### Ticket Details Component
```typescript
export const TicketDetails: React.FC<{
  ticket: SupportTicket;
  onUpdate: (ticketId: string, updates: Partial<SupportTicket>) => void;
  onReply: (ticketId: string, message: string) => void;
}> = ({ ticket, onUpdate, onReply }) => {
  const [replyMessage, setReplyMessage] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  
  const handleReply = async () => {
    if (!replyMessage.trim()) return;
    
    setIsReplying(true);
    try {
      await onReply(ticket.id, replyMessage);
      setReplyMessage('');
    } finally {
      setIsReplying(false);
    }
  };
  
  const handleStatusChange = (status: TicketStatus) => {
    onUpdate(ticket.id, { status });
  };
  
  const handlePriorityChange = (priority: TicketPriority) => {
    onUpdate(ticket.id, { priority });
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">{ticket.subject}</h1>
          <div className="flex items-center space-x-2">
            <TicketStatusBadge status={ticket.status} />
            <TicketPriorityBadge priority={ticket.priority} />
          </div>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>From: {ticket.userEmail}</span>
          <span>•</span>
          <span>Created: {format(new Date(ticket.createdAt), 'MMM dd, yyyy HH:mm')}</span>
          <span>•</span>
          <span>Category: {ticket.category}</span>
        </div>
        
        {/* Actions */}
        <div className="flex items-center space-x-3 mt-4">
          <StatusDropdown
            currentStatus={ticket.status}
            onChange={handleStatusChange}
          />
          <PriorityDropdown
            currentPriority={ticket.priority}
            onChange={handlePriorityChange}
          />
          <AssigneeDropdown
            currentAssignee={ticket.assignedTo}
            onChange={(assignee) => onUpdate(ticket.id, { assignedTo: assignee })}
          />
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Original Message */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <img
                src={ticket.userAvatar || '/default-avatar.png'}
                alt={ticket.userName}
                className="w-8 h-8 rounded-full"
              />
              <div>
                <div className="font-medium">{ticket.userName}</div>
                <div className="text-sm text-gray-500">
                  {format(new Date(ticket.createdAt), 'MMM dd, yyyy HH:mm')}
                </div>
              </div>
            </div>
            <div className="prose prose-sm max-w-none">
              {ticket.message}
            </div>
          </div>
          
          {/* Replies */}
          {ticket.replies?.map((reply) => (
            <div
              key={reply.id}
              className={`rounded-lg p-4 ${
                reply.sender === 'agent' ? 'bg-blue-50 ml-8' : 'bg-gray-50 mr-8'
              }`}
            >
              <div className="flex items-center space-x-3 mb-3">
                <img
                  src={reply.senderAvatar || '/default-avatar.png'}
                  alt={reply.senderName}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <div className="font-medium">{reply.senderName}</div>
                  <div className="text-sm text-gray-500">
                    {format(new Date(reply.timestamp), 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>
              </div>
              <div className="prose prose-sm max-w-none">
                {reply.message}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Reply Form */}
      <div className="p-6 border-t border-gray-200">
        <div className="space-y-3">
          <textarea
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            placeholder="Type your reply..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button className="text-gray-400 hover:text-gray-600">
                📎 Attach File
              </button>
              <button className="text-gray-400 hover:text-gray-600">
                😊 Add Emoji
              </button>
            </div>
            <button
              onClick={handleReply}
              disabled={!replyMessage.trim() || isReplying}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isReplying ? 'Sending...' : 'Send Reply'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

## 💰 Billing Management

### Billing Dashboard
```typescript
export const BillingDashboard: React.FC = () => {
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  
  useEffect(() => {
    fetchBillingData();
  }, [timeRange]);
  
  const fetchBillingData = async () => {
    try {
      const response = await adminApi.getBillingData(timeRange);
      setBillingData(response.data);
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
    }
  };
  
  const handleRefund = async (paymentId: string, amount: number, reason: string) => {
    try {
      await adminApi.processRefund(paymentId, amount, reason);
      await fetchBillingData();
      toast.success('Refund processed successfully');
    } catch (error) {
      toast.error('Failed to process refund');
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Monthly Revenue"
          value={`$${billingData?.monthlyRevenue || 0}`}
          change={billingData?.revenueGrowth || 0}
          icon="💰"
        />
        <MetricCard
          title="Active Subscriptions"
          value={billingData?.activeSubscriptions || 0}
          change={billingData?.subscriptionGrowth || 0}
          icon="📊"
        />
        <MetricCard
          title="Churn Rate"
          value={`${billingData?.churnRate || 0}%`}
          change={-billingData?.churnChange || 0}
          icon="📉"
        />
        <MetricCard
          title="Average Revenue Per User"
          value={`$${billingData?.arpu || 0}`}
          change={billingData?.arpuGrowth || 0}
          icon="👤"
        />
      </div>
      
      {/* Revenue Chart */}
      <RevenueChart data={billingData?.revenueHistory} />
      
      {/* Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTransactions
          transactions={billingData?.recentTransactions}
          onRefund={handleRefund}
        />
        <SubscriptionBreakdown data={billingData?.subscriptionBreakdown} />
      </div>
    </div>
  );
};
```

## 🔧 System Health Monitoring

### System Health Dashboard
```typescript
export const SystemHealthDashboard: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  
  useEffect(() => {
    fetchSystemHealth();
    const interval = setInterval(fetchSystemHealth, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);
  
  const fetchSystemHealth = async () => {
    try {
      const [healthResponse, alertsResponse] = await Promise.all([
        adminApi.getSystemHealth(),
        adminApi.getSystemAlerts()
      ]);
      
      setSystemHealth(healthResponse.data);
      setAlerts(alertsResponse.data);
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ServiceStatusCard
          name="API Gateway"
          status={systemHealth?.apiGateway?.status || 'unknown'}
          responseTime={systemHealth?.apiGateway?.responseTime}
          uptime={systemHealth?.apiGateway?.uptime}
        />
        <ServiceStatusCard
          name="Database"
          status={systemHealth?.database?.status || 'unknown'}
          responseTime={systemHealth?.database?.responseTime}
          connections={systemHealth?.database?.connections}
        />
        <ServiceStatusCard
          name="Cache (Redis)"
          status={systemHealth?.cache?.status || 'unknown'}
          responseTime={systemHealth?.cache?.responseTime}
          memoryUsage={systemHealth?.cache?.memoryUsage}
        />
      </div>
      
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceChart
          title="API Response Times"
          data={systemHealth?.performanceMetrics?.apiResponseTimes}
        />
        <PerformanceChart
          title="Database Query Times"
          data={systemHealth?.performanceMetrics?.dbQueryTimes}
        />
      </div>
      
      {/* System Alerts */}
      <SystemAlertsPanel alerts={alerts} />
      
      {/* Resource Usage */}
      <ResourceUsagePanel usage={systemHealth?.resourceUsage} />
    </div>
  );
};
```

## 📈 Analytics & Reporting

### Analytics Dashboard
```typescript
export const AnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [selectedMetric, setSelectedMetric] = useState<AnalyticsMetric>('clicks');
  
  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange, selectedMetric]);
  
  const fetchAnalyticsData = async () => {
    try {
      const response = await adminApi.getAnalyticsData(timeRange, selectedMetric);
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    }
  };
  
  const exportReport = async (format: 'csv' | 'pdf') => {
    try {
      const response = await adminApi.exportAnalyticsReport(timeRange, format);
      // Handle file download
      const blob = new Blob([response.data], { 
        type: format === 'csv' ? 'text/csv' : 'application/pdf' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${timeRange}.${format}`;
      a.click();
    } catch (error) {
      toast.error('Failed to export report');
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          <MetricSelector value={selectedMetric} onChange={setSelectedMetric} />
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => exportReport('csv')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Export CSV
          </button>
          <button
            onClick={() => exportReport('pdf')}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Export PDF
          </button>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total Clicks"
          value={analyticsData?.totalClicks || 0}
          change={analyticsData?.clicksGrowth || 0}
          icon="👆"
        />
        <MetricCard
          title="Unique Visitors"
          value={analyticsData?.uniqueVisitors || 0}
          change={analyticsData?.visitorsGrowth || 0}
          icon="👥"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${analyticsData?.conversionRate || 0}%`}
          change={analyticsData?.conversionGrowth || 0}
          icon="🎯"
        />
        <MetricCard
          title="Avg. Session Duration"
          value={analyticsData?.avgSessionDuration || '0s'}
          change={analyticsData?.sessionGrowth || 0}
          icon="⏱️"
        />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ClicksOverTimeChart data={analyticsData?.clicksOverTime} />
        <GeographicDistributionChart data={analyticsData?.geographicData} />
      </div>
      
      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TopUrlsTable urls={analyticsData?.topUrls} />
        <DeviceBreakdownChart data={analyticsData?.deviceBreakdown} />
        <ReferrerAnalysis data={analyticsData?.referrerData} />
      </div>
    </div>
  );
};
```

## 🔧 API Integration

### Admin API Client
```typescript
class AdminApiClient {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: process.env.REACT_APP_API_URL + '/api/v1/admin',
      timeout: 30000,
    });
    
    this.setupInterceptors();
  }
  
  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('adminToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('adminToken');
          window.location.href = '/admin/login';
        }
        return Promise.reject(error);
      }
    );
  }
  
  // Dashboard APIs
  async getDashboardMetrics(timeRange: TimeRange): Promise<DashboardMetrics> {
    const response = await this.client.get('/dashboard/metrics', {
      params: { timeRange }
    });
    return response.data;
  }
  
  // User Management APIs
  async getUsers(filters: UserFilters): Promise<PagedResponse<User>> {
    const response = await this.client.get('/users', { params: filters });
    return response.data;
  }
  
  async getUserDetails(userId: string): Promise<User> {
    const response = await this.client.get(`/users/${userId}`);
    return response.data;
  }
  
  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const response = await this.client.put(`/users/${userId}`, updates);
    return response.data;
  }
  
  async impersonateUser(userId: string): Promise<{ token: string }> {
    const response = await this.client.post(`/users/${userId}/impersonate`);
    return response.data;
  }
  
  async bulkUserAction(action: BulkAction, userIds: string[]): Promise<void> {
    await this.client.post('/users/bulk-action', { action, userIds });
  }
  
  // Support APIs
  async getSupportTickets(filters: TicketFilters): Promise<SupportTicket[]> {
    const response = await this.client.get('/support/tickets', { params: filters });
    return response.data;
  }
  
  async updateSupportTicket(ticketId: string, updates: Partial<SupportTicket>): Promise<void> {
    await this.client.put(`/support/tickets/${ticketId}`, updates);
  }
  
  async replyToTicket(ticketId: string, message: string): Promise<void> {
    await this.client.post(`/support/tickets/${ticketId}/reply`, { message });
  }
  
  // Billing APIs
  async getBillingData(timeRange: TimeRange): Promise<BillingData> {
    const response = await this.client.get('/billing/data', {
      params: { timeRange }
    });
    return response.data;
  }
  
  async processRefund(paymentId: string, amount: number, reason: string): Promise<void> {
    await this.client.post(`/billing/refund`, { paymentId, amount, reason });
  }
  
  // System Health APIs
  async getSystemHealth(): Promise<SystemHealth> {
    const response = await this.client.get('/system/health');
    return response.data;
  }
  
  async getSystemAlerts(): Promise<SystemAlert[]> {
    const response = await this.client.get('/system/alerts');
    return response.data;
  }
  
  // Analytics APIs
  async getAnalyticsData(timeRange: TimeRange, metric: AnalyticsMetric): Promise<AnalyticsData> {
    const response = await this.client.get('/analytics/data', {
      params: { timeRange, metric }
    });
    return response.data;
  }
  
  async exportAnalyticsReport(timeRange: TimeRange, format: 'csv' | 'pdf'): Promise<Blob> {
    const response = await this.client.get('/analytics/export', {
      params: { timeRange, format },
      responseType: 'blob'
    });
    return response.data;
  }
}

export const adminApi = new AdminApiClient();
```

## 🔒 Security Features

### Audit Logging
```typescript
export const AuditLogViewer: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [filters, setFilters] = useState<AuditLogFilters>({
    action: 'all',
    resource: 'all',
    userId: '',
    dateRange: { from: null, to: null }
  });
  
  useEffect(() => {
    fetchAuditLogs();
  }, [filters]);
  
  const fetchAuditLogs = async () => {
    try {
      const response = await adminApi.getAuditLogs(filters);
      setAuditLogs(response.data);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <ExportButton onExport={() => adminApi.exportAuditLogs(filters)} />
      </div>
      
      <AuditLogFilters filters={filters} onChange={setFilters} />
      
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Resource
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {auditLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img
                      src={log.userAvatar || '/default-avatar.png'}
                      alt={log.userName}
                      className="w-8 h-8 rounded-full mr-3"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {log.userName}
                      </div>
                      <div className="text-sm text-gray-500">{log.userEmail}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <ActionBadge action={log.action} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {log.resource}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

## 🚀 Performance Optimization

### Code Splitting & Lazy Loading
```typescript
// Lazy load admin pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const SupportDashboard = lazy(() => import('./pages/SupportDashboard'));
const BillingDashboard = lazy(() => import('./pages/BillingDashboard'));
const AnalyticsDashboard = lazy(() => import('./pages/AnalyticsDashboard'));

export const AdminRouter: React.FC = () => {
  return (
    <Router>
      <Suspense fallback={<PageLoadingSpinner />}>
        <Routes>
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/support" element={<SupportDashboard />} />
          <Route path="/admin/billing" element={<BillingDashboard />} />
          <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
        </Routes>
      </Suspense>
    </Router>
  );
};
```

### Data Caching
```typescript
// React Query for server state management
export const useAdminData = () => {
  const queryClient = useQueryClient();
  
  const dashboardMetrics = useQuery({
    queryKey: ['admin', 'dashboard', 'metrics'],
    queryFn: () => adminApi.getDashboardMetrics('7d'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // 30 seconds
  });
  
  const users = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminApi.getUsers({}),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
  
  const invalidateCache = (keys: string[]) => {
    keys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: ['admin', key] });
    });
  };
  
  return {
    dashboardMetrics,
    users,
    invalidateCache
  };
};
```

---

This admin panel documentation provides comprehensive guidance for managing, monitoring, and scaling the BitaURL platform through the administrative interface. The system is designed for enterprise-grade administration with robust security, comprehensive analytics, and intuitive user management capabilities.