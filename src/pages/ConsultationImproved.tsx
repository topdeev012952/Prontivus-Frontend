import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  Bell, 
  User, 
  Clock, 
  CheckCircle, 
  FileText, 
  Pill, 
  Shield,
  ArrowLeft,
  Save,
  Loader2,
  Eye,
  Plus,
  X,
  Upload,
  Download,
  Lock,
  Unlock,
  Volume2,
  AlertCircle,
  History,
  Activity,
  ChevronDown,
  ChevronUp,
  Paperclip,
  FileCheck,
  XCircle
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { CID10Autocomplete } from "@/components/CID10Autocomplete";
import { formatDate, formatTime } from "@/lib/utils";

interface WaitingPatient {
  id: string;
  queue_id: string;
  patient_id: string;
  patient_name: string;
  patient_cpf: string;
  patient_age: number;
  patient_gender: string;
  appointment_id: string;
  appointment_time: string;
  doctor_name: string;
  status: "waiting" | "in_progress" | "completed";
  position: number;
  called_at?: string;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: string;
  instructions: string;
}

interface SADTItem {
  procedure_code: string;
  procedure_name: string;
  quantity: number;
  justification: string;
}

interface Attachment {
  id?: string;
  file_name: string;
  file_type: string;
  file_url?: string;
  file_size?: number;
  uploaded_at?: string;
}

interface ConsultationData {
  id?: string;
  // Anamnese
  chief_complaint: string;
  history_present_illness: string;
  past_medical_history: string;
  family_history: string;
  social_history: string;
  medications_in_use: string;
  allergies: string;
  
  // Evolução e Conduta
  physical_examination: string;
  vital_signs: {
    blood_pressure: string;
    heart_rate: string;
    temperature: string;
    respiratory_rate: string;
    oxygen_saturation: string;
    weight: string;
    height: string;
  };
  diagnosis: string;
  diagnosis_code: string;
  treatment_plan: string;
  follow_up: string;
  notes: string;
  
  // Metadata
  is_locked: boolean;
  locked_at?: string;
  locked_by?: string;
}

