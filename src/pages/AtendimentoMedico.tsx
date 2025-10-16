/**
 * Atendimento Médico - Complete Consultation Module
 * Integrated consultation screen with patient queue, vitals, quick actions, attachments
 */

import { useState, useEffect, useCallback, useRef } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  User, Clock, Phone, Calendar, Heart, Activity, Thermometer, Weight,
  FileText, Pill, ClipboardList, Send, Upload, Download, Save, 
  CheckCircle, AlertCircle, History, Image as ImageIcon, Mic, StopCircle,
  Plus, X, Loader2, ArrowLeft, Bell, Shield, ChevronDown, ChevronUp, Video,
  Eye, Trash2, FileImage, File, Maximize2, Minimize2
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
  appointment_id?: string;
  status: "waiting" | "in_progress" | "completed";
  priority: number;
  insurance_provider?: string;
}

interface Vitals {
  blood_pressure: string;
  heart_rate: string;
  temperature: string;
  respiratory_rate: string;
  oxygen_saturation: string;
  weight: string;
  height: string;
  bmi: string;
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
    respiratory_rate: "",
    oxygen_saturation: "",
    weight: "",
    height: "",
    bmi: ""
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
  const [activeAppointmentId, setActiveAppointmentId] = useState<string | null>(null);
  const [isCallingPatientId, setIsCallingPatientId] = useState<string | null>(null);
  const [isReturningToQueue, setIsReturningToQueue] = useState(false);
  
