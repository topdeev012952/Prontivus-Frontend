import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, X, FileText, FolderOpen, Download } from 'lucide-react';
import { usePDFGeneration } from '@/hooks/usePDFGeneration';
import { useToast } from '@/hooks/use-toast';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  title: string;
  consultationId?: string;
  documentType?: string;
  onPrint?: () => void;
  onPrintConsolidated?: () => void;
}

export function PrintPreviewModal({ 
  isOpen, 
  onClose, 
  content, 
  title, 
  consultationId,
  documentType = 'receita_simples',
  onPrint,
  onPrintConsolidated 
}: PrintPreviewModalProps) {
  const [printType, setPrintType] = useState<'pdf' | 'direct_print'>('pdf');
  const { toast } = useToast();
  const {
    isGenerating,
    error,
    generateAndDownloadPDF,
    generateAndPrintPDF,
    generateAndDownloadConsolidatedPDF,
    generateAndPrintConsolidatedPDF
  } = usePDFGeneration();

  const handlePrintDocument = async () => {
    if (!consultationId) return;
    
    try {
      if (printType === 'pdf') {
        await generateAndPrintPDF({
          documentType,
          consultationId,
          outputType: 'base64'
        });
      } else {
        // For direct print, we'll still generate PDF but open it for printing
        await generateAndPrintPDF({
          documentType,
          consultationId,
          outputType: 'base64'
        });
      }
      
      toast({
        title: "Sucesso",
        description: "Documento enviado para impressão"
      });
    } catch (error) {
      console.error('Print error:', error);
      toast({
        title: "Erro",
        description: "Falha ao imprimir documento",
        variant: "destructive"
      });
    }
  };

  const handleDownloadDocument = async () => {
    if (!consultationId) return;
    
    try {
      await generateAndDownloadPDF({
        documentType,
        consultationId,
        outputType: 'base64'
      });
      
      toast({
        title: "Sucesso",
        description: "PDF baixado com sucesso"
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Erro",
        description: "Falha ao baixar PDF",
        variant: "destructive"
      });
    }
  };

  const handlePrintConsolidated = async () => {
    if (!consultationId) return;
    
    try {
      if (printType === 'pdf') {
        await generateAndPrintConsolidatedPDF(consultationId);
      } else {
        await generateAndPrintConsolidatedPDF(consultationId);
      }
      
      toast({
        title: "Sucesso",
        description: "Documentos consolidados enviados para impressão"
      });
    } catch (error) {
      console.error('Consolidated print error:', error);
      toast({
        title: "Erro",
        description: "Falha ao imprimir documentos consolidados",
        variant: "destructive"
      });
    }
  };

  const handleDownloadConsolidated = async () => {
    if (!consultationId) return;
    
    try {
      await generateAndDownloadConsolidatedPDF(consultationId);
      
      toast({
        title: "Sucesso",
        description: "PDF consolidado baixado com sucesso"
      });
    } catch (error) {
      console.error('Consolidated download error:', error);
      toast({
        title: "Erro",
        description: "Falha ao baixar PDF consolidado",
        variant: "destructive"
      });
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
            <>
              <Button 
                onClick={handleDownloadConsolidated} 
                className="bg-green-600 hover:bg-green-700"
                disabled={isGenerating}
              >
                <Download className="h-4 w-4 mr-2" />
                {isGenerating ? 'Gerando...' : 'Baixar Tudo'}
              </Button>
              
              <Button 
                onClick={handlePrintConsolidated} 
                className="bg-green-600 hover:bg-green-700"
                disabled={isGenerating}
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                {isGenerating ? 'Imprimindo...' : 'Imprimir Tudo'}
              </Button>
            </>
          )}
          
          <Button 
            onClick={handleDownloadDocument} 
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isGenerating}
          >
            <Download className="h-4 w-4 mr-2" />
            {isGenerating ? 'Gerando...' : 'Baixar PDF'}
          </Button>
          
          <Button 
            onClick={onPrint || handlePrintDocument} 
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isGenerating}
          >
            <Printer className="h-4 w-4 mr-2" />
            {isGenerating ? 'Imprimindo...' : 'Imprimir Documento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
