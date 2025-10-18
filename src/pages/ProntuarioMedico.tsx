/**
 * Prontuário Médico - Read-only Medical Records Page
 * Displays historical medical records for patients in a read-only format.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, Search, Calendar, User, FileText, Printer, 
  Eye, Loader2, AlertCircle, History, Filter
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import MedicalHistoryTimeline from '@/components/MedicalHistoryTimeline';

interface MedicalRecord {
  id: string;
  consultation_id: string;
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
}

interface Patient {
  id: string;
  name: string;
  birthdate: string;
  cpf: string;
  phone: string;
  insurance_provider: string;
}

export default function ProntuarioMedico() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State
  const [patient, setPatient] = useState<Patient | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  // Load patient and medical records
  useEffect(() => {
    if (patientId) {
      loadPatientData();
    }
  }, [patientId]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      
      // Load patient data
      const patientResponse = await apiClient.request<Patient>(`/patients/${patientId}`);
      setPatient(patientResponse);
      
      // Load medical records
      const recordsResponse = await apiClient.request<{
        items: MedicalRecord[];
        total: number;
        patient_name: string;
      }>(`/consultations/history/${patientId}`);
      
      setMedicalRecords(recordsResponse.items || []);
      
    } catch (error) {
      console.error('Error loading patient data:', error);
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
    try {
      const response = await fetch(`/api/v1/consultations/history/${record.id}/print`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prontuario_${patient?.name}_${record.date}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error printing record:', error);
      toast({
        title: "Erro",
        description: "Erro ao imprimir prontuário",
        variant: "destructive"
      });
    }
  };

  const handlePrintAllRecords = async () => {
    try {
      const response = await fetch(`/api/v1/consultations/history/${patientId}/print-all`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prontuario_completo_${patient?.name}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error printing all records:', error);
      toast({
        title: "Erro",
        description: "Erro ao imprimir prontuário completo",
        variant: "destructive"
      });
    }
  };

  const filteredRecords = medicalRecords.filter(record => {
    const matchesSearch = record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.summary.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !filterDate || record.date === filterDate;
    
    return matchesSearch && matchesDate;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const formatTime = (timeStr: string) => {
    return timeStr;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Carregando prontuário...</span>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Paciente não encontrado</h3>
        <p className="text-gray-600 mb-4">O paciente solicitado não foi encontrado</p>
        <Button onClick={() => navigate('/app/patients')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Pacientes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/app/patients')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Prontuário Médico</h1>
            <p className="text-gray-600">{patient.name} - {patient.cpf}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handlePrintAllRecords}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimir Tudo
          </Button>
        </div>
      </div>

      {/* Patient Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações do Paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Nome</p>
              <p className="text-sm text-gray-600">{patient.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Data de Nascimento</p>
              <p className="text-sm text-gray-600">{formatDate(patient.birthdate)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Convênio</p>
              <p className="text-sm text-gray-600">{patient.insurance_provider || 'Particular'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por diagnóstico, médico ou resumo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-40"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical Records */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Histórico Médico ({filteredRecords.length} registros)
          </h2>
        </div>

        {filteredRecords.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || filterDate ? 'Nenhum registro encontrado' : 'Nenhum registro médico'}
              </h3>
              <p className="text-gray-600">
                {searchTerm || filterDate 
                  ? 'Tente ajustar os filtros de busca'
                  : 'O histórico médico aparecerá aqui após as consultas serem finalizadas'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <Card key={record.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Consulta - {record.chief_complaint || 'Consulta médica'}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(record.datetime)}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {record.doctor_name}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {record.date}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRecord(record)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrintRecord(record)}
                        className="flex items-center gap-1"
                      >
                        <Printer className="h-4 w-4" />
                        Imprimir
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {record.diagnosis && record.diagnosis !== 'N/A' && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Diagnóstico:</p>
                      <p className="text-sm text-gray-600">{record.diagnosis}</p>
                    </div>
                  )}
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">{record.summary}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Detalhes da Consulta</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRecord(null)}
              >
                Fechar
              </Button>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Data</p>
                    <p className="text-sm text-gray-600">{formatDate(selectedRecord.datetime)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Médico</p>
                    <p className="text-sm text-gray-600">{selectedRecord.doctor_name}</p>
                  </div>
                </div>
                
                {selectedRecord.chief_complaint && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Queixa Principal</p>
                    <p className="text-sm text-gray-600">{selectedRecord.chief_complaint}</p>
                  </div>
                )}
                
                {selectedRecord.diagnosis && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Diagnóstico</p>
                    <p className="text-sm text-gray-600">{selectedRecord.diagnosis}</p>
                  </div>
                )}
                
                {selectedRecord.treatment_plan && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Plano de Tratamento</p>
                    <p className="text-sm text-gray-600">{selectedRecord.treatment_plan}</p>
                  </div>
                )}
                
                {selectedRecord.vital_signs && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Sinais Vitais</p>
                    <p className="text-sm text-gray-600">
                      {typeof selectedRecord.vital_signs === 'string' 
                        ? selectedRecord.vital_signs
                        : JSON.stringify(selectedRecord.vital_signs, null, 2)
                      }
                    </p>
                  </div>
                )}
                
                {selectedRecord.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Observações</p>
                    <p className="text-sm text-gray-600">{selectedRecord.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
