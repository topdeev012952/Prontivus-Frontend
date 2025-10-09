import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Clock, Users } from 'lucide-react';
import { useWaitingQueue } from '@/hooks/useWaitingQueue';
import { useClinicStore } from '@/stores/clinicStore';
// Drag-drop functionality can be added later with @hello-pangea/dnd

export default function WaitingQueue() {
  const { selectedClinic } = useClinicStore();
  const { queue, isLoading, callNext } = useWaitingQueue(selectedClinic?.id ?? '');
  const [audioEnabled, setAudioEnabled] = useState(true);

  const handleCall = async (queueId: string) => {
    await callNext.mutateAsync(queueId);
    
    if (audioEnabled) {
      const audio = new Audio('/chime.mp3');
      audio.play().catch(() => console.log('Could not play audio'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'default';
      case 'called':
        return 'secondary';
      case 'in_progress':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'Aguardando';
      case 'called':
        return 'Chamado';
      case 'in_progress':
        return 'Em atendimento';
      default:
        return status;
    }
  };

  if (!selectedClinic) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Selecione uma clínica</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fila de Espera</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie a fila de pacientes aguardando atendimento
          </p>
        </div>
        <Button
          variant={audioEnabled ? 'default' : 'outline'}
          size="sm"
          onClick={() => setAudioEnabled(!audioEnabled)}
        >
          <Bell className="h-4 w-4 mr-2" />
          {audioEnabled ? 'Som ativo' : 'Som desativado'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Aguardando</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {queue.filter((i) => i.status === 'waiting').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atendimento</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {queue.filter((i) => i.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chamados</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {queue.filter((i) => i.status === 'called').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pacientes na Fila</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : queue.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum paciente na fila
            </div>
          ) : (
            <div className="space-y-3">
              {queue.map((item) => (
                <div
                  key={item.queue_id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary font-bold">
                      {item.position}
                    </div>
                    <div>
                      <p className="font-medium">{item.patient_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Horário: {new Date(item.appointment_time).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={getStatusColor(item.status)}>
                      {getStatusLabel(item.status)}
                    </Badge>
                    {item.status === 'waiting' && (
                      <Button
                        size="sm"
                        onClick={() => handleCall(item.queue_id)}
                        disabled={callNext.isPending}
                      >
                        <Bell className="h-4 w-4 mr-2" />
                        Chamar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
