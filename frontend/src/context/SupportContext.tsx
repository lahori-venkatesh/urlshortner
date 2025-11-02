import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface SupportTicket {
  id: string;
  userId: string;
  category: 'payment' | 'technical' | 'account' | 'general';
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  createdAt: Date;
  updatedAt: Date;
  assignedAgent?: string;
  responses: SupportResponse[];
  attachments?: string[];
}

interface SupportResponse {
  id: string;
  ticketId: string;
  message: string;
  sender: 'user' | 'agent';
  senderName: string;
  timestamp: Date;
  attachments?: string[];
}

interface SupportContextType {
  tickets: SupportTicket[];
  isLoading: boolean;
  createTicket: (ticketData: Omit<SupportTicket, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status' | 'responses'>) => Promise<SupportTicket>;
  getTickets: () => Promise<void>;
  getTicket: (ticketId: string) => Promise<SupportTicket | null>;
  addResponse: (ticketId: string, message: string, attachments?: string[]) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: SupportTicket['status']) => Promise<void>;
  searchTickets: (query: string) => SupportTicket[];
  getTicketsByStatus: (status: SupportTicket['status']) => SupportTicket[];
  unreadCount: number;
}

const SupportContext = createContext<SupportContextType | undefined>(undefined);

export const useSupportContext = () => {
  const context = useContext(SupportContext);
  if (!context) {
    throw new Error('useSupportContext must be used within a SupportProvider');
  }
  return context;
};

interface SupportProviderProps {
  children: ReactNode;
}

export const SupportProvider: React.FC<SupportProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Create a new support ticket
  const createTicket = async (ticketData: Omit<SupportTicket, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status' | 'responses'>): Promise<SupportTicket> => {
    setIsLoading(true);
    try {
      const baseUrl = process.env.REACT_APP_API_URL || 'https://urlshortner-mrrl.onrender.com/api';
      
      // Prepare request data
      const requestData: any = {
        userId: user?.id || 'anonymous-user',
        category: ticketData.category.toUpperCase(),
        subject: ticketData.subject,
        message: ticketData.message,
        priority: ticketData.priority.toUpperCase(),
        currentPage: window.location.pathname
      };

      // Add user info if available
      if (user) {
        requestData.userEmail = user.email;
        requestData.userName = user.name || user.email;
      }

      const response = await fetch(`${baseUrl}/v1/support/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create support ticket');
      }
      
      const newTicket = result.data;

      setTickets(prev => [newTicket, ...prev]);
      return newTicket;
    } catch (error) {
      console.error('Error creating support ticket:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Get all tickets for the current user
  const getTickets = async (): Promise<void> => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Import apiClient dynamically
      const { default: axios } = await import('axios');
      const apiClient = axios.create({
        baseURL: process.env.REACT_APP_API_URL || 'https://urlshortner-mrrl.onrender.com/api',
        timeout: 10000,
      });

      // Add auth token
      const token = localStorage.getItem('token');
      if (token) {
        apiClient.defaults.headers.Authorization = `Bearer ${token}`;
      }

      const response = await apiClient.get(`/v1/support/tickets/user/${user.id}`);
      const result = response.data;
      setTickets(result.data || []);
      
      // Calculate unread count
      const unread = result.data?.filter((ticket: SupportTicket) => 
        ticket.responses.some(response => 
          response.sender === 'agent' && 
          new Date(response.timestamp) > new Date(ticket.updatedAt)
        )
      ).length || 0;
      
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching support tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get a specific ticket by ID
  const getTicket = async (ticketId: string): Promise<SupportTicket | null> => {
    try {
      // Import apiClient dynamically
      const { default: axios } = await import('axios');
      const apiClient = axios.create({
        baseURL: process.env.REACT_APP_API_URL || 'https://urlshortner-mrrl.onrender.com/api',
        timeout: 10000,
      });

      // Add auth token
      const token = localStorage.getItem('token');
      if (token) {
        apiClient.defaults.headers.Authorization = `Bearer ${token}`;
      }

      const response = await apiClient.get(`/v1/support/tickets/${ticketId}`);
      const result = response.data;
      return result.data;
    } catch (error) {
      console.error('Error fetching support ticket:', error);
      return null;
    }
  };

  // Add a response to a ticket
  const addResponse = async (ticketId: string, message: string, attachments?: string[]): Promise<void> => {
    if (!user?.id) {
      throw new Error('User must be logged in to add a response');
    }

    try {
      // Import apiClient dynamically
      const { default: axios } = await import('axios');
      const apiClient = axios.create({
        baseURL: process.env.REACT_APP_API_URL || 'https://urlshortner-mrrl.onrender.com/api',
        timeout: 10000,
      });

      // Add auth token
      const token = localStorage.getItem('token');
      if (token) {
        apiClient.defaults.headers.Authorization = `Bearer ${token}`;
      }

      await apiClient.post(`/v1/support/tickets/${ticketId}/responses`, {
        message,
        sender: 'user',
        senderName: user.name || user.email,
        attachments,
      });

      // Refresh tickets to get updated data
      await getTickets();
    } catch (error) {
      console.error('Error adding response:', error);
      throw error;
    }
  };

  // Update ticket status
  const updateTicketStatus = async (ticketId: string, status: SupportTicket['status']): Promise<void> => {
    try {
      // Import apiClient dynamically
      const { default: axios } = await import('axios');
      const apiClient = axios.create({
        baseURL: process.env.REACT_APP_API_URL || 'https://urlshortner-mrrl.onrender.com/api',
        timeout: 10000,
      });

      // Add auth token
      const token = localStorage.getItem('token');
      if (token) {
        apiClient.defaults.headers.Authorization = `Bearer ${token}`;
      }

      await apiClient.patch(`/v1/support/tickets/${ticketId}/status`, { status });

      // Update local state
      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId ? { ...ticket, status, updatedAt: new Date() } : ticket
      ));
    } catch (error) {
      console.error('Error updating ticket status:', error);
      throw error;
    }
  };

  // Search tickets
  const searchTickets = (query: string): SupportTicket[] => {
    if (!query.trim()) return tickets;

    const lowercaseQuery = query.toLowerCase();
    return tickets.filter(ticket =>
      ticket.subject.toLowerCase().includes(lowercaseQuery) ||
      ticket.message.toLowerCase().includes(lowercaseQuery) ||
      ticket.category.toLowerCase().includes(lowercaseQuery) ||
      ticket.responses.some(response => 
        response.message.toLowerCase().includes(lowercaseQuery)
      )
    );
  };

  // Get tickets by status
  const getTicketsByStatus = (status: SupportTicket['status']): SupportTicket[] => {
    return tickets.filter(ticket => ticket.status === status);
  };

  // Load tickets when user changes
  useEffect(() => {
    if (user?.id) {
      getTickets();
    }
  }, [user?.id]);

  // Set up real-time updates (WebSocket simulation)
  useEffect(() => {
    if (!user?.id) return;

    // Simulate real-time updates every 30 seconds
    const interval = setInterval(() => {
      getTickets();
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.id]);

  const contextValue: SupportContextType = {
    tickets,
    isLoading,
    createTicket,
    getTickets,
    getTicket,
    addResponse,
    updateTicketStatus,
    searchTickets,
    getTicketsByStatus,
    unreadCount,
  };

  return (
    <SupportContext.Provider value={contextValue}>
      {children}
    </SupportContext.Provider>
  );
};

export default SupportContext;