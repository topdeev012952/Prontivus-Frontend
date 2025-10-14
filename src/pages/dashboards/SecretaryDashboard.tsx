import { useState, useEffect } from "react";
import { Calendar, Users, Clock, Phone, Plus, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api";
import { StatsCard } from "@/components/Dashboard/StatsCard";

export default function SecretaryDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [queuePatients, setQueuePatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSecretaryData();
  }, []);

  const loadSecretaryData = async () => {
    try {
      setLoading(true);
      
      const [statsData, appointmentsData] = await Promise.all([
        apiClient.request<any>("/dashboard/stats"),
        apiClient.request<any[]>("/dashboard/today-appointments").catch(() => []),
      ]);

      setStats(statsData);
      setTodayAppointments(appointmentsData);
      
      // Load queue from consultations endpoint
      try {
        const queueData = await apiClient.request<any>("/consultations/queue");
        setQueuePatients(queueData || []);
      } catch (queueErr) {
        console.log("Queue not available:", queueErr);
        setQueuePatients([]);
      }
      
    } catch (err) {
      console.error("Error loading secretary dashboard:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Secretary Dashboard</h1>
        <p className="text-muted-foreground">Patient scheduling and queue management</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats - All from database */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard
            title="Consultas Hoje"
            value={stats.today_appointments?.toString() || "0"}
            change="Agendadas"
            icon={Calendar}
          />
          <StatsCard
            title="Fila de Espera"
            value={queuePatients.length.toString()}
            change="Aguardando"
            icon={Clock}
          />
          <StatsCard
            title="Total de Pacientes"
            value={stats.total_patients?.toString() || "0"}
            change="No sistema"
            icon={Users}
          />
          <StatsCard
            title="Consultas Pendentes"
            value={stats.pending_appointments?.toString() || "0"}
            change="Futuras"
            icon={Phone}
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Button className="h-24 flex flex-col gap-2" size="lg" onClick={() => navigate("/app/patients")}>
          <Plus className="h-8 w-8" />
          <span>Register New Patient</span>
        </Button>
        <Button className="h-24 flex flex-col gap-2" variant="outline" onClick={() => navigate("/app/appointments")}>
          <Calendar className="h-8 w-8" />
          <span>Schedule Appointment</span>
        </Button>
        <Button className="h-24 flex flex-col gap-2" variant="outline" onClick={() => navigate("/app/waiting-room")}>
          <Users className="h-8 w-8" />
          <span>Manage Queue</span>
        </Button>
      </div>

      {/* Today's Schedule */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Today's Schedule</CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate("/app/appointments")}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {todayAppointments.length > 0 ? (
            <div className="space-y-2">
              {todayAppointments.slice(0, 8).map((apt) => (
                <div key={apt.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{apt.patient_name || "Patient"}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(apt.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <Badge>{apt.status}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-12 text-muted-foreground">
              No appointments scheduled for today
            </p>
          )}
        </CardContent>
      </Card>

      {/* Patient Queue */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Patient Queue
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate("/app/waiting-room")}>
              Manage
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {queuePatients.length > 0 ? (
            <div className="space-y-2">
              {queuePatients.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{patient.patient_name || "Patient"}</p>
                    <p className="text-xs text-muted-foreground">
                      Position: {patient.position}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => navigate("/app/waiting-room")}>
                    <Phone className="h-4 w-4 mr-1" />
                    Call
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              No patients in queue
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

