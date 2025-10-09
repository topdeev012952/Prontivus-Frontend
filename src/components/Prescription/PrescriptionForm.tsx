import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { PrescriptionType, PrescriptionItem } from '@/hooks/usePrescription';

const prescriptionItemSchema = z.object({
  drug_name: z.string().min(1, 'Nome do medicamento é obrigatório').max(200),
  dosage: z.string().min(1, 'Dosagem é obrigatória').max(100),
  frequency: z.string().min(1, 'Frequência é obrigatória').max(100),
  duration: z.string().min(1, 'Duração é obrigatória').max(100),
  route: z.string().min(1, 'Via de administração é obrigatória').max(50),
  notes: z.string().max(500).optional(),
});

const prescriptionSchema = z.object({
  type: z.enum(['simple', 'antimicrobial', 'controlled_c1']),
  items: z.array(prescriptionItemSchema).min(1, 'Adicione pelo menos um medicamento'),
  notes: z.string().max(1000).optional(),
});

type PrescriptionFormData = z.infer<typeof prescriptionSchema>;

interface PrescriptionFormProps {
  onSubmit: (data: { type: PrescriptionType; items: PrescriptionItem[]; notes?: string }) => void;
  isLoading?: boolean;
}

export function PrescriptionForm({ onSubmit, isLoading }: PrescriptionFormProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PrescriptionFormData>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      type: 'simple',
      items: [{ drug_name: '', dosage: '', frequency: '', duration: '', route: 'oral', notes: '' }],
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const prescriptionType = watch('type');

  const handleFormSubmit = (data: PrescriptionFormData) => {
    onSubmit({
      type: data.type,
      items: data.items as PrescriptionItem[],
      notes: data.notes,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Receita</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select
              value={prescriptionType}
              onValueChange={(value) => {
                const event = { target: { name: 'type', value } };
                register('type').onChange(event);
              }}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">Receita Simples</SelectItem>
                <SelectItem value="antimicrobial">Receita de Antimicrobiano</SelectItem>
                <SelectItem value="controlled_c1">Receita de Controle Especial (C1)</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
          </div>

          {prescriptionType === 'antimicrobial' && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Antimicrobianos requerem justificativa clínica conforme RDC 471/2021
              </AlertDescription>
            </Alert>
          )}

          {prescriptionType === 'controlled_c1' && (
            <Alert className="mt-4" variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Medicamentos controlados C1 serão emitidos em duas vias conforme legislação
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Medications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Medicamentos</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({ drug_name: '', dosage: '', frequency: '', duration: '', route: 'oral', notes: '' })
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Medicamento
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Medicamento {index + 1}</h4>
                {fields.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`items.${index}.drug_name`}>Nome do Medicamento *</Label>
                  <Input
                    id={`items.${index}.drug_name`}
                    {...register(`items.${index}.drug_name`)}
                    placeholder="Ex: Dipirona"
                  />
                  {errors.items?.[index]?.drug_name && (
                    <p className="text-sm text-destructive">{errors.items[index].drug_name?.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`items.${index}.dosage`}>Dosagem *</Label>
                  <Input
                    id={`items.${index}.dosage`}
                    {...register(`items.${index}.dosage`)}
                    placeholder="Ex: 500mg"
                  />
                  {errors.items?.[index]?.dosage && (
                    <p className="text-sm text-destructive">{errors.items[index].dosage?.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`items.${index}.frequency`}>Frequência *</Label>
                  <Input
                    id={`items.${index}.frequency`}
                    {...register(`items.${index}.frequency`)}
                    placeholder="Ex: 8/8 horas"
                  />
                  {errors.items?.[index]?.frequency && (
                    <p className="text-sm text-destructive">{errors.items[index].frequency?.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`items.${index}.duration`}>Duração *</Label>
                  <Input
                    id={`items.${index}.duration`}
                    {...register(`items.${index}.duration`)}
                    placeholder="Ex: 7 dias"
                  />
                  {errors.items?.[index]?.duration && (
                    <p className="text-sm text-destructive">{errors.items[index].duration?.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`items.${index}.route`}>Via de Administração *</Label>
                  <Select
                    value={watch(`items.${index}.route`)}
                    onValueChange={(value) => {
                      const event = { target: { name: `items.${index}.route`, value } };
                      register(`items.${index}.route`).onChange(event);
                    }}
                  >
                    <SelectTrigger id={`items.${index}.route`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oral">Oral</SelectItem>
                      <SelectItem value="sublingual">Sublingual</SelectItem>
                      <SelectItem value="intramuscular">Intramuscular</SelectItem>
                      <SelectItem value="intravenous">Intravenosa</SelectItem>
                      <SelectItem value="topical">Tópica</SelectItem>
                      <SelectItem value="ocular">Ocular</SelectItem>
                      <SelectItem value="nasal">Nasal</SelectItem>
                      <SelectItem value="rectal">Retal</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.items?.[index]?.route && (
                    <p className="text-sm text-destructive">{errors.items[index].route?.message}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={`items.${index}.notes`}>Observações</Label>
                  <Textarea
                    id={`items.${index}.notes`}
                    {...register(`items.${index}.notes`)}
                    placeholder="Informações adicionais sobre este medicamento"
                    rows={2}
                  />
                  {errors.items?.[index]?.notes && (
                    <p className="text-sm text-destructive">{errors.items[index].notes?.message}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {errors.items && typeof errors.items === 'object' && 'message' in errors.items && (
            <p className="text-sm text-destructive">{errors.items.message as string}</p>
          )}
        </CardContent>
      </Card>

      {/* General Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Observações Gerais</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            {...register('notes')}
            placeholder="Instruções gerais, orientações ao paciente..."
            rows={4}
          />
          {errors.notes && <p className="text-sm text-destructive mt-2">{errors.notes.message}</p>}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar Receita'}
        </Button>
      </div>
    </form>
  );
}
