import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { ConsultationHeader } from '@/components/Consultation/ConsultationHeader';
import { ConsentModal } from '@/components/Consultation/ConsentModal';
import { Recorder } from '@/components/Consultation/Recorder';
import { AISummaryEditor } from '@/components/Consultation/AISummaryEditor';
import { TelemedicineModal } from '@/components/TelemedicineModal';
import { useAIConsultation } from '@/hooks/useAIConsultation';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Consultation {
  id: string;
  patient: {
    id: string;
    name: string;
    avatar?: string;
    age: number;
    cpf: string;
  };
  appointment: {
    id: string;
    scheduled_time: string;
    status: string;
    telemed_link?: string;
  };
}

export default function ConsultationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showTelemedicine, setShowTelemedicine] = useState(false);
  const [currentRecordingId, setCurrentRecordingId] = useState<string | null>(null);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);

  const consultation = useQuery<Consultation>({
    queryKey: ['consultation', id],
    queryFn: () => apiClient.request(`/consultations/${id}`),
  });

  const {
    startRecording,
    uploadRecording,
    completeRecording,
    aiSummaries,
    acceptSummary,
  } = useAIConsultation(id!);

  // WebSocket for real-time AI summary updates
  useEffect(() => {
    const handleAISummaryReady = (event: CustomEvent) => {
      if (event.detail.consultation_id === id) {
        toast({
          title: 'Resumo Pronto',
          description: 'A IA finalizou a análise da sua consulta.',
        });
        aiSummaries.refetch();
      }
    };

    window.addEventListener('ai_summary_ready' as any, handleAISummaryReady);
    return () => window.removeEventListener('ai_summary_ready' as any, handleAISummaryReady);
  }, [id, toast, aiSummaries]);

  const handleStartRecording = () => {
    setShowConsentModal(true);
  };

  const handleConsentGiven = async () => {
    setShowConsentModal(false);
    
    try {
      const result = await startRecording.mutateAsync(true);
      setCurrentRecordingId(result.recording_id);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const handleRecordingComplete = async (blob: Blob) => {
    setRecordingBlob(blob);
    
    if (!currentRecordingId) return;

    try {
      const startResult = await apiClient.request<{ presigned_upload_url: string }>(
        `/consultations/${id}/record/start`,
        { method: 'POST', body: JSON.stringify({ consent: true }) }
      );

      await uploadRecording.mutateAsync({
        url: startResult.presigned_upload_url,
        blob,
      });

      await completeRecording.mutateAsync(currentRecordingId);
    } catch (error) {
      console.error('Failed to process recording:', error);
    }
  };

  const handleAcceptSummary = async (editedData: any) => {
    const latestSummary = aiSummaries.data?.summaries?.[0];
    if (!latestSummary) return;

    try {
      await acceptSummary.mutateAsync({
        summaryId: latestSummary.id,
        editedPayload: editedData,
      });
    } catch (error) {
      console.error('Failed to accept summary:', error);
    }
  };

  const handleRejectSummary = () => {
    toast({
      title: 'Resumo Rejeitado',
      description: 'Você pode gravar novamente ou editar manualmente.',
    });
  };

  if (consultation.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!consultation.data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Consulta não encontrada</p>
        </CardContent>
      </Card>
    );
  }

  const latestSummary = aiSummaries.data?.summaries?.[0];
  const hasDoneSummary = latestSummary?.status === 'done';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/appointments')}
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Consulta em Andamento</h1>
      </div>

      <ConsultationHeader
        patient={consultation.data.patient}
        appointment={consultation.data.appointment}
        onJoinTelemedicine={() => setShowTelemedicine(true)}
      />

      {!hasDoneSummary && (
        <Card>
          <CardHeader>
            <CardTitle>Gravação da Consulta</CardTitle>
            <CardDescription>
              Grave a consulta para gerar automaticamente o prontuário via IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!currentRecordingId ? (
              <Button onClick={handleStartRecording} size="lg">
                Iniciar Gravação
              </Button>
            ) : (
              <Recorder
                onRecordingComplete={handleRecordingComplete}
                isUploading={uploadRecording.isPending}
              />
            )}
          </CardContent>
        </Card>
      )}

      {latestSummary?.status === 'pending' && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <div className="animate-pulse">
                <div className="h-12 w-12 bg-primary/20 rounded-full mx-auto" />
              </div>
              <p className="font-medium">Processando gravação...</p>
              <p className="text-sm text-muted-foreground">A IA está analisando a consulta</p>
            </div>
          </CardContent>
        </Card>
      )}

      {hasDoneSummary && (
        <AISummaryEditor
          summaryId={latestSummary.id}
          initialData={latestSummary.summary_json}
          transcript={latestSummary.transcript_text}
          onAccept={handleAcceptSummary}
          onReject={handleRejectSummary}
          isLoading={acceptSummary.isPending}
        />
      )}

      <ConsentModal
        open={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onConsent={handleConsentGiven}
        patientName={consultation.data.patient.name}
      />

      {consultation.data.appointment.telemed_link && (
        <TelemedicineModal
          open={showTelemedicine}
          onClose={() => setShowTelemedicine(false)}
          telemedicineLink={consultation.data.appointment.telemed_link}
          patientName={consultation.data.patient.name}
        />
      )}
    </div>
  );
}
