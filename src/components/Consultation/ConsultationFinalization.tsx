/**
 * Consultation Finalization Component
 * Handles the finalization of consultations with automatic history generation
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CheckCircle, Save, AlertCircle, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ConsultationFinalizationProps {
  consultationId: string;
  patientId: string;
  onFinalizationComplete: () => void;
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    anamnesis?: string;
    diagnosis?: string;
    exams?: any[];
    prescriptions?: any[];
    observations?: string;
  };
}

export default function ConsultationFinalization({
  consultationId,
  patientId,
  onFinalizationComplete,
  isOpen,
  onClose,
  initialData
}: ConsultationFinalizationProps) {
  const [formData, setFormData] = useState({
    anamnesis: initialData?.anamnesis || '',
    diagnosis: initialData?.diagnosis || '',
    exams: initialData?.exams || [],
    prescriptions: initialData?.prescriptions || [],
    observations: initialData?.observations || '',
    finalization_notes: ''
  });
  
  const [isFinalizing, setIsFinalizing] = useState(false);
  const { toast } = useToast();

  const handleFinalize = async () => {
    if (!formData.anamnesis || !formData.diagnosis) {
      toast({
        title: "Campos obrigatórios",
        description: "Anamnese e Diagnóstico são obrigatórios para finalizar a consulta.",
        variant: "destructive"
      });
      return;
    }

    setIsFinalizing(true);
    
    try {
      const response = await apiClient.request(`/consultation_finalization/finalize/${consultationId}`, {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (response.success) {
        toast({
          title: "Consulta finalizada",
          description: "A consulta foi finalizada com sucesso e o histórico foi gerado automaticamente.",
        });
        
        onFinalizationComplete();
        onClose();
      }
    } catch (error: any) {
      toast({
        title: "Erro ao finalizar",
        description: error.message || "Erro ao finalizar a consulta. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Finalizar Consulta
          </DialogTitle>
          <DialogDescription>
            Revise e confirme os dados da consulta para gerar o histórico médico.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Anamnese */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Anamnese</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.anamnesis}
                onChange={(e) => setFormData(prev => ({ ...prev, anamnesis: e.target.value }))}
                placeholder="Descreva a anamnese completa..."
                className="min-h-[100px]"
                required
              />
            </CardContent>
          </Card>

          {/* Diagnóstico */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Diagnóstico</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.diagnosis}
                onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                placeholder="Descreva o diagnóstico principal..."
                className="min-h-[80px]"
                required
              />
            </CardContent>
          </Card>

          {/* Observações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.observations}
                onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                placeholder="Observações adicionais..."
                className="min-h-[80px]"
              />
            </CardContent>
          </Card>

          {/* Notas de Finalização */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notas de Finalização</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.finalization_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, finalization_notes: e.target.value }))}
                placeholder="Notas específicas para o histórico médico..."
                className="min-h-[80px]"
              />
            </CardContent>
          </Card>

          {/* Resumo dos Dados */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg text-blue-800">Resumo da Finalização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-blue-700">
              <p><strong>Paciente ID:</strong> {patientId}</p>
              <p><strong>Consulta ID:</strong> {consultationId}</p>
              <p><strong>Exames solicitados:</strong> {formData.exams.length}</p>
              <p><strong>Prescrições:</strong> {formData.prescriptions.length}</p>
              <p className="text-xs text-blue-600 mt-2">
                ⚠️ Após a finalização, um registro histórico será criado automaticamente 
                e ficará visível no timeline do paciente.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isFinalizing}>
            Cancelar
          </Button>
          <Button 
            onClick={handleFinalize} 
            disabled={isFinalizing || !formData.anamnesis || !formData.diagnosis}
            className="bg-green-600 hover:bg-green-700"
          >
            {isFinalizing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Finalizando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Finalizar Consulta
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
