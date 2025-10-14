/**
 * Referral Modal - Create referrals to other specialists
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

interface ReferralModalProps {
  consultationId: string;
  patientId: string;
  onClose: () => void;
}

export default function ReferralModal({ consultationId, patientId, onClose }: ReferralModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [specialty, setSpecialty] = useState("");
  const [reason, setReason] = useState("");
  const [urgency, setUrgency] = useState("routine");
  const [referredToDoctor, setReferredToDoctor] = useState("");
  const [referredToClinic, setReferredToClinic] = useState("");

  const handleSubmit = async () => {
    if (!specialty || !reason) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await apiClient.request("/quick-actions/referrals/create", {
        method: "POST",
        body: JSON.stringify({
          consultation_id: consultationId,
          patient_id: patientId,
          specialty,
          reason,
          urgency,
          referred_to_doctor: referredToDoctor || null,
          referred_to_clinic: referredToClinic || null
        })
      });

      toast({
        title: "Encaminhamento criado",
        description: "O encaminhamento foi gerado com sucesso"
      });

      // Generate PDF
      if (response.referral_id) {
        await apiClient.request(`/quick-actions/referrals/${response.referral_id}/generate-pdf`, {
          method: "POST"
        });
      }

      onClose();
    } catch (error) {
      console.error("Error creating referral:", error);
      toast({
        title: "Erro",
        description: "Falha ao criar encaminhamento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" aria-describedby="referral-description">
        <DialogHeader>
          <DialogTitle>Novo Encaminhamento</DialogTitle>
          <p id="referral-description" className="sr-only">Formulário para criar um encaminhamento médico</p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Especialidade *</Label>
            <Select value={specialty} onValueChange={setSpecialty}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a especialidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cardiologia">Cardiologia</SelectItem>
                <SelectItem value="dermatologia">Dermatologia</SelectItem>
                <SelectItem value="endocrinologia">Endocrinologia</SelectItem>
                <SelectItem value="gastroenterologia">Gastroenterologia</SelectItem>
                <SelectItem value="ginecologia">Ginecologia</SelectItem>
                <SelectItem value="neurologia">Neurologia</SelectItem>
                <SelectItem value="oftalmologia">Oftalmologia</SelectItem>
                <SelectItem value="ortopedia">Ortopedia</SelectItem>
                <SelectItem value="otorrinolaringologia">Otorrinolaringologia</SelectItem>
                <SelectItem value="pediatria">Pediatria</SelectItem>
                <SelectItem value="pneumologia">Pneumologia</SelectItem>
                <SelectItem value="psiquiatria">Psiquiatria</SelectItem>
                <SelectItem value="urologia">Urologia</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
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
            <Label>Médico de Destino (Opcional)</Label>
            <Input
              placeholder="Nome do médico"
              value={referredToDoctor}
              onChange={(e) => setReferredToDoctor(e.target.value)}
            />
          </div>

          <div>
            <Label>Clínica/Hospital de Destino (Opcional)</Label>
            <Input
              placeholder="Nome da instituição"
              value={referredToClinic}
              onChange={(e) => setReferredToClinic(e.target.value)}
            />
          </div>

          <div>
            <Label>Motivo do Encaminhamento *</Label>
            <Textarea
              placeholder="Descreva o motivo do encaminhamento e informações relevantes..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
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
                Gerar Encaminhamento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

