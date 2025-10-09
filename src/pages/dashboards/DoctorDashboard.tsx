import { useState, useEffect } from "react";
import { Calendar, Users, FileText, Video, Mic, Clock, Stethoscope, Loader2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api";
import { StatsCard } from "@/components/Dashboard/StatsCard";

interface Appointment {
  id: string;
  patient_name?: string;
  start_time: string;
  status: string;
}

interface QueuePatient {
  id: string;
  patient_name?: string;
  position: number;
  priority: string;
}

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [queuePatients, setQueuePatients] = useState<QueuePatient[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDoctorData();
  }, []);

  const loadDoctorData = async () => {
    try {
      setLoading(true);
      
      const [statsData, appointmentsData] = await Promise.all([
        apiClient.request<any>("/dashboard/stats"),
        apiClient.request<Appointment[]>("/dashboard/today-appointments").catch(() => []),
      ]);

      setStats(statsData);
      setTodayAppointments(appointmentsData);
      
      // Load queue
      try {
        const queueData = await apiClient.request<any>("/waiting_queue?status=waiting");
        setQueuePatients(queueData.items || queueData || []);
      } catch {}
      
    } catch (err) {
      console.error("Error loading doctor dashboard:", err);
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
        <h1 className="text-3xl font-bold">Doctor Dashboard</h1>
        <p className="text-muted-foreground">Your schedule and patient care tools</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Today's Appointments"
            value={todayAppointments.length.toString()}
            change={`${todayAppointments.filter(a => a.status === 'completed').length} completed`}
            icon={Calendar}
          />
          <StatsCard
            title="Patients in Queue"
            value={queuePatients.length.toString()}
            change="Waiting now"
            icon={Clock}
          />
          <StatsCard
            title="Your Records"
            value={stats.total_records?.toString() || "0"}
            change="All time"
            icon={FileText}
          />
          <StatsCard
            title="This Week"
            value={stats.records_this_week?.toString() || "0"}
            change="New records"
            icon={Stethoscope}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Agenda */}
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Agenda
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate("/app/appointments")}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {todayAppointments.length > 0 ? (
              <div className="space-y-3">
                {todayAppointments.slice(0, 6).map((apt) => (
                  <div 
                    key={apt.id} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/app/consultations/${apt.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold ${
                        apt.status === 'completed' ? 'bg-green-500' : 
                        apt.status === 'in_progress' ? 'bg-blue-500' : 
                        'bg-gray-500'
                      }`}>
                        {apt.patient_name?.charAt(0) || "P"}
                      </div>
                      <div>
                        <p className="font-medium">{apt.patient_name || "Patient"}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(apt.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <Badge variant={apt.status === "completed" ? "default" : "outline"}>
                      {apt.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No appointments today</p>
                <Button className="mt-4" variant="outline" onClick={() => navigate("/app/appointments")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Appointment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Patient Queue */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Patient Queue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {queuePatients.length > 0 ? (
              <>
                <div className="space-y-2">
                  {queuePatients.slice(0, 4).map((patient) => (
                    <div key={patient.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{patient.patient_name || "Patient"}</p>
                        <p className="text-xs text-muted-foreground">
                          Position: {patient.position} • {patient.estimated_wait_time}min
                        </p>
                      </div>
                      <Badge className={
                        patient.priority === "urgent" ? "bg-red-100 text-red-800" : 
                        patient.priority === "high" ? "bg-orange-100 text-orange-800" : 
                        "bg-blue-100 text-blue-800"
                      }>
                        {patient.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button className="w-full" size="lg" onClick={handleCallNextPatient}>
                  <Users className="h-5 w-5 mr-2" />
                  Call Next Patient
                </Button>
              </>
            ) : (
              <p className="text-center py-8 text-muted-foreground">
                No patients in queue
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Tools */}
      <Card className="shadow-card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            AI-Powered Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Button className="h-20 flex flex-col gap-2" onClick={() => navigate("/app/consultations/new")}>
            <Mic className="h-6 w-6" />
            <span>AI Dictation</span>
            <span className="text-xs opacity-80">Record & Transcribe</span>
          </Button>
          <Button className="h-20 flex flex-col gap-2" variant="outline" onClick={() => navigate("/app/records")}>
            <FileText className="h-6 w-6" />
            <span>EMR with AI</span>
            <span className="text-xs opacity-80">Structured Summary</span>
          </Button>
          <Button className="h-20 flex flex-col gap-2" variant="outline" onClick={() => navigate("/app/prescriptions")}>
            <Stethoscope className="h-6 w-6" />
            <span>Digital Rx</span>
            <span className="text-xs opacity-80">With Signature</span>
          </Button>
        </CardContent>
      </Card>

      {/* Telemedicine */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Telemedicine
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Start video consultations with patients remotely
          </p>
          <Button className="w-full gap-2" onClick={() => navigate("/app/settings")}>
            <Video className="h-4 w-4" />
            Configure Telemedicine
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
