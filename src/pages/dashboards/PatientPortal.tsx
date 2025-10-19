import { useState, useEffect } from "react";
import { FileText, Pill, Video, Calendar, User, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function PatientPortal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [medicalRecords, setMedicalRecords] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      
      // Load patient-specific data
      const [recordsData, prescriptionsData, appointmentsData] = await Promise.all([
        apiClient.request<any>("/medical_records/list?page=1&size=10").catch(() => ({ items: [] })),
        apiClient.request<any>("/prescriptions?page=1&size=10").catch(() => ({ items: [] })),
        apiClient.request<any>("/appointments?page=1&size=10").catch(() => ({ items: [] })),
      ]);

      setMedicalRecords(recordsData.items || []);
      setPrescriptions(prescriptionsData.items || []);
      setAppointments(appointmentsData.items || []);
    } catch (err) {
      console.error("Error loading patient portal:", err);
      setError("Failed to load your health information");
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
        <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
        <p className="text-muted-foreground">Your health information portal</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="h-10 w-10 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{medicalRecords.length}</p>
              <p className="text-sm text-muted-foreground">Medical Records</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="text-center">
              <Pill className="h-10 w-10 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{prescriptions.length}</p>
              <p className="text-sm text-muted-foreground">Prescriptions</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="text-center">
              <Calendar className="h-10 w-10 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{appointments.length}</p>
              <p className="text-sm text-muted-foreground">Appointments</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="text-center">
              <Video className="h-10 w-10 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Telemed Sessions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* My Medical Records */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                My Medical Records
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate("/app/records")}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {medicalRecords.length > 0 ? (
              <div className="space-y-2">
                {medicalRecords.slice(0, 4).map((record) => (
                  <div 
                    key={record.id} 
                    className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate("/app/records")}
                  >
                    <p className="font-medium">{record.diagnosis || "Medical Record"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(record.created_at).toLocaleDateString('pt-BR')} • 
                      Dr. {record.doctor_name || "Unknown"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">
                No medical records yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* My Prescriptions */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                My Prescriptions
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate("/app/prescriptions")}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {prescriptions.length > 0 ? (
              <div className="space-y-2">
                {prescriptions.slice(0, 4).map((rx) => (
                  <div 
                    key={rx.id} 
                    className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate("/app/prescriptions")}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">{rx.prescription_type}</p>
                      <Badge variant="outline" className="text-xs">
                        {rx.medications?.length || 0} med(s)
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(rx.created_at).toLocaleDateString('pt-BR')} • 
                      Dr. {rx.doctor_name || "Unknown"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">
                No prescriptions yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Upcoming Appointments</CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate("/app/appointments")}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {appointments.length > 0 ? (
            <div className="space-y-2">
              {appointments.slice(0, 4).map((apt) => (
                <div key={apt.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">
                      {new Date(apt.start_time).toLocaleString('pt-BR')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Dr. {apt.doctor_name || "Unknown"}
                    </p>
                  </div>
                  <Badge>{apt.status}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              No upcoming appointments
            </p>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Alert>
        <User className="h-4 w-4" />
        <AlertDescription>
          <strong>Patient Portal</strong>
          <p className="mt-2 text-sm">
            Access your medical history, prescriptions, and schedule appointments with your healthcare providers.
            For assistance, contact your clinic directly.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}

