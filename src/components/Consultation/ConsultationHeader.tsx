import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Video, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface ConsultationHeaderProps {
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
  onJoinTelemedicine?: () => void;
}

export function ConsultationHeader({ patient, appointment, onJoinTelemedicine }: ConsultationHeaderProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'in_progress': return 'secondary';
      case 'completed': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={patient.avatar} alt={patient.name} />
              <AvatarFallback>{getInitials(patient.name)}</AvatarFallback>
            </Avatar>
            
            <div>
              <h2 className="text-2xl font-bold">{patient.name}</h2>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span>{patient.age} anos</span>
                <span>•</span>
                <span>CPF: {patient.cpf}</span>
              </div>
              
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(appointment.scheduled_time), 'dd/MM/yyyy')}
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Clock className="h-4 w-4" />
                  {format(new Date(appointment.scheduled_time), 'HH:mm')}
                </div>
                <Badge variant={getStatusVariant(appointment.status)}>
                  {appointment.status}
                </Badge>
              </div>
            </div>
          </div>

          {appointment.telemed_link && (
            <Button 
              onClick={onJoinTelemedicine}
              className="gap-2"
              aria-label="Iniciar teleconsulta"
            >
              <Video className="h-4 w-4" />
              Iniciar Teleconsulta
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
