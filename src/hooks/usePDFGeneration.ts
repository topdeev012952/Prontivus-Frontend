/**
 * Custom hook for PDF generation and printing
 */

import { useState } from 'react';
import { apiClient } from '@/lib/api';

interface PDFGenerationOptions {
  documentType: string;
  consultationId: string;
  outputType?: 'pdf' | 'base64';
}

interface PDFGenerationResponse {
  success: boolean;
  document_type: string;
  consultation_id: string;
  pdf_url?: string;
  pdf_base64?: string;
  filename: string;
  message: string;
  generated_at: string;
}

export function usePDFGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePDF = async (options: PDFGenerationOptions): Promise<PDFGenerationResponse | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await apiClient.request<PDFGenerationResponse>('/pdf/generate', {
        method: 'POST',
        body: JSON.stringify({
          document_type: options.documentType,
          consultation_id: options.consultationId,
          output_type: options.outputType || 'base64'
        })
      });

      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Falha ao gerar PDF');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao gerar PDF';
      setError(errorMessage);
      console.error('PDF generation error:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const generateConsolidatedPDF = async (consultationId: string): Promise<PDFGenerationResponse | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await apiClient.request<PDFGenerationResponse>('/pdf/generate-consolidated', {
        method: 'POST',
        body: JSON.stringify({
          consultation_id: consultationId,
          output_type: 'base64'
        })
      });

      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Falha ao gerar PDF consolidado');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao gerar PDF consolidado';
      setError(errorMessage);
      console.error('Consolidated PDF generation error:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = (pdfBase64: string, filename: string) => {
    try {
      // Convert base64 to blob
      const byteCharacters = atob(pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError('Erro ao baixar PDF');
    }
  };

  const printPDF = (pdfBase64: string) => {
    try {
      // Convert base64 to blob
      const byteCharacters = atob(pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      // Create object URL and open in new window for printing
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          // Clean up after printing
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
            printWindow.close();
          }, 1000);
        };
      } else {
        throw new Error('Não foi possível abrir a janela de impressão');
      }
    } catch (err) {
      console.error('Error printing PDF:', err);
      setError('Erro ao imprimir PDF');
    }
  };

  const generateAndDownloadPDF = async (options: PDFGenerationOptions) => {
    const result = await generatePDF(options);
    if (result && result.pdf_base64) {
      downloadPDF(result.pdf_base64, result.filename);
    }
  };

  const generateAndPrintPDF = async (options: PDFGenerationOptions) => {
    const result = await generatePDF(options);
    if (result && result.pdf_base64) {
      printPDF(result.pdf_base64);
    }
  };

  const generateAndDownloadConsolidatedPDF = async (consultationId: string) => {
    const result = await generateConsolidatedPDF(consultationId);
    if (result && result.pdf_base64) {
      downloadPDF(result.pdf_base64, result.filename);
    }
  };

  const generateAndPrintConsolidatedPDF = async (consultationId: string) => {
    const result = await generateConsolidatedPDF(consultationId);
    if (result && result.pdf_base64) {
      printPDF(result.pdf_base64);
    }
  };

  return {
    isGenerating,
    error,
    generatePDF,
    generateConsolidatedPDF,
    downloadPDF,
    printPDF,
    generateAndDownloadPDF,
    generateAndPrintPDF,
    generateAndDownloadConsolidatedPDF,
    generateAndPrintConsolidatedPDF
  };
}
