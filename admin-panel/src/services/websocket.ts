import { SystemHealthUpdate, WebSocketMessage } from '../types';

export class AdminWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(private baseUrl: string = 'ws://localhost:8080') {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const token = localStorage.getItem('admin-token');
        if (!token) {
          reject(new Error('No authentication token found'));
          return;
        }

        this.ws = new WebSocket(`${this.baseUrl}/admin/ws?token=${token}`);

        this.ws.onopen = () => {
          console.log('Admin WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('Admin WebSocket disconnected:', event.code, event.reason);
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('Admin WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }

  subscribe(eventType: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  send(type: string, payload: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type,
        payload,
        timestamp: new Date(),
      };
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    const callbacks = this.listeners.get(message.type);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(message.payload);
        } catch (error) {
          console.error('Error in WebSocket callback:', error);
        }
      });
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, this.reconnectInterval * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Create singleton instance
export const adminWebSocket = new AdminWebSocketService();

// React hook for WebSocket
import { useEffect, useState } from 'react';

export const useWebSocket = (eventType: string) => {
  const [data, setData] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setIsConnected(adminWebSocket.isConnected());

    const unsubscribe = adminWebSocket.subscribe(eventType, (newData) => {
      setData(newData);
    });

    // Connect if not already connected
    if (!adminWebSocket.isConnected()) {
      adminWebSocket.connect().then(() => {
        setIsConnected(true);
      }).catch(error => {
        console.error('Failed to connect WebSocket:', error);
      });
    }

    return unsubscribe;
  }, [eventType]);

  return { data, isConnected };
};

// Specific hooks for different data types
export const useSystemMetrics = () => {
  return useWebSocket('system_metrics');
};

export const useUserActivity = () => {
  return useWebSocket('user_activity');
};

export const useSystemHealth = () => {
  return useWebSocket('system_health');
};

export const useAuditEvents = () => {
  return useWebSocket('audit_events');
};