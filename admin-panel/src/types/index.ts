// Core Admin Types
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  permissions: Permission[];
  lastLogin?: Date;
  isActive: boolean;
  mfaEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminRole {
  id: string;
  name: string;
  displayName: string;
  permissions: Permission[];
  description?: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

// User Management Types
export interface User {
  id: string;
  email: string;
  name: string;
  plan: UserPlan;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: Date;
  lastLogin?: Date;
  subscription?: Subscription;
  usage: UserUsage;
  teams: Team[];
}

export interface UserUsage {
  linksCreated: number;
  linksLimit: number;
  domainsUsed: number;
  domainsLimit: number;
  clicksThisMonth: number;
  storageUsed: number;
  storageLimit: number;
}

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION' | 'DELETED';
export type UserPlan = 'FREE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';

// Team Management Types
export interface Team {
  id: string;
  name: string;
  plan: UserPlan;
  owner: User;
  members: TeamMember[];
  domains: Domain[];
  usage: TeamUsage;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  user: User;
  role: TeamRole;
  joinedAt: Date;
  invitedBy: User;
}

export interface TeamUsage {
  linksCreated: number;
  linksLimit: number;
  membersCount: number;
  membersLimit: number;
  domainsUsed: number;
  domainsLimit: number;
}

export type TeamRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

// Domain Management Types
export interface Domain {
  id: string;
  domain: string;
  owner: User;
  team?: Team;
  status: DomainStatus;
  sslStatus: SSLStatus;
  verificationStatus: VerificationStatus;
  cnameTarget: string;
  createdAt: Date;
  verifiedAt?: Date;
  lastChecked?: Date;
}

export type DomainStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_DELETION';
export type SSLStatus = 'ACTIVE' | 'PENDING' | 'FAILED' | 'EXPIRED';
export type VerificationStatus = 'VERIFIED' | 'PENDING' | 'FAILED';

// Billing & Subscription Types
export interface Subscription {
  id: string;
  user: User;
  plan: UserPlan;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  paymentMethod?: PaymentMethod;
  invoices: Invoice[];
  createdAt: Date;
}

export interface Invoice {
  id: string;
  subscription: Subscription;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  dueDate: Date;
  paidAt?: Date;
  items: InvoiceItem[];
  createdAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
  quantity: number;
}

export interface PaymentMethod {
  id: string;
  type: 'CARD' | 'UPI' | 'BANK_TRANSFER';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID' | 'TRIALING';
export type InvoiceStatus = 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';

// Support Types
export interface SupportTicket {
  id: string;
  user: User;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedTo?: AdminUser;
  responses: SupportResponse[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface SupportResponse {
  id: string;
  ticket: SupportTicket;
  author: AdminUser | User;
  message: string;
  isInternal: boolean;
  attachments: string[];
  createdAt: Date;
}

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_CUSTOMER' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// Analytics Types
export interface SystemMetrics {
  activeUsers: number;
  totalUsers: number;
  linksCreated: number;
  totalClicks: number;
  revenue: number;
  systemLoad: number;
  responseTime: number;
  errorRate: number;
  timestamp: Date;
}

export interface UserAnalytics {
  signups: ChartData[];
  activeUsers: ChartData[];
  churnRate: ChartData[];
  planDistribution: PieChartData[];
}

export interface RevenueAnalytics {
  monthlyRevenue: ChartData[];
  planRevenue: PieChartData[];
  churnRevenue: ChartData[];
  mrr: number;
  arr: number;
}

export interface ChartData {
  date: string;
  value: number;
  label?: string;
}

export interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

// Audit Types
export interface AuditEvent {
  id: string;
  actorId: string;
  actorName: string;
  actionType: string;
  entityType: string;
  entityId: string;
  changes: Record<string, any>;
  metadata: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

// Feature Flags Types
export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetRoles: string[];
  conditions: FeatureFlagCondition[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureFlagCondition {
  type: 'USER_ROLE' | 'USER_PLAN' | 'USER_ID' | 'PERCENTAGE';
  operator: 'EQUALS' | 'IN' | 'NOT_IN' | 'GREATER_THAN' | 'LESS_THAN';
  value: string | number | string[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface FilterOptions {
  search?: string;
  status?: string;
  plan?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
}

// WebSocket Types
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: Date;
}

export interface SystemHealthUpdate {
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
  requestsPerSecond: number;
  errorRate: number;
  responseTime: number;
}