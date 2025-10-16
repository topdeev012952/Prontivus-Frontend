/**
 * Certificate Modal - Create medical certificates (atestados)
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
import { CID10Autocomplete } from "@/components/CID10Autocomplete";

interface CertificateModalProps {
  consultationId: string;
  patientId: string;
  onClose: () => void;
}

export default function CertificateModal({ consultationId, patientId, onClose }: CertificateModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [certificateType, setCertificateType] = useState("atestado");
  const [content, setContent] = useState("");
  const [daysOff, setDaysOff] = useState("");
  const [cid10Code, setCid10Code] = useState("");

  const handleSubmit = async () => {
    if (!content) {
      toast({
        title: "Erro",
        description: "Preencha o conteúdo do atestado",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await apiClient.request("/quick-actions/certificates/create", {
        method: "POST",
        body: JSON.stringify({
          consultation_id: consultationId,
          patient_id: patientId,
          certificate_type: certificateType,
          content,
          days_off: daysOff || null, // Send as string, not integer
          cid10_code: cid10Code || null
        })
      });

      toast({
        title: "Atestado criado",
        description: "O atestado foi gerado com sucesso"
      });

      // Generate PDF
      if (response.certificate_id) {
        await apiClient.request(`/quick-actions/certificates/${response.certificate_id}/generate-pdf`, {
          method: "POST"
        });
      }

      onClose();
    } catch (error) {
      console.error("Error creating certificate:", error);
      toast({
        title: "Erro",
        description: "Falha ao criar atestado",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" aria-describedby="certificate-description">
        <DialogHeader>
          <DialogTitle>Novo Atestado Médico</DialogTitle>
          <p id="certificate-description" className="sr-only">Formulário para criar um atestado médico</p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Tipo de Documento</Label>
            <Select value={certificateType} onValueChange={setCertificateType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="atestado">Atestado Médico</SelectItem>
                <SelectItem value="declaracao">Declaração de Comparecimento</SelectItem>
                <SelectItem value="laudo">Laudo Médico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {certificateType === "atestado" && (
            <div>
              <Label>Dias de Afastamento</Label>
              <Input
                type="number"
                placeholder="Ex: 3"
                value={daysOff}
                onChange={(e) => setDaysOff(e.target.value)}
              />
            </div>
          )}

          <div>
            <Label>CID-10 (Opcional)</Label>
            <CID10Autocomplete
              onSelect={(code, description) => {
                setCid10Code(code);
              }}
            />
          </div>

          <div>
            <Label>Conteúdo do Atestado *</Label>
            <Textarea
              placeholder="Atesto para os devidos fins que o(a) paciente..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
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
                Gerar Atestado
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

