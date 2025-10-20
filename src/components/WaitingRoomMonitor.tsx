import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { User, Clock, Volume2, VolumeX, RefreshCw, Video, Phone, Copy } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface QueuePatient {
  id: string;
  patient_id: string;
  patient_name: string;
  status: "waiting" | "called" | "in_consultation" | "attended" | "cancelled";
  appointment_time: string;
  priority: number;
  insurance_provider?: string;
}

function WaitingRoomMonitor() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState<QueuePatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  // Telemedicine states
  const [showTelemedicineModal, setShowTelemedicineModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<QueuePatient | null>(null);
  const [telemedicineSessionId, setTelemedicineSessionId] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const response = await apiClient.request<QueuePatient[]>("/patient_call/queue");
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

  const startVideoCall = (patient: QueuePatient) => {
    setSelectedPatient(patient);
    setShowTelemedicineModal(true);
  };

  const createTelemedicineSession = async () => {
    if (!selectedPatient) return;
    
    try {
      setIsCreatingSession(true);
      
      // Get current user info for doctor_id
      const userResponse = await apiClient.request("/users/me");
      const doctorId = userResponse.id;
      
      // Create telemedicine session with required fields
      const now = new Date();
      const endTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      
      const sessionData = {
        appointment_id: selectedPatient.appointment_id || "00000000-0000-0000-0000-000000000000", // Fallback UUID
        doctor_id: doctorId,
        allow_recording: false,
        max_duration_minutes: 60,
        scheduled_start: now.toISOString(),
        scheduled_end: endTime.toISOString()
      };
      
      console.log("Sending telemedicine session data:", sessionData);
      
      const response = await apiClient.request("/telemedicine/sessions", {
        method: "POST",
        data: sessionData
      });
      
      console.log("Telemedicine session response:", response);
      
      setTelemedicineSessionId(response.session_id);
      
      toast({
        title: "Sessão Criada",
        description: "Sessão de telemedicina criada com sucesso!",
      });
      
    } catch (error) {
      console.error("Error creating telemedicine session:", error);
      toast({
        title: "Erro",
        description: "Falha ao criar sessão de telemedicina",
        variant: "destructive",
      });
    } finally {
      setIsCreatingSession(false);
    }
  };

  const joinVideoCall = () => {
    if (telemedicineSessionId) {
      navigate(`/app/telemed/${telemedicineSessionId}`);
    }
  };

  const copyVideoCallLink = () => {
    if (telemedicineSessionId) {
      const link = `${window.location.origin}/app/telemed/${telemedicineSessionId}`;
      navigator.clipboard.writeText(link);
      toast({
        title: "Link Copiado",
        description: "Link da consulta copiado para a área de transferência",
      });
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
                      <div className="flex items-center space-x-4">
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
                        {(patient.status === "waiting" || patient.status === "called") && (
                          <Button
                            onClick={() => startVideoCall(patient)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
                            size="sm"
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Video Call
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Telemedicine Modal */}
      <Dialog open={showTelemedicineModal} onOpenChange={setShowTelemedicineModal}>
        <DialogContent className="max-w-2xl" aria-describedby="telemed-desc">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-blue-600" />
              Iniciar Video Call - {selectedPatient?.patient_name}
            </DialogTitle>
            <DialogDescription id="telemed-desc">
              Criar uma sessão de telemedicina para consulta com o paciente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {!telemedicineSessionId ? (
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <Video className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <h3 className="text-lg font-semibold mb-2">
                  Criar Sessão de Video Call
                </h3>
                <p className="text-muted-foreground mb-4">
                  Clique no botão abaixo para criar uma sessão de telemedicina com {selectedPatient?.patient_name}.
                </p>
                <Button 
                  onClick={createTelemedicineSession}
                  disabled={isCreatingSession}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isCreatingSession ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Criando Sessão...
                    </>
                  ) : (
                    <>
                      <Video className="h-4 w-4 mr-2" />
                      Criar Sessão
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <Video className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h3 className="text-lg font-semibold mb-2">
                  Sessão Criada com Sucesso!
                </h3>
                <p className="text-muted-foreground mb-4">
                  A sessão de telemedicina foi criada. Compartilhe o link com o paciente ou entre diretamente na consulta.
                </p>
                
                <div className="bg-white p-3 rounded border mb-4">
                  <code className="text-sm break-all">
                    {window.location.origin}/app/telemed/{telemedicineSessionId}
                  </code>
                </div>
                
                <div className="flex gap-2 justify-center">
                  <Button onClick={joinVideoCall} className="bg-green-600 hover:bg-green-700">
                    <Video className="h-4 w-4 mr-2" />
                    Entrar na Consulta
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={copyVideoCallLink}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Link
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default WaitingRoomMonitor;
