import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Shield } from 'lucide-react';

interface ConsentModalProps {
  open: boolean;
  onClose: () => void;
  onConsent: () => void;
  patientName: string;
}

export function ConsentModal({ open, onClose, onConsent, patientName }: ConsentModalProps) {
  const [consentGiven, setConsentGiven] = useState(false);

  const handleAccept = () => {
    if (consentGiven) {
      onConsent();
      setConsentGiven(false);
    }
  };

  const handleClose = () => {
    setConsentGiven(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-primary" />
            <DialogTitle>Consentimento de Gravação</DialogTitle>
          </div>
          <DialogDescription className="text-left space-y-3 pt-2">
            <p>
              Esta consulta com <strong>{patientName}</strong> será gravada para fins de:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Transcrição automática e geração de prontuário via IA</li>
              <li>Registro médico e auditoria clínica</li>
              <li>Melhoria da qualidade do atendimento</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              A gravação será armazenada de forma segura e protegida de acordo com a LGPD.
              O paciente tem direito de acessar, retificar ou solicitar a exclusão dos dados.
            </p>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-start space-x-2 py-4">
          <Checkbox 
            id="consent" 
            checked={consentGiven}
            onCheckedChange={(checked) => setConsentGiven(checked === true)}
            aria-label="Concordo com a gravação"
          />
          <Label 
            htmlFor="consent" 
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Confirmo que obtive o consentimento verbal do paciente para esta gravação
          </Label>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleAccept} 
            disabled={!consentGiven}
            aria-label="Aceitar e iniciar gravação"
          >
            Aceitar e Iniciar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
