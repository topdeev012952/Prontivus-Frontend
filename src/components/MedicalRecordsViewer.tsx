/**
 * Medical Records Viewer Component
 * Displays patient medical records with proper data fetching and error handling
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, User, FileText, Printer, 
  Eye, Loader2, AlertCircle, History, Filter, Search
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { PrintPreviewModal } from '@/components/PrintPreviewModal';

interface MedicalRecord {
  id: string;
  consultation_id?: string;
  date: string;
  time: string;
  datetime: string;
  doctor_name: string;
  diagnosis: string;
  diagnosis_code?: string;
  summary: string;
  chief_complaint?: string;
  treatment_plan?: string;
  vital_signs?: any;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface Patient {
  id: string;
  name: string;
  birthdate: string;
  cpf: string;
  phone: string;
  insurance_provider: string;
}

interface MedicalRecordsViewerProps {
  patientId: string;
  patient?: Patient;
  onClose?: () => void;
}

export function MedicalRecordsViewer({ patientId, patient, onClose }: MedicalRecordsViewerProps) {
  const { toast } = useToast();
  
  // State
  const [patientData, setPatientData] = useState<Patient | null>(patient || null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Load patient and medical records
  useEffect(() => {
    if (patientId) {
      loadPatientData();
    }
  }, [patientId]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load patient data if not provided
      if (!patientData) {
        try {
          const patientResponse = await apiClient.request<Patient>(`/patients/${patientId}`);
          setPatientData(patientResponse);
        } catch (patientError) {
          console.warn('Could not load patient data:', patientError);
          // Continue without patient data
        }
      }
      
      // Load medical records from multiple endpoints
      const recordsPromises = [
        // Try consultation history endpoint
        apiClient.request<{ items: MedicalRecord[]; total: number }>(`/consultations/history/${patientId}`).catch(() => ({ items: [] })),
        // Try medical records endpoint
        apiClient.request<{ items: MedicalRecord[]; total: number }>(`/medical_records/patient/${patientId}`).catch(() => ({ items: [] })),
        // Try consultation finalization endpoint
        apiClient.request<{ timeline: MedicalRecord[] }>(`/consultation_finalization/history/${patientId}`).catch(() => ({ timeline: [] }))
      ];
      
      const [consultationHistory, medicalRecordsResponse, finalizationHistory] = await Promise.all(recordsPromises);
      
      // Combine all records
      const allRecords = [
        ...(consultationHistory.items || []),
        ...(medicalRecordsResponse.items || []),
        ...(finalizationHistory.timeline || [])
      ];
      
      // Remove duplicates based on ID and sort by date
      const uniqueRecords = allRecords.reduce((acc, record) => {
        const existingIndex = acc.findIndex(r => r.id === record.id);
        if (existingIndex === -1) {
          acc.push(record);
        } else {
          // Merge data if needed
          acc[existingIndex] = { ...acc[existingIndex], ...record };
        }
        return acc;
      }, [] as MedicalRecord[]);
      
      // Sort by date (newest first)
      uniqueRecords.sort((a, b) => {
        const dateA = new Date(a.date || a.created_at || a.datetime);
        const dateB = new Date(b.date || b.created_at || b.datetime);
        return dateB.getTime() - dateA.getTime();
      });
      
      setMedicalRecords(uniqueRecords);
      
    } catch (error) {
      console.error('Error loading patient data:', error);
      setError('Erro ao carregar dados do paciente');
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do paciente",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrintRecord = async (record: MedicalRecord) => {
    if (record.consultation_id) {
      setSelectedRecord(record);
      setShowPrintModal(true);
    } else {
      toast({
        title: "Aviso",
        description: "Este registro não possui consulta associada para impressão",
        variant: "destructive"
      });
    }
  };

  const handleViewRecord = (record: MedicalRecord) => {
    setSelectedRecord(record);
    // You can implement a detailed view modal here
    toast({
      title: "Visualizar Registro",
      description: `Visualizando registro de ${record.date}`,
    });
  };

  // Filter records based on search and date
  const filteredRecords = medicalRecords.filter(record => {
    const matchesSearch = !searchTerm || 
      record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.summary.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !filterDate || 
      record.date === filterDate ||
      record.datetime?.startsWith(filterDate) ||
      record.created_at?.startsWith(filterDate);
    
    return matchesSearch && matchesDate;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando prontuário...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <span className="ml-2 text-destructive">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Prontuário Médico</h2>
          {patientData && (
            <p className="text-muted-foreground">
              {patientData.name} • {patientData.cpf}
            </p>
          )}
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por diagnóstico, médico ou resumo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Input
          type="date"
          placeholder="Filtrar por data"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="w-48"
        />
      </div>

      {/* Records List */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-4">
          {filteredRecords.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    {medicalRecords.length === 0 
                      ? 'Nenhum registro médico encontrado' 
                      : 'Nenhum registro corresponde aos filtros aplicados'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredRecords.map((record, index) => (
              <Card key={record.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-lg">
                          {record.date || new Date(record.created_at).toLocaleDateString('pt-BR')}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {record.time || new Date(record.created_at).toLocaleTimeString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewRecord(record)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      {record.consultation_id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrintRecord(record)}
                        >
                          <Printer className="h-4 w-4 mr-1" />
                          Imprimir
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{record.doctor_name}</span>
                    </div>
                    
                    {record.diagnosis && (
                      <div>
                        <Badge variant="secondary" className="mb-2">
                          Diagnóstico
                        </Badge>
                        <p className="text-sm">{record.diagnosis}</p>
                        {record.diagnosis_code && (
                          <p className="text-xs text-muted-foreground mt-1">
                            CID: {record.diagnosis_code}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {record.summary && (
                      <div>
                        <Badge variant="outline" className="mb-2">
                          Resumo
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {record.summary.length > 200 
                            ? `${record.summary.substring(0, 200)}...` 
                            : record.summary
                          }
                        </p>
                      </div>
                    )}
                    
                    {record.treatment_plan && (
                      <div>
                        <Badge variant="outline" className="mb-2">
                          Plano de Tratamento
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {record.treatment_plan.length > 150 
                            ? `${record.treatment_plan.substring(0, 150)}...` 
                            : record.treatment_plan
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Print Modal */}
      {showPrintModal && selectedRecord && (
        <PrintPreviewModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          content={`<h2>Registro Médico</h2><p>Data: ${selectedRecord.date}</p><p>Médico: ${selectedRecord.doctor_name}</p><p>Diagnóstico: ${selectedRecord.diagnosis}</p><p>Resumo: ${selectedRecord.summary}</p>`}
          title={`Registro - ${selectedRecord.date}`}
          consultationId={selectedRecord.consultation_id}
          documentType="atestado"
        />
      )}
    </div>
  );
}
