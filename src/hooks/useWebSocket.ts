import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';

export interface Notification {
  id: string;
  type: 'patient_call' | 'payment_confirmation' | 'license_warning' | 'queue_update' | 'patient_called' | 'ai_summary_ready';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

export const useWebSocket = () => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Clean up on logout
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) return;

    const apiUrl = import.meta.env.VITE_API_URL || 'https://prontivus-backend-wnw2.onrender.com/api/v1';
    const wsUrl = `${apiUrl.replace('https', 'wss').replace('http', 'ws').replace('/api/v1', '')}/ws/notifications?token=${token}`;
    
    const connectWebSocket = () => {
      // Don't reconnect if already trying
      if (wsRef.current?.readyState === WebSocket.CONNECTING || wsRef.current?.readyState === WebSocket.OPEN) {
        return;
      }

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.debug('WebSocket connected');
          setIsConnected(true);
          reconnectAttemptsRef.current = 0; // Reset counter on success
        };

        ws.onmessage = (event) => {
          try {
            const notification: Notification = JSON.parse(event.data);
            // Ensure notification has an id
            if (!notification.id) {
              notification.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            }
            setNotifications(prev => [notification, ...prev]);
            
            // Save to IndexedDB
            const db = indexedDB.open('prontivus', 1);
            db.onsuccess = () => {
              const transaction = db.result.transaction(['notifications'], 'readwrite');
              transaction.objectStore('notifications').add(notification);
            };
          } catch (error) {
            console.error('Error parsing notification:', error);
          }
        };

        ws.onerror = (error) => {
          console.debug('WebSocket error (notifications may be unavailable)');
          setIsConnected(false);
        };

        ws.onclose = () => {
          console.debug('WebSocket disconnected');
          setIsConnected(false);
          
          // Retry connection with exponential backoff (max 3 attempts)
          if (reconnectAttemptsRef.current < 3) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
            console.debug(`Reconnecting WebSocket in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/3)...`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttemptsRef.current++;
              connectWebSocket();
            }, delay);
          } else {
            console.debug('WebSocket reconnection failed after 3 attempts. Notifications disabled.');
          }
        };
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        setIsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      // Clear reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      // Close WebSocket
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isAuthenticated, user]);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    
    // Update in IndexedDB
    const db = indexedDB.open('prontivus', 1);
    db.onsuccess = () => {
      const transaction = db.result.transaction(['notifications'], 'readwrite');
      const store = transaction.objectStore('notifications');
      const request = store.get(id);
      request.onsuccess = () => {
        const notification = request.result;
        if (notification) {
          notification.read = true;
          store.put(notification);
        }
      };
    };
  };

  const clearAll = () => {
    setNotifications([]);
    
    // Clear from IndexedDB
    const db = indexedDB.open('prontivus', 1);
    db.onsuccess = () => {
      const transaction = db.result.transaction(['notifications'], 'readwrite');
      transaction.objectStore('notifications').clear();
    };
  };

  return {
    notifications,
    isConnected,
    markAsRead,
    clearAll,
    unreadCount: notifications.filter(n => !n.read).length,
  };
};
