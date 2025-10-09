import { useNavigate, useSearchParams } from 'react-router-dom';
import { PrescriptionForm } from '@/components/Prescription/PrescriptionForm';
import { usePrescription } from '@/hooks/usePrescription';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NewPrescription() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patient_id');
  const doctorId = searchParams.get('doctor_id') || 'current-user-id'; // Should come from auth context

  const { create } = usePrescription();

  const handleSubmit = async (data: any) => {
    if (!patientId) return;

    await create.mutateAsync({
      patient_id: patientId,
      doctor_id: doctorId,
      ...data,
    });

    navigate(`/patients/${patientId}`);
  };

  if (!patientId) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card>
          <CardHeader>
            <CardTitle>Erro</CardTitle>
            <CardDescription>Paciente não especificado</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/patients')}>Voltar para Pacientes</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nova Receita</h1>
        <p className="text-muted-foreground mt-1">
          Crie uma nova receita médica para o paciente
        </p>
      </div>

      <PrescriptionForm onSubmit={handleSubmit} isLoading={create.isPending} />
    </div>
  );
}
