import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export type PrescriptionType = 'simple' | 'antimicrobial' | 'controlled_c1';

export interface PrescriptionItem {
  drug_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  notes?: string;
}

export interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  items: PrescriptionItem[];
  type: PrescriptionType;
  status: 'draft' | 'signing' | 'signed' | 'failed';
  notes?: string;
  signed_pdf_url?: string;
  qr_token?: string;
  created_at: string;
  signed_at?: string;
}

export const usePrescription = (prescriptionId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const prescription = useQuery({
    queryKey: ['prescription', prescriptionId],
    queryFn: () => apiClient.request<Prescription>(`/prescriptions/${prescriptionId}`),
    enabled: !!prescriptionId,
  });

  const create = useMutation({
    mutationFn: async (data: {
      patient_id: string;
      doctor_id: string;
      items: PrescriptionItem[];
      type: PrescriptionType;
      notes?: string;
    }) => {
      return apiClient.request<Prescription>('/prescriptions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Receita criada',
        description: 'Receita salva como rascunho.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a receita.',
        variant: 'destructive',
      });
    },
  });

  const requestSign = useMutation({
    mutationFn: async ({ prescriptionId, signerUserId }: { prescriptionId: string; signerUserId: string }) => {
      return apiClient.request(`/prescriptions/${prescriptionId}/request-sign`, {
        method: 'POST',
        body: JSON.stringify({ signer_user_id: signerUserId }),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Assinatura solicitada',
        description: 'A receita está sendo assinada...',
      });
      queryClient.invalidateQueries({ queryKey: ['prescription', prescriptionId] });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível solicitar assinatura.',
        variant: 'destructive',
      });
    },
  });

  const checkStatus = useQuery({
    queryKey: ['prescription-status', prescriptionId],
    queryFn: () =>
      apiClient.request<{
        status: Prescription['status'];
        signed_pdf_url?: string;
        qr_token?: string;
      }>(`/prescriptions/${prescriptionId}/status`),
    enabled: !!prescriptionId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'signing' ? 3000 : false;
    },
  });

  return {
    prescription: prescription.data,
    isLoading: prescription.isLoading,
    create,
    requestSign,
    status: checkStatus.data,
  };
};
