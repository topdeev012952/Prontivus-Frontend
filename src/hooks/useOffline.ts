import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: 'Back online',
        description: 'Syncing pending changes...',
      });
      syncPendingChanges();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: 'You are offline',
        description: 'Changes will be saved locally and synced when you reconnect.',
        variant: 'destructive',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  const syncPendingChanges = async () => {
    const db = indexedDB.open('prontivus', 1);
    db.onsuccess = async () => {
      const transaction = db.result.transaction(['pending_sync'], 'readonly');
      const store = transaction.objectStore('pending_sync');
      const request = store.getAll();
      
      request.onsuccess = async () => {
        const events = request.result;
        
        for (const event of events) {
          try {
            await fetch('https://prontivus-backend-wnw2.onrender.com/api/v1/sync/events', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              },
              body: JSON.stringify(event),
            });
            
            // Remove from IndexedDB after successful sync
            const deleteTransaction = db.result.transaction(['pending_sync'], 'readwrite');
            deleteTransaction.objectStore('pending_sync').delete(event.id);
          } catch (error) {
            console.error('Failed to sync event:', error);
          }
        }
        
        if (events.length > 0) {
          toast({
            title: 'Sync complete',
            description: `${events.length} changes synced successfully.`,
          });
        }
      };
    };
  };

  const saveForSync = (event: any) => {
    const db = indexedDB.open('prontivus', 1);
    db.onsuccess = () => {
      const transaction = db.result.transaction(['pending_sync'], 'readwrite');
      transaction.objectStore('pending_sync').add({
        ...event,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      });
    };
  };

  return { isOnline, saveForSync };
};