  const ensureActiveAppointmentForPatient = useCallback(async (patientId: string) => {
    // If we already have it, nothing to do
    if (activeAppointmentId) return activeAppointmentId;
    try {
      // 1) Try to find from current queue
      try {
        const queueResponse = await apiClient.request<any[]>(`/consultation-management/queue`);
        const match = Array.isArray(queueResponse)
          ? queueResponse.find((q) => q.patient_id === patientId && q.appointment_id)
          : null;
        if (match?.appointment_id) {
          setActiveAppointmentId(match.appointment_id);
          return match.appointment_id as string;
        }
      } catch {}

      // 2) Fallback: fetch today's appointments for this patient (and current doctor, if available)
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const params = new URLSearchParams({ page: '1', size: '10', patient_id: patientId, date: dateStr });
      const appts = await apiClient.request<any>(`/appointments?${params.toString()}`);
      const apptList = Array.isArray(appts?.items) ? appts.items : Array.isArray(appts) ? appts : [];
      const first = apptList.find((a: any) => a.status === 'scheduled' || a.status === 'confirmed' || a.status === 'checked_in' || a.status === 'in_progress') || apptList[0];
      if (first?.id) {
        setActiveAppointmentId(first.id);
        return first.id as string;
      }
    } catch (e) {
      // swallow, handled by caller
    }
    return null;
  }, [activeAppointmentId]);

  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    anamnese: true,
    exame: true,
    evolucao: true,
    diagnostico: true,
    conduta: true,
    prescricao: true,
    tiss: true,
    exames: true
  });
  
  // Quick Action Modals
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  
  // Telemedicine
  const [showTelemedicineModal, setShowTelemedicineModal] = useState(false);
  const [telemedicineSessionId, setTelemedicineSessionId] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [showAttachmentViewer, setShowAttachmentViewer] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Section anchors for tab navigation
  const anamneseRef = useRef<HTMLDivElement | null>(null);
  const evolucaoRef = useRef<HTMLDivElement | null>(null);
  const prescricaoRef = useRef<HTMLDivElement | null>(null);
  const tissRef = useRef<HTMLDivElement | null>(null);
  const examesRef = useRef<HTMLDivElement | null>(null);
  
  // Safe modal close functions
  const closePrescriptionModal = useCallback(() => {
    try {
      setShowPrescriptionModal(false);
    } catch (error) {
      console.error("Error closing prescription modal:", error);
    }
  }, []);
  
  const closeCertificateModal = useCallback(() => {
    try {
      setShowCertificateModal(false);
    } catch (error) {
      console.error("Error closing certificate modal:", error);
    }
  }, []);
  
  const closeExamModal = useCallback(() => {
    try {
      setShowExamModal(false);
    } catch (error) {
      console.error("Error closing exam modal:", error);
    }
  }, []);
  
  const closeReferralModal = useCallback(() => {
    try {
      setShowReferralModal(false);
    } catch (error) {
      console.error("Error closing referral modal:", error);
    }
  }, []);

  // Telemedicine functions
  const startTelemedicineSession = async () => {
    if (!consultationId || !currentPatient) return;
    
    try {
      setIsCreatingSession(true);
      
      // Create telemedicine session
      const now = new Date();
      const endTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      
      const sessionData = {
        appointment_id: activeAppointmentId,
        doctor_id: user?.id,
        allow_recording: true,
        max_duration_minutes: 60,
        scheduled_start: now.toISOString(),
        scheduled_end: endTime.toISOString()
      };
      
      const response = await apiClient.request("/telemed/sessions", {
        method: "POST",
        body: JSON.stringify(sessionData)
      }) as { session_id: string };
      
      setTelemedicineSessionId(response.session_id);
      setShowTelemedicineModal(true);
      
      toast({ 
        title: "Sessão de Telemedicina", 
        description: "Sessão criada com sucesso. Aguardando paciente..." 
      });
      
    } catch (error) {
      console.error("Error creating telemedicine session:", error);
      toast({ 
        title: "Erro", 
        description: "Falha ao criar sessão de telemedicina", 
        variant: "destructive" 
      });
    } finally {
      setIsCreatingSession(false);
    }
  };

  const joinTelemedicineSession = () => {
    if (telemedicineSessionId) {
      navigate(`/app/telemed/${telemedicineSessionId}`);
    }
  };

  const closeTelemedicineModal = () => {
    setShowTelemedicineModal(false);
    setTelemedicineSessionId(null);
  };
  
  // Voice Recording
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  
  // Interface for consultation history
  interface ConsultationHistoryItem {
    id: string;
    appointment_id?: string;
    doctor_id?: string;
    date: string;
    chief_complaint?: string;
    diagnosis?: string;
    summary?: string;
  }

  // Past consultations
  const [pastConsultations, setPastConsultations] = useState<ConsultationHistoryItem[]>([]);
  const consultationViewRef = useRef<HTMLDivElement | null>(null);

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
      (async () => {
        await ensureActiveAppointmentForPatient(patientId);
        await loadPatientConsultation(patientId);
      })();
    }
  }, [searchParams, ensureActiveAppointmentForPatient]);

  // Auto-save notes every 15 seconds
  useEffect(() => {
    if (!consultationId) return;
    
    const autoSaveInterval = setInterval(() => {
      try {
        saveConsultationNotes(true);
      } catch (error) {
        console.error("Auto-save error:", error);
      }
    }, 15000);
    
    return () => clearInterval(autoSaveInterval);
  }, [consultationId, notes]);

  // Real-time queue updates every 10 seconds
  useEffect(() => {
    const queueUpdateInterval = setInterval(() => {
      if (!currentPatient) { // Only update queue when not in consultation
        loadQueue();
      }
    }, 10000);
    
    return () => clearInterval(queueUpdateInterval);
  }, [currentPatient]);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      // Cleanup any pending operations
      setLoading(false);
      setSaving(false);
      setIsCallingPatientId(null);
    };
  }, []);

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
        // Validate/resolve required fields for backend schema
        let appointmentIdToUse = activeAppointmentId || await ensureActiveAppointmentForPatient(patientId);
        if (!appointmentIdToUse) {
          toast({
            title: "Agendamento não encontrado",
            description: "Nenhum agendamento válido encontrado para hoje.",
            variant: "destructive"
          });
          throw new Error("Missing activeAppointmentId for consultation creation");
        }

        const doctorId = user?.id;
        if (!doctorId) {
          toast({
            title: "Médico não identificado",
            description: "Reautentique-se para continuar.",
            variant: "destructive"
          });
          throw new Error("Missing doctorId for consultation creation");
        }

        consultation = await apiClient.request<any>("/consultations", {
          method: "POST",
          body: JSON.stringify({
            patient_id: patientId,
            appointment_id: appointmentIdToUse,
            doctor_id: doctorId,
            chief_complaint: "Consulta em andamento",
            diagnosis: "A ser determinado"
          })
        });
      }
      
      setConsultationId(consultation.id);
        
      // Ensure the consultation panel is scrolled into view
      setTimeout(() => {
        try {
          consultationViewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Also push a slight scroll to reveal lower sections
          window.scrollTo({ top: (window.scrollY || 0) + 120, behavior: 'smooth' });
        } catch {}
      }, 50);

        // Load vitals - handle 404 gracefully
        try {
          const vitalsResponse = await apiClient.request<any>(`/consultation-management/vitals/${consultation.id}`);
          if (vitalsResponse) {
            setVitals({
              blood_pressure: vitalsResponse.blood_pressure || "",
              heart_rate: vitalsResponse.heart_rate || "",
              temperature: vitalsResponse.temperature || "",
              respiratory_rate: vitalsResponse.respiratory_rate || "",
              oxygen_saturation: vitalsResponse.oxygen_saturation || "",
              weight: vitalsResponse.weight || "",
              height: vitalsResponse.height || "",
              bmi: vitalsResponse.bmi || ""
            });
          }
        } catch (e: any) {
          if (e.status === 404) {
            console.log("No vitals found - initializing empty vitals");
            setVitals({
              blood_pressure: "",
              heart_rate: "",
              temperature: "",
              respiratory_rate: "",
              oxygen_saturation: "",
              weight: "",
              height: "",
              bmi: ""
            });
          } else {
            console.error("Error loading vitals:", e);
            setVitals({
              blood_pressure: "",
              heart_rate: "",
              temperature: "",
              respiratory_rate: "",
              oxygen_saturation: "",
              weight: "",
              height: "",
              bmi: ""
            });
          }
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
        
        // Load patient history for sidebar
        await loadPatientHistoryForSidebar();
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

  const callPatient = async (queueItem: QueuePatient) => {
    try {
      setIsCallingPatientId(queueItem.patient_id);
      await apiClient.request(`/consultation-management/queue/call/${queueItem.patient_id}`, {
        method: "POST"
      });
      
      // Play alert sound (optional - silently fail if not available)
      try {
        const audio = new Audio("/alert-sound.mp3");
        await audio.play();
      } catch (audioError) {
        // Audio not available or autoplay blocked - that's okay
        console.log("Audio notification not played (file missing or blocked)");
      }
      
      // Track active appointment for consultation creation
      setActiveAppointmentId((queueItem as any).appointment_id ?? null);

      // Load patient consultation
      await loadPatientConsultation(queueItem.patient_id);
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
    } finally {
      setIsCallingPatientId(null);
    }
  };

  const saveVitals = async () => {
    if (!consultationId || !currentPatient) return;
    
    try {
      setSaving(true);
      
      // Try to update existing vitals first
      try {
        await apiClient.request(`/consultation-management/vitals/${consultationId}`, {
          method: "PUT",
          body: JSON.stringify({
            consultation_id: consultationId,
            patient_id: currentPatient.id,
            ...vitals
          })
        });
      } catch (updateError: any) {
        // If update fails (404), create new vitals
        if (updateError.status === 404) {
          await apiClient.request("/consultation-management/vitals", {
            method: "POST",
            body: JSON.stringify({
              consultation_id: consultationId,
              patient_id: currentPatient.id,
              ...vitals
            })
          });
        } else {
          throw updateError;
        }
      }
      
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
    if (!event.target.files || event.target.files.length === 0) {
      console.log("No files selected");
      return;
    }
    
    if (!consultationId) {
      console.error("No consultation ID available");
      toast({
        title: "Erro",
        description: "Nenhuma consulta ativa encontrada",
        variant: "destructive"
      });
      return;
    }
    
    if (!currentPatient) {
      console.error("No current patient available");
      toast({
        title: "Erro",
        description: "Nenhum paciente selecionado",
        variant: "destructive"
      });
      return;
    }
    
    const file = event.target.files[0];
    console.log("Uploading file:", file.name, "for consultation:", consultationId, "patient:", currentPatient.id);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("consultation_id", consultationId);
    formData.append("patient_id", currentPatient.id);
    formData.append("category", "exam");
    
    try {
      setSaving(true);
      const response = await apiClient.request<Attachment>("/consultation-management/attachments/upload", {
        method: "POST",
        body: formData
        // Don't set headers - let browser handle FormData Content-Type
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
      // Reset the input so the same file can be selected again
      event.target.value = '';
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
      
      // Save final notes and vitals
      await saveConsultationNotes();
      await saveVitals();
      
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
      
      // Auto-call next patient if available
      const nextPatient = queue.find(p => p.status === "waiting");
      if (nextPatient) {
        setTimeout(async () => {
          try {
            await callPatient(nextPatient);
            toast({
              title: "Próximo paciente",
              description: `${nextPatient.patient_name} foi chamado automaticamente`
            });
          } catch (error) {
            console.error("Error auto-calling next patient:", error);
          }
        }, 2000); // 2 second delay
      }
      
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
      const history = await apiClient.request<ConsultationHistoryItem[]>(`/consultation-management/consultations/history/${currentPatient.id}`);
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

  const loadPatientHistoryForSidebar = async () => {
    if (!currentPatient) return;
    
    try {
      const history = await apiClient.request<ConsultationHistoryItem[]>(`/consultation-management/consultations/history/${currentPatient.id}`);
      setPastConsultations(Array.isArray(history) ? history : []);
    } catch (error) {
      console.error("Error loading history for sidebar:", error);
      // Don't show toast for sidebar loading to avoid spam
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
          respiratory_rate: vitalsResponse.respiratory_rate || "",
          oxygen_saturation: vitalsResponse.oxygen_saturation || "",
          weight: vitalsResponse.weight || "",
          height: vitalsResponse.height || "",
          bmi: vitalsResponse.bmi || ""
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

  // Helper functions for attachment management
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <FileImage className="h-4 w-4 text-green-600" />;
    if (fileType === 'application/pdf') return <FileText className="h-4 w-4 text-red-600" />;
    return <File className="h-4 w-4 text-blue-600" />;
  };

  const getFileTypeLabel = (fileType: string) => {
    if (fileType.startsWith('image/')) return 'Imagem';
    if (fileType === 'application/pdf') return 'PDF';
    if (fileType.includes('word') || fileType.includes('document')) return 'Documento';
    return 'Arquivo';
  };

  const openAttachmentViewer = (attachment: Attachment) => {
    setSelectedAttachment(attachment);
    setShowAttachmentViewer(true);
    setIsFullscreen(false);
  };

  const closeAttachmentViewer = () => {
    setShowAttachmentViewer(false);
    setSelectedAttachment(null);
    setIsFullscreen(false);
  };

  const deleteAttachment = async (attachmentId: string) => {
    try {
      await apiClient.request(`/consultation-management/attachments/${attachmentId}`, { method: 'DELETE' });
      toast({ 
        title: 'Anexo removido', 
        description: 'O arquivo foi excluído com sucesso.' 
      });
      
      // Refresh attachments list
      if (consultationId) {
        const refreshed = await apiClient.request<Attachment[]>(`/consultation-management/attachments/${consultationId}`);
        setAttachments(Array.isArray(refreshed) ? refreshed : []);
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      toast({ 
        title: 'Erro', 
        description: 'Falha ao excluir anexo.', 
        variant: 'destructive' 
      });
    }
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
    const waitingPatients = queue.filter(p => p.status === "waiting");
    const inProgressPatients = queue.filter(p => p.status === "in_progress");
    const completedPatients = queue.filter(p => p.status === "completed");

    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Fila de Atendimento
            </h1>
            <p className="text-muted-foreground">Pacientes aguardando, em atendimento e atendidos</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadQueue}>
              <Activity className="h-4 w-4 mr-2" />
              Atualizar Fila
            </Button>
            <Button variant="outline" onClick={() => navigate("/app/appointments")}>
              <Calendar className="h-4 w-4 mr-2" />
              Ver Agendamentos
            </Button>
          </div>
        </div>

        {/* Resumo de Status */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Aguardando</p>
                  <p className="text-2xl font-bold text-orange-700">{waitingPatients.length}</p>
                </div>
                <Clock className="h-6 w-6 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Em Atendimento</p>
                  <p className="text-2xl font-bold text-blue-700">{inProgressPatients.length}</p>
                </div>
                <User className="h-6 w-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Atendidos</p>
                  <p className="text-2xl font-bold text-green-700">{completedPatients.length}</p>
                </div>
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Aguardando */}
        <div className="grid gap-4">
          {waitingPatients.map((patient, index) => (
            <Card key={patient.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-lg">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {patient.patient_name}
                        {patient.insurance_provider && patient.insurance_provider !== "Particular" ? (
                          <span className="text-sm font-medium ml-2 text-blue-600">
                            — Convênio: {patient.insurance_provider}
                          </span>
                        ) : (
                          <span className="text-sm font-medium ml-2 text-gray-500">
                            — Particular
                          </span>
                        )}
                      </h3>
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
                    <Button onClick={() => callPatient(patient)}>
                      <Bell className="h-4 w-4 mr-2" />
                      Chamar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {waitingPatients.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum paciente na fila</h3>
                <p className="text-muted-foreground">Todos os pacientes foram atendidos</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Em Atendimento */}
        {inProgressPatients.length > 0 && (
          <div className="grid gap-4">
            <h2 className="text-xl font-semibold">Em Atendimento</h2>
            {inProgressPatients.map((patient) => (
              <Card key={patient.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-lg">
                        <User className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {patient.patient_name}
                          {patient.insurance_provider && patient.insurance_provider !== "Particular" ? (
                            <span className="text-sm font-medium ml-2 text-blue-600">
                              — Convênio: {patient.insurance_provider}
                            </span>
                          ) : (
                            <span className="text-sm font-medium ml-2 text-gray-500">
                              — Particular
                            </span>
                          )}
                        </h3>
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
                      <Badge variant="secondary">Em atendimento</Badge>
                      <Button variant="outline" onClick={() => callPatient(patient)}>
                        Continuar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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
            <Button variant="ghost" disabled={isReturningToQueue} onClick={async () => {
              try {
                setIsReturningToQueue(true);
                if (consultationId) {
                  await apiClient.request(`/consultation-management/queue/return/${consultationId}`, { method: "POST" });
                }
              } catch (e) {
                // non-blocking
              } finally {
                setCurrentPatient(null);
                setConsultationId(null);
                await loadQueue();
                navigate("/app/atendimento");
                setIsReturningToQueue(false);
              }
            }}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Fila
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={async () => { await saveVitals(); await saveConsultationNotes(); }}>
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
              <h1 className="text-2xl font-bold mb-2">
                {currentPatient.name}
                {currentPatient.insurance_provider && currentPatient.insurance_provider !== "Particular" ? (
                  <span className="text-lg font-semibold ml-3 text-blue-600">
                    — Convênio: {currentPatient.insurance_provider}
                  </span>
                ) : (
                  <span className="text-lg font-semibold ml-3 text-gray-500">
                    — Particular
                  </span>
                )}
              </h1>
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
                  {currentPatient.insurance_provider && currentPatient.insurance_provider !== "Particular" 
                    ? currentPatient.insurance_provider 
                    : "Particular"}
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
      <div className="flex-1 overflow-auto">
        <div ref={consultationViewRef} className="container mx-auto p-6 h-full">
          <div className="grid grid-cols-3 gap-6 h-full">
            {/* Left Column - Consultation Content */}
            <div className="col-span-2 space-y-6">
              {/* Tabs */}
              <Tabs defaultValue="anamnese" className="w-full" onValueChange={(val) => {
                const map: Record<string, HTMLDivElement | null> = {
                  anamnese: anamneseRef.current,
                  evolucao: evolucaoRef.current,
                  prescricao: prescricaoRef.current,
                  tiss: tissRef.current,
                  exames: examesRef.current,
                };
                const node = map[val];
                if (node) node.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}>
                <TabsList className="grid grid-cols-5">
                  <TabsTrigger value="anamnese">Anamnese</TabsTrigger>
                  <TabsTrigger value="evolucao">Evolução</TabsTrigger>
                  <TabsTrigger value="prescricao">Prescrição</TabsTrigger>
                  <TabsTrigger value="tiss">SADT / TISS</TabsTrigger>
                  <TabsTrigger value="exames">Exames</TabsTrigger>
                </TabsList>
              </Tabs>
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
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={startTelemedicineSession}
                        disabled={isCreatingSession || !consultationId || !currentPatient}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        {isCreatingSession ? "Criando..." : "Telemedicina"}
                      </Button>
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
                      <div ref={anamneseRef} />
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
                      <div ref={evolucaoRef} />
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
                                  onChange={(code: string, description: string) => {
                                    try {
                                      if (code && description) {
                                        setNotes(prev => ({ ...prev, diagnosis: `${code} - ${description}` }));
                                      }
                                    } catch (error) {
                                      console.error("Error in CID10Autocomplete onChange:", error);
                                    }
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

                      {/* Prescrição Section */}
                      <div ref={prescricaoRef} />
                      <Collapsible
                        open={openSections.prescricao}
                        onOpenChange={(open) => setOpenSections(prev => ({ ...prev, prescricao: open }))}
                      >
                        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-accent transition-colors">
                          <h3 className="font-semibold text-lg">4. Prescrição Médica</h3>
                          {openSections.prescricao ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="p-4 pt-0 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <Button 
                                className="w-full" 
                                onClick={() => setShowPrescriptionModal(true)}
                                disabled={!consultationId || !currentPatient}
                              >
                                <Pill className="h-4 w-4 mr-2" />
                                Nova Receita
                              </Button>
                              <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={() => setShowCertificateModal(true)}
                                disabled={!consultationId || !currentPatient}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Atestado Médico
                              </Button>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <p>• Clique em "Nova Receita" para criar prescrições com medicamentos</p>
                              <p>• Use "Atestado Médico" para gerar atestados e declarações</p>
                              <p>• Todas as prescrições são vinculadas a esta consulta</p>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      {/* TISS/SADT Section */}
                      <div ref={tissRef} />
                      <Collapsible
                        open={openSections.tiss}
                        onOpenChange={(open) => setOpenSections(prev => ({ ...prev, tiss: open }))}
                      >
                        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-accent transition-colors">
                          <h3 className="font-semibold text-lg">5. Guias SADT / TISS</h3>
                          {openSections.tiss ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="p-4 pt-0 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <Button 
                                className="w-full" 
                                onClick={() => setShowExamModal(true)}
                                disabled={!consultationId || !currentPatient}
                              >
                                <ClipboardList className="h-4 w-4 mr-2" />
                                Guia SADT
                              </Button>
                              <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={async () => {
                                  if (!consultationId) return;
                                  try {
                                    await apiClient.request(`/tiss/generate`, {
                                      method: "POST",
                                      body: JSON.stringify({
                                        consultation_id: consultationId,
                                        type: "CONSULTA"
                                      })
                                    });
                                    toast({ title: "Guia gerada", description: "Guia TISS criada com sucesso" });
                                  } catch (error) {
                                    toast({ title: "Erro", description: "Erro ao gerar guia TISS. Verifique as credenciais ou dados do paciente.", variant: "destructive" });
                                  }
                                }}
                                disabled={!consultationId || !currentPatient}
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                Guia TISS
                              </Button>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <p>• Guia SADT para procedimentos e exames</p>
                              <p>• Guia TISS para consultas e procedimentos</p>
                              <p>• XMLs são gerados automaticamente e vinculados à consulta</p>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      {/* Exames Section */}
                      <div ref={examesRef} />
                      <Collapsible
                        open={openSections.exames}
                        onOpenChange={(open) => setOpenSections(prev => ({ ...prev, exames: open }))}
                      >
                        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-accent transition-colors">
                          <h3 className="font-semibold text-lg">6. Exames e Documentos</h3>
                          {openSections.exames ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="p-4 pt-0 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <Button 
                                className="w-full" 
                                onClick={() => setShowExamModal(true)}
                                disabled={!consultationId || !currentPatient}
                              >
                                <ClipboardList className="h-4 w-4 mr-2" />
                                Solicitar Exame
                              </Button>
                              <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={() => setShowReferralModal(true)}
                                disabled={!consultationId || !currentPatient}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Encaminhamento
                              </Button>
                            </div>
                            
                            {/* File Upload Area */}
                            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground mb-2">Arraste arquivos aqui ou clique para selecionar</p>
                              <Button variant="outline" size="sm">
                                <Upload className="h-4 w-4 mr-2" />
                                Selecionar Arquivos
                              </Button>
                            </div>

                            {/* Attachments List */}
                            {attachments.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm">Arquivos Anexados:</h4>
                                {attachments.map((attachment, index) => (
                                  <div key={index} className="flex items-center justify-between p-2 border rounded hover:bg-accent/50 transition-colors">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      {getFileIcon(attachment.file_type)}
                                      <span className="text-sm truncate" title={attachment.file_name}>
                                        {attachment.file_name}
                                      </span>
                                    </div>
                                    <div className="flex gap-1">
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        onClick={() => openAttachmentViewer(attachment)}
                                        className="h-6 w-6 p-0"
                                        title="Visualizar"
                                      >
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        onClick={() => {
                                          const link = document.createElement('a');
                                          link.href = attachment.file_url;
                                          link.download = attachment.file_name;
                                          link.click();
                                        }}
                                        className="h-6 w-6 p-0"
                                        title="Download"
                                      >
                                        <Download className="h-3 w-3" />
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        onClick={() => deleteAttachment(attachment.id)}
                                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                        title="Excluir"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Quick Actions & Attachments */}
            <div className="space-y-6">
              {/* Prescrição Section Anchor */}
              <div ref={prescricaoRef} />
              
              {/* TISS Section Anchor */}
              <div ref={tissRef} />
              
              {/* Exames Section Anchor */}
              <div ref={examesRef} />
              
              {/* Medical History Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="h-5 w-5 text-blue-600" />
                    Histórico de Prontuários
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {pastConsultations.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Nenhum histórico encontrado</p>
                        </div>
                      ) : (
                        pastConsultations.map((consultation) => (
                          <div key={consultation.id} className="border rounded-lg p-3 hover:bg-accent transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm font-medium">
                                    {new Date(consultation.date).toLocaleDateString("pt-BR", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric"
                                    })}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  <strong>Consulta:</strong> {consultation.chief_complaint || "Sem descrição"}
                                </p>
                                {consultation.diagnosis && (
                                  <p className="text-xs text-muted-foreground">
                                    <strong>Dx:</strong> {consultation.diagnosis}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => reopenConsultation(consultation.id)}
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  Visualizar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => {
                                    // TODO: Implement PDF generation for consultation
                                    toast({
                                      title: "Em desenvolvimento",
                                      description: "Geração de PDF será implementada em breve",
                                      variant: "destructive"
                                    });
                                  }}
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  PDF
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                  <div className="mt-3 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={loadPatientHistory}
                    >
                      <History className="h-4 w-4 mr-2" />
                      Ver Histórico Completo
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {/* Nova Receita */}
                  <Button className="w-full justify-start" variant="outline" disabled={!consultationId || !currentPatient} onClick={() => setShowPrescriptionModal(true)}>
                    <Pill className="h-4 w-4 mr-2" />
                    Nova Receita
                  </Button>
                  {/* Atestado */}
                  <Button className="w-full justify-start" variant="outline" disabled={!consultationId || !currentPatient} onClick={() => setShowCertificateModal(true)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Atestado
                  </Button>
                  {/* Solicitar Exame */}
                  <Button className="w-full justify-start" variant="outline" disabled={!consultationId || !currentPatient} onClick={() => setShowExamModal(true)}>
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Solicitar Exame
                  </Button>
                  {/* Encaminhamento */}
                  <Button className="w-full justify-start" variant="outline" disabled={!consultationId || !currentPatient} onClick={() => setShowReferralModal(true)}>
                    <Send className="h-4 w-4 mr-2" />
                    Encaminhamento
                  </Button>
                  {/* Telemedicina */}
                  <Button 
                    className="w-full justify-start bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700" 
                    variant="outline" 
                    disabled={isCreatingSession || !consultationId || !currentPatient} 
                    onClick={startTelemedicineSession}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    {isCreatingSession ? "Criando..." : "Iniciar Telemedicina"}
                  </Button>
                  {/* Generic Guide SADT */}
                  <Button className="w-full justify-start" variant="outline" disabled={!consultationId || !currentPatient} onClick={() => setShowExamModal(true)}>
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Guia SADT Genérica
                  </Button>
                  {/* Generic Guide de Consulta TISS */}
                  <Button className="w-full justify-start" variant="outline" disabled={!consultationId || !currentPatient} onClick={async () => {
                    if (!consultationId) return;
                    try {
                      await apiClient.request(`/tiss/generate`, {
                        method: "POST",
                        body: JSON.stringify({
                          consultation_id: consultationId,
                          type: "CONSULTA"
                        })
                      });
                      toast({ title: "Guia gerada", description: "Guia de consulta TISS (genérica) criada" });
                    } catch (error) {
                      toast({ title: "Erro", description: "Erro ao gerar guia TISS. Verifique as credenciais ou dados do paciente.", variant: "destructive" });
                    }
                  }}>
                    <Shield className="h-4 w-4 mr-2" />
                    Guia de Consulta TISS Genérica
                  </Button>
                </CardContent>
              </Card>

              {/* Attachments */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Anexos</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {attachments.length} arquivo{attachments.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Upload Area */}
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".pdf,.jpg,.jpeg,.png,.docx"
                      multiple
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

                  {/* Attachments List */}
                  {attachments.length > 0 ? (
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {getFileIcon(attachment.file_type)}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" title={attachment.file_name}>
                                  {attachment.file_name}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{getFileTypeLabel(attachment.file_type)}</span>
                                  <span>•</span>
                                  <span>
                                    {new Date(attachment.uploaded_at).toLocaleDateString("pt-BR", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit"
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => openAttachmentViewer(attachment)}
                                className="h-8 w-8 p-0"
                                title="Visualizar"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
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
                                className="h-8 w-8 p-0"
                                title="Download"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => deleteAttachment(attachment.id)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum anexo encontrado</p>
                      <p className="text-xs mt-1">Faça upload de arquivos para visualizá-los aqui</p>
                    </div>
                  )}
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
          onClose={closePrescriptionModal}
        />
      )}
      {showCertificateModal && consultationId && currentPatient && (
        <CertificateModal
          consultationId={consultationId}
          patientId={currentPatient.id}
          onClose={closeCertificateModal}
        />
      )}
      {showExamModal && consultationId && currentPatient && (
        <ExamRequestModal
          consultationId={consultationId}
          patientId={currentPatient.id}
          onClose={closeExamModal}
        />
      )}
      {showReferralModal && consultationId && currentPatient && (
        <ReferralModal
          consultationId={consultationId}
          patientId={currentPatient.id}
          onClose={closeReferralModal}
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
                              {new Date(consult.date).toLocaleDateString("pt-BR", {
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

      {/* Telemedicine Modal */}
      {showTelemedicineModal && (
        <Dialog open={showTelemedicineModal} onOpenChange={closeTelemedicineModal}>
          <DialogContent className="max-w-2xl" aria-describedby="telemed-desc">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-blue-600" />
                Sessão de Telemedicina
              </DialogTitle>
            </DialogHeader>
            <DialogDescription id="telemed-desc" className="sr-only">
              Sessão de telemedicina criada. Compartilhe o link com o paciente e entre na sala quando estiver pronto.
            </DialogDescription>
            
            <div className="space-y-4">
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <Video className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <h3 className="text-lg font-semibold mb-2">
                  Sessão Criada com Sucesso!
                </h3>
                <p className="text-muted-foreground mb-4">
                  Compartilhe o link abaixo com o paciente para iniciar a consulta por vídeo.
                </p>
                
                <div className="bg-white p-3 rounded border mb-4">
                  <code className="text-sm break-all">
                    {window.location.origin}/app/telemed/{telemedicineSessionId}
                  </code>
                </div>
                
                <div className="flex gap-2 justify-center">
                  <Button onClick={joinTelemedicineSession} className="bg-blue-600 hover:bg-blue-700">
                    <Video className="h-4 w-4 mr-2" />
                    Entrar na Consulta
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/app/telemed/${telemedicineSessionId}`);
                      toast({ title: "Link copiado!", description: "Link da consulta copiado para a área de transferência" });
                    }}
                  >
                    Copiar Link
                  </Button>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p><strong>Instruções para o paciente:</strong></p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Clique no link para abrir a consulta</li>
                  <li>Permita acesso à câmera e microfone</li>
                  <li>Aguarde o médico entrar na sala</li>
                  <li>A consulta será gravada com seu consentimento</li>
                </ul>
              </div>
            </div>
           </DialogContent>
         </Dialog>
       )}

      {/* Attachment Viewer Modal */}
      {showAttachmentViewer && selectedAttachment && (
        <Dialog open={showAttachmentViewer} onOpenChange={closeAttachmentViewer}>
          <DialogContent 
            className={`${isFullscreen ? 'max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh]' : 'max-w-4xl max-h-[80vh]'} p-0`}
            aria-describedby="attachment-viewer-description"
          >
            <DialogHeader className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getFileIcon(selectedAttachment.file_type)}
                  <div>
                    <DialogTitle className="text-lg">{selectedAttachment.file_name}</DialogTitle>
                    <p id="attachment-viewer-description" className="text-sm text-muted-foreground">
                      {getFileTypeLabel(selectedAttachment.file_type)} • 
                      {new Date(selectedAttachment.uploaded_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
                  >
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = selectedAttachment.file_url;
                      link.download = selectedAttachment.file_name;
                      link.click();
                    }}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteAttachment(selectedAttachment.id)}
                    className="text-destructive hover:text-destructive"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>
            
            <div className="flex-1 overflow-hidden px-6 pb-6">
              {selectedAttachment.file_type.startsWith('image/') ? (
                <div className="w-full h-full flex items-center justify-center bg-muted/20 rounded-lg overflow-hidden">
                  <img
                    src={selectedAttachment.file_url}
                    alt={selectedAttachment.file_name}
                    className={`max-w-full max-h-full object-contain ${isFullscreen ? 'max-h-[calc(95vh-200px)]' : 'max-h-[60vh]'}`}
                  />
                </div>
              ) : selectedAttachment.file_type === 'application/pdf' ? (
                <div className="w-full h-full">
                  <iframe
                    src={selectedAttachment.file_url}
                    className={`w-full border-0 rounded-lg ${isFullscreen ? 'h-[calc(95vh-200px)]' : 'h-[60vh]'}`}
                    title={selectedAttachment.file_name}
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted/20 rounded-lg">
                  <div className="text-center">
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Visualização não disponível</h3>
                    <p className="text-muted-foreground mb-4">
                      Este tipo de arquivo não pode ser visualizado no navegador.
                    </p>
                    <Button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = selectedAttachment.file_url;
                        link.download = selectedAttachment.file_name;
                        link.click();
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar arquivo
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