export default function ConsultationImproved() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);

  // Waiting list state
  const [waitingPatients, setWaitingPatients] = useState<WaitingPatient[]>([]);
  const [completedPatients, setCompletedPatients] = useState<WaitingPatient[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Current consultation state
  const [currentPatient, setCurrentPatient] = useState<WaitingPatient | null>(null);
  
  // Consultation data state
  const [consultationData, setConsultationData] = useState<ConsultationData>({
    chief_complaint: "",
    history_present_illness: "",
    past_medical_history: "",
    family_history: "",
    social_history: "",
    medications_in_use: "",
    allergies: "",
    physical_examination: "",
    vital_signs: {
      blood_pressure: "",
      heart_rate: "",
      temperature: "",
      respiratory_rate: "",
      oxygen_saturation: "",
      weight: "",
      height: "",
    },
    diagnosis: "",
    diagnosis_code: "",
    treatment_plan: "",
    follow_up: "",
    notes: "",
    is_locked: false,
  });
  
  // Prescription state
  const [prescriptionType, setPrescriptionType] = useState("simple");
  const [medications, setMedications] = useState<Medication[]>([]);
  const [prescriptionNotes, setPrescriptionNotes] = useState("");
  
  // TISS/SADT state
  const [sadtItems, setSadtItems] = useState<SADTItem[]>([]);
  const [sadtJustification, setSadtJustification] = useState("");
  
  // Attachments state
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [autoCallNext, setAutoCallNext] = useState(true);
  
  // Collapsible sections state
  const [anamneseOpen, setAnamneseOpen] = useState(true);
  const [evolucaoOpen, setEvolucaoOpen] = useState(true);
  const [prescricaoOpen, setPrescricaoOpen] = useState(false);
  const [tissOpen, setTissOpen] = useState(false);

  useEffect(() => {
    // Only load if user is authenticated
    if (user && user.id) {
      loadWaitingPatients();
      const interval = setInterval(loadWaitingPatients, 10000); // Refresh every 10s
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadWaitingPatients = async () => {
    // Don't attempt if user is not authenticated
    if (!user || !user.id) {
      console.log("User not authenticated, skipping queue load");
      return;
    }
    
    try {
      setLoading(true);
      setError(""); // Clear any previous errors
      
      // Load from consultations/queue endpoint for accurate data
      const queueResponse = await apiClient.request(`/consultations/queue`);
      
      const waiting = queueResponse
        .filter((patient: any) => patient.status === 'waiting')
        .map((patient: any) => ({
          id: patient.id,
          queue_id: patient.id,
          patient_id: patient.patient_id,
          patient_name: patient.patient_name,
          patient_cpf: patient.patient_cpf || "N/A",
          patient_age: patient.patient_age || 0,
          patient_gender: patient.patient_gender || "unknown",
          appointment_id: patient.appointment_id,
          appointment_time: patient.appointment_time,
          doctor_name: patient.doctor_name || "Doctor",
          status: 'waiting' as const,
          position: patient.position,
          called_at: undefined,
        }));
      
      const inProgress = queueResponse
        .filter((patient: any) => patient.status === 'in_progress')
        .map((patient: any) => ({
          id: patient.id,
          queue_id: patient.id,
          patient_id: patient.patient_id,
          patient_name: patient.patient_name,
          patient_cpf: patient.patient_cpf || "N/A",
          patient_age: patient.patient_age || 0,
          patient_gender: patient.patient_gender || "unknown",
          appointment_id: patient.appointment_id,
          appointment_time: patient.appointment_time,
          doctor_name: patient.doctor_name || "Doctor",
          status: 'in_progress' as const,
          position: patient.position,
          called_at: patient.called_at,
        }));
      
      const completed = queueResponse
        .filter((patient: any) => patient.status === 'completed')
        .map((patient: any) => ({
          id: patient.id,
          queue_id: patient.id,
          patient_id: patient.patient_id,
          patient_name: patient.patient_name,
          patient_cpf: patient.patient_cpf || "N/A",
          patient_age: patient.patient_age || 0,
          patient_gender: patient.patient_gender || "unknown",
          appointment_id: patient.appointment_id,
          appointment_time: patient.appointment_time,
          doctor_name: patient.doctor_name || "Doctor",
          status: 'completed' as const,
          position: patient.position,
          called_at: patient.called_at,
        }));
      
      // Combine waiting and in_progress for the queue display
      setWaitingPatients([...waiting, ...inProgress]);
      setCompletedPatients(completed);
    } catch (err: any) {
      console.error("Error loading patients:", err);
      
      // Handle authentication errors
      if (err.message?.includes("Autenticação") || err.message?.includes("401")) {
        console.log("Authentication error - user may need to login again");
        // Don't show error toast for auth issues in background polling
        // The user will be redirected by the app's auth guard
        return;
      }
      
      setError(err.message || "Falha ao carregar lista de espera");
    } finally {
      setLoading(false);
    }
  };

  const playCallAlert = () => {
    // Play audio alert
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.log("Audio play failed:", err));
    }
    
    // Visual notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Paciente Chamado', {
        body: `${currentPatient?.patient_name} foi chamado para atendimento`,
        icon: '/Logo/Sublogo PNG Transparente.png'
      });
    }
  };

  const handleCallPatient = async (patient: WaitingPatient) => {
    try {
      setSaving(true);
      
      // Call patient via API
      await apiClient.request(
        `/consultations/queue/call/${patient.appointment_id}`,
        {
          method: "POST",
        }
      );
      
      // Play alert
      playCallAlert();
      
      // Open consultation area
      setCurrentPatient({ ...patient, status: 'in_progress' });
      
      // Reload queue
      await loadWaitingPatients();
      
      toast({
        title: "Paciente chamado",
        description: `${patient.patient_name} foi chamado para atendimento`,
      });
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Falha ao chamar paciente",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConsultation = async () => {
    if (!currentPatient) return;

    try {
      setSaving(true);
      
      const payload = {
        patient_id: currentPatient.patient_id,
        appointment_id: currentPatient.appointment_id,
        doctor_id: user?.id,
        ...consultationData,
      };

      if (consultationData.id) {
        // Update existing
        await apiClient.request(`/consultations/${consultationData.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        // Create new
        const response = await apiClient.request(`/consultations`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        
        setConsultationData({ ...consultationData, id: response.id });
      }

      toast({
        title: "Salvo",
        description: "Consulta salva com sucesso",
      });
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Falha ao salvar consulta",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFinalizeConsultation = async () => {
    if (!consultationData.id) {
      toast({
        title: "Erro",
        description: "Salve a consulta antes de finalizar",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      await apiClient.request(`/consultations/${consultationData.id}/finalize`, {
        method: "POST",
      });

      toast({
        title: "Atendimento finalizado",
        description: "Paciente marcado como atendido",
      });

      // Reset and reload
      resetConsultationState();
      await loadWaitingPatients();

      // Auto-call next patient if enabled
      if (autoCallNext && waitingPatients.length > 0) {
        const nextPatient = waitingPatients.find(p => p.status === 'waiting');
        if (nextPatient) {
          await handleCallPatient(nextPatient);
        }
      }
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Falha ao finalizar atendimento",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReopenConsultation = async (patient: WaitingPatient) => {
    try {
      // Load the consultation for this appointment
      const consultation = await apiClient.request(
        `/consultations?appointment_id=${patient.appointment_id}`
      );
      
      if (consultation && consultation.length > 0) {
        const data = consultation[0];
        
        setConsultationData({
          id: data.id,
          chief_complaint: data.chief_complaint || "",
          history_present_illness: data.history_present_illness || "",
          past_medical_history: data.past_medical_history || "",
          family_history: data.family_history || "",
          social_history: data.social_history || "",
          medications_in_use: data.medications_in_use || "",
          allergies: data.allergies || "",
          physical_examination: data.physical_examination || "",
          vital_signs: data.vital_signs || {
            blood_pressure: "",
            heart_rate: "",
            temperature: "",
            respiratory_rate: "",
            oxygen_saturation: "",
            weight: "",
            height: "",
          },
          diagnosis: data.diagnosis || "",
          diagnosis_code: data.diagnosis_code || "",
          treatment_plan: data.treatment_plan || "",
          follow_up: data.follow_up || "",
          notes: data.notes || "",
          is_locked: data.is_locked || false,
          locked_at: data.locked_at,
          locked_by: data.locked_by,
        });
        
        // Load prescription if exists
        if (data.prescription) {
          setMedications(data.prescription.medications || []);
          setPrescriptionType(data.prescription.prescription_type || "simple");
          setPrescriptionNotes(data.prescription.notes || "");
        }
        
        // Load TISS if exists
        if (data.tiss_guide) {
          setSadtItems(data.tiss_guide.items || []);
          setSadtJustification(data.tiss_guide.justification || "");
        }
      }
      
      setCurrentPatient({ ...patient, status: 'completed' });
    } catch (err: any) {
      toast({
        title: "Erro",
        description: "Falha ao carregar consulta",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "Arquivo muito grande (máx. 10MB)",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setUploadingFile(true);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patient_id', currentPatient!.patient_id);
      formData.append('appointment_id', currentPatient!.appointment_id);
      if (consultationData.id) {
        formData.append('consultation_id', consultationData.id);
      }
      
      const response = await apiClient.request('/files/upload', {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set Content-Type for FormData
      });
      
      setAttachments([
        ...attachments,
        {
          id: response.id,
          file_name: file.name,
          file_type: file.type,
          file_url: response.url,
          file_size: file.size,
          uploaded_at: new Date().toISOString(),
        },
      ]);
      
      toast({
        title: "Arquivo enviado",
        description: `${file.name} foi anexado com sucesso`,
      });
    } catch (err: any) {
      toast({
        title: "Erro no upload",
        description: err.message || "Falha ao enviar arquivo",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const resetConsultationState = () => {
    setCurrentPatient(null);
    setConsultationData({
      chief_complaint: "",
      history_present_illness: "",
      past_medical_history: "",
      family_history: "",
      social_history: "",
      medications_in_use: "",
      allergies: "",
      physical_examination: "",
      vital_signs: {
        blood_pressure: "",
        heart_rate: "",
        temperature: "",
        respiratory_rate: "",
        oxygen_saturation: "",
        weight: "",
        height: "",
      },
      diagnosis: "",
      diagnosis_code: "",
      treatment_plan: "",
      follow_up: "",
      notes: "",
      is_locked: false,
    });
    setMedications([]);
    setPrescriptionNotes("");
    setSadtItems([]);
    setSadtJustification("");
    setAttachments([]);
  };

  const addMedication = () => {
    setMedications([
      ...medications,
      {
        name: "",
        dosage: "",
        frequency: "",
        duration: "",
        quantity: "",
        instructions: "",
      },
    ]);
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const addSADTItem = () => {
    setSadtItems([
      ...sadtItems,
      {
        procedure_code: "",
        procedure_name: "",
        quantity: 1,
        justification: "",
      },
    ]);
  };

  const updateSADTItem = (index: number, field: keyof SADTItem, value: string | number) => {
    const updated = [...sadtItems];
    updated[index] = { ...updated[index], [field]: value };
    setSadtItems(updated);
  };

  const removeSADTItem = (index: number) => {
    setSadtItems(sadtItems.filter((_, i) => i !== index));
  };

  const handleGeneratePrescription = async () => {
    if (!consultationData.id) {
      toast({
        title: "Erro",
        description: "Salve a consulta antes de gerar a prescrição",
        variant: "destructive",
      });
      return;
    }

    if (medications.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um medicamento",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      
      const response = await apiClient.request<{
        success: boolean;
        pdf_base64: string;
        verification_url: string;
        message: string;
      }>(
        `/consultations/${consultationData.id}/prescription`,
        {
          method: "POST",
          body: JSON.stringify({
            prescription_type: prescriptionType,
            medications: medications,
            notes: prescriptionNotes,
          }),
        }
      );

      if (response.success && response.pdf_base64) {
        // Convert base64 to blob and download
        const binaryString = atob(response.pdf_base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Prescricao_${currentPatient?.patient_name || "Paciente"}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({
          title: "Sucesso",
          description: "Prescrição gerada e baixada!",
        });
      }
    } catch (err: any) {
      console.error("Error generating prescription:", err);
      toast({
        title: "Erro",
        description: err.message || "Falha ao gerar prescrição",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateTISS = async () => {
    if (!consultationData.id) {
      toast({
        title: "Erro",
        description: "Salve a consulta antes de gerar a guia TISS",
        variant: "destructive",
      });
      return;
    }

    if (sadtItems.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um procedimento",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      
      const response = await apiClient.request<{
        success: boolean;
        xml_content: string;
        status: string;
        message: string;
      }>(
        `/consultations/${consultationData.id}/tiss`,
        {
          method: "POST",
          body: JSON.stringify({
            items: sadtItems,
            justification: sadtJustification,
          }),
        }
      );

      if (response.success && response.xml_content) {
        // Convert XML to blob and download
        const blob = new Blob([response.xml_content], { type: "application/xml" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `TISS_SADT_${currentPatient?.patient_name || "Paciente"}_${new Date().toISOString().split('T')[0]}.xml`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({
          title: "Sucesso",
          description: "Guia TISS gerada e baixada!",
        });
      }
    } catch (err: any) {
      console.error("Error generating TISS:", err);
      toast({
        title: "Erro",
        description: err.message || "Falha ao gerar guia TISS",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "waiting":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Aguardando</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Em atendimento</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Atendido</Badge>;
      default:
        return null;
    }
  };

  const isReadOnly = consultationData.is_locked;

  if (!currentPatient) {
    // Queue View
    return (
      <div className="container mx-auto p-6 space-y-6">
        <audio ref={audioRef} src="/alert-sound.mp3" preload="auto" />
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Atendimento Médico</h1>
            <p className="text-gray-500 mt-1">Gerencie a fila de pacientes e realize atendimentos</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Waiting Queue */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Fila de Espera
                  </CardTitle>
                  <CardDescription>
                    {waitingPatients.length} paciente(s) aguardando
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400 dark:text-gray-300" />
                  </div>
                ) : waitingPatients.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-500" />
                    <p>Nenhum paciente na fila</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {waitingPatients.map((patient, index) => (
                      <Card key={patient.id} className="border-2 hover:border-blue-300 dark:hover:border-blue-500 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold">
                                {patient.position}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100">{patient.patient_name}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-300">
                                  {patient.patient_age} anos • {formatTime(patient.appointment_time)}
                                </p>
                              </div>
                            </div>
                            {getStatusBadge(patient.status)}
                          </div>
                          <Button
                            onClick={() => handleCallPatient(patient)}
                            disabled={saving || patient.status === 'in_progress'}
                            className="w-full"
                            size="sm"
                          >
                            {patient.status === 'in_progress' ? (
                              <>
                                <Activity className="mr-2 h-4 w-4 animate-pulse" />
                                Em Atendimento
                              </>
                            ) : (
                              <>
                                <Bell className="mr-2 h-4 w-4" />
                                Chamar Paciente
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Completed Patients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Atendidos Hoje
              </CardTitle>
              <CardDescription>
                {completedPatients.length} paciente(s) atendidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                {completedPatients.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-500" />
                    <p>Nenhum atendimento finalizado hoje</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {completedPatients.map((patient) => (
                      <Card key={patient.id} className="border hover:border-green-300 dark:hover:border-green-500 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100">{patient.patient_name}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-300">
                                Atendido às {formatTime(patient.called_at || patient.appointment_time)}
                              </p>
                            </div>
                            {getStatusBadge(patient.status)}
                          </div>
                          <Button
                            onClick={() => handleReopenConsultation(patient)}
                            variant="outline"
                            className="w-full"
                            size="sm"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Consulta
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Consultation View - Simplified Single-Page Layout
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <audio ref={audioRef} src="/alert-sound.mp3" preload="auto" />
      
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm("Deseja sair sem finalizar? As alterações não salvas serão perdidas.")) {
                resetConsultationState();
              }
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Fila
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{currentPatient.patient_name}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {currentPatient.patient_age} anos • CPF: {currentPatient.patient_cpf}
            </p>
          </div>
          {consultationData.is_locked && (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
              <Lock className="h-3 w-3 mr-1" />
              Bloqueado
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSaveConsultation}
            disabled={saving || isReadOnly}
            variant="outline"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </>
            )}
          </Button>
          <Button
            onClick={handleFinalizeConsultation}
            disabled={saving || !consultationData.id}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Finalizar Atendimento
          </Button>
        </div>
      </div>

      {/* Main Content Area - 2 Columns */}
      <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-800">
        <div className="h-full grid lg:grid-cols-[1fr_320px] gap-6 p-6">
          {/* Left Column - Scrollable Consultation Form */}
          <ScrollArea className="h-full">
            <div className="space-y-4 pr-4">
              {/* Anamnese Section */}
              <Collapsible open={anamneseOpen} onOpenChange={setAnamneseOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      Anamnese e História Clínica
                    </CardTitle>
                        {anamneseOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="chief_complaint">Queixa Principal *</Label>
                        <Textarea
                          id="chief_complaint"
                          value={consultationData.chief_complaint}
                          onChange={(e) => setConsultationData({ ...consultationData, chief_complaint: e.target.value })}
                          placeholder="Descreva a queixa principal do paciente..."
                          rows={2}
                          disabled={isReadOnly}
                        />
                      </div>
                      <div>
                        <Label htmlFor="history_present_illness">História da Doença Atual</Label>
                        <Textarea
                          id="history_present_illness"
                          value={consultationData.history_present_illness}
                          onChange={(e) => setConsultationData({ ...consultationData, history_present_illness: e.target.value })}
                          placeholder="História detalhada da doença atual..."
                          rows={3}
                          disabled={isReadOnly}
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="past_medical_history">Antecedentes Pessoais</Label>
                          <Textarea
                            id="past_medical_history"
                            value={consultationData.past_medical_history}
                            onChange={(e) => setConsultationData({ ...consultationData, past_medical_history: e.target.value })}
                            placeholder="Doenças prévias, cirurgias..."
                            rows={2}
                            disabled={isReadOnly}
                          />
                        </div>
                        <div>
                          <Label htmlFor="family_history">Antecedentes Familiares</Label>
                          <Textarea
                            id="family_history"
                            value={consultationData.family_history}
                            onChange={(e) => setConsultationData({ ...consultationData, family_history: e.target.value })}
                            placeholder="Histórico familiar de doenças..."
                            rows={2}
                            disabled={isReadOnly}
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="medications_in_use">Medicações em Uso</Label>
                          <Textarea
                            id="medications_in_use"
                            value={consultationData.medications_in_use}
                            onChange={(e) => setConsultationData({ ...consultationData, medications_in_use: e.target.value })}
                            placeholder="Medicamentos que o paciente usa..."
                            rows={2}
                            disabled={isReadOnly}
                          />
                        </div>
                        <div>
                          <Label htmlFor="allergies">Alergias</Label>
                          <Textarea
                            id="allergies"
                            value={consultationData.allergies}
                            onChange={(e) => setConsultationData({ ...consultationData, allergies: e.target.value })}
                            placeholder="Alergias conhecidas..."
                            rows={2}
                            disabled={isReadOnly}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Evolução e Conduta Section */}
              <Collapsible open={evolucaoOpen} onOpenChange={setEvolucaoOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
                      Evolução e Conduta
                    </CardTitle>
                        {evolucaoOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      {/* Vital Signs */}
                      <div>
                        <Label className="mb-2 block">Sinais Vitais</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <Label htmlFor="blood_pressure" className="text-xs">PA</Label>
                            <Input
                              id="blood_pressure"
                              value={consultationData.vital_signs.blood_pressure}
                              onChange={(e) => setConsultationData({
                                ...consultationData,
                                vital_signs: { ...consultationData.vital_signs, blood_pressure: e.target.value }
                              })}
                              placeholder="120/80"
                              disabled={isReadOnly}
                            />
                          </div>
                          <div>
                            <Label htmlFor="heart_rate" className="text-xs">FC</Label>
                            <Input
                              id="heart_rate"
                              value={consultationData.vital_signs.heart_rate}
                              onChange={(e) => setConsultationData({
                                ...consultationData,
                                vital_signs: { ...consultationData.vital_signs, heart_rate: e.target.value }
                              })}
                              placeholder="72 bpm"
                              disabled={isReadOnly}
                            />
                          </div>
                          <div>
                            <Label htmlFor="temperature" className="text-xs">Temp.</Label>
                            <Input
                              id="temperature"
                              value={consultationData.vital_signs.temperature}
                              onChange={(e) => setConsultationData({
                                ...consultationData,
                                vital_signs: { ...consultationData.vital_signs, temperature: e.target.value }
                              })}
                              placeholder="36.5°C"
                              disabled={isReadOnly}
                            />
                          </div>
                          <div>
                            <Label htmlFor="respiratory_rate" className="text-xs">FR</Label>
                            <Input
                              id="respiratory_rate"
                              value={consultationData.vital_signs.respiratory_rate}
                              onChange={(e) => setConsultationData({
                                ...consultationData,
                                vital_signs: { ...consultationData.vital_signs, respiratory_rate: e.target.value }
                              })}
                              placeholder="16 irpm"
                              disabled={isReadOnly}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="physical_examination">Exame Físico</Label>
                        <Textarea
                          id="physical_examination"
                          value={consultationData.physical_examination}
                          onChange={(e) => setConsultationData({ ...consultationData, physical_examination: e.target.value })}
                          placeholder="Descreva os achados do exame físico..."
                          rows={3}
                          disabled={isReadOnly}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="diagnosis">Diagnóstico *</Label>
                          <Textarea
                            id="diagnosis"
                            value={consultationData.diagnosis}
                            onChange={(e) => setConsultationData({ ...consultationData, diagnosis: e.target.value })}
                            placeholder="Diagnóstico clínico..."
                            rows={2}
                            disabled={isReadOnly}
                          />
                        </div>
                        <div>
                          <Label htmlFor="diagnosis_code">CID-10</Label>
                          <CID10Autocomplete
                            value={consultationData.diagnosis_code}
                            onChange={(code, description) =>
                              setConsultationData({ ...consultationData, diagnosis_code: code })
                            }
                            disabled={isReadOnly}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="treatment_plan">Plano Terapêutico</Label>
                        <Textarea
                          id="treatment_plan"
                          value={consultationData.treatment_plan}
                          onChange={(e) => setConsultationData({ ...consultationData, treatment_plan: e.target.value })}
                          placeholder="Conduta, tratamento proposto..."
                          rows={3}
                          disabled={isReadOnly}
                        />
                      </div>

                      <div>
                        <Label htmlFor="follow_up">Seguimento</Label>
                        <Textarea
                          id="follow_up"
                          value={consultationData.follow_up}
                          onChange={(e) => setConsultationData({ ...consultationData, follow_up: e.target.value })}
                          placeholder="Retorno, orientações..."
                          rows={2}
                          disabled={isReadOnly}
                        />
                      </div>

                      <div>
                        <Label htmlFor="notes">Observações</Label>
                        <Textarea
                          id="notes"
                          value={consultationData.notes}
                          onChange={(e) => setConsultationData({ ...consultationData, notes: e.target.value })}
                          placeholder="Observações adicionais..."
                          rows={2}
                          disabled={isReadOnly}
                        />
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Prescription Section */}
              <Collapsible open={prescricaoOpen} onOpenChange={setPrescricaoOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Pill className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      Prescrição Médica
                    </CardTitle>
                        {prescricaoOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="prescription_type">Tipo de Receita</Label>
                        <Select
                          value={prescriptionType}
                          onValueChange={setPrescriptionType}
                          disabled={isReadOnly}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="simple">Receita Simples</SelectItem>
                            <SelectItem value="antimicrobial">Antimicrobiano</SelectItem>
                            <SelectItem value="controlled_c1">Controlado C1</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Medicamentos</Label>
                          {!isReadOnly && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addMedication}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Adicionar
                            </Button>
                          )}
                        </div>

                        {medications.map((med, index) => (
                          <Card key={index} className="bg-gray-50">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Medicamento {index + 1}</span>
                                {!isReadOnly && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeMedication(index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              <div className="grid md:grid-cols-2 gap-3">
                                <div className="md:col-span-2">
                                  <Label className="text-xs">Nome</Label>
                                  <Input
                                    type="text"
                                    value={med.name}
                                    onChange={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      updateMedication(index, "name", e.target.value);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                      }
                                    }}
                                    placeholder="Ex: Dipirona 500mg"
                                    disabled={isReadOnly}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Dosagem</Label>
                                  <Input
                                    type="text"
                                    value={med.dosage}
                                    onChange={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      updateMedication(index, "dosage", e.target.value);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                      }
                                    }}
                                    placeholder="500mg"
                                    disabled={isReadOnly}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Frequência</Label>
                                  <Input
                                    type="text"
                                    value={med.frequency}
                                    onChange={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      updateMedication(index, "frequency", e.target.value);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                      }
                                    }}
                                    placeholder="8/8 horas"
                                    disabled={isReadOnly}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Duração</Label>
                                  <Input
                                    type="text"
                                    value={med.duration}
                                    onChange={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      updateMedication(index, "duration", e.target.value);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                      }
                                    }}
                                    placeholder="7 dias"
                                    disabled={isReadOnly}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Quantidade</Label>
                                  <Input
                                    type="text"
                                    value={med.quantity}
                                    onChange={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      updateMedication(index, "quantity", e.target.value);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                      }
                                    }}
                                    placeholder="1 caixa"
                                    disabled={isReadOnly}
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}

                        {medications.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">
                            Nenhum medicamento adicionado
                          </p>
                        )}
                      </div>

                      {medications.length > 0 && (
                        <div className="pt-4 space-y-3">
                          <div>
                            <Label htmlFor="prescription_notes">Observações</Label>
                            <Textarea
                              id="prescription_notes"
                              value={prescriptionNotes}
                              onChange={(e) => setPrescriptionNotes(e.target.value)}
                              placeholder="Informações adicionais..."
                              rows={2}
                              disabled={isReadOnly}
                            />
                          </div>
                          {!isReadOnly && (
                            <Button
                              type="button"
                              onClick={handleGeneratePrescription}
                              disabled={saving || !consultationData.id}
                              className="w-full"
                              variant="default"
                            >
                              {saving ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Gerando...
                                </>
                              ) : (
                                <>
                                  <Download className="mr-2 h-4 w-4" />
                                  Gerar Receita PDF
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* TISS/SADT Section */}
              <Collapsible open={tissOpen} onOpenChange={setTissOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Shield className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      Guias SADT e TISS
                    </CardTitle>
                        {tissOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Procedimentos/Exames</Label>
                          {!isReadOnly && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addSADTItem}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Adicionar
                            </Button>
                          )}
                        </div>

                        {sadtItems.map((item, index) => (
                          <Card key={index} className="bg-gray-50">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Procedimento {index + 1}</span>
                                {!isReadOnly && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeSADTItem(index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              <div className="grid md:grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs">Código TUSS</Label>
                                  <Input
                                    type="text"
                                    value={item.procedure_code}
                                    onChange={(e) => updateSADTItem(index, "procedure_code", e.target.value)}
                                    placeholder="Ex: 40301010"
                                    disabled={isReadOnly}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Procedimento</Label>
                                  <Input
                                    type="text"
                                    value={item.procedure_name}
                                    onChange={(e) => updateSADTItem(index, "procedure_name", e.target.value)}
                                    placeholder="Ex: Hemograma Completo"
                                    disabled={isReadOnly}
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <Label className="text-xs">Justificativa</Label>
                                  <Textarea
                                    value={item.justification}
                                    onChange={(e) => updateSADTItem(index, "justification", e.target.value)}
                                    placeholder="Justificativa clínica..."
                                    rows={2}
                                    disabled={isReadOnly}
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}

                        {sadtItems.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">
                            Nenhum procedimento solicitado
                          </p>
                        )}
                      </div>

                      {sadtItems.length > 0 && (
                        <div className="pt-4 space-y-3">
                          <div>
                            <Label htmlFor="sadt_justification">Justificativa Geral</Label>
                            <Textarea
                              id="sadt_justification"
                              value={sadtJustification}
                              onChange={(e) => setSadtJustification(e.target.value)}
                              placeholder="Justificativa clínica geral..."
                              rows={2}
                              disabled={isReadOnly}
                            />
                          </div>
                          {!isReadOnly && (
                            <Button
                              type="button"
                              onClick={handleGenerateTISS}
                              disabled={saving || !consultationData.id}
                              className="w-full"
                              variant="default"
                            >
                              {saving ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Gerando...
                                </>
                              ) : (
                                <>
                                  <Download className="mr-2 h-4 w-4" />
                                  Gerar Guia SADT XML
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </div>
          </ScrollArea>

          {/* Right Column - Attachments Panel */}
          <Card className="flex flex-col h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-gray-100">
                <Paperclip className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Anexos
              </CardTitle>
              <CardDescription className="text-xs text-gray-600 dark:text-gray-300">
                Exames e documentos do paciente
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
              {!isReadOnly && (
                <div className="mb-4">
                  <Input
                    type="file"
                    id="file-upload-sidebar"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  <Label
                    htmlFor="file-upload-sidebar"
                    className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Upload className="h-8 w-8 text-gray-400 dark:text-gray-300 mb-2" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Enviar Arquivo</span>
                    <span className="text-xs text-gray-500 dark:text-gray-300 mt-1">PDF, Imagens, Word (máx. 10MB)</span>
                  </Label>
                </div>
              )}

              <ScrollArea className="flex-1">
                {uploadingFile && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg mb-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm text-blue-700">Enviando...</span>
                  </div>
                )}

                {attachments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Paperclip className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-500" />
                    <p className="text-sm">Nenhum arquivo anexado</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {attachments.map((attachment, index) => (
                      <Card key={index} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex items-start gap-2">
                          <FileCheck className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {attachment.file_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {attachment.uploaded_at && formatDate(attachment.uploaded_at)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (attachment.file_url) {
                                window.open(attachment.file_url, '_blank');
                              }
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

