import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/useWebSocket';

interface QueueItem {
  queue_id: string;
  appointment_id: string;
  patient_id: string;
  patient_name: string;
  appointment_time: string;
  position: number;
  status: 'waiting' | 'called' | 'in_progress' | 'completed';
  called_at?: string;
}

export const useWaitingQueue = (clinicId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { notifications } = useWebSocket();

  const queue = useQuery({
    queryKey: ['waiting-queue', clinicId],
    queryFn: () =>
      apiClient.request<{ items: QueueItem[] }>(`/waiting_queue?clinic_id=${clinicId}`),
    refetchInterval: 10000, // Refetch every 10s
  });

  const enqueue = useMutation({
    mutationFn: async ({ appointmentId, patientId }: { appointmentId: string; patientId: string }) => {
      return apiClient.request<QueueItem>('/waiting_queue/enqueue', {
        method: 'POST',
        body: JSON.stringify({ appointment_id: appointmentId, patient_id: patientId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiting-queue', clinicId] });
      toast({
        title: 'Paciente adicionado',
        description: 'Paciente adicionado à fila de espera.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar paciente à fila.',
        variant: 'destructive',
      });
    },
  });

  const callNext = useMutation({
    mutationFn: async (queueId: string) => {
      return apiClient.request(`/waiting_queue/call/${queueId}`, { method: 'POST' });
    },
    onSuccess: (_, queueId) => {
      queryClient.invalidateQueries({ queryKey: ['waiting-queue', clinicId] });
      const item = queue.data?.items.find((i) => i.queue_id === queueId);
      if (item) {
        toast({
          title: 'Paciente chamado',
          description: `${item.patient_name} foi chamado para atendimento.`,
        });
      }
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível chamar o paciente.',
        variant: 'destructive',
      });
    },
  });

  const reorder = useMutation({
    mutationFn: async ({ items }: { items: { queue_id: string; position: number }[] }) => {
      return apiClient.request('/waiting_queue/reorder', {
        method: 'POST',
        body: JSON.stringify({ items }),
      });
    },
    onMutate: async ({ items }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['waiting-queue', clinicId] });
      const previous = queryClient.getQueryData(['waiting-queue', clinicId]);

      queryClient.setQueryData(['waiting-queue', clinicId], (old: any) => {
        if (!old) return old;
        const newItems = [...old.items].sort((a, b) => {
          const aPos = items.find((i) => i.queue_id === a.queue_id)?.position ?? a.position;
          const bPos = items.find((i) => i.queue_id === b.queue_id)?.position ?? b.position;
          return aPos - bPos;
        });
        return { ...old, items: newItems };
      });

      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['waiting-queue', clinicId], context.previous);
      }
      toast({
        title: 'Erro',
        description: 'Não foi possível reordenar a fila.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['waiting-queue', clinicId] });
    },
  });

  // Listen for WebSocket queue updates
  useEffect(() => {
    const queueUpdates = notifications.filter(
      (n) => n.type === 'queue_update' || n.type === 'patient_called'
    );

    if (queueUpdates.length > 0) {
      queryClient.invalidateQueries({ queryKey: ['waiting-queue', clinicId] });
    }
  }, [notifications, queryClient, clinicId]);

  return {
    queue: queue.data?.items ?? [],
    isLoading: queue.isLoading,
    enqueue,
    callNext,
    reorder,
  };
};
