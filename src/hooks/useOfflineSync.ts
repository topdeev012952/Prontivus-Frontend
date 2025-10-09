import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

interface PendingEvent {
  client_event_id: string;
  clinic_id: string;
  event_type: string;
  payload: any;
  idempotency_key: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  created_at: string;
  processed_at?: string;
}

export const useOfflineSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const { toast } = useToast();

  const getPendingEvents = useCallback(async (): Promise<PendingEvent[]> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('prontivus', 1);

      request.onsuccess = () => {
        const db = request.result;
        
        // Check if object store exists
        if (!db.objectStoreNames.contains('pending_sync')) {
          console.debug('pending_sync store not found, returning empty array');
          resolve([]);
          return;
        }
        
        try {
          const transaction = db.transaction(['pending_sync'], 'readonly');
          const store = transaction.objectStore('pending_sync');
          const getRequest = store.getAll();

          getRequest.onsuccess = () => {
            const events = getRequest.result.filter((e: PendingEvent) => e.status === 'pending');
            resolve(events);
          };
          getRequest.onerror = () => reject(getRequest.error);
        } catch (error) {
          console.debug('Error accessing pending_sync:', error);
          resolve([]);
        }
      };

      request.onerror = () => {
        console.debug('IndexedDB error:', request.error);
        resolve([]); // Resolve with empty array instead of rejecting
      };
    });
  }, []);

  const updateEventStatus = useCallback(
    async (clientEventId: string, status: PendingEvent['status']) => {
      return new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('prontivus', 1);

        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['pending_sync'], 'readwrite');
          const store = transaction.objectStore('pending_sync');
          const getRequest = store.get(clientEventId);

          getRequest.onsuccess = () => {
            const event = getRequest.result;
            if (event) {
              event.status = status;
              event.processed_at = new Date().toISOString();
              const updateRequest = store.put(event);
              updateRequest.onsuccess = () => resolve();
              updateRequest.onerror = () => reject(updateRequest.error);
            } else {
              resolve();
            }
          };

          getRequest.onerror = () => reject(getRequest.error);
        };

        request.onerror = () => reject(request.error);
      });
    },
    []
  );

  const syncPendingEvents = useCallback(async () => {
    if (isSyncing) return;

    try {
      setIsSyncing(true);
      const events = await getPendingEvents();

      if (events.length === 0) {
        setPendingCount(0);
        return;
      }

      setPendingCount(events.length);

      // Sync in batches
      const batchSize = 10;
      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);

        try {
          await apiClient.request('/sync/events', {
            method: 'POST',
            body: JSON.stringify({ events: batch }),
          });

          // Mark as done
          for (const event of batch) {
            await updateEventStatus(event.client_event_id, 'done');
          }
        } catch (error) {
          console.error('Sync batch failed:', error);
          // Mark as failed
          for (const event of batch) {
            await updateEventStatus(event.client_event_id, 'failed');
          }
        }
      }

      const remaining = await getPendingEvents();
      setPendingCount(remaining.length);

      if (remaining.length === 0) {
        toast({
          title: 'Sincronização completa',
          description: 'Todos os dados foram sincronizados.',
        });
      } else {
        toast({
          title: 'Sincronização parcial',
          description: `${remaining.length} eventos falharam. Tente novamente.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: 'Erro na sincronização',
        description: 'Não foi possível sincronizar os dados.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, getPendingEvents, updateEventStatus, toast]);

  const addPendingEvent = useCallback(async (event: Omit<PendingEvent, 'created_at' | 'status'>) => {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('prontivus', 1);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['pending_sync'], 'readwrite');
        const store = transaction.objectStore('pending_sync');

        const fullEvent: PendingEvent = {
          ...event,
          status: 'pending',
          created_at: new Date().toISOString(),
        };

        const addRequest = store.add(fullEvent);

        addRequest.onsuccess = () => {
          setPendingCount((prev) => prev + 1);
          resolve();
        };
        addRequest.onerror = () => reject(addRequest.error);
      };

      request.onerror = () => reject(request.error);
    });
  }, []);

  useEffect(() => {
    // Check pending events on mount
    getPendingEvents().then((events) => setPendingCount(events.length));

    // Sync on online
    const handleOnline = () => {
      toast({
        title: 'Conexão restaurada',
        description: 'Sincronizando dados...',
      });
      syncPendingEvents();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [getPendingEvents, syncPendingEvents, toast]);

  return {
    isSyncing,
    pendingCount,
    syncPendingEvents,
    addPendingEvent,
  };
};
