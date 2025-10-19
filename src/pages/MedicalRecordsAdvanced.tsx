import { useState, useEffect } from "react";
import { FileText, Search, Loader2, User, Calendar, Stethoscope, Eye, Lock, Unlock, Upload, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api";
import { CID10Autocomplete } from "@/components/CID10Autocomplete";

interface MedicalRecord {
  id: string;
  appointment_id?: string;
  doctor_id?: string;
  patient_id: string;
  
  // História Clínica (Clinical History)
  chief_complaint?: string;
  present_illness?: string;
  anamnesis?: string;
  past_medical_history?: string;
  family_history?: string;
  social_history?: string;
  allergies?: string[];
  current_medications?: string[];
  
  // Exame Físico (Physical Examination)
  physical_exam?: string;
  vital_signs?: {
    temperature?: number;
    blood_pressure_systolic?: number;
    blood_pressure_diastolic?: number;
    heart_rate?: number;
    respiratory_rate?: number;
    oxygen_saturation?: number;
    weight?: number;
    height?: number;
  };
  system_review?: {
    cardiovascular?: string;
    respiratory?: string;
    gastrointestinal?: string;
    neurological?: string;
    musculoskeletal?: string;
  };
  
  // Assessment & Plan
  diagnosis?: string;
  icd_code?: string;
  icd_codes?: Array<{code: string; description: string; type: string}>;
  treatment_plan?: string;
  prescriptions?: string;
  
  // Evolution
  evolution_notes?: string;
  
  // Metadata
  is_locked?: boolean;
  locked_by?: string;
  locked_at?: string;
  created_at: string;
  updated_at: string;
  patient_name?: string;
  doctor_name?: string;
}

interface PaginatedResponse {
  items: MedicalRecord[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

interface Patient {
  id: string;
  name: string;
  cpf?: string;
  birthdate?: string;
}

export default function MedicalRecordsAdvanced() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  // Removed edit functionality - this is now read-only
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [locking, setLocking] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [recordFiles, setRecordFiles] = useState<any[]>([]);
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  
  // Form tabs state
  const [activeTab, setActiveTab] = useState("historia");
  
  // Enhanced form data
  const [formData, setFormData] = useState({
    appointment_id: "",
    
    // Tab 1: História Clínica
    chief_complaint: "",
    present_illness: "",
    anamnesis: "",
    past_medical_history: "",
    family_history: "",
    social_history: "",
    allergies: "",
    current_medications: "",
    
    // Tab 2: Exame Físico
    physical_exam: "",
    temperature: "",
    bp_systolic: "",
    bp_diastolic: "",
    heart_rate: "",
    respiratory_rate: "",
    oxygen_saturation: "",
    weight: "",
    height: "",
    cardiovascular: "",
    respiratory: "",
    gastrointestinal: "",
    neurological: "",
    musculoskeletal: "",
    
    // Tab 3: Evolução
    evolution_notes: "",
    
    // Tab 4: Conduta
    diagnosis: "",
    icd_code: "",
    treatment_plan: "",
    prescriptions: "",
  });

  useEffect(() => {
    loadRecords();
    loadPatients();
  }, [page]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: page.toString(),
        size: "20",
      });

      const data = await apiClient.request<PaginatedResponse>(
        `/medical_records/list?${params.toString()}`
      );

      setRecords(data.items);
      setTotal(data.total);
      setTotalPages(data.pages);
    } catch (err: any) {
      console.error("Error loading records:", err);
      setError("Failed to load medical records. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const data = await apiClient.request<PaginatedResponse>("/patients/list?page=1&size=100");
      setPatients(data.items as any);
    } catch (err) {
      console.error("Error loading patients:", err);
    }
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // Build comprehensive record data
      const recordData = {
        patient_id: selectedPatient,
        appointment_id: formData.appointment_id || null,
        
        // Basic fields (current database schema)
        anamnesis: [
          formData.chief_complaint ? `Chief Complaint: ${formData.chief_complaint}` : "",
          formData.present_illness ? `Present Illness: ${formData.present_illness}` : "",
          formData.anamnesis,
          formData.past_medical_history ? `Past Medical History: ${formData.past_medical_history}` : "",
          formData.family_history ? `Family History: ${formData.family_history}` : "",
          formData.social_history ? `Social History: ${formData.social_history}` : "",
          formData.allergies ? `Allergies: ${formData.allergies}` : "",
          formData.current_medications ? `Current Medications: ${formData.current_medications}` : "",
        ].filter(Boolean).join("\n\n"),
        
        physical_exam: [
          formData.temperature ? `Temperature: ${formData.temperature}°C` : "",
          formData.bp_systolic && formData.bp_diastolic ? `BP: ${formData.bp_systolic}/${formData.bp_diastolic} mmHg` : "",
          formData.heart_rate ? `HR: ${formData.heart_rate} bpm` : "",
          formData.respiratory_rate ? `RR: ${formData.respiratory_rate} rpm` : "",
          formData.oxygen_saturation ? `SpO2: ${formData.oxygen_saturation}%` : "",
          formData.weight ? `Weight: ${formData.weight} kg` : "",
          formData.height ? `Height: ${formData.height} cm` : "",
          "\nSystem Review:",
          formData.cardiovascular ? `Cardiovascular: ${formData.cardiovascular}` : "",
          formData.respiratory ? `Respiratory: ${formData.respiratory}` : "",
          formData.gastrointestinal ? `Gastrointestinal: ${formData.gastrointestinal}` : "",
          formData.neurological ? `Neurological: ${formData.neurological}` : "",
          formData.musculoskeletal ? `Musculoskeletal: ${formData.musculoskeletal}` : "",
          formData.physical_exam,
        ].filter(Boolean).join("\n"),
        
        diagnosis: formData.diagnosis || null,
        icd_code: formData.icd_code || null,
        
        treatment_plan: [
          formData.treatment_plan,
          formData.prescriptions ? `Prescriptions:\n${formData.prescriptions}` : "",
          formData.evolution_notes ? `Evolution Notes:\n${formData.evolution_notes}` : "",
        ].filter(Boolean).join("\n\n"),
      };

      await apiClient.request("/medical_records", {
        method: "POST",
        body: JSON.stringify(recordData),
      });

      // Reset form
      resetForm();
      setShowCreateDialog(false);
      setSuccess("Medical record created successfully!");
      
      // Reload records
      await loadRecords();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("Error creating record:", err);
      setError(err.message || "Failed to create medical record. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      appointment_id: "",
      chief_complaint: "",
      present_illness: "",
      anamnesis: "",
      past_medical_history: "",
      family_history: "",
      social_history: "",
      allergies: "",
      current_medications: "",
      physical_exam: "",
      temperature: "",
      bp_systolic: "",
      bp_diastolic: "",
      heart_rate: "",
      respiratory_rate: "",
      oxygen_saturation: "",
      weight: "",
      height: "",
      cardiovascular: "",
      respiratory: "",
      gastrointestinal: "",
      neurological: "",
      musculoskeletal: "",
      evolution_notes: "",
      diagnosis: "",
      icd_code: "",
      treatment_plan: "",
      prescriptions: "",
    });
    setSelectedPatient("");
    setActiveTab("historia");
  };

  const handleViewRecord = async (record: MedicalRecord) => {
    setSelectedRecord(record);
    setShowViewDialog(true);
    
    // Load files for this record
    try {
      const filesData = await apiClient.request<{ files: any[]; total: number }>(
        `/medical_records/${record.id}/files`
      );
      setRecordFiles(filesData.files);
    } catch (err) {
      console.error("Error loading files:", err);
      setRecordFiles([]);
    }
  };

  // Removed edit functionality - this is now read-only

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRecord) return;
    
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // Build update data (same structure as create)
      const recordData = {
        patient_id: selectedPatient,
        appointment_id: formData.appointment_id || null,
        
        anamnesis: [
          formData.chief_complaint ? `Chief Complaint: ${formData.chief_complaint}` : "",
          formData.present_illness ? `Present Illness: ${formData.present_illness}` : "",
          formData.anamnesis,
          formData.past_medical_history ? `Past Medical History: ${formData.past_medical_history}` : "",
          formData.family_history ? `Family History: ${formData.family_history}` : "",
          formData.social_history ? `Social History: ${formData.social_history}` : "",
          formData.allergies ? `Allergies: ${formData.allergies}` : "",
          formData.current_medications ? `Current Medications: ${formData.current_medications}` : "",
        ].filter(Boolean).join("\n\n"),
        
        physical_exam: [
          formData.temperature ? `Temperature: ${formData.temperature}°C` : "",
          formData.bp_systolic && formData.bp_diastolic ? `BP: ${formData.bp_systolic}/${formData.bp_diastolic} mmHg` : "",
          formData.heart_rate ? `HR: ${formData.heart_rate} bpm` : "",
          formData.respiratory_rate ? `RR: ${formData.respiratory_rate} rpm` : "",
          formData.oxygen_saturation ? `SpO2: ${formData.oxygen_saturation}%` : "",
          formData.weight ? `Weight: ${formData.weight} kg` : "",
          formData.height ? `Height: ${formData.height} cm` : "",
          "\nSystem Review:",
          formData.cardiovascular ? `Cardiovascular: ${formData.cardiovascular}` : "",
          formData.respiratory ? `Respiratory: ${formData.respiratory}` : "",
          formData.gastrointestinal ? `Gastrointestinal: ${formData.gastrointestinal}` : "",
          formData.neurological ? `Neurological: ${formData.neurological}` : "",
          formData.musculoskeletal ? `Musculoskeletal: ${formData.musculoskeletal}` : "",
          formData.physical_exam,
        ].filter(Boolean).join("\n"),
        
        diagnosis: formData.diagnosis || null,
        icd_code: formData.icd_code || null,
        
        treatment_plan: [
          formData.treatment_plan,
          formData.prescriptions ? `Prescriptions:\n${formData.prescriptions}` : "",
          formData.evolution_notes ? `Evolution Notes:\n${formData.evolution_notes}` : "",
        ].filter(Boolean).join("\n\n"),
      };

      await apiClient.request(`/medical_records/${selectedRecord.id}`, {
        method: "PUT",
        body: JSON.stringify(recordData),
      });

      resetForm();
      setShowEditDialog(false);
      setSuccess("Prontuário atualizado com sucesso!");
      
      await loadRecords();
      
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      console.error("Error updating record:", err);
      setError(err.message || "Falha ao atualizar prontuário. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setShowDeleteDialog(true);
  };

  const handleDeleteRecord = async () => {
    if (!selectedRecord) return;
    
    try {
      setDeleting(true);
      setError("");

      await apiClient.request(`/medical_records/${selectedRecord.id}`, {
        method: "DELETE",
      });

      setShowDeleteDialog(false);
      setSelectedRecord(null);
      setSuccess("Prontuário excluído com sucesso!");
      
      await loadRecords();
      
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      console.error("Error deleting record:", err);
      setError(err.message || "Falha ao excluir prontuário. Tente novamente.");
    } finally {
      setDeleting(false);
    }
  };

  const handleLockRecord = async (record: MedicalRecord) => {
    if (record.is_locked) {
      setError("Record is already locked");
      return;
    }

    try {
      setLocking(true);
      setError("");

      await apiClient.request(`/medical_records/${record.id}/lock`, {
        method: "POST",
        body: JSON.stringify({
          reason: "Record finalized by doctor"
        }),
      });

      setSuccess("Prontuário bloqueado com sucesso!");
      await loadRecords();
      
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      console.error("Error locking record:", err);
      setError(err.message || "Falha ao bloquear prontuário.");
    } finally {
      setLocking(false);
    }
  };

  const handleFileUpload = async (recordId: string, file: File) => {
    try {
      setUploadingFile(true);
      setError("");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("description", `Attachment for medical record`);

      const response = await fetch(
        `https://prontivus-backend-wnw2.onrender.com/api/v1/medical_records/${recordId}/files`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      setSuccess("File uploaded successfully!");
      
      // Reload files
      const filesData = await apiClient.request<{ files: any[]; total: number }>(
        `/medical_records/${recordId}/files`
      );
      setRecordFiles(filesData.files);
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("Error uploading file:", err);
      setError(err.message || "Failed to upload file.");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteFile = async (recordId: string, fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) {
      return;
    }

    try {
      await apiClient.request(`/medical_records/${recordId}/files/${fileId}`, {
        method: "DELETE",
      });

      setSuccess("File deleted successfully!");
      
      // Reload files
      const filesData = await apiClient.request<{ files: any[]; total: number }>(
        `/medical_records/${recordId}/files`
      );
      setRecordFiles(filesData.files);
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("Error deleting file:", err);
      setError(err.message || "Failed to delete file.");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading medical records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Prontuário Médico</h1>
          <p className="text-muted-foreground">
            {total > 0 ? `Visualizar ${total.toLocaleString()} registros médicos` : "Visualizar registros médicos (somente leitura)"}
          </p>
        </div>
        {/* New Record button removed - this is now read-only */}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription className="text-green-600">{success}</AlertDescription>
        </Alert>
      )}

      {/* Records List */}
      {records.length > 0 ? (
        <>
          <div className="space-y-3">
            {records.map((record) => (
              <Card key={record.id} className="shadow-card hover:shadow-medical transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">
                            {record.patient_name || `Patient #${record.patient_id.slice(0, 8)}`}
                          </h3>
                          {record.diagnosis && (
                            <Badge variant="outline" className="text-xs">
                              {record.diagnosis}
                            </Badge>
                          )}
                          {record.is_locked && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Lock className="h-3 w-3" />
                              Locked
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>Dr: {record.doctor_name || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(record.created_at)}</span>
                          </div>
                          {record.icd_code && (
                            <div className="flex items-center gap-2">
                              <Stethoscope className="h-4 w-4" />
                              <span>ICD: {record.icd_code}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewRecord(record)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!record.is_locked && (
                        <>
                          {/* Edit button removed - this is now read-only */}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteClick(record)}
                            title="Delete Record"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleLockRecord(record)}
                            title="Finalize & Lock Record"
                            className="text-orange-600 hover:text-orange-700"
                            disabled={locking}
                          >
                            <Lock className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {record.is_locked && (
                        <span className="text-xs text-muted-foreground ml-2">
                          (Locked - cannot modify)
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing page {page} of {totalPages} ({total.toLocaleString()} total records)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum registro médico encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Visualize os registros médicos dos pacientes aqui
            </p>
            {/* New Record button removed - this is now read-only */}
          </CardContent>
        </Card>
      )}

      {/* Create Medical Record Dialog with Tabs */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Medical Record - Advanced</DialogTitle>
            <DialogDescription>
              Complete medical record with structured tabs (História, Exame, Evolução, Conduta)
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateRecord}>
            {/* Patient Selection */}
            <div className="mb-4">
              <Label htmlFor="patient">Patient *</Label>
              <Select value={selectedPatient} onValueChange={setSelectedPatient} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name} {patient.cpf && `(CPF: ${patient.cpf})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tabbed Interface */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="historia">História Clínica</TabsTrigger>
                <TabsTrigger value="exame">Exame Físico</TabsTrigger>
                <TabsTrigger value="evolucao">Evolução</TabsTrigger>
                <TabsTrigger value="conduta">Conduta</TabsTrigger>
              </TabsList>

              {/* Tab 1: História Clínica (Clinical History) */}
              <TabsContent value="historia" className="space-y-4 mt-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="chief_complaint">Chief Complaint (Queixa Principal)</Label>
                    <Input
                      id="chief_complaint"
                      placeholder="Patient's main complaint..."
                      value={formData.chief_complaint}
                      onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="present_illness">Present Illness (História da Doença Atual)</Label>
                    <Textarea
                      id="present_illness"
                      placeholder="Duration, progression, associated symptoms..."
                      value={formData.present_illness}
                      onChange={(e) => setFormData({ ...formData, present_illness: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="anamnesis">Additional Anamnesis</Label>
                    <Textarea
                      id="anamnesis"
                      placeholder="Additional patient history..."
                      value={formData.anamnesis}
                      onChange={(e) => setFormData({ ...formData, anamnesis: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="past_medical_history">Past Medical History</Label>
                      <Textarea
                        id="past_medical_history"
                        placeholder="Previous conditions, surgeries..."
                        value={formData.past_medical_history}
                        onChange={(e) => setFormData({ ...formData, past_medical_history: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="family_history">Family History</Label>
                      <Textarea
                        id="family_history"
                        placeholder="Family medical conditions..."
                        value={formData.family_history}
                        onChange={(e) => setFormData({ ...formData, family_history: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="social_history">Social History</Label>
                    <Textarea
                      id="social_history"
                      placeholder="Smoking, alcohol, occupation, lifestyle..."
                      value={formData.social_history}
                      onChange={(e) => setFormData({ ...formData, social_history: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="allergies">Allergies</Label>
                      <Input
                        id="allergies"
                        placeholder="Drug allergies, food allergies..."
                        value={formData.allergies}
                        onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="current_medications">Current Medications</Label>
                      <Input
                        id="current_medications"
                        placeholder="Current medications..."
                        value={formData.current_medications}
                        onChange={(e) => setFormData({ ...formData, current_medications: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Exame Físico (Physical Examination) */}
              <TabsContent value="exame" className="space-y-4 mt-4">
                <div className="grid gap-4">
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Vital Signs</Label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="temperature">Temperature (°C)</Label>
                        <Input
                          id="temperature"
                          type="number"
                          step="0.1"
                          placeholder="36.5"
                          value={formData.temperature}
                          onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="bp_systolic">BP Systolic</Label>
                        <Input
                          id="bp_systolic"
                          type="number"
                          placeholder="120"
                          value={formData.bp_systolic}
                          onChange={(e) => setFormData({ ...formData, bp_systolic: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="bp_diastolic">BP Diastolic</Label>
                        <Input
                          id="bp_diastolic"
                          type="number"
                          placeholder="80"
                          value={formData.bp_diastolic}
                          onChange={(e) => setFormData({ ...formData, bp_diastolic: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 mt-4">
                      <div>
                        <Label htmlFor="heart_rate">Heart Rate (bpm)</Label>
                        <Input
                          id="heart_rate"
                          type="number"
                          placeholder="72"
                          value={formData.heart_rate}
                          onChange={(e) => setFormData({ ...formData, heart_rate: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="respiratory_rate">Resp. Rate (rpm)</Label>
                        <Input
                          id="respiratory_rate"
                          type="number"
                          placeholder="16"
                          value={formData.respiratory_rate}
                          onChange={(e) => setFormData({ ...formData, respiratory_rate: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="oxygen_saturation">SpO2 (%)</Label>
                        <Input
                          id="oxygen_saturation"
                          type="number"
                          placeholder="98"
                          value={formData.oxygen_saturation}
                          onChange={(e) => setFormData({ ...formData, oxygen_saturation: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="weight">Weight (kg)</Label>
                        <Input
                          id="weight"
                          type="number"
                          step="0.1"
                          placeholder="70.5"
                          value={formData.weight}
                          onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-semibold mb-3 block">System Review</Label>
                    <div className="grid gap-3">
                      <div>
                        <Label htmlFor="cardiovascular">Cardiovascular</Label>
                        <Input
                          id="cardiovascular"
                          placeholder="Heart sounds, rhythm, murmurs..."
                          value={formData.cardiovascular}
                          onChange={(e) => setFormData({ ...formData, cardiovascular: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="respiratory">Respiratory</Label>
                        <Input
                          id="respiratory"
                          placeholder="Lung sounds, breathing pattern..."
                          value={formData.respiratory}
                          onChange={(e) => setFormData({ ...formData, respiratory: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="gastrointestinal">Gastrointestinal</Label>
                          <Input
                            id="gastrointestinal"
                            placeholder="Abdomen findings..."
                            value={formData.gastrointestinal}
                            onChange={(e) => setFormData({ ...formData, gastrointestinal: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="neurological">Neurological</Label>
                          <Input
                            id="neurological"
                            placeholder="Consciousness, reflexes..."
                            value={formData.neurological}
                            onChange={(e) => setFormData({ ...formData, neurological: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="physical_exam">Additional Physical Findings</Label>
                    <Textarea
                      id="physical_exam"
                      placeholder="Additional physical examination findings..."
                      value={formData.physical_exam}
                      onChange={(e) => setFormData({ ...formData, physical_exam: e.target.value })}
                      rows={4}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Tab 3: Evolução (Evolution) */}
              <TabsContent value="evolucao" className="space-y-4 mt-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="evolution_notes">Progress Notes (Evolução)</Label>
                    <Textarea
                      id="evolution_notes"
                      placeholder="Patient progress, response to treatment, changes in condition..."
                      value={formData.evolution_notes}
                      onChange={(e) => setFormData({ ...formData, evolution_notes: e.target.value })}
                      rows={10}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Document patient progress, treatment response, and any changes
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 4: Conduta (Conduct/Management Plan) */}
              <TabsContent value="conduta" className="space-y-4 mt-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="diagnosis">Diagnosis</Label>
                    <Textarea
                      id="diagnosis"
                      placeholder="Medical diagnosis..."
                      value={formData.diagnosis}
                      onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="icd_code">ICD Code (CID-10)</Label>
                    <CID10Autocomplete
                      value={formData.icd_code}
                      onChange={(code, description) => {
                        setFormData({ 
                          ...formData, 
                          icd_code: code,
                          diagnosis: formData.diagnosis || description
                        });
                      }}
                      placeholder="Search CID-10 code (e.g., J06.9 or 'sinusite')..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      ✅ CID-10 autocomplete with 80+ common codes
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="treatment_plan">Treatment Plan (Conduta)</Label>
                    <Textarea
                      id="treatment_plan"
                      placeholder="Treatment plan, procedures, follow-up instructions..."
                      value={formData.treatment_plan}
                      onChange={(e) => setFormData({ ...formData, treatment_plan: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="prescriptions">Prescriptions</Label>
                    <Textarea
                      id="prescriptions"
                      placeholder="Medications prescribed (separate prescription module in Phase C)..."
                      value={formData.prescriptions}
                      onChange={(e) => setFormData({ ...formData, prescriptions: e.target.value })}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Full digital prescription module coming in Phase C
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  resetForm();
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !selectedPatient}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Record"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog - Simplified for now */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Medical Record Details</DialogTitle>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-sm font-semibold">Patient</Label>
                <p className="mt-1">{selectedRecord.patient_name}</p>
              </div>

              {selectedRecord.anamnesis && (
                <div>
                  <Label className="text-sm font-semibold">Anamnesis</Label>
                  <p className="mt-2 text-sm whitespace-pre-wrap">{selectedRecord.anamnesis}</p>
                </div>
              )}

              {selectedRecord.physical_exam && (
                <div>
                  <Label className="text-sm font-semibold">Physical Examination</Label>
                  <p className="mt-2 text-sm whitespace-pre-wrap">{selectedRecord.physical_exam}</p>
                </div>
              )}

              {selectedRecord.diagnosis && (
                <div>
                  <Label className="text-sm font-semibold">Diagnosis</Label>
                  <p className="mt-2 text-sm">{selectedRecord.diagnosis}</p>
                </div>
              )}

              {selectedRecord.treatment_plan && (
                <div>
                  <Label className="text-sm font-semibold">Treatment Plan</Label>
                  <p className="mt-2 text-sm whitespace-pre-wrap">{selectedRecord.treatment_plan}</p>
                </div>
              )}

              {/* File Attachments Section */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Attached Files ({recordFiles.length})
                  </Label>
                  {!selectedRecord.is_locked && (
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                        <Upload className="h-4 w-4" />
                        Upload File
                      </div>
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        accept=".jpg,.jpeg,.png,.gif,.pdf,.dcm"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && selectedRecord) {
                            handleFileUpload(selectedRecord.id, file);
                            e.target.value = ""; // Reset input
                          }
                        }}
                        disabled={uploadingFile}
                      />
                    </label>
                  )}
                </div>

                {uploadingFile && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-md mb-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Uploading file...</span>
                  </div>
                )}

                {recordFiles.length > 0 ? (
                  <div className="space-y-2">
                    {recordFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.filename}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.file_size / 1024).toFixed(1)} KB • {new Date(file.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`https://prontivus-backend-wnw2.onrender.com${file.url}`, '_blank')}
                            title="View/Download"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!selectedRecord.is_locked && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteFile(selectedRecord.id, file.id)}
                              className="text-destructive hover:text-destructive"
                              title="Delete"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No files attached. Upload exam results, images, or PDFs.
                  </p>
                )}

                <p className="text-xs text-muted-foreground mt-2">
                  Supported: JPG, PNG, GIF, PDF, DICOM • Max 10MB
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowViewDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog removed - this is now read-only */}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este prontuário? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="py-4">
              <p className="text-sm">
                <strong>Paciente:</strong> {selectedRecord.patient_name}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Data:</strong> {formatDate(selectedRecord.created_at)}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedRecord(null);
              }}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRecord}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir Prontuário"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
