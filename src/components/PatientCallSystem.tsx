import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PhoneCall, User, Clock, Bell, Volume2, VolumeX } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface QueuePatient {
  id: string;
  patient_id: string;
  patient_name: string;
  status: "waiting" | "called" | "in_consultation" | "attended" | "cancelled";
  appointment_time: string;
  priority: number;
  insurance_provider?: string;
}

interface PatientCallSystemProps {
  onPatientCalled?: (patient: QueuePatient) => void;
}

function PatientCallSystem({ onPatientCalled }: PatientCallSystemProps) {
  const [queue, setQueue] = useState<QueuePatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const response = await apiClient.request<QueuePatient[]>("/patient_call/queue");
      setQueue(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Erro ao carregar fila:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar a fila de pacientes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleCallPatient = async (patient: QueuePatient) => {
    try {
      await apiClient.request(`/patient_call/call/${patient.patient_id}`, {
        method: "POST",
      });

      // Play notification sound if not muted
      if (!isMuted) {
        // You can add a notification sound here
        console.log("🔔 Playing notification sound");
      }

      toast({
        title: "Paciente Chamado",
        description: `${patient.patient_name} foi chamado para a sala de espera.`,
      });

      onPatientCalled?.(patient);
      fetchQueue(); // Refresh queue
    } catch (error) {
      console.error("Erro ao chamar paciente:", error);
      toast({
        title: "Erro",
        description: "Falha ao chamar o paciente.",
        variant: "destructive",
      });
    }
  };

  const handleSendAnnouncement = async () => {
    const message = prompt("Digite o anúncio para a sala de espera:");
    if (!message) return;

    try {
      await apiClient.request("/patient-call/announcement", {
        method: "POST",
        body: JSON.stringify({
          title: "Aviso",
          message: message
        })
      });

      toast({
        title: "Anúncio Enviado",
        description: "Anúncio enviado para a sala de espera.",
      });
    } catch (error) {
      console.error("Erro ao enviar anúncio:", error);
      toast({
        title: "Erro",
        description: "Falha ao enviar anúncio.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: QueuePatient['status']) => {
    switch (status) {
      case "waiting": return "default";
      case "called": return "secondary";
      case "in_consultation": return "success";
      case "attended": return "outline";
      case "cancelled": return "destructive";
      default: return "default";
    }
  };

  const getStatusText = (status: QueuePatient['status']) => {
    switch (status) {
      case "waiting": return "Aguardando";
      case "called": return "Chamado";
      case "in_consultation": return "Em Atendimento";
      case "attended": return "Atendido";
      case "cancelled": return "Cancelado";
      default: return "Desconhecido";
    }
  };

  const waitingPatients = queue.filter(p => p.status === "waiting");
  const calledPatients = queue.filter(p => p.status === "called");

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Sistema de Chamada de Pacientes
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendAnnouncement}
              >
                Enviar Aviso
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{waitingPatients.length}</div>
            <p className="text-sm text-muted-foreground">Aguardando</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{calledPatients.length}</div>
            <p className="text-sm text-muted-foreground">Chamados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{queue.length}</div>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Patient Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Fila de Pacientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              {queue.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum paciente na fila no momento.
                </p>
              ) : (
                <div className="space-y-3">
                  {queue.map((patient) => (
                    <Card key={patient.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <User className="h-6 w-6 text-primary" />
                          <div>
                            <p className="font-semibold text-lg">{patient.patient_name}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(patient.appointment_time).toLocaleTimeString('pt-BR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                              {patient.insurance_provider && patient.insurance_provider !== "Particular" && (
                                <span className="ml-2 text-blue-600 font-medium">
                                  ({patient.insurance_provider})
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getStatusBadgeVariant(patient.status)}>
                            {getStatusText(patient.status)}
                          </Badge>
                          {patient.status === "waiting" && (
                            <Button
                              size="sm"
                              onClick={() => handleCallPatient(patient)}
                              className="gap-1"
                            >
                              <PhoneCall className="h-4 w-4" />
                              Chamar
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default PatientCallSystem;
