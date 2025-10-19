import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, X, FileText, FolderOpen } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  title: string;
  consultationId?: string;
  onPrint?: () => void;
  onPrintConsolidated?: () => void;
}

export function PrintPreviewModal({ 
  isOpen, 
  onClose, 
  content, 
  title, 
  consultationId,
  onPrint,
  onPrintConsolidated 
}: PrintPreviewModalProps) {
  const [printType, setPrintType] = useState<'pdf' | 'direct_print'>('pdf');
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrintDocument = async () => {
    if (!consultationId) return;
    
    setIsPrinting(true);
    try {
      const response = await apiClient.request(`/print/document/receita_simples/${consultationId}`, {
        method: 'POST',
        body: JSON.stringify({ output_type: printType })
      });
      
      if (response.success) {
        // Handle successful print
        console.log('Document printed successfully');
      }
    } catch (error) {
      console.error('Print error:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrintConsolidated = async () => {
    if (!consultationId) return;
    
    setIsPrinting(true);
    try {
      const response = await apiClient.request(`/print/consolidated/${consultationId}`, {
        method: 'POST',
        body: JSON.stringify({ output_type: printType })
      });
      
      if (response.success) {
        // Handle successful consolidated print
        console.log('Consolidated documents printed successfully');
      }
    } catch (error) {
      console.error('Consolidated print error:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Impressão de Documentos - {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto border rounded-lg p-4 bg-white">
          <div 
            className="print-content"
            dangerouslySetInnerHTML={{ __html: content }}
            style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: '12px',
              lineHeight: '1.4'
            }}
          />
        </div>
        
        <div className="flex items-center gap-4 p-4 border-t bg-gray-50">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Tipo de Saída:</label>
            <Select value={printType} onValueChange={(value: 'pdf' | 'direct_print') => setPrintType(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="direct_print">Impressão Direta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          
          {consultationId && (
            <Button 
              onClick={handlePrintConsolidated} 
              className="bg-green-600 hover:bg-green-700"
              disabled={isPrinting}
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              {isPrinting ? 'Imprimindo...' : 'Imprimir Tudo'}
            </Button>
          )}
          
          <Button 
            onClick={onPrint || handlePrintDocument} 
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isPrinting}
          >
            <Printer className="h-4 w-4 mr-2" />
            {isPrinting ? 'Imprimindo...' : 'Imprimir Documento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
