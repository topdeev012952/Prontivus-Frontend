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

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const token = localStorage.getItem('access_token');
    const wsUrl = `ws://localhost:8000/ws/notifications?token=${token}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.debug('WebSocket connected');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const notification: Notification = JSON.parse(event.data);
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
      console.debug('WebSocket not available (notifications disabled)');
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.debug('WebSocket disconnected');
      setIsConnected(false);
    };

    return () => {
      ws.close();
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
