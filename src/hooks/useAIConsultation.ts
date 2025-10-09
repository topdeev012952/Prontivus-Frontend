import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface RecordingStartResponse {
  recording_id: string;
  presigned_upload_url: string;
  upload_fields?: Record<string, string>;
}

interface AISummary {
  id: string;
  status: 'pending' | 'done' | 'failed';
  summary_json: {
    anamnese: string;
    diagnoses: Array<{ description: string; cid_code?: string; confidence?: number }>;
    suggested_exams: Array<{ name: string; justification: string }>;
    treatment_plan: string;
  };
  transcript_text: string;
  provider: string;
  cost?: number;
  created_at: string;
}

export const useAIConsultation = (consultationId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const startRecording = useMutation({
    mutationFn: async (consent: boolean) => {
      return apiClient.request<RecordingStartResponse>(
        `/consultations/${consultationId}/record/start`,
        { method: 'POST', body: JSON.stringify({ consent, meta: { device: 'web', language: 'pt-BR' } }) }
      );
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to start recording session.',
        variant: 'destructive',
      });
    },
  });

  const uploadRecording = useMutation({
    mutationFn: async ({ url, blob, fields }: { url: string; blob: Blob; fields?: Record<string, string> }) => {
      const formData = new FormData();
      if (fields) {
        Object.entries(fields).forEach(([key, value]) => formData.append(key, value));
      }
      formData.append('file', blob, 'recording.webm');

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      return response;
    },
    onError: () => {
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload recording. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const completeRecording = useMutation({
    mutationFn: async (recordingId: string) => {
      return apiClient.request(
        `/consultations/${consultationId}/record/complete`,
        { method: 'POST', body: JSON.stringify({ recording_id: recordingId }) }
      );
    },
    onSuccess: () => {
      toast({
        title: 'Processing',
        description: 'AI is analyzing your recording...',
      });
    },
  });

  const aiSummaries = useQuery({
    queryKey: ['ai-summaries', consultationId],
    queryFn: () => apiClient.request<{ summaries: AISummary[] }>(`/consultations/${consultationId}/ai-summaries`),
    refetchInterval: (query) => {
      const hasPending = query.state.data?.summaries?.some(s => s.status === 'pending');
      return hasPending ? 3000 : false;
    },
  });

  const acceptSummary = useMutation({
    mutationFn: async ({ summaryId, editedPayload }: { summaryId: string; editedPayload: any }) => {
      return apiClient.request(
        `/consultations/${consultationId}/ai-accept`,
        { method: 'POST', body: JSON.stringify({ summary_id: summaryId, edited_payload: editedPayload }) }
      );
    },
    onSuccess: () => {
      toast({
        title: 'Saved',
        description: 'Medical record created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['consultations', consultationId] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to save medical record.',
        variant: 'destructive',
      });
    },
  });

  return {
    startRecording,
    uploadRecording,
    completeRecording,
    aiSummaries,
    acceptSummary,
  };
};
