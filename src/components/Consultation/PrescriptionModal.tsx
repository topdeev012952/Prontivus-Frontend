/**
 * Prescription Modal - Create prescriptions with multiple medications
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Loader2, Download } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Medication {
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  instructions: string;
}

interface PrescriptionModalProps {
  consultationId: string;
  patientId: string;
  onClose: () => void;
}

export default function PrescriptionModal({ consultationId, patientId, onClose }: PrescriptionModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([{
    medication_name: "",
    dosage: "",
    frequency: "",
    duration: "",
    route: "oral",
    instructions: ""
  }]);
  const [notes, setNotes] = useState("");

  const addMedication = () => {
    setMedications([...medications, {
      medication_name: "",
      dosage: "",
      frequency: "",
      duration: "",
      route: "oral",
      instructions: ""
    }]);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  };

  const handleSubmit = async () => {
    // Validation
    const invalidMeds = medications.filter(m => !m.medication_name || !m.dosage || !m.frequency || !m.duration);
    if (invalidMeds.length > 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios dos medicamentos",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await apiClient.request("/quick-actions/prescriptions/create", {
        method: "POST",
        body: JSON.stringify({
          consultation_id: consultationId,
          patient_id: patientId,
          items: medications,
          notes
        })
      });

      toast({
        title: "Receita criada",
        description: "A receita foi gerada com sucesso"
      });

      // Generate and download PDF
      if (response.prescription_id) {
        try {
          // Generate PDF
          await apiClient.request(`/quick-actions/prescriptions/${response.prescription_id}/generate-pdf`, {
            method: "POST"
          });
          
          // Download the PDF
          const pdfResponse = await fetch(`${import.meta.env.VITE_API_URL || 'https://prontivus-backend-wnw2.onrender.com/api/v1'}/prescriptions/${response.prescription_id}/pdf`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
          });
          
          if (pdfResponse.ok) {
            const blob = await pdfResponse.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Prescricao_${response.prescription_id}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);
          }
        } catch (pdfError) {
          console.error("Error generating PDF:", pdfError);
          // Don't show error to user, PDF generation is optional
        }
      }

      onClose();
    } catch (error) {
      console.error("Error creating prescription:", error);
      toast({
        title: "Erro",
        description: "Falha ao criar receita",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="prescription-description">
        <DialogHeader>
          <DialogTitle>Nova Receita Médica</DialogTitle>
          <p id="prescription-description" className="sr-only">Formulário para criar uma nova receita médica com medicamentos</p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {medications.map((med, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Medicamento {index + 1}</h4>
                {medications.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeMedication(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nome do Medicamento *</Label>
                  <Input
                    placeholder="Ex: Dipirona"
                    value={med.medication_name}
                    onChange={(e) => updateMedication(index, "medication_name", e.target.value)}
                  />
                </div>

                <div>
                  <Label>Dosagem *</Label>
                  <Input
                    placeholder="Ex: 500mg"
                    value={med.dosage}
                    onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                  />
                </div>

                <div>
                  <Label>Via de Administração *</Label>
                  <Select
                    value={med.route}
                    onValueChange={(value) => updateMedication(index, "route", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oral">Oral</SelectItem>
                      <SelectItem value="intravenosa">Intravenosa</SelectItem>
                      <SelectItem value="intramuscular">Intramuscular</SelectItem>
                      <SelectItem value="subcutanea">Subcutânea</SelectItem>
                      <SelectItem value="topica">Tópica</SelectItem>
                      <SelectItem value="inalatoria">Inalatória</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Frequência *</Label>
                  <Input
                    placeholder="Ex: 8/8h ou 3x ao dia"
                    value={med.frequency}
                    onChange={(e) => updateMedication(index, "frequency", e.target.value)}
                  />
                </div>

                <div>
                  <Label>Duração *</Label>
                  <Input
                    placeholder="Ex: 7 dias ou uso contínuo"
                    value={med.duration}
                    onChange={(e) => updateMedication(index, "duration", e.target.value)}
                  />
                </div>

                <div className="col-span-2">
                  <Label>Instruções Adicionais</Label>
                  <Textarea
                    placeholder="Ex: Tomar após as refeições"
                    value={med.instructions}
                    onChange={(e) => updateMedication(index, "instructions", e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            className="w-full"
            onClick={addMedication}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Medicamento
          </Button>

          <div>
            <Label>Observações Gerais</Label>
            <Textarea
              placeholder="Observações adicionais sobre a prescrição..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Gerar Receita
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

