import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Phone, Clock, User, UserCheck, Users, Loader2, CheckCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface Appointment {
  id: string;
  patient_id: string;
  patient_name?: string;
  doctor_id: string;
  doctor_name?: string;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string;
}

interface PaginatedResponse {
  items: Appointment[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export default function WaitingRoom() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    loadTodayAppointments();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadTodayAppointments, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadTodayAppointments = async () => {
    try {
      setLoading(true);
      setError("");

      const today = new Date().toISOString().split('T')[0];
      const params = new URLSearchParams({
        day: today,
        page: "1",
        size: "100",
      });

      const data = await apiClient.request<PaginatedResponse>(
        `/appointments?${params.toString()}`
      );

      // Filter for scheduled and checked_in appointments
      const waitingRoomAppts = data.items.filter(a => 
        ['scheduled', 'checked_in', 'in_progress'].includes(a.status.toLowerCase())
      );

      setAppointments(waitingRoomAppts);
    } catch (err) {
      console.error("Error loading appointments:", err);
      setError("Failed to load waiting room. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      setUpdating(appointmentId);
      setError("");

      await apiClient.request(`/appointments/${appointmentId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      // Reload appointments
      await loadTodayAppointments();
    } catch (err: any) {
      console.error("Error updating appointment:", err);
      setError(err.message || "Failed to update appointment status.");
    } finally {
      setUpdating(null);
    }
  };

  const handleCheckIn = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowCheckInDialog(true);
  };

  const confirmCheckIn = async () => {
    if (!selectedAppointment) return;
    
    await updateAppointmentStatus(selectedAppointment.id, 'checked_in');
    setShowCheckInDialog(false);
    setSelectedAppointment(null);
  };

  const callPatient = async (appointment: Appointment) => {
    await updateAppointmentStatus(appointment.id, 'in_progress');
  };

  const completeConsultation = async (appointment: Appointment) => {
    await updateAppointmentStatus(appointment.id, 'completed');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
      case 'checked_in':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'completed':
        return 'bg-green-500/10 text-green-700 border-green-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      scheduled: "Scheduled",
      checked_in: "Checked In",
      in_progress: "In Consultation",
      completed: "Completed"
    };
    return labels[status.toLowerCase()] || status;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getWaitTime = (checkInTime: string) => {
    const now = new Date();
    const checkIn = new Date(checkInTime);
    const minutes = Math.floor((now.getTime() - checkIn.getTime()) / 60000);
    
    if (minutes < 1) return "Just now";
    if (minutes === 1) return "1 minute ago";
    return `${minutes} minutes ago`;
  };

  // Calculate statistics
  const scheduledCount = appointments.filter(a => a.status.toLowerCase() === 'scheduled').length;
  const checkedInCount = appointments.filter(a => a.status.toLowerCase() === 'checked_in').length;
  const inProgressCount = appointments.filter(a => a.status.toLowerCase() === 'in_progress').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Waiting Room</h1>
        <p className="text-muted-foreground mt-1">
          Monitor and manage today's patient check-ins and consultations
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-600" />
              Scheduled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{scheduledCount}</div>
            <p className="text-xs text-muted-foreground">Not checked in yet</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-yellow-600" />
              Checked In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{checkedInCount}</div>
            <p className="text-xs text-muted-foreground">Waiting to be called</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4 text-blue-600" />
              In Consultation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground">Currently with doctor</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Total Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{appointments.length}</div>
            <p className="text-xs text-muted-foreground">Appointments for today</p>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty State */}
      {!loading && appointments.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <User className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No appointments today</h3>
            <p className="text-muted-foreground">
              There are no scheduled appointments for today
            </p>
          </CardContent>
        </Card>
      )}

      {/* Appointments List */}
      {!loading && appointments.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Today's Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {appointments.map(appointment => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          {appointment.patient_name || `Patient #${appointment.patient_id.slice(0, 8)}`}
                        </h3>
                        <Badge className={getStatusColor(appointment.status)}>
                          {getStatusLabel(appointment.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(appointment.start_time)}
                        </span>
                        {appointment.doctor_name && (
                          <span>Dr: {appointment.doctor_name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {appointment.status.toLowerCase() === 'scheduled' && (
                      <Button
                        onClick={() => handleCheckIn(appointment)}
                        disabled={updating === appointment.id}
                        variant="outline"
                        size="sm"
                      >
                        {updating === appointment.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Check In
                          </>
                        )}
                      </Button>
                    )}
                    
                    {appointment.status.toLowerCase() === 'checked_in' && (
                      <Button
                        onClick={() => callPatient(appointment)}
                        disabled={updating === appointment.id}
                        size="sm"
                      >
                        {updating === appointment.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Phone className="h-4 w-4 mr-2" />
                            Call Patient
                          </>
                        )}
                      </Button>
                    )}
                    
                    {appointment.status.toLowerCase() === 'in_progress' && (
                      <Button
                        onClick={() => completeConsultation(appointment)}
                        disabled={updating === appointment.id}
                        variant="outline"
                        size="sm"
                      >
                        {updating === appointment.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Complete
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Check-In Confirmation Dialog */}
      <Dialog open={showCheckInDialog} onOpenChange={setShowCheckInDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check In Patient</DialogTitle>
            <DialogDescription>
              Confirm that the patient has arrived and is ready to wait
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="py-4">
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <User className="h-12 w-12 text-primary" />
                <div>
                  <p className="font-semibold text-lg">
                    {selectedAppointment.patient_name || `Patient #${selectedAppointment.patient_id.slice(0, 8)}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Appointment: {formatTime(selectedAppointment.start_time)}
                  </p>
                  {selectedAppointment.doctor_name && (
                    <p className="text-sm text-muted-foreground">
                      Dr: {selectedAppointment.doctor_name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCheckInDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmCheckIn} disabled={updating !== null}>
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking In...
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Confirm Check-In
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}