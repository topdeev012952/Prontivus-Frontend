import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { User, Clock, Volume2, VolumeX, RefreshCw } from 'lucide-react';
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

export function WaitingRoomMonitor() {
  const [queue, setQueue] = useState<QueuePatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const response = await apiClient.request<QueuePatient[]>("/patient-call/queue");
      setQueue(Array.isArray(response) ? response : []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Erro ao carregar fila:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar a fila da sala de espera.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <Card className="h-full shadow-lg">
        <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl font-bold">
              Prontivus — Sala de Espera
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchQueue}
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Statistics */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">{waitingPatients.length}</div>
              <p className="text-lg text-muted-foreground">Aguardando</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-600">{calledPatients.length}</div>
              <p className="text-lg text-muted-foreground">Chamados</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600">{queue.length}</div>
              <p className="text-lg text-muted-foreground">Total</p>
            </div>
          </div>

          {/* Patient List */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : queue.length === 0 ? (
            <div className="text-center py-16">
              <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-2xl text-muted-foreground">
                Nenhum paciente na fila no momento.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {queue.map((patient) => (
                  <Card 
                    key={patient.id} 
                    className={`p-6 transition-all duration-300 ${
                      patient.status === "called" 
                        ? "bg-yellow-100 border-yellow-400 shadow-lg animate-pulse" 
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <User className="h-8 w-8 text-primary" />
                        <div>
                          <p className="text-2xl font-bold text-gray-800">
                            {patient.patient_name}
                          </p>
                          <p className="text-lg text-muted-foreground flex items-center gap-2 mt-1">
                            <Clock className="h-5 w-5" />
                            {new Date(patient.appointment_time).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                            {patient.insurance_provider && patient.insurance_provider !== "Particular" && (
                              <span className="ml-3 text-blue-600 font-semibold">
                                ({patient.insurance_provider})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={getStatusBadgeVariant(patient.status)}
                        className={`text-xl px-4 py-2 ${
                          patient.status === "called" 
                            ? "bg-yellow-500 text-white" 
                            : ""
                        }`}
                      >
                        {getStatusText(patient.status)}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
