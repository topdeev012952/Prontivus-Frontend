/**
 * Exam Request Modal - Create exam requests with TISS integration
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ExamRequestModalProps {
  consultationId: string;
  patientId: string;
  onClose: () => void;
}

export default function ExamRequestModal({ consultationId, patientId, onClose }: ExamRequestModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [examType, setExamType] = useState("laboratorial");
  const [examName, setExamName] = useState("");
  const [clinicalIndication, setClinicalIndication] = useState("");
  const [urgency, setUrgency] = useState("routine");

  const handleSubmit = async () => {
    if (!examName || !clinicalIndication) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await apiClient.request("/quick-actions/exam-requests/create", {
        method: "POST",
        body: JSON.stringify({
          consultation_id: consultationId,
          patient_id: patientId,
          exam_type: examType,
          exam_name: examName,
          clinical_indication: clinicalIndication,
          urgency
        })
      });

      toast({
        title: "Solicitação criada",
        description: "A solicitação de exame foi gerada com sucesso"
      });

      // Generate PDF
      if (response.exam_request_id) {
        await apiClient.request(`/quick-actions/exam-requests/${response.exam_request_id}/generate-pdf`, {
          method: "POST"
        });
      }

      onClose();
    } catch (error) {
      console.error("Error creating exam request:", error);
      toast({
        title: "Erro",
        description: "Falha ao criar solicitação",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" aria-describedby="exam-description">
        <DialogHeader>
          <DialogTitle>Solicitar Exame</DialogTitle>
          <p id="exam-description" className="sr-only">Formulário para solicitar um exame médico</p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Tipo de Exame *</Label>
            <Select value={examType} onValueChange={setExamType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="laboratorial">Laboratorial</SelectItem>
                <SelectItem value="imagem">Imagem</SelectItem>
                <SelectItem value="procedimento">Procedimento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Nome do Exame *</Label>
            <Input
              placeholder="Ex: Hemograma completo"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
            />
          </div>

          <div>
            <Label>Urgência</Label>
            <Select value={urgency} onValueChange={setUrgency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="routine">Rotina</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="emergency">Emergência</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Indicação Clínica *</Label>
            <Textarea
              placeholder="Descreva a indicação clínica para o exame..."
              value={clinicalIndication}
              onChange={(e) => setClinicalIndication(e.target.value)}
              rows={6}
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
                Gerar Solicitação
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

