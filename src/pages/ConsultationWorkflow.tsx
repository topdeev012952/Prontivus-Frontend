import { useState, useEffect } from "react";
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
  X
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
  appointment_id: string;
  appointment_time: string;
  doctor_name: string;
  status: "waiting" | "called" | "in_progress" | "completed";
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

export default function ConsultationWorkflow() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Waiting list state
  const [waitingPatients, setWaitingPatients] = useState<WaitingPatient[]>([]);
  const [completedPatients, setCompletedPatients] = useState<WaitingPatient[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Current consultation state
  const [currentPatient, setCurrentPatient] = useState<WaitingPatient | null>(null);
  const [activeTab, setActiveTab] = useState("consultation");
  
  // Medical record state
  const [medicalRecord, setMedicalRecord] = useState({
    chief_complaint: "",
    history_present_illness: "",
    physical_examination: "",
    diagnosis: "",
    diagnosis_code: "",
    treatment_plan: "",
    notes: "",
  });
  
  // Prescription state
  const [prescriptionType, setPrescriptionType] = useState("simple");
  const [medications, setMedications] = useState<Medication[]>([]);
  const [prescriptionNotes, setPrescriptionNotes] = useState("");
  
  // TISS/SADT state
  const [sadtItems, setSadtItems] = useState<SADTItem[]>([]);
  const [sadtJustification, setSadtJustification] = useState("");
  
  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadWaitingPatients();
    const interval = setInterval(loadWaitingPatients, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const loadWaitingPatients = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      const response = await apiClient.request(
        `/appointments?day=${today}&status=scheduled,checked_in,in_progress`
      );
      
      const waiting = response.items
        .filter((apt: any) => apt.status !== 'completed')
        .map((apt: any, index: number) => ({
          id: apt.id,
          queue_id: apt.id,
          patient_id: apt.patient_id,
          patient_name: apt.patient_name,
          patient_cpf: apt.patient?.cpf || "N/A",
          patient_age: apt.patient?.age || 0,
          appointment_id: apt.id,
          appointment_time: apt.scheduled_time,
          doctor_name: apt.doctor_name,
          status: apt.status === 'checked_in' ? 'waiting' : 
                  apt.status === 'in_progress' ? 'in_progress' : 'waiting',
          position: index + 1,
        }));
      
      const completed = response.items
        .filter((apt: any) => apt.status === 'completed')
        .map((apt: any) => ({
          id: apt.id,
          queue_id: apt.id,
          patient_id: apt.patient_id,
          patient_name: apt.patient_name,
          patient_cpf: apt.patient?.cpf || "N/A",
          patient_age: apt.patient?.age || 0,
          appointment_id: apt.id,
          appointment_time: apt.scheduled_time,
          doctor_name: apt.doctor_name,
          status: 'completed' as const,
          position: 0,
        }));
      
      setWaitingPatients(waiting);
      setCompletedPatients(completed);
    } catch (err: any) {
      console.error("Error loading patients:", err);
      setError(err.message || "Falha ao carregar lista de espera");
    } finally {
      setLoading(false);
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
      setActiveTab("consultation");
      
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

  const handleCompleteConsultation = async () => {
    if (!currentPatient) return;
    
    try {
      setSaving(true);
      setError("");
      
      // 1. Save medical record
      const recordData = {
        patient_id: currentPatient.patient_id,
        appointment_id: currentPatient.appointment_id,
        ...medicalRecord,
      };
      
      const recordResponse = await apiClient.request("/medical_records", {
        method: "POST",
        body: JSON.stringify(recordData),
      });
      
      // 2. Save prescription if medications exist
      if (medications.length > 0) {
        await apiClient.request("/prescriptions", {
          method: "POST",
          body: JSON.stringify({
            patient_id: currentPatient.patient_id,
            appointment_id: currentPatient.appointment_id,
            prescription_type: prescriptionType,
            medications,
            notes: prescriptionNotes,
          }),
        });
      }
      
      // 3. Save SADT request if items exist
      if (sadtItems.length > 0) {
        await apiClient.request("/tiss/sadt-requests", {
          method: "POST",
          body: JSON.stringify({
            patient_id: currentPatient.patient_id,
            appointment_id: currentPatient.appointment_id,
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
        title: "Consulta concluída",
        description: `Atendimento de ${currentPatient.patient_name} finalizado com sucesso.`,
      });
      
      // Reset state
      resetConsultationState();
      await loadWaitingPatients();
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

  const handleViewCompletedConsultation = async (patient: WaitingPatient) => {
    try {
      // Load the medical record for this appointment
      const records = await apiClient.request(
        `/medical_records?appointment_id=${patient.appointment_id}`
      );
      
      if (records && records.items && records.items.length > 0) {
        const record = records.items[0];
        setMedicalRecord({
          chief_complaint: record.chief_complaint || "",
          history_present_illness: record.history_present_illness || "",
          physical_examination: record.physical_examination || "",
          diagnosis: record.diagnosis || "",
          diagnosis_code: record.diagnosis_code || "",
          treatment_plan: record.treatment_plan || "",
          notes: record.notes || "",
        });
      }
      
      setCurrentPatient({ ...patient, status: 'completed' });
      setActiveTab("consultation");
    } catch (err: any) {
      toast({
        title: "Erro",
        description: "Falha ao carregar consulta",
        variant: "destructive",
      });
    }
  };

  const resetConsultationState = () => {
    setCurrentPatient(null);
    setMedicalRecord({
      chief_complaint: "",
      history_present_illness: "",
      physical_examination: "",
      diagnosis: "",
      diagnosis_code: "",
      treatment_plan: "",
      notes: "",
    });
    setMedications([]);
    setPrescriptionNotes("");
    setSadtItems([]);
    setSadtJustification("");
    setActiveTab("consultation");
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
        return <Badge variant="outline" className="bg-green-50">Concluído</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // If viewing/editing a consultation
  if (currentPatient) {
    const isCompleted = currentPatient.status === 'completed';
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={resetConsultationState}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para a lista
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {isCompleted ? "Visualizando Consulta" : "Atendimento"}
              </h1>
              <p className="text-muted-foreground">
                Paciente: <span className="font-semibold">{currentPatient.patient_name}</span>
                {" "}• CPF: {currentPatient.patient_cpf}
              </p>
            </div>
          </div>
          
          {!isCompleted && (
            <Button
              onClick={handleCompleteConsultation}
              disabled={saving || !medicalRecord.diagnosis}
              size="lg"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finalizando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Finalizar Consulta
                </>
              )}
            </Button>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Consultation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="consultation">
              <FileText className="h-4 w-4 mr-2" />
              Prontuário
            </TabsTrigger>
            <TabsTrigger value="prescription">
              <Pill className="h-4 w-4 mr-2" />
              Prescrição
            </TabsTrigger>
            <TabsTrigger value="tiss">
              <Shield className="h-4 w-4 mr-2" />
              TISS/SADT
            </TabsTrigger>
          </TabsList>

          {/* Medical Record Tab */}
          <TabsContent value="consultation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Prontuário Médico</CardTitle>
                <CardDescription>
                  Registro completo da consulta e evolução clínica
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  {/* Chief Complaint */}
                  <div className="space-y-2">
                    <Label htmlFor="chief_complaint">Queixa Principal *</Label>
                    <Textarea
                      id="chief_complaint"
                      placeholder="Motivo da consulta..."
                      value={medicalRecord.chief_complaint}
                      onChange={(e) =>
                        setMedicalRecord({ ...medicalRecord, chief_complaint: e.target.value })
                      }
                      rows={2}
                      disabled={isCompleted}
                    />
                  </div>

                  {/* History Present Illness */}
                  <div className="space-y-2">
                    <Label htmlFor="history">História da Doença Atual</Label>
                    <Textarea
                      id="history"
                      placeholder="Detalhes dos sintomas..."
                      value={medicalRecord.history_present_illness}
                      onChange={(e) =>
                        setMedicalRecord({ ...medicalRecord, history_present_illness: e.target.value })
                      }
                      rows={3}
                      disabled={isCompleted}
                    />
                  </div>

                  {/* Physical Examination */}
                  <div className="space-y-2">
                    <Label htmlFor="examination">Exame Físico</Label>
                    <Textarea
                      id="examination"
                      placeholder="Achados do exame físico..."
                      value={medicalRecord.physical_examination}
                      onChange={(e) =>
                        setMedicalRecord({ ...medicalRecord, physical_examination: e.target.value })
                      }
                      rows={3}
                      disabled={isCompleted}
                    />
                  </div>

                  {/* Diagnosis */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="diagnosis">Diagnóstico *</Label>
                      <Input
                        id="diagnosis"
                        placeholder="Diagnóstico principal"
                        value={medicalRecord.diagnosis}
                        onChange={(e) =>
                          setMedicalRecord({ ...medicalRecord, diagnosis: e.target.value })
                        }
                        disabled={isCompleted}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="diagnosis_code">CID-10</Label>
                      <CID10Autocomplete
                        value={medicalRecord.diagnosis_code}
                        onSelect={(code) =>
                          setMedicalRecord({ ...medicalRecord, diagnosis_code: code })
                        }
                        disabled={isCompleted}
                      />
                    </div>
                  </div>

                  {/* Treatment Plan */}
                  <div className="space-y-2">
                    <Label htmlFor="treatment">Plano de Tratamento</Label>
                    <Textarea
                      id="treatment"
                      placeholder="Conduta e orientações..."
                      value={medicalRecord.treatment_plan}
                      onChange={(e) =>
                        setMedicalRecord({ ...medicalRecord, treatment_plan: e.target.value })
                      }
                      rows={3}
                      disabled={isCompleted}
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações Adicionais</Label>
                    <Textarea
                      id="notes"
                      placeholder="Notas complementares..."
                      value={medicalRecord.notes}
                      onChange={(e) =>
                        setMedicalRecord({ ...medicalRecord, notes: e.target.value })
                      }
                      rows={2}
                      disabled={isCompleted}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prescription Tab */}
          <TabsContent value="prescription" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Prescrição Médica</CardTitle>
                <CardDescription>
                  Receituário digital com assinatura
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Prescription Type */}
                <div className="space-y-2">
                  <Label htmlFor="prescription_type">Tipo de Receita</Label>
                  <Select
                    value={prescriptionType}
                    onValueChange={setPrescriptionType}
                    disabled={isCompleted}
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

                {/* Medications List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Medicamentos</Label>
                    {!isCompleted && (
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
                          {!isCompleted && (
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
                              disabled={isCompleted}
                            />
                          </div>
                          <div>
                            <Label>Dosagem</Label>
                            <Input
                              value={med.dosage}
                              onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                              placeholder="Ex: 500mg"
                              disabled={isCompleted}
                            />
                          </div>
                          <div>
                            <Label>Frequência</Label>
                            <Input
                              value={med.frequency}
                              onChange={(e) => updateMedication(index, "frequency", e.target.value)}
                              placeholder="Ex: 8/8 horas"
                              disabled={isCompleted}
                            />
                          </div>
                          <div>
                            <Label>Duração</Label>
                            <Input
                              value={med.duration}
                              onChange={(e) => updateMedication(index, "duration", e.target.value)}
                              placeholder="Ex: 7 dias"
                              disabled={isCompleted}
                            />
                          </div>
                          <div>
                            <Label>Quantidade</Label>
                            <Input
                              value={med.quantity}
                              onChange={(e) => updateMedication(index, "quantity", e.target.value)}
                              placeholder="Ex: 1 caixa"
                              disabled={isCompleted}
                            />
                          </div>
                          <div className="col-span-2">
                            <Label>Instruções</Label>
                            <Input
                              value={med.instructions}
                              onChange={(e) => updateMedication(index, "instructions", e.target.value)}
                              placeholder="Ex: Tomar com água"
                              disabled={isCompleted}
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

                {/* Prescription Notes */}
                <div className="space-y-2">
                  <Label htmlFor="prescription_notes">Observações da Receita</Label>
                  <Textarea
                    id="prescription_notes"
                    placeholder="Informações adicionais..."
                    value={prescriptionNotes}
                    onChange={(e) => setPrescriptionNotes(e.target.value)}
                    rows={2}
                    disabled={isCompleted}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TISS/SADT Tab */}
          <TabsContent value="tiss" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Solicitação SADT (TISS)</CardTitle>
                <CardDescription>
                  Guias para exames e procedimentos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* SADT Items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Procedimentos/Exames</Label>
                    {!isCompleted && (
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
                          {!isCompleted && (
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
                              disabled={isCompleted}
                            />
                          </div>
                          <div>
                            <Label>Nome do Procedimento</Label>
                            <Input
                              value={item.procedure_name}
                              onChange={(e) => updateSADTItem(index, "procedure_name", e.target.value)}
                              placeholder="Ex: Hemograma Completo"
                              disabled={isCompleted}
                            />
                          </div>
                          <div>
                            <Label>Quantidade</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateSADTItem(index, "quantity", parseInt(e.target.value) || 1)}
                              disabled={isCompleted}
                            />
                          </div>
                          <div className="col-span-2">
                            <Label>Justificativa</Label>
                            <Textarea
                              value={item.justification}
                              onChange={(e) => updateSADTItem(index, "justification", e.target.value)}
                              placeholder="Justificativa clínica..."
                              rows={2}
                              disabled={isCompleted}
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

                {/* General Justification */}
                {sadtItems.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="sadt_justification">Justificativa Geral</Label>
                    <Textarea
                      id="sadt_justification"
                      placeholder="Justificativa clínica geral para os procedimentos..."
                      value={sadtJustification}
                      onChange={(e) => setSadtJustification(e.target.value)}
                      rows={3}
                      disabled={isCompleted}
                    />
                  </div>
                )}
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
          <h1 className="text-3xl font-bold">Consultas</h1>
          <p className="text-muted-foreground">
            Gerencie seus atendimentos e chame pacientes da fila
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
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
              <p className="text-center text-muted-foreground py-8">Carregando...</p>
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
                        >
                          <Bell className="h-4 w-4 mr-2" />
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
              Atendidos ({completedPatients.length})
            </CardTitle>
            <CardDescription>
              Consultas finalizadas hoje
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Carregando...</p>
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
                    onClick={() => handleViewCompletedConsultation(patient)}
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

