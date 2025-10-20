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
import { MedicalRecordsViewer } from '@/components/MedicalRecordsViewer';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load patient data
  useEffect(() => {
    if (patientId) {
      loadPatientData();
    }
  }, [patientId]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load patient data
      const patientResponse = await apiClient.request<Patient>(`/patients/${patientId}`);
      setPatient(patientResponse);
      
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando dados do paciente...</span>
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

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-96">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <span className="ml-2 text-destructive">Paciente não encontrado</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Prontuário Médico</h1>
          <p className="text-muted-foreground">
            Visualização de registros médicos - {patient.name}
          </p>
        </div>
      </div>

      {/* Patient Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações do Paciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nome</p>
              <p className="text-lg">{patient.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">CPF</p>
              <p className="text-lg">{patient.cpf}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Convênio</p>
              <p className="text-lg">{patient.insurance_provider || 'Particular'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical Records Viewer */}
      <MedicalRecordsViewer 
        patientId={patientId!} 
        patient={patient}
      />
    </div>
  );
}