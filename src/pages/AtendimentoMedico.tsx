/**
 * Atendimento Médico - Complete Consultation Module
 * Integrated consultation screen with patient queue, vitals, quick actions, attachments
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  User, Clock, Phone, Calendar, Heart, Activity, Thermometer, Weight,
  FileText, Pill, ClipboardList, Send, Upload, Download, Save, 
  CheckCircle, AlertCircle, History, Image as ImageIcon, Mic, StopCircle,
  Plus, X, Loader2, ArrowLeft, Bell, Shield, ChevronDown, ChevronUp
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { CID10Autocomplete } from "@/components/CID10Autocomplete";

// Quick Action Modals
import PrescriptionModal from "@/components/Consultation/PrescriptionModal";
import CertificateModal from "@/components/Consultation/CertificateModal";
import ExamRequestModal from "@/components/Consultation/ExamRequestModal";
import ReferralModal from "@/components/Consultation/ReferralModal";

interface Patient {
  id: string;
  name: string;
  age: number;
  cpf: string;
  phone: string;
  insurance_provider: string;
  last_consultation: string;
  allergies: string[];
  chronic_conditions: string[];
}

interface QueuePatient {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_age: number;
  appointment_time: string;
  status: "waiting" | "in_progress" | "completed";
  priority: number;
}

interface Vitals {
  blood_pressure: string;
  heart_rate: string;
  temperature: string;
  weight: string;
}

interface ConsultationNotes {
  anamnese: string;
  physical_exam: string;
  evolution: string;
  diagnosis: string;
  treatment_plan: string;
}

interface Attachment {
  id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  uploaded_at: string;
}

export default function AtendimentoMedico() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [queue, setQueue] = useState<QueuePatient[]>([]);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [vitals, setVitals] = useState<Vitals>({
    blood_pressure: "",
    heart_rate: "",
    temperature: "",
    weight: ""
  });
  const [notes, setNotes] = useState<ConsultationNotes>({
    anamnese: "",
    physical_exam: "",
    evolution: "",
    diagnosis: "",
    treatment_plan: ""
  });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [activeTab, setActiveTab] = useState("anamnese");
  
  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    anamnese: true,
    exame: false,
    evolucao: false,
    diagnostico: false,
    conduta: false,
    prescricao: false,
    tiss: false
  });
  
  // Quick Action Modals
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  
  // Voice Recording
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  
  // Past consultations
  const [pastConsultations, setPastConsultations] = useState<any[]>([]);

  // Load queue on mount
  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  // Check if patient_id in URL
  useEffect(() => {
    const patientId = searchParams.get("patient_id");
    if (patientId) {
      loadPatientConsultation(patientId);
    }
  }, [searchParams]);

  // Auto-save notes every 15 seconds
  useEffect(() => {
    if (!consultationId) return;
    
    const autoSaveInterval = setInterval(() => {
      saveConsultationNotes(true);
    }, 15000);
    
    return () => clearInterval(autoSaveInterval);
  }, [consultationId, notes]);

  const loadQueue = async () => {
    try {
      const response = await apiClient.request<QueuePatient[]>("/consultation-management/queue");
      const queueData = Array.isArray(response) ? response : [];
      setQueue(queueData);
    } catch (error) {
      console.error("Error loading queue:", error);
      setQueue([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientConsultation = async (patientId: string) => {
    try {
      setLoading(true);
      
      // Load patient data
      const patientResponse = await apiClient.request<any>(`/patients/${patientId}`);
      setCurrentPatient({
        id: patientResponse.id,
        name: patientResponse.name,
        age: calculateAge(patientResponse.birthdate),
        cpf: patientResponse.cpf,
        phone: patientResponse.phone,
        insurance_provider: patientResponse.insurance_provider || "Particular",
        last_consultation: patientResponse.last_consultation || "Primeira consulta",
        allergies: patientResponse.allergies ? patientResponse.allergies.split(",") : [],
        chronic_conditions: patientResponse.chronic_conditions ? patientResponse.chronic_conditions.split(",") : []
      });
      
      // Get or create consultation
      let consultationResponse = await apiClient.request<any>(`/consultations?patient_id=${patientId}`);
      
      let consultation;
      if (Array.isArray(consultationResponse) && consultationResponse.length > 0) {
        // Use existing consultation
        consultation = consultationResponse[0];
      } else {
        // Create new consultation if none exists
        consultation = await apiClient.request<any>("/consultations", {
          method: "POST",
          body: JSON.stringify({
            patient_id: patientId,
            chief_complaint: "Consulta em andamento",
            diagnosis: "A ser determinado"
          })
        });
      }
      
      setConsultationId(consultation.id);
        
        // Load vitals
        try {
          const vitalsResponse = await apiClient.request<any>(`/consultation-management/vitals/${consultation.id}`);
          if (vitalsResponse) {
            setVitals({
              blood_pressure: vitalsResponse.blood_pressure || "",
              heart_rate: vitalsResponse.heart_rate || "",
              temperature: vitalsResponse.temperature || "",
              weight: vitalsResponse.weight || ""
            });
          }
        } catch (e) {
          console.log("No vitals found");
        }
        
        // Load notes
        try {
          const notesResponse = await apiClient.request<any>(`/consultation-management/notes/${consultation.id}`);
          if (notesResponse) {
            setNotes({
              anamnese: notesResponse.anamnese || "",
              physical_exam: notesResponse.physical_exam || "",
              evolution: notesResponse.evolution || "",
              diagnosis: notesResponse.diagnosis || "",
              treatment_plan: notesResponse.treatment_plan || ""
            });
          }
        } catch (e) {
          console.log("No notes found");
        }
        
        // Load attachments
        try {
          const attachmentsResponse = await apiClient.request<Attachment[]>(`/consultation-management/attachments/${consultation.id}`);
          setAttachments(Array.isArray(attachmentsResponse) ? attachmentsResponse : []);
        } catch (e) {
          console.log("No attachments found");
          setAttachments([]);
        }
    } catch (error) {
      console.error("Error loading patient consultation:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados do paciente",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const callPatient = async (patientId: string) => {
    try {
      await apiClient.request(`/consultation-management/queue/call/${patientId}`, {
        method: "POST"
      });
      
      // Play alert sound (optional - silently fail if not available)
      try {
        const audio = new Audio("/sounds/notification.mp3");
        await audio.play();
      } catch (audioError) {
        // Audio not available or autoplay blocked - that's okay
        console.log("Audio notification not played (file missing or blocked)");
      }
      
      // Load patient consultation
      await loadPatientConsultation(patientId);
      await loadQueue();
      
      toast({
        title: "Paciente chamado",
        description: "O paciente foi notificado na recepção"
      });
    } catch (error) {
      console.error("Error calling patient:", error);
      toast({
        title: "Erro",
        description: "Falha ao chamar paciente",
        variant: "destructive"
      });
    }
  };

  const saveVitals = async () => {
    if (!consultationId || !currentPatient) return;
    
    try {
      setSaving(true);
      await apiClient.request("/consultation-management/vitals", {
        method: "POST",
        body: JSON.stringify({
          consultation_id: consultationId,
          patient_id: currentPatient.id,
          ...vitals
        })
      });
      
      toast({
        title: "Sinais vitais salvos",
        description: "Os dados foram atualizados com sucesso"
      });
    } catch (error) {
      console.error("Error saving vitals:", error);
      toast({
        title: "Erro",
        description: "Falha ao salvar sinais vitais",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const saveConsultationNotes = async (isAutoSave = false) => {
    if (!consultationId) return;
    
    try {
      if (!isAutoSave) setSaving(true);
      
      await apiClient.request(`/consultation-management/notes/${consultationId}`, {
        method: "POST",
        body: JSON.stringify(notes)
      });
      
      if (!isAutoSave) {
        toast({
          title: "Notas salvas",
          description: "As anotações foram atualizadas"
        });
      }
    } catch (error) {
      console.error("Error saving notes:", error);
      if (!isAutoSave) {
        toast({
          title: "Erro",
          description: "Falha ao salvar notas",
          variant: "destructive"
        });
      }
    } finally {
      if (!isAutoSave) setSaving(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !consultationId || !currentPatient) return;
    
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("consultation_id", consultationId);
    formData.append("patient_id", currentPatient.id);
    formData.append("category", "exam");
    
    try {
      setSaving(true);
      const response = await apiClient.request<Attachment>("/consultation-management/attachments/upload", {
        method: "POST",
        body: formData,
        headers: {} // Let browser set Content-Type for FormData
      });
      
      setAttachments([...attachments, response]);
      
      toast({
        title: "Arquivo enviado",
        description: "O documento foi anexado à consulta"
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Erro",
        description: "Falha ao enviar arquivo",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        await uploadVoiceNote(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Erro",
        description: "Falha ao iniciar gravação",
        variant: "destructive"
      });
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const uploadVoiceNote = async (audioBlob: Blob) => {
    if (!consultationId) return;
    
    const formData = new FormData();
    formData.append("audio_file", audioBlob, "recording.wav");
    formData.append("consultation_id", consultationId);
    formData.append("note_type", activeTab);
    
    try {
      await apiClient.request("/consultation-management/voice-notes/upload", {
        method: "POST",
        body: formData,
        headers: {}
      });
      
      toast({
        title: "Nota de voz enviada",
        description: "A transcrição será processada em breve"
      });
    } catch (error) {
      console.error("Error uploading voice note:", error);
      toast({
        title: "Erro",
        description: "Falha ao enviar nota de voz",
        variant: "destructive"
      });
    }
  };

  const finalizeConsultation = async () => {
    if (!consultationId) return;
    
    try {
      setSaving(true);
      
      // Save final notes
      await saveConsultationNotes();
      
      // Finalize consultation
      await apiClient.request(`/consultation-management/queue/finalize/${consultationId}`, {
        method: "POST"
      });
      
      toast({
        title: "Atendimento finalizado",
        description: "O paciente foi marcado como atendido"
      });
      
      // Clear current patient and reload queue
      setCurrentPatient(null);
      setConsultationId(null);
      await loadQueue();
      
      // Navigate back to queue
      navigate("/app/atendimento");
    } catch (error) {
      console.error("Error finalizing consultation:", error);
      toast({
        title: "Erro",
        description: "Falha ao finalizar atendimento",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const loadPatientHistory = async () => {
    if (!currentPatient) return;
    
    try {
      const history = await apiClient.request<any[]>(`/consultations?patient_id=${currentPatient.id}`);
      setPastConsultations(Array.isArray(history) ? history : []);
      setShowHistoryModal(true);
    } catch (error) {
      console.error("Error loading history:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar histórico",
        variant: "destructive"
      });
    }
  };

  const reopenConsultation = async (consultationId: string) => {
    try {
      // Load the past consultation
      const consultation = await apiClient.request<any>(`/consultations/${consultationId}`);
      
      setConsultationId(consultation.id);
      
      // Load all data for this consultation
      const vitalsResponse = await apiClient.request<any>(`/consultation-management/vitals/${consultation.id}`);
      if (vitalsResponse) {
        setVitals({
          blood_pressure: vitalsResponse.blood_pressure || "",
          heart_rate: vitalsResponse.heart_rate || "",
          temperature: vitalsResponse.temperature || "",
          weight: vitalsResponse.weight || ""
        });
      }
      
      const notesResponse = await apiClient.request<any>(`/consultation-management/notes/${consultation.id}`);
      if (notesResponse) {
        setNotes({
          anamnese: notesResponse.anamnese || "",
          physical_exam: notesResponse.physical_exam || "",
          evolution: notesResponse.evolution || "",
          diagnosis: notesResponse.diagnosis || "",
          treatment_plan: notesResponse.treatment_plan || ""
        });
      }
      
      const attachmentsResponse = await apiClient.request<Attachment[]>(`/consultation-management/attachments/${consultation.id}`);
      setAttachments(Array.isArray(attachmentsResponse) ? attachmentsResponse : []);
      
      setShowHistoryModal(false);
      
      toast({
        title: "Consulta reaberta",
        description: "Você pode editar os dados desta consulta"
      });
    } catch (error) {
      console.error("Error reopening consultation:", error);
      toast({
        title: "Erro",
        description: "Falha ao reabrir consulta",
        variant: "destructive"
      });
    }
  };

  const calculateAge = (birthdate: string): number => {
    if (!birthdate) return 0;
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Queue View (no patient selected)
  if (!currentPatient) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Fila de Atendimento</h1>
            <p className="text-muted-foreground">Pacientes aguardando atendimento</p>
          </div>
          <Button variant="outline" onClick={loadQueue}>
            <Activity className="h-4 w-4 mr-2" />
            Atualizar Fila
          </Button>
        </div>

        <div className="grid gap-4">
          {queue.filter(p => p.status === "waiting").map((patient, index) => (
            <Card key={patient.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-lg">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{patient.patient_name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {patient.patient_age} anos
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(patient.appointment_time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {patient.priority > 0 && (
                      <Badge variant="destructive">Urgente</Badge>
                    )}
                    <Badge variant="secondary">{patient.status === "waiting" ? "Aguardando" : "Em atendimento"}</Badge>
                    <Button onClick={() => callPatient(patient.patient_id)}>
                      <Bell className="h-4 w-4 mr-2" />
                      Chamar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {queue.filter(p => p.status === "waiting").length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum paciente na fila</h3>
                <p className="text-muted-foreground">Todos os pacientes foram atendidos</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Completed Patients */}
        {queue.filter(p => p.status === "completed").length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Atendidos Hoje</h2>
            <div className="grid gap-2">
              {queue.filter(p => p.status === "completed").map((patient) => (
                <Card key={patient.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{patient.patient_name}</span>
                        <span className="text-sm text-muted-foreground ml-4">
                          {new Date(patient.appointment_time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Atendido
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            // Find consultation for this appointment
                            try {
                              const consultations = await apiClient.request<any[]>(`/consultations?appointment_id=${patient.appointment_id}`);
                              if (consultations && consultations.length > 0) {
                                await reopenConsultation(consultations[0].id);
                              }
                            } catch (error) {
                              console.error("Error finding consultation:", error);
                            }
                          }}
                        >
                          <History className="h-4 w-4 mr-1" />
                          Reabrir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Consultation View (patient selected)
  return (
    <div className="h-screen flex flex-col">
      {/* Header with Patient Info */}
      <div className="border-b bg-card">
        <div className="container mx-auto p-6">
          <div className="flex items-start justify-between mb-4">
            <Button variant="ghost" onClick={() => {
              setCurrentPatient(null);
              setConsultationId(null);
              navigate("/app/atendimento");
            }}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Fila
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => saveConsultationNotes()}>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
              <Button onClick={finalizeConsultation} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Finalizar Atendimento
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <h1 className="text-2xl font-bold mb-2">{currentPatient.name}</h1>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {currentPatient.age} anos
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  CPF: {currentPatient.cpf}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {currentPatient.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  {currentPatient.insurance_provider}
                </span>
              </div>
              
              <div className="flex gap-2 mt-3">
                {currentPatient.allergies.length > 0 && (
                  <div className="flex gap-1">
                    <span className="text-xs font-medium">Alergias:</span>
                    {currentPatient.allergies.map((allergy, i) => (
                      <Badge key={i} variant="destructive" className="text-xs">{allergy}</Badge>
                    ))}
                  </div>
                )}
                {currentPatient.chronic_conditions.length > 0 && (
                  <div className="flex gap-1">
                    <span className="text-xs font-medium">Condições:</span>
                    {currentPatient.chronic_conditions.map((condition, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{condition}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadPatientHistory}>
                <History className="h-4 w-4 mr-2" />
                Histórico
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowPhotosModal(true)}>
                <ImageIcon className="h-4 w-4 mr-2" />
                Fotos
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto p-6 h-full">
          <div className="grid grid-cols-3 gap-6 h-full">
            {/* Left Column - Consultation Content */}
            <div className="col-span-2 space-y-6">
              {/* Vitals */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sinais Vitais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs">Pressão</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="120/80"
                          value={vitals.blood_pressure}
                          onChange={(e) => setVitals({ ...vitals, blood_pressure: e.target.value })}
                          className="h-9"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Frequência</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Heart className="h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="72 bpm"
                          value={vitals.heart_rate}
                          onChange={(e) => setVitals({ ...vitals, heart_rate: e.target.value })}
                          className="h-9"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Temperatura</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Thermometer className="h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="36.5°C"
                          value={vitals.temperature}
                          onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                          className="h-9"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Peso</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Weight className="h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="70 kg"
                          value={vitals.weight}
                          onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                          className="h-9"
                        />
                      </div>
                    </div>
                  </div>
                  <Button size="sm" className="mt-4" onClick={saveVitals} disabled={saving}>
                    <Save className="h-3 w-3 mr-2" />
                    Salvar Sinais Vitais
                  </Button>
                </CardContent>
              </Card>

              {/* Consultation Sections - Simplified Scrollable View */}
              <Card className="flex-1">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Consulta Atual</CardTitle>
                    <div className="flex gap-2">
                      {!isRecording ? (
                        <Button size="sm" variant="outline" onClick={startVoiceRecording}>
                          <Mic className="h-4 w-4 mr-2" />
                          Gravar Nota
                        </Button>
                      ) : (
                        <Button size="sm" variant="destructive" onClick={stopVoiceRecording}>
                          <StopCircle className="h-4 w-4 mr-2" />
                          Parar Gravação
                        </Button>
                      )}
                      <Button size="sm" onClick={() => saveConsultationNotes()} disabled={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Tudo
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-4 pr-4">
                      
                      {/* Anamnese Section */}
                      <Collapsible
                        open={openSections.anamnese}
                        onOpenChange={(open) => setOpenSections({ ...openSections, anamnese: open })}
                      >
                        <div className="border rounded-lg">
                          <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-accent transition-colors">
                            <h3 className="font-semibold text-lg">1. Anamnese</h3>
                            {openSections.anamnese ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="p-4 pt-0 space-y-3">
                              <div>
                                <Label className="text-sm font-medium">Queixa Principal e História da Doença Atual</Label>
                                <Textarea
                                  placeholder="Descreva a queixa principal e a história da doença atual..."
                                  value={notes.anamnese}
                                  onChange={(e) => setNotes({ ...notes, anamnese: e.target.value })}
                                  className="mt-2 min-h-[150px]"
                                />
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>

                      {/* Exame Físico Section */}
                      <Collapsible
                        open={openSections.exame}
                        onOpenChange={(open) => setOpenSections({ ...openSections, exame: open })}
                      >
                        <div className="border rounded-lg">
                          <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-accent transition-colors">
                            <h3 className="font-semibold text-lg">2. Exame Físico</h3>
                            {openSections.exame ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="p-4 pt-0 space-y-3">
                              <div>
                                <Label className="text-sm font-medium">Achados do Exame Físico</Label>
                                <Textarea
                                  placeholder="Descreva os achados do exame físico..."
                                  value={notes.physical_exam}
                                  onChange={(e) => setNotes({ ...notes, physical_exam: e.target.value })}
                                  className="mt-2 min-h-[150px]"
                                />
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>

                      {/* Evolução Section */}
                      <Collapsible
                        open={openSections.evolucao}
                        onOpenChange={(open) => setOpenSections({ ...openSections, evolucao: open })}
                      >
                        <div className="border rounded-lg">
                          <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-accent transition-colors">
                            <h3 className="font-semibold text-lg">3. Evolução e Observações</h3>
                            {openSections.evolucao ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="p-4 pt-0 space-y-3">
                              <div>
                                <Label className="text-sm font-medium">Evolução do Paciente</Label>
                                <Textarea
                                  placeholder="Descreva a evolução do paciente..."
                                  value={notes.evolution}
                                  onChange={(e) => setNotes({ ...notes, evolution: e.target.value })}
                                  className="mt-2 min-h-[150px]"
                                />
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>

                      {/* Diagnóstico Section */}
                      <Collapsible
                        open={openSections.diagnostico}
                        onOpenChange={(open) => setOpenSections({ ...openSections, diagnostico: open })}
                      >
                        <div className="border rounded-lg">
                          <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-accent transition-colors">
                            <h3 className="font-semibold text-lg">4. Diagnóstico</h3>
                            {openSections.diagnostico ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="p-4 pt-0 space-y-3">
                              <div>
                                <Label className="text-sm font-medium">CID-10</Label>
                                <CID10Autocomplete
                                  onSelect={(code, description) => {
                                    setNotes({ ...notes, diagnosis: `${code} - ${description}` });
                                  }}
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Diagnóstico Detalhado</Label>
                                <Textarea
                                  placeholder="Diagnóstico detalhado..."
                                  value={notes.diagnosis}
                                  onChange={(e) => setNotes({ ...notes, diagnosis: e.target.value })}
                                  className="mt-2 min-h-[120px]"
                                />
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>

                      {/* Conduta Section */}
                      <Collapsible
                        open={openSections.conduta}
                        onOpenChange={(open) => setOpenSections({ ...openSections, conduta: open })}
                      >
                        <div className="border rounded-lg">
                          <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-accent transition-colors">
                            <h3 className="font-semibold text-lg">5. Plano Terapêutico e Conduta</h3>
                            {openSections.conduta ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="p-4 pt-0 space-y-3">
                              <div>
                                <Label className="text-sm font-medium">Plano de Tratamento</Label>
                                <Textarea
                                  placeholder="Descreva o plano de tratamento..."
                                  value={notes.treatment_plan}
                                  onChange={(e) => setNotes({ ...notes, treatment_plan: e.target.value })}
                                  className="mt-2 min-h-[150px]"
                                />
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>

                      {/* Prescrição Section - Inline */}
                      <Collapsible
                        open={openSections.prescricao}
                        onOpenChange={(open) => setOpenSections({ ...openSections, prescricao: open })}
                      >
                        <div className="border rounded-lg border-blue-200 bg-blue-50/50">
                          <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-blue-100/50 transition-colors">
                            <div className="flex items-center gap-2">
                              <Pill className="h-5 w-5 text-blue-600" />
                              <h3 className="font-semibold text-lg">6. Prescrição</h3>
                            </div>
                            {openSections.prescricao ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="p-4 pt-0 bg-white">
                              <Button 
                                className="w-full" 
                                onClick={() => setShowPrescriptionModal(true)}
                              >
                                <Pill className="h-4 w-4 mr-2" />
                                Nova Receita
                              </Button>
                              <p className="text-sm text-muted-foreground mt-2 text-center">
                                Clique para criar uma receita médica completa
                              </p>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>

                      {/* TISS/SADT Section - Inline */}
                      <Collapsible
                        open={openSections.tiss}
                        onOpenChange={(open) => setOpenSections({ ...openSections, tiss: open })}
                      >
                        <div className="border rounded-lg border-purple-200 bg-purple-50/50">
                          <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-purple-100/50 transition-colors">
                            <div className="flex items-center gap-2">
                              <ClipboardList className="h-5 w-5 text-purple-600" />
                              <h3 className="font-semibold text-lg">7. Guias TISS / SADT</h3>
                            </div>
                            {openSections.tiss ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="p-4 pt-0 space-y-2 bg-white">
                              <Button 
                                className="w-full" 
                                variant="outline"
                                onClick={() => setShowExamModal(true)}
                              >
                                <ClipboardList className="h-4 w-4 mr-2" />
                                Gerar Guia SADT
                              </Button>
                              <Button 
                                className="w-full" 
                                variant="outline"
                                onClick={async () => {
                                  if (!consultationId) return;
                                  try {
                                    const response = await apiClient.request("/tiss/generate", {
                                      method: "POST",
                                      body: JSON.stringify({
                                        consultation_id: consultationId,
                                        guide_type: "consultation"
                                      })
                                    });
                                    toast({
                                      title: "Guia gerada",
                                      description: "Guia de consulta TISS criada com sucesso"
                                    });
                                  } catch (error) {
                                    console.error("Error generating TISS guide:", error);
                                    toast({
                                      title: "Erro",
                                      description: "Falha ao gerar guia TISS",
                                      variant: "destructive"
                                    });
                                  }
                                }}
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                Gerar Guia de Consulta TISS
                              </Button>
                              <p className="text-sm text-muted-foreground mt-2 text-center">
                                Gere guias para convênios e operadoras
                              </p>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>

                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Quick Actions & Attachments */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full justify-start" variant="outline" onClick={() => setShowPrescriptionModal(true)}>
                    <Pill className="h-4 w-4 mr-2" />
                    Nova Receita
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => setShowCertificateModal(true)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Atestado
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => setShowExamModal(true)}>
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Solicitar Exame
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => setShowReferralModal(true)}>
                    <Send className="h-4 w-4 mr-2" />
                    Encaminhamento
                  </Button>
                </CardContent>
              </Card>

              {/* Attachments */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Anexos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".pdf,.jpg,.jpeg,.png,.docx"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Clique ou arraste arquivos
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF, JPG, PNG, DOCX
                      </p>
                    </label>
                  </div>

                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{attachment.file_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(attachment.uploaded_at).toLocaleDateString("pt-BR")}
                              </p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => {
                              // Download file
                              const link = document.createElement('a');
                              link.href = attachment.file_url;
                              link.download = attachment.file_name;
                              link.click();
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Modals */}
      {showPrescriptionModal && consultationId && currentPatient && (
        <PrescriptionModal
          consultationId={consultationId}
          patientId={currentPatient.id}
          onClose={() => setShowPrescriptionModal(false)}
        />
      )}
      {showCertificateModal && consultationId && currentPatient && (
        <CertificateModal
          consultationId={consultationId}
          patientId={currentPatient.id}
          onClose={() => setShowCertificateModal(false)}
        />
      )}
      {showExamModal && consultationId && currentPatient && (
        <ExamRequestModal
          consultationId={consultationId}
          patientId={currentPatient.id}
          onClose={() => setShowExamModal(false)}
        />
      )}
      {showReferralModal && consultationId && currentPatient && (
        <ReferralModal
          consultationId={consultationId}
          patientId={currentPatient.id}
          onClose={() => setShowReferralModal(false)}
        />
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" aria-describedby="history-description">
            <DialogHeader>
              <DialogTitle>Histórico de Consultas - {currentPatient?.name}</DialogTitle>
              <p id="history-description" className="sr-only">Lista de consultas anteriores do paciente</p>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {pastConsultations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma consulta anterior encontrada</p>
              ) : (
                pastConsultations.map((consult) => (
                  <Card key={consult.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {new Date(consult.created_at).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric"
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            <strong>Diagnóstico:</strong> {consult.diagnosis || "Não registrado"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <strong>Queixa:</strong> {consult.chief_complaint || "Não registrado"}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => reopenConsultation(consult.id)}
                        >
                          <History className="h-4 w-4 mr-2" />
                          Reabrir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Photos Modal */}
      {showPhotosModal && (
        <Dialog open={showPhotosModal} onOpenChange={setShowPhotosModal}>
          <DialogContent className="max-w-4xl" aria-describedby="photos-description">
            <DialogHeader>
              <DialogTitle>Fotos do Paciente - {currentPatient?.name}</DialogTitle>
              <p id="photos-description" className="sr-only">Galeria de fotos e imagens do paciente</p>
            </DialogHeader>
            <div className="py-4">
              <div className="grid grid-cols-3 gap-4">
                {attachments.filter(a => a.file_type.startsWith('image/')).length === 0 ? (
                  <div className="col-span-3 text-center py-8 text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma foto disponível</p>
                    <p className="text-sm mt-2">Use a seção "Anexos" para fazer upload de imagens</p>
                  </div>
                ) : (
                  attachments
                    .filter(a => a.file_type.startsWith('image/'))
                    .map((photo) => (
                      <div key={photo.id} className="border rounded-lg overflow-hidden">
                        <img
                          src={photo.file_url}
                          alt={photo.file_name}
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-2">
                          <p className="text-xs font-medium truncate">{photo.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(photo.uploaded_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

