/**
 * Patient Call System - Secretary Interface
 * Interface for calling patients with external monitor display
 */

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Phone, PhoneCall, Users, Clock, Bell, Volume2, 
  Mic, MicOff, Monitor, Settings, Search, Filter,
  AlertCircle, CheckCircle, Loader2
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface QueuePatient {
  patient_id: string;
  patient_name: string;
  appointment_time: string;
  status: string;
  priority: number;
  insurance_provider?: string;
}

interface CallHistory {
  patient_id: string;
  patient_name: string;
  called_at: string;
  called_by: string;
  status: "called" | "attended" | "missed";
}

export default function PatientCallSystem() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [queue, setQueue] = useState<QueuePatient[]>([]);
  const [callHistory, setCallHistory] = useState<CallHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [announcement, setAnnouncement] = useState({ title: "", message: "" });
  const [monitorConnected, setMonitorConnected] = useState(false);
  
  // WebSocket refs
  const wsRef = useRef<WebSocket | null>(null);
  const monitorWsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    loadQueue();
    connectWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (monitorWsRef.current) monitorWsRef.current.close();
    };
  }, []);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const response = await apiClient.request<QueuePatient[]>("/patient-call/queue");
      setQueue(response);
    } catch (error) {
      console.error("Error loading queue:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar fila de pacientes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    // Connect to secretary WebSocket
    const ws = new WebSocket(`${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/patient-call/ws/secretary`);
    
    ws.onopen = () => {
      console.log("Secretary WebSocket connected");
    };
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };
    
    ws.onclose = () => {
      console.log("Secretary WebSocket disconnected");
      // Reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000);
    };
    
    wsRef.current = ws;
  };

  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case "call_confirmation":
        toast({
          title: "Chamada realizada",
          description: message.message
        });
        break;
      case "patient_call":
        // Update call history
        setCallHistory(prev => [{
          patient_id: message.patient_id,
          patient_name: message.patient_name,
          called_at: message.called_at,
          called_by: message.called_by,
          status: "called"
        }, ...prev]);
        break;
    }
  };

  const callPatient = async (patientId: string, patientName: string) => {
    try {
      setCalling(patientId);
      
      const response = await apiClient.request(`/patient-call/call/${patientId}`, {
        method: "POST"
      });
      
      toast({
        title: "Paciente chamado",
        description: `${patientName} foi chamado com sucesso`
      });
      
      // Add to call history
      setCallHistory(prev => [{
        patient_id: patientId,
        patient_name: patientName,
        called_at: new Date().toISOString(),
        called_by: user?.name || "Secretária",
        status: "called"
      }, ...prev]);
      
    } catch (error) {
      console.error("Error calling patient:", error);
      toast({
        title: "Erro",
        description: "Falha ao chamar paciente",
        variant: "destructive"
      });
    } finally {
      setCalling(null);
    }
  };

  const sendAnnouncement = async () => {
    try {
      await apiClient.request("/patient-call/announcement", {
        method: "POST",
        body: JSON.stringify(announcement)
      });
      
      toast({
        title: "Anúncio enviado",
        description: "Anúncio exibido no monitor da sala de espera"
      });
      
      setShowAnnouncement(false);
      setAnnouncement({ title: "", message: "" });
      
    } catch (error) {
      console.error("Error sending announcement:", error);
      toast({
        title: "Erro",
        description: "Falha ao enviar anúncio",
        variant: "destructive"
      });
    }
  };

  const filteredQueue = queue.filter(patient =>
    patient.patient_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sistema de Chamada</h1>
          <p className="text-muted-foreground">Chamada de pacientes e monitor da sala de espera</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={monitorConnected ? "default" : "secondary"}>
            <Monitor className="h-4 w-4 mr-2" />
            Monitor {monitorConnected ? "Conectado" : "Desconectado"}
          </Badge>
          <Button onClick={() => setShowAnnouncement(true)}>
            <Bell className="h-4 w-4 mr-2" />
            Fazer Anúncio
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Queue */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Fila de Pacientes
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar paciente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {filteredQueue.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum paciente aguardando
                    </div>
                  ) : (
                    filteredQueue.map((patient) => (
                      <div
                        key={patient.patient_id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold">{patient.patient_name}</h3>
                            <Badge variant="outline">
                              {patient.insurance_provider || "Particular"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Clock className="h-4 w-4" />
                            {new Date(patient.appointment_time).toLocaleString('pt-BR')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => callPatient(patient.patient_id, patient.patient_name)}
                            disabled={calling === patient.patient_id}
                            className="gap-2"
                          >
                            {calling === patient.patient_id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <PhoneCall className="h-4 w-4" />
                            )}
                            Chamar
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Call History */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Histórico de Chamadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {callHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma chamada realizada
                    </div>
                  ) : (
                    callHistory.map((call, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{call.patient_name}</h4>
                          <Badge variant={
                            call.status === "attended" ? "default" :
                            call.status === "missed" ? "destructive" : "secondary"
                          }>
                            {call.status === "attended" ? "Atendido" :
                             call.status === "missed" ? "Perdido" : "Chamado"}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {new Date(call.called_at).toLocaleString('pt-BR')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Por: {call.called_by}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Announcement Dialog */}
      <Dialog open={showAnnouncement} onOpenChange={setShowAnnouncement}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fazer Anúncio</DialogTitle>
            <DialogDescription>
              Envie uma mensagem para o monitor da sala de espera
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                placeholder="Ex: Aviso importante"
                value={announcement.title}
                onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                placeholder="Digite sua mensagem aqui..."
                value={announcement.message}
                onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAnnouncement(false)}>
                Cancelar
              </Button>
              <Button onClick={sendAnnouncement}>
                <Bell className="h-4 w-4 mr-2" />
                Enviar Anúncio
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
