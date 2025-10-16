/**
 * Waiting Room Monitor - External Display
 * Large display for waiting room showing patient calls and announcements
 */

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, PhoneCall, Users, Clock, Bell, Volume2, 
  AlertCircle, CheckCircle, Loader2, Monitor
} from "lucide-react";

interface CallMessage {
  type: string;
  patient_id: string;
  patient_name: string;
  appointment_time: string;
  insurance_provider: string;
  called_by: string;
  called_at: string;
  message: string;
}

interface AnnouncementMessage {
  type: string;
  title: string;
  message: string;
  announced_by: string;
  announced_at: string;
}

export default function WaitingRoomMonitor() {
  const [currentCall, setCurrentCall] = useState<CallMessage | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const connectWebSocket = () => {
    const ws = new WebSocket(`${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/patient-call/ws/monitor`);
    
    ws.onopen = () => {
      console.log("Monitor WebSocket connected");
      setConnected(true);
    };
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };
    
    ws.onclose = () => {
      console.log("Monitor WebSocket disconnected");
      setConnected(false);
      // Reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000);
    };
    
    wsRef.current = ws;
  };

  const handleWebSocketMessage = (message: any) => {
    setLastUpdate(new Date());
    
    switch (message.type) {
      case "patient_call":
        setCurrentCall(message);
        playCallSound();
        // Clear call after 30 seconds
        setTimeout(() => setCurrentCall(null), 30000);
        break;
      case "announcement":
        setAnnouncements(prev => [message, ...prev.slice(0, 4)]); // Keep last 5 announcements
        playAnnouncementSound();
        break;
    }
  };

  const playCallSound = () => {
    // Create audio context for call sound
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log("Audio not supported");
    }
  };

  const playAnnouncementSound = () => {
    // Simple beep for announcements
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log("Audio not supported");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Monitor className="h-12 w-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-800">Sala de Espera</h1>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Badge variant={connected ? "default" : "destructive"} className="text-lg px-4 py-2">
              {connected ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Sistema Conectado
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Sistema Desconectado
                </>
              )}
            </Badge>
            {lastUpdate && (
              <span className="text-sm text-gray-600">
                Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
              </span>
            )}
          </div>
        </div>

        {/* Current Call Display */}
        {currentCall && (
          <Card className="mb-8 border-4 border-red-500 shadow-2xl animate-pulse">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="flex items-center justify-center gap-4 mb-6">
                  <PhoneCall className="h-16 w-16 text-red-500 animate-bounce" />
                  <h2 className="text-5xl font-bold text-red-600">ATENÇÃO!</h2>
                </div>
                <div className="bg-red-50 p-6 rounded-lg">
                  <h3 className="text-4xl font-bold text-gray-800 mb-4">
                    {currentCall.patient_name}
                  </h3>
                  <div className="text-2xl text-gray-600 mb-4">
                    {currentCall.message}
                  </div>
                  <div className="flex items-center justify-center gap-4 text-lg text-gray-500">
                    <Clock className="h-6 w-6" />
                    {new Date(currentCall.appointment_time).toLocaleString('pt-BR')}
                    <Badge variant="outline" className="text-lg px-4 py-2">
                      {currentCall.insurance_provider}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Announcements */}
        {announcements.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Bell className="h-6 w-6 text-yellow-600" />
                Avisos Importantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {announcements.map((announcement, index) => (
                  <div
                    key={index}
                    className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg"
                  >
                    <h4 className="text-xl font-bold text-gray-800 mb-2">
                      {announcement.title}
                    </h4>
                    <p className="text-lg text-gray-700 mb-2">
                      {announcement.message}
                    </p>
                    <div className="text-sm text-gray-500">
                      {new Date(announcement.announced_at).toLocaleString('pt-BR')} - 
                      Por: {announcement.announced_by}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Instruções</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="p-4">
                <Phone className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Aguarde sua vez</h3>
                <p className="text-gray-600">
                  Fique atento ao seu nome sendo chamado
                </p>
              </div>
              <div className="p-4">
                <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Mantenha distância</h3>
                <p className="text-gray-600">
                  Respeite o distanciamento social
                </p>
              </div>
              <div className="p-4">
                <Bell className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Avisos importantes</h3>
                <p className="text-gray-600">
                  Fique atento aos anúncios na tela
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500">
          <p>Sistema de Chamada Prontivus - {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}
