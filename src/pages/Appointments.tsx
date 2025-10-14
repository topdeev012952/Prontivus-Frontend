import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Plus, Clock, User, Loader2, X, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api";
import { formatDate, formatTime, cn } from "@/lib/utils";

interface Appointment {
  id: string;
  patient_id: string;
  patient_name?: string;
  doctor_id: string;
  doctor_name?: string;
  clinic_id: string;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse {
  items: Appointment[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

interface Patient {
  id: string;
  name: string;
}

interface Doctor {
  id: string;
  name: string;
}

export default function Appointments() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [total, setTotal] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [formData, setFormData] = useState({
    patient_id: "",
    doctor_id: "",
    date: "",
    start_time: "",
    duration: "30",
    status: "scheduled"
  });

  useEffect(() => {
    loadAppointments();
  }, [selectedDate]);

  useEffect(() => {
    loadPatientsAndDoctors();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError("");

      const dateStr = selectedDate.toISOString().split('T')[0];
      const params = new URLSearchParams({
        day: dateStr,
        page: "1",
        size: "50",
      });

      const data = await apiClient.request<PaginatedResponse>(
        `/appointments?${params.toString()}`
      );

      setAppointments(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error("Error loading appointments:", err);
      setError("Falha ao carregar consultas. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const loadPatientsAndDoctors = async () => {
    try {
      // Load patients
      const patientsData = await apiClient.request<PaginatedResponse>("/patients?page=1&size=100");
      setPatients(patientsData.items as any);

      // Load doctors (users with doctor role)
      const usersData = await apiClient.request<any>("/users?page=1&size=100");
      const doctorsList = usersData.items?.filter((u: any) => 
        ['DOCTOR', 'doctor', 'ADMIN', 'admin'].includes(u.role)
      ) || [];
      setDoctors(doctorsList);
    } catch (err) {
      console.error("Error loading patients/doctors:", err);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // Calculate start_time and end_time
      const startDateTime = new Date(`${formData.date}T${formData.start_time}`);
      const endDateTime = new Date(startDateTime.getTime() + parseInt(formData.duration) * 60000);

      const appointmentData = {
        patient_id: formData.patient_id,
        doctor_id: formData.doctor_id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status: formData.status
      };

      await apiClient.request("/appointments", {
        method: "POST",
        body: JSON.stringify(appointmentData),
      });

      // Show success message
      setSuccess("Consulta agendada com sucesso!");
      
      // Update selected date to show the newly created appointment
      setSelectedDate(startDateTime);

      // Reset form
      setFormData({
        patient_id: "",
        doctor_id: "",
        date: "",
        start_time: "",
        duration: "30",
        status: "scheduled"
      });
      
      setShowCreateDialog(false);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(""), 5000);
      
      // Reload appointments for the new date (will happen automatically via useEffect)
      // No need to call loadAppointments() - the selectedDate change will trigger it
    } catch (err: any) {
      console.error("Error creating appointment:", err);
      setError(err.response?.data?.detail || "Falha ao agendar consulta. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleViewAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowViewDialog(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    
    // Parse the start_time to get date and time
    const startDate = new Date(appointment.start_time);
    const endDate = new Date(appointment.end_time);
    const duration = Math.round((endDate.getTime() - startDate.getTime()) / 60000); // minutes
    
    setFormData({
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id,
      date: startDate.toISOString().split('T')[0],
      start_time: startDate.toTimeString().substring(0, 5),
      duration: duration.toString(),
      status: appointment.status
    });
    
    setShowEditDialog(true);
  };

  const handleUpdateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAppointment) return;

    try {
      setSaving(true);
      setError("");

      // Calculate start_time and end_time
      const startDateTime = new Date(`${formData.date}T${formData.start_time}`);
      const endDateTime = new Date(startDateTime.getTime() + parseInt(formData.duration) * 60000);

      const updateData = {
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status: formData.status
      };

      await apiClient.request(`/appointments/${selectedAppointment.id}`, {
        method: "PATCH",
        body: JSON.stringify(updateData),
      });

      setShowEditDialog(false);
      setSelectedAppointment(null);
      
      // Reset form
      setFormData({
        patient_id: "",
        doctor_id: "",
        date: "",
        start_time: "",
        duration: "30",
        status: "scheduled"
      });
      
      // Reload appointments
      await loadAppointments();
    } catch (err: any) {
      console.error("Error updating appointment:", err);
      setError(err.message || "Falha ao atualizar consulta. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowDeleteDialog(true);
  };

  const handleDeleteAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      setDeleting(true);
      setError("");

      await apiClient.request(`/appointments/${selectedAppointment.id}`, {
        method: "DELETE",
      });

      setShowDeleteDialog(false);
      setSelectedAppointment(null);
      
      // Reload appointments
      await loadAppointments();
    } catch (err: any) {
      console.error("Error deleting appointment:", err);
      setError(err.message || "Falha ao excluir consulta. Tente novamente.");
    } finally {
      setDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-accent/10 text-accent border-accent/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
      case "completed":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const calculateDuration = (start: string, end: string) => {
    const startTime = new Date(start);
    const endTime = new Date(end);
    return Math.round((endTime.getTime() - startTime.getTime()) / 60000);
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const confirmedCount = appointments.filter(a => a.status === 'confirmed').length;
  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Consultas</h1>
          <p className="text-muted-foreground">
            {total > 0 ? `Gerenciando ${total.toLocaleString()} consultas` : "Gerencie sua agenda e consultas"}
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4" />
          Nova Consulta
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-1 shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                {/* Calendar Date Picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                      disabled={loading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        selectedDate.toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                {/* Quick Navigation */}
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeDate(-1)}
                    disabled={loading}
                    className="flex-1"
                  >
                    ← Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(new Date())}
                    disabled={loading}
                    className="flex-1"
                  >
                    Hoje
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeDate(1)}
                    disabled={loading}
                    className="flex-1"
                  >
                    Próximo →
                  </Button>
                </div>
              </div>
              <div className="space-y-2 border-t pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total de Consultas</span>
                  <span className="font-semibold">{appointments.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Confirmadas</span>
                  <span className="font-semibold text-accent">{confirmedCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pendentes</span>
                  <span className="font-semibold text-yellow-600">{pendingCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Concluídas</span>
                  <span className="font-semibold text-green-600">{completedCount}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appointments List */}
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Agenda</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : appointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarIcon className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma consulta agendada</h3>
                <p className="text-muted-foreground mb-4">
                  Não há consultas para {selectedDate.toLocaleDateString('pt-BR')}
                </p>
                <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4" />
                  Agendar Consulta
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="rounded-lg border p-4 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 text-primary font-semibold">
                            <Clock className="h-4 w-4" />
                            {formatTime(appointment.start_time)}
                          </div>
                          <Badge className={getStatusColor(appointment.status)}>
                            {getStatusLabel(appointment.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {appointment.patient_name || `Paciente #${appointment.patient_id.slice(0, 8)}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Tipo: Consulta</span>
                          <span>Duração: {calculateDuration(appointment.start_time, appointment.end_time)} min</span>
                          {appointment.doctor_name && <span>Dr: {appointment.doctor_name}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewAppointment(appointment);
                          }}
                          title="Ver Detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditAppointment(appointment);
                          }}
                          title="Editar Consulta"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(appointment);
                          }}
                          title="Excluir Consulta"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Appointment Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Consulta</DialogTitle>
            <DialogDescription>
              Agende uma nova consulta para um paciente
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAppointment}>
            <div className="grid gap-4 py-4">
              {/* Patient Selection */}
              <div className="grid gap-2">
                <Label htmlFor="patient">Paciente *</Label>
                <Select
                  value={formData.patient_id}
                  onValueChange={(value) => setFormData({ ...formData, patient_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o paciente" />
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

              {/* Doctor Selection */}
              <div className="grid gap-2">
                <Label htmlFor="doctor">Médico *</Label>
                <Select
                  value={formData.doctor_id}
                  onValueChange={(value) => setFormData({ ...formData, doctor_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o médico" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Date with Calendar Picker */}
                <div className="grid gap-2">
                  <Label htmlFor="date">Data *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.date ? (
                          new Date(formData.date).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })
                        ) : (
                          <span>Selecione a data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.date ? new Date(formData.date) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setFormData({ 
                              ...formData, 
                              date: date.toISOString().split('T')[0] 
                            });
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Time */}
                <div className="grid gap-2">
                  <Label htmlFor="start_time">Horário *</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Duration */}
                <div className="grid gap-2">
                  <Label htmlFor="duration">Duração (minutos)</Label>
                  <Select
                    value={formData.duration}
                    onValueChange={(value) => setFormData({ ...formData, duration: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="45">45 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="90">1.5 horas</SelectItem>
                      <SelectItem value="120">2 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Agendado</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || !formData.patient_id || !formData.doctor_id}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Consulta"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Appointment Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Consulta</DialogTitle>
            <DialogDescription>
              Visualize todas as informações da consulta agendada.
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Paciente</Label>
                  <p className="font-medium">
                    {selectedAppointment.patient_name || `Paciente #${selectedAppointment.patient_id.slice(0, 8)}`}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Médico</Label>
                  <p className="font-medium">
                    {selectedAppointment.doctor_name || `Médico #${selectedAppointment.doctor_id.slice(0, 8)}`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Data</Label>
                  <p className="font-medium">
                    {new Date(selectedAppointment.start_time).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Horário</Label>
                  <p className="font-medium">
                    {formatTime(selectedAppointment.start_time)} - {formatTime(selectedAppointment.end_time)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Duração</Label>
                  <p className="font-medium">
                    {calculateDuration(selectedAppointment.start_time, selectedAppointment.end_time)} minutos
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={getStatusColor(selectedAppointment.status)}>
                    {getStatusLabel(selectedAppointment.status)}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Criado em</Label>
                <p className="text-sm">
                  {new Date(selectedAppointment.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowViewDialog(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Appointment Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Consulta</DialogTitle>
            <DialogDescription>
              Atualize as informações da consulta. Paciente e médico não podem ser alterados.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateAppointment}>
            <div className="space-y-4 py-4">
              {/* Patient (Read-only) */}
              <div className="space-y-2">
                <Label>Paciente (Não pode ser alterado)</Label>
                <Input
                  value={selectedAppointment?.patient_name || `Paciente #${selectedAppointment?.patient_id.slice(0, 8)}`}
                  disabled
                  className="bg-muted"
                />
              </div>

              {/* Doctor (Read-only) */}
              <div className="space-y-2">
                <Label>Médico (Não pode ser alterado)</Label>
                <Input
                  value={selectedAppointment?.doctor_name || `Médico #${selectedAppointment?.doctor_id.slice(0, 8)}`}
                  disabled
                  className="bg-muted"
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="edit-date">Data</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              {/* Time and Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-start-time">Horário de Início</Label>
                  <Input
                    id="edit-start-time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-duration">Duração (minutos)</Label>
                  <Select
                    value={formData.duration}
                    onValueChange={(value) => setFormData({ ...formData, duration: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="45">45 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="90">1,5 hora</SelectItem>
                      <SelectItem value="120">2 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Agendada</SelectItem>
                    <SelectItem value="checked_in">Check-in Realizado</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  "Atualizar Consulta"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Consulta</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta consulta? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="py-4">
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="font-medium">
                  {selectedAppointment.patient_name || `Paciente #${selectedAppointment.patient_id.slice(0, 8)}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(selectedAppointment.start_time)} às {formatTime(selectedAppointment.start_time)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Status: {getStatusLabel(selectedAppointment.status)}
                </p>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Prontuários e faturas relacionadas permanecerão no sistema.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAppointment}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Consulta
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}