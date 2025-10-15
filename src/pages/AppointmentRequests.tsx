import { useState, useEffect } from "react";
import { Calendar, Clock, User, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface AppointmentRequest {
  id: string;
  patient_id: string;
  patient_name: string;
  doctor_id?: string;
  doctor_name?: string;
  preferred_date: string;
  preferred_time?: string;
  reason: string;
  notes?: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  requested_at: string;
  reviewed_at?: string;
  reviewer_name?: string;
  rejection_reason?: string;
  approved_appointment_id?: string;
  approved_start_time?: string;
  approved_end_time?: string;
}

interface Patient {
  id: string;
  name: string;
}

interface Doctor {
  id: string;
  name: string;
}

interface AppointmentRequestStats {
  total_requests: number;
  pending_requests: number;
  approved_requests: number;
  rejected_requests: number;
  requests_today: number;
  pending_today: number;
  approved_this_week: number;
}

export default function AppointmentRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [stats, setStats] = useState<AppointmentRequestStats>({
    total_requests: 0,
    pending_requests: 0,
    approved_requests: 0,
    rejected_requests: 0,
    requests_today: 0,
    pending_today: 0,
    approved_this_week: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AppointmentRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [formData, setFormData] = useState({
    patient_id: "",
    doctor_id: "",
    preferred_date: "",
    preferred_time: "",
    reason: "",
    notes: "",
  });

  const [reviewData, setReviewData] = useState({
    action: "approve",
    rejection_reason: "",
    start_time: "",
    duration_minutes: 30,
  });

  useEffect(() => {
    loadRequests();
    loadPatients();
    loadDoctors();
    loadStats();
  }, [filterStatus]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const url = filterStatus === "all" 
        ? "/appointment-requests" 
        : `/appointment-requests?status_filter=${filterStatus}`;
      const data = await apiClient.request<AppointmentRequest[]>(url);
      setRequests(data);
    } catch (err: any) {
      console.error("Error loading requests:", err);
      setError(err.message || "Falha ao carregar solicitações");
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const data = await apiClient.request<any>("/patients?page=1&size=100");
      setPatients(data.items || []);
    } catch (err) {
      console.error("Error loading patients:", err);
    }
  };

  const loadDoctors = async () => {
    try {
      const data = await apiClient.request<any>("/users?page=1&size=100");
      const doctorList = (data.items || []).filter((u: any) => 
        u.role === "doctor" || u.role === "admin"
      );
      setDoctors(doctorList);
    } catch (err) {
      console.error("Error loading doctors:", err);
    }
  };

  const loadStats = async () => {
    try {
      const data = await apiClient.request<AppointmentRequestStats>("/appointment-requests/stats");
      setStats(data);
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");
      
      // Prepare request data - doctor_id is optional (patient can request without specific doctor)
      const requestData = {
        patient_id: formData.patient_id,
        doctor_id: formData.doctor_id || null, // Allow null if no doctor selected
        preferred_date: formData.preferred_date,
        preferred_time: formData.preferred_time || null,
        reason: formData.reason,
        notes: formData.notes || null,
      };
      
      await apiClient.request("/appointment-requests", {
        method: "POST",
        body: JSON.stringify(requestData),
      });
      setSuccess("Solicitação de consulta criada com sucesso!");
      setShowCreateDialog(false);
      resetForm();
      loadRequests();
      loadStats();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      console.error("Error creating request:", err);
      setError(err.message || "Falha ao criar solicitação");
    }
  };

  const handleReviewRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      setError("");
      
      const requestBody: any = {
        action: reviewData.action,
      };

      if (reviewData.action === "approve") {
        if (!reviewData.start_time) {
          setError("Data e hora de início são obrigatórias para aprovar");
          return;
        }
        requestBody.start_time = new Date(reviewData.start_time).toISOString();
        requestBody.duration_minutes = reviewData.duration_minutes;
      } else {
        if (!reviewData.rejection_reason) {
          setError("Motivo da rejeição é obrigatório");
          return;
        }
        requestBody.rejection_reason = reviewData.rejection_reason;
      }

      await apiClient.request(`/appointment-requests/${selectedRequest.id}/review`, {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      setSuccess(`Solicitação ${reviewData.action === "approve" ? "aprovada" : "rejeitada"} com sucesso!`);
      setShowReviewDialog(false);
      setSelectedRequest(null);
      resetReviewForm();
      loadRequests();
      loadStats();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      console.error("Error reviewing request:", err);
      setError(err.message || "Falha ao revisar solicitação");
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!window.confirm("Tem certeza que deseja cancelar esta solicitação?")) return;

    try {
      setError("");
      await apiClient.request(`/appointment-requests/${requestId}`, {
        method: "DELETE",
      });
      setSuccess("Solicitação cancelada com sucesso!");
      loadRequests();
      loadStats();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      console.error("Error cancelling request:", err);
      setError(err.message || "Falha ao cancelar solicitação");
    }
  };

  const resetForm = () => {
    setFormData({
      patient_id: "",
      doctor_id: "",
      preferred_date: "",
      preferred_time: "",
      reason: "",
      notes: "",
    });
  };

  const resetReviewForm = () => {
    setReviewData({
      action: "approve",
      rejection_reason: "",
      start_time: "",
      duration_minutes: 30,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Aprovada</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-100 text-red-800">Rejeitada</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isStaff = user?.role && ["admin", "doctor", "secretary", "superadmin"].includes(user.role.toLowerCase());

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Solicitações de Consulta</h1>
          <p className="text-muted-foreground">Gerenciar solicitações de agendamento de pacientes</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Calendar className="mr-2 h-4 w-4" />
              Nova Solicitação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Solicitação de Consulta</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar uma nova solicitação de agendamento
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateRequest}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="patient_id">Paciente *</Label>
                  <Select value={formData.patient_id} onValueChange={(value) => setFormData({ ...formData, patient_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="doctor_id">Médico (Opcional)</Label>
                  <Select 
                    value={formData.doctor_id || "none"} 
                    onValueChange={(value) => setFormData({ ...formData, doctor_id: value === "none" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Qualquer médico disponível" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Qualquer médico</SelectItem>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="preferred_date">Data Preferida *</Label>
                    <Input
                      id="preferred_date"
                      type="date"
                      value={formData.preferred_date}
                      onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="preferred_time">Hora Preferida</Label>
                    <Input
                      id="preferred_time"
                      type="time"
                      value={formData.preferred_time}
                      onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="reason">Motivo da Consulta *</Label>
                  <Textarea
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Descreva o motivo da consulta..."
                    required
                    minLength={10}
                    maxLength={500}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Observações Adicionais</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Informações adicionais..."
                    maxLength={1000}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Criar Solicitação</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Solicitações</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_requests}</div>
            <p className="text-xs text-muted-foreground">
              {stats.requests_today} hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending_requests}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pending_today} hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved_requests}</div>
            <p className="text-xs text-muted-foreground">
              {stats.approved_this_week} esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejeitadas</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected_requests}</div>
            <p className="text-xs text-muted-foreground">
              Total de rejeitadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Button
              variant={filterStatus === "all" ? "default" : "outline"}
              onClick={() => setFilterStatus("all")}
            >
              Todas
            </Button>
            <Button
              variant={filterStatus === "pending" ? "default" : "outline"}
              onClick={() => setFilterStatus("pending")}
            >
              Pendentes
            </Button>
            <Button
              variant={filterStatus === "approved" ? "default" : "outline"}
              onClick={() => setFilterStatus("approved")}
            >
              Aprovadas
            </Button>
            <Button
              variant={filterStatus === "rejected" ? "default" : "outline"}
              onClick={() => setFilterStatus("rejected")}
            >
              Rejeitadas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Success/Error Messages */}
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Requests List */}
      <div className="grid gap-4">
        {requests.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma solicitação encontrada</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{request.patient_name}</span>
                      {getStatusBadge(request.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(request.preferred_date).toLocaleDateString("pt-BR")}</span>
                        {request.preferred_time && (
                          <>
                            <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                            <span>{request.preferred_time}</span>
                          </>
                        )}
                      </div>
                      {request.doctor_name && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>Dr(a). {request.doctor_name}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm text-muted-foreground">{request.reason}</p>
                    </div>

                    {request.rejection_reason && (
                      <Alert variant="destructive" className="mt-3">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{request.rejection_reason}</AlertDescription>
                      </Alert>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Solicitado em: {new Date(request.requested_at).toLocaleString("pt-BR")}
                      {request.reviewed_at && (
                        <> • Revisado em: {new Date(request.reviewed_at).toLocaleString("pt-BR")}</>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {isStaff && request.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setReviewData({
                            ...reviewData,
                            start_time: `${request.preferred_date}T${request.preferred_time || "09:00"}`,
                          });
                          setShowReviewDialog(true);
                        }}
                      >
                        Revisar
                      </Button>
                    )}
                    {request.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelRequest(request.id)}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revisar Solicitação</DialogTitle>
            <DialogDescription>
              Aprove ou rejeite a solicitação de consulta do paciente
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReviewRequest}>
            <div className="space-y-4">
              <div>
                <Label>Ação</Label>
                <Select value={reviewData.action} onValueChange={(value) => setReviewData({ ...reviewData, action: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">Aprovar</SelectItem>
                    <SelectItem value="reject">Rejeitar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {reviewData.action === "approve" ? (
                <>
                  <div>
                    <Label htmlFor="start_time">Data e Hora da Consulta *</Label>
                    <Input
                      id="start_time"
                      type="datetime-local"
                      value={reviewData.start_time}
                      onChange={(e) => setReviewData({ ...reviewData, start_time: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration">Duração (minutos)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={reviewData.duration_minutes}
                      onChange={(e) => setReviewData({ ...reviewData, duration_minutes: parseInt(e.target.value) })}
                      min={15}
                      max={180}
                    />
                  </div>
                </>
              ) : (
                <div>
                  <Label htmlFor="rejection_reason">Motivo da Rejeição *</Label>
                  <Textarea
                    id="rejection_reason"
                    value={reviewData.rejection_reason}
                    onChange={(e) => setReviewData({ ...reviewData, rejection_reason: e.target.value })}
                    placeholder="Explique o motivo da rejeição..."
                    required={reviewData.action === "reject"}
                    minLength={10}
                    maxLength={500}
                  />
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setShowReviewDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {reviewData.action === "approve" ? "Aprovar" : "Rejeitar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

