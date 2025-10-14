import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
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
  Send,
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
  Activity
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { CID10Autocomplete } from "@/components/CID10Autocomplete";

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

export default function ConsultationWorkflowEnhanced() {
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
  const [activeTab, setActiveTab] = useState("anamnese");
  
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

  useEffect(() => {
    loadWaitingPatients();
    const interval = setInterval(loadWaitingPatients, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const loadWaitingPatients = async () => {
    try {
      setLoading(true);
      
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
      
      // Update appointment status to in_progress
      await apiClient.request(`/appointments/${patient.appointment_id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "in_progress" }),
      });
      
      setCurrentPatient(patient);
      setActiveTab("anamnese");
      
      // Play alert sound
      playCallAlert();
      
      toast({
        title: "Paciente chamado",
        description: `${patient.patient_name} está sendo atendido.`,
      });
      
      await loadWaitingPatients();
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
      setError("");
      
      // Save consultation data
      const consultationPayload = {
        patient_id: currentPatient.patient_id,
        appointment_id: currentPatient.appointment_id,
        doctor_id: user?.id,
        ...consultationData,
      };
      
      await apiClient.request("/consultations", {
        method: "POST",
        body: JSON.stringify(consultationPayload),
      });
      
      toast({
        title: "Salvo",
        description: "Consulta salva com sucesso.",
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

  const handleCompleteConsultation = async () => {
    if (!currentPatient) return;
    
    if (!consultationData.diagnosis) {
      toast({
        title: "Diagnóstico obrigatório",
        description: "Por favor, preencha o diagnóstico antes de finalizar.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setSaving(true);
      setError("");
      
      // 1. Save consultation with locked status
      const consultationPayload = {
        patient_id: currentPatient.patient_id,
        appointment_id: currentPatient.appointment_id,
        doctor_id: user?.id,
        ...consultationData,
        is_locked: true,
        locked_at: new Date().toISOString(),
        locked_by: user?.id,
      };
      
      const consultationResponse = await apiClient.request("/consultations", {
        method: "POST",
        body: JSON.stringify(consultationPayload),
      });
      
      const consultationId = consultationResponse.id;
      
      // 2. Save prescription if medications exist
      if (medications.length > 0) {
        await apiClient.request(`/consultations/${consultationId}/prescription`, {
          method: "POST",
          body: JSON.stringify({
            prescription_type: prescriptionType,
            medications,
            notes: prescriptionNotes,
          }),
        });
      }
      
      // 3. Save SADT request if items exist
      if (sadtItems.length > 0) {
        await apiClient.request(`/consultations/${consultationId}/tiss`, {
          method: "POST",
          body: JSON.stringify({
            items: sadtItems,
            justification: sadtJustification,
          }),
        });
      }
      
      // 4. Update appointment status to completed
      await apiClient.request(`/appointments/${currentPatient.appointment_id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "completed" }),
      });
      
      toast({
        title: "Consulta finalizada",
        description: `Atendimento de ${currentPatient.patient_name} concluído.`,
      });
      
      // Reset state
      resetConsultationState();
      await loadWaitingPatients();
      
      // Auto-call next patient if enabled
      if (autoCallNext) {
        setTimeout(() => {
          const nextPatient = waitingPatients.find(p => p.status === 'waiting');
          if (nextPatient) {
            handleCallPatient(nextPatient);
          }
        }, 2000);
      }
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Falha ao finalizar consulta",
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
      
      if (consultation && consultation.items && consultation.items.length > 0) {
        const data = consultation.items[0];
        
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
      setActiveTab("anamnese");
    } catch (err: any) {
      toast({
        title: "Erro",
        description: "Falha ao carregar consulta",
        variant: "destructive",
      });
    }
  };

  const handleUnlockConsultation = () => {
    setConsultationData({
      ...consultationData,
      is_locked: false,
      locked_at: undefined,
      locked_by: undefined,
    });
    
    toast({
      title: "Consulta desbloqueada",
      description: "Você pode editar os dados novamente.",
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setUploadingFile(true);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patient_id', currentPatient!.patient_id);
      formData.append('appointment_id', currentPatient!.appointment_id);
      
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
        title: "Arquivo anexado",
        description: `${file.name} foi adicionado.`,
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
    setActiveTab("anamnese");
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "waiting":
        return <Badge variant="outline" className="bg-yellow-50">Aguardando</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="bg-blue-50">Em atendimento</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-50">Atendido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isReadOnly = consultationData.is_locked && currentPatient?.status === 'completed';

  // If viewing/editing a consultation
  if (currentPatient) {
    return (
      <div className="space-y-6">
        {/* Hidden audio element for alert */}
        <audio ref={audioRef} src="/alert-sound.mp3" preload="auto" />
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={resetConsultationState}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para a fila
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {isReadOnly && <Lock className="h-5 w-5 text-gray-500" />}
                {isReadOnly ? "Visualizando Consulta" : "Atendimento Médico"}
              </h1>
              <p className="text-muted-foreground">
                Paciente: <span className="font-semibold">{currentPatient.patient_name}</span>
                {" "}• CPF: {currentPatient.patient_cpf}
                {" "}• {currentPatient.patient_age} anos
                {" "}• {currentPatient.patient_gender === 'male' ? 'Masculino' : currentPatient.patient_gender === 'female' ? 'Feminino' : 'Outro'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isReadOnly && (
              <Button
                variant="outline"
                onClick={handleUnlockConsultation}
              >
                <Unlock className="mr-2 h-4 w-4" />
                Desbloquear
              </Button>
            )}
            
            {!isReadOnly && (
              <>
                <Button
                  variant="outline"
                  onClick={handleSaveConsultation}
                  disabled={saving}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Salvar
                </Button>
                
                <Button
                  onClick={handleCompleteConsultation}
                  disabled={saving || !consultationData.diagnosis}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Finalizando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Finalizar Atendimento
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isReadOnly && (
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Esta consulta está finalizada e bloqueada para edição. Clique em "Desbloquear" para editar.
            </AlertDescription>
          </Alert>
        )}

        {/* Consultation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="anamnese">
              <History className="h-4 w-4 mr-2" />
              Anamnese
            </TabsTrigger>
            <TabsTrigger value="evolucao">
              <Activity className="h-4 w-4 mr-2" />
              Evolução
            </TabsTrigger>
            <TabsTrigger value="prescription">
              <Pill className="h-4 w-4 mr-2" />
              Prescrição
            </TabsTrigger>
            <TabsTrigger value="tiss">
              <Shield className="h-4 w-4 mr-2" />
              TISS/SADT
            </TabsTrigger>
            <TabsTrigger value="attachments">
              <Upload className="h-4 w-4 mr-2" />
              Exames
            </TabsTrigger>
          </TabsList>

          {/* Anamnese Tab */}
          <TabsContent value="anamnese" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Anamnese e História Clínica</CardTitle>
                <CardDescription>
                  Histórico completo do paciente e queixa principal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="chief_complaint">Queixa Principal *</Label>
                  <Textarea
                    id="chief_complaint"
                    placeholder="Motivo da consulta..."
                    value={consultationData.chief_complaint}
                    onChange={(e) =>
                      setConsultationData({ ...consultationData, chief_complaint: e.target.value })
                    }
                    rows={2}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="history_present_illness">História da Doença Atual</Label>
                  <Textarea
                    id="history_present_illness"
                    placeholder="Detalhes dos sintomas, início, duração..."
                    value={consultationData.history_present_illness}
                    onChange={(e) =>
                      setConsultationData({ ...consultationData, history_present_illness: e.target.value })
                    }
                    rows={4}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="past_medical_history">Antecedentes Pessoais</Label>
                  <Textarea
                    id="past_medical_history"
                    placeholder="Doenças prévias, cirurgias, hospitalizações..."
                    value={consultationData.past_medical_history}
                    onChange={(e) =>
                      setConsultationData({ ...consultationData, past_medical_history: e.target.value })
                    }
                    rows={3}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="family_history">Antecedentes Familiares</Label>
                  <Textarea
                    id="family_history"
                    placeholder="Histórico familiar de doenças..."
                    value={consultationData.family_history}
                    onChange={(e) =>
                      setConsultationData({ ...consultationData, family_history: e.target.value })
                    }
                    rows={2}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="social_history">Histórico Social</Label>
                  <Textarea
                    id="social_history"
                    placeholder="Tabagismo, etilismo, atividade física, profissão..."
                    value={consultationData.social_history}
                    onChange={(e) =>
                      setConsultationData({ ...consultationData, social_history: e.target.value })
                    }
                    rows={2}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medications_in_use">Medicamentos em Uso</Label>
                  <Textarea
                    id="medications_in_use"
                    placeholder="Liste medicamentos que o paciente usa regularmente..."
                    value={consultationData.medications_in_use}
                    onChange={(e) =>
                      setConsultationData({ ...consultationData, medications_in_use: e.target.value })
                    }
                    rows={2}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allergies">Alergias</Label>
                  <Input
                    id="allergies"
                    placeholder="Alergias medicamentosas ou outras..."
                    value={consultationData.allergies}
                    onChange={(e) =>
                      setConsultationData({ ...consultationData, allergies: e.target.value })
                    }
                    disabled={isReadOnly}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Evolução e Conduta Tab */}
          <TabsContent value="evolucao" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Evolução e Conduta Médica</CardTitle>
                <CardDescription>
                  Exame físico, diagnóstico e plano terapêutico
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Vital Signs */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Sinais Vitais</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="blood_pressure" className="text-xs">PA (mmHg)</Label>
                      <Input
                        id="blood_pressure"
                        placeholder="120/80"
                        value={consultationData.vital_signs.blood_pressure}
                        onChange={(e) =>
                          setConsultationData({
                            ...consultationData,
                            vital_signs: { ...consultationData.vital_signs, blood_pressure: e.target.value }
                          })
                        }
                        disabled={isReadOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="heart_rate" className="text-xs">FC (bpm)</Label>
                      <Input
                        id="heart_rate"
                        placeholder="75"
                        value={consultationData.vital_signs.heart_rate}
                        onChange={(e) =>
                          setConsultationData({
                            ...consultationData,
                            vital_signs: { ...consultationData.vital_signs, heart_rate: e.target.value }
                          })
                        }
                        disabled={isReadOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="temperature" className="text-xs">Temp. (°C)</Label>
                      <Input
                        id="temperature"
                        placeholder="36.5"
                        value={consultationData.vital_signs.temperature}
                        onChange={(e) =>
                          setConsultationData({
                            ...consultationData,
                            vital_signs: { ...consultationData.vital_signs, temperature: e.target.value }
                          })
                        }
                        disabled={isReadOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="respiratory_rate" className="text-xs">FR (rpm)</Label>
                      <Input
                        id="respiratory_rate"
                        placeholder="16"
                        value={consultationData.vital_signs.respiratory_rate}
                        onChange={(e) =>
                          setConsultationData({
                            ...consultationData,
                            vital_signs: { ...consultationData.vital_signs, respiratory_rate: e.target.value }
                          })
                        }
                        disabled={isReadOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="oxygen_saturation" className="text-xs">SpO2 (%)</Label>
                      <Input
                        id="oxygen_saturation"
                        placeholder="98"
                        value={consultationData.vital_signs.oxygen_saturation}
                        onChange={(e) =>
                          setConsultationData({
                            ...consultationData,
                            vital_signs: { ...consultationData.vital_signs, oxygen_saturation: e.target.value }
                          })
                        }
                        disabled={isReadOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight" className="text-xs">Peso (kg)</Label>
                      <Input
                        id="weight"
                        placeholder="70"
                        value={consultationData.vital_signs.weight}
                        onChange={(e) =>
                          setConsultationData({
                            ...consultationData,
                            vital_signs: { ...consultationData.vital_signs, weight: e.target.value }
                          })
                        }
                        disabled={isReadOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height" className="text-xs">Altura (cm)</Label>
                      <Input
                        id="height"
                        placeholder="170"
                        value={consultationData.vital_signs.height}
                        onChange={(e) =>
                          setConsultationData({
                            ...consultationData,
                            vital_signs: { ...consultationData.vital_signs, height: e.target.value }
                          })
                        }
                        disabled={isReadOnly}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="physical_examination">Exame Físico</Label>
                  <Textarea
                    id="physical_examination"
                    placeholder="Achados do exame físico por sistemas..."
                    value={consultationData.physical_examination}
                    onChange={(e) =>
                      setConsultationData({ ...consultationData, physical_examination: e.target.value })
                    }
                    rows={5}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="diagnosis">Diagnóstico *</Label>
                    <Input
                      id="diagnosis"
                      placeholder="Diagnóstico principal"
                      value={consultationData.diagnosis}
                      onChange={(e) =>
                        setConsultationData({ ...consultationData, diagnosis: e.target.value })
                      }
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="diagnosis_code">CID-10</Label>
                    <CID10Autocomplete
                      value={consultationData.diagnosis_code}
                      onSelect={(code) =>
                        setConsultationData({ ...consultationData, diagnosis_code: code })
                      }
                      disabled={isReadOnly}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="treatment_plan">Plano Terapêutico</Label>
                  <Textarea
                    id="treatment_plan"
                    placeholder="Conduta, tratamento proposto, orientações..."
                    value={consultationData.treatment_plan}
                    onChange={(e) =>
                      setConsultationData({ ...consultationData, treatment_plan: e.target.value })
                    }
                    rows={4}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="follow_up">Retorno e Acompanhamento</Label>
                  <Textarea
                    id="follow_up"
                    placeholder="Orientações para retorno, tempo estimado..."
                    value={consultationData.follow_up}
                    onChange={(e) =>
                      setConsultationData({ ...consultationData, follow_up: e.target.value })
                    }
                    rows={2}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações Adicionais</Label>
                  <Textarea
                    id="notes"
                    placeholder="Notas complementares..."
                    value={consultationData.notes}
                    onChange={(e) =>
                      setConsultationData({ ...consultationData, notes: e.target.value })
                    }
                    rows={2}
                    disabled={isReadOnly}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prescription Tab - Keep existing implementation */}
          <TabsContent value="prescription" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Prescrição Médica</CardTitle>
                <CardDescription>
                  Receituário digital com assinatura ICP-Brasil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
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
                      <SelectItem value="antimicrobial">Antimicrobiano (RDC 471/2021)</SelectItem>
                      <SelectItem value="controlled_c1">Controlado C1 (Portaria 344/98)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Medicamentos</Label>
                    {!isReadOnly && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addMedication}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Medicamento
                      </Button>
                    )}
                  </div>

                  {medications.map((med, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">Medicamento {index + 1}</h4>
                          {!isReadOnly && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMedication(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <Label>Nome do Medicamento</Label>
                            <Input
                              value={med.name}
                              onChange={(e) => updateMedication(index, "name", e.target.value)}
                              placeholder="Ex: Dipirona 500mg"
                              disabled={isReadOnly}
                            />
                          </div>
                          <div>
                            <Label>Dosagem</Label>
                            <Input
                              value={med.dosage}
                              onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                              placeholder="Ex: 500mg"
                              disabled={isReadOnly}
                            />
                          </div>
                          <div>
                            <Label>Frequência</Label>
                            <Input
                              value={med.frequency}
                              onChange={(e) => updateMedication(index, "frequency", e.target.value)}
                              placeholder="Ex: 8/8 horas"
                              disabled={isReadOnly}
                            />
                          </div>
                          <div>
                            <Label>Duração</Label>
                            <Input
                              value={med.duration}
                              onChange={(e) => updateMedication(index, "duration", e.target.value)}
                              placeholder="Ex: 7 dias"
                              disabled={isReadOnly}
                            />
                          </div>
                          <div>
                            <Label>Quantidade</Label>
                            <Input
                              value={med.quantity}
                              onChange={(e) => updateMedication(index, "quantity", e.target.value)}
                              placeholder="Ex: 1 caixa"
                              disabled={isReadOnly}
                            />
                          </div>
                          <div className="col-span-2">
                            <Label>Instruções</Label>
                            <Input
                              value={med.instructions}
                              onChange={(e) => updateMedication(index, "instructions", e.target.value)}
                              placeholder="Ex: Tomar com água"
                              disabled={isReadOnly}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {medications.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum medicamento adicionado
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prescription_notes">Observações da Receita</Label>
                  <Textarea
                    id="prescription_notes"
                    placeholder="Informações adicionais..."
                    value={prescriptionNotes}
                    onChange={(e) => setPrescriptionNotes(e.target.value)}
                    rows={2}
                    disabled={isReadOnly}
                  />
                </div>

                {!isReadOnly && medications.length > 0 && (
                  <Button className="w-full" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Gerar PDF com Assinatura Digital
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TISS/SADT Tab - Keep existing implementation */}
          <TabsContent value="tiss" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Solicitação SADT (TISS)</CardTitle>
                <CardDescription>
                  Guias para exames e procedimentos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Procedimentos/Exames</Label>
                    {!isReadOnly && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addSADTItem}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Procedimento
                      </Button>
                    )}
                  </div>

                  {sadtItems.map((item, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">Procedimento {index + 1}</h4>
                          {!isReadOnly && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSADTItem(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Código TUSS</Label>
                            <Input
                              value={item.procedure_code}
                              onChange={(e) => updateSADTItem(index, "procedure_code", e.target.value)}
                              placeholder="Ex: 40301010"
                              disabled={isReadOnly}
                            />
                          </div>
                          <div>
                            <Label>Nome do Procedimento</Label>
                            <Input
                              value={item.procedure_name}
                              onChange={(e) => updateSADTItem(index, "procedure_name", e.target.value)}
                              placeholder="Ex: Hemograma Completo"
                              disabled={isReadOnly}
                            />
                          </div>
                          <div>
                            <Label>Quantidade</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateSADTItem(index, "quantity", parseInt(e.target.value) || 1)}
                              disabled={isReadOnly}
                            />
                          </div>
                          <div className="col-span-2">
                            <Label>Justificativa</Label>
                            <Textarea
                              value={item.justification}
                              onChange={(e) => updateSADTItem(index, "justification", e.target.value)}
                              placeholder="Justificativa clínica..."
                              rows={2}
                              disabled={isReadOnly}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {sadtItems.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum procedimento solicitado
                    </p>
                  )}
                </div>

                {sadtItems.length > 0 && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="sadt_justification">Justificativa Geral</Label>
                      <Textarea
                        id="sadt_justification"
                        placeholder="Justificativa clínica geral para os procedimentos..."
                        value={sadtJustification}
                        onChange={(e) => setSadtJustification(e.target.value)}
                        rows={3}
                        disabled={isReadOnly}
                      />
                    </div>

                    {!isReadOnly && (
                      <Button className="w-full" variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Gerar XML TISS
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attachments Tab */}
          <TabsContent value="attachments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Exames e Documentos Anexados</CardTitle>
                <CardDescription>
                  Adicione exames de imagem, laboratório e outros documentos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isReadOnly && (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                    <Label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="h-10 w-10 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        Clique para enviar arquivo
                      </span>
                      <span className="text-xs text-muted-foreground">
                        PDF, Imagens, Word (máx. 10MB)
                      </span>
                    </Label>
                  </div>
                )}

                {uploadingFile && (
                  <div className="flex items-center justify-center gap-2 py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Enviando arquivo...</span>
                  </div>
                )}

                <div className="space-y-2">
                  {attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{attachment.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {attachment.file_type} • {attachment.file_size ? Math.round(attachment.file_size / 1024) + ' KB' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(attachment.file_url, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!isReadOnly && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {attachments.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhum arquivo anexado
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Default view: Waiting list
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Atendimento Médico</h1>
          <p className="text-muted-foreground">
            Gerencie suas consultas e chame pacientes da fila
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Checkbox
            id="auto-call"
            checked={autoCallNext}
            onCheckedChange={(checked) => setAutoCallNext(checked as boolean)}
          />
          <Label htmlFor="auto-call" className="text-sm cursor-pointer">
            Chamar próximo automaticamente
          </Label>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Waiting Patients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Fila de Espera ({waitingPatients.length})
            </CardTitle>
            <CardDescription>
              Pacientes aguardando atendimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : waitingPatients.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum paciente na fila
              </p>
            ) : (
              <div className="space-y-3">
                {waitingPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary font-bold">
                        {patient.position}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{patient.patient_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(patient.appointment_time).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" • "}
                          {patient.patient_age} anos
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusBadge(patient.status)}
                      {patient.status === "waiting" && (
                        <Button
                          size="sm"
                          onClick={() => handleCallPatient(patient)}
                          disabled={saving}
                          className="gap-2"
                        >
                          <Bell className="h-4 w-4" />
                          Chamar
                        </Button>
                      )}
                      {patient.status === "in_progress" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCurrentPatient(patient)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Continuar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Patients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Atendidos Hoje ({completedPatients.length})
            </CardTitle>
            <CardDescription>
              Consultas finalizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : completedPatients.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma consulta finalizada hoje
              </p>
            ) : (
              <div className="space-y-3">
                {completedPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors cursor-pointer"
                    onClick={() => handleReopenConsultation(patient)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-50 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{patient.patient_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(patient.appointment_time).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

