import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Thermometer, Weight, User, Activity, Eye, Wind } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface VitalsData {
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  oxygen_saturation?: number;
  respiratory_rate?: number;
  bmi?: number;
  notes?: string;
}

interface CompactVitalsFormProps {
  patientId: string;
  consultationId?: string;
  initialData?: VitalsData;
  onSave?: (vitals: VitalsData) => void;
}

export function CompactVitalsForm({ patientId, consultationId, initialData, onSave }: CompactVitalsFormProps) {
  const [vitals, setVitals] = useState<VitalsData>(initialData || {});
  const [saving, setSaving] = useState(false);

  // Calculate BMI when weight or height changes
  useEffect(() => {
    if (vitals.weight && vitals.height) {
      const heightM = vitals.height / 100;
      const bmi = Math.round((vitals.weight / (heightM * heightM)) * 10) / 10;
      setVitals(prev => ({ ...prev, bmi }));
    }
  }, [vitals.weight, vitals.height]);

  const handleInputChange = (field: keyof VitalsData, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    setVitals(prev => ({ ...prev, [field]: numValue }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const vitalsData = {
        ...vitals,
        patient_id: patientId,
        consultation_id: consultationId
      };

      await apiClient.request('/vitals', {
        method: 'POST',
        body: JSON.stringify(vitalsData)
      });

      toast({
        title: "Sucesso",
        description: "Dados vitais salvos com sucesso!",
      });

      onSave?.(vitals);
    } catch (error) {
      console.error('Erro ao salvar dados vitais:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar dados vitais.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getBMICategory = (bmi?: number) => {
    if (!bmi) return null;
    if (bmi < 18.5) return { label: "Abaixo do peso", color: "bg-blue-100 text-blue-800" };
    if (bmi < 25) return { label: "Peso normal", color: "bg-green-100 text-green-800" };
    if (bmi < 30) return { label: "Sobrepeso", color: "bg-yellow-100 text-yellow-800" };
    return { label: "Obesidade", color: "bg-red-100 text-red-800" };
  };

  const bmiCategory = getBMICategory(vitals.bmi);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Dados Vitais
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* First row - Blood pressure and Heart rate */}
        <div className="grid grid-cols-6 gap-2">
          <div className="col-span-2">
            <Label htmlFor="systolic" className="text-xs text-muted-foreground">PA Sistólica</Label>
            <div className="relative">
              <Input
                id="systolic"
                type="number"
                placeholder="120"
                value={vitals.blood_pressure_systolic || ''}
                onChange={(e) => handleInputChange('blood_pressure_systolic', e.target.value)}
                className="h-8 text-xs pr-8"
              />
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">mmHg</span>
            </div>
          </div>
          <div className="col-span-2">
            <Label htmlFor="diastolic" className="text-xs text-muted-foreground">PA Diastólica</Label>
            <div className="relative">
              <Input
                id="diastolic"
                type="number"
                placeholder="80"
                value={vitals.blood_pressure_diastolic || ''}
                onChange={(e) => handleInputChange('blood_pressure_diastolic', e.target.value)}
                className="h-8 text-xs pr-8"
              />
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">mmHg</span>
            </div>
          </div>
          <div className="col-span-2">
            <Label htmlFor="heart_rate" className="text-xs text-muted-foreground flex items-center gap-1">
              <Heart className="h-3 w-3" />
              FC
            </Label>
            <div className="relative">
              <Input
                id="heart_rate"
                type="number"
                placeholder="72"
                value={vitals.heart_rate || ''}
                onChange={(e) => handleInputChange('heart_rate', e.target.value)}
                className="h-8 text-xs pr-8"
              />
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">bpm</span>
            </div>
          </div>
        </div>

        {/* Second row - Temperature, Weight, Height */}
        <div className="grid grid-cols-6 gap-2">
          <div className="col-span-2">
            <Label htmlFor="temperature" className="text-xs text-muted-foreground flex items-center gap-1">
              <Thermometer className="h-3 w-3" />
              Temperatura
            </Label>
            <div className="relative">
              <Input
                id="temperature"
                type="number"
                step="0.1"
                placeholder="36.5"
                value={vitals.temperature || ''}
                onChange={(e) => handleInputChange('temperature', e.target.value)}
                className="h-8 text-xs pr-8"
              />
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">°C</span>
            </div>
          </div>
          <div className="col-span-2">
            <Label htmlFor="weight" className="text-xs text-muted-foreground flex items-center gap-1">
              <Weight className="h-3 w-3" />
              Peso
            </Label>
            <div className="relative">
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="70.0"
                value={vitals.weight || ''}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                className="h-8 text-xs pr-8"
              />
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">kg</span>
            </div>
          </div>
          <div className="col-span-2">
            <Label htmlFor="height" className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" />
              Altura
            </Label>
            <div className="relative">
              <Input
                id="height"
                type="number"
                placeholder="170"
                value={vitals.height || ''}
                onChange={(e) => handleInputChange('height', e.target.value)}
                className="h-8 text-xs pr-8"
              />
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">cm</span>
            </div>
          </div>
        </div>

        {/* Third row - Oxygen saturation, Respiratory rate, BMI */}
        <div className="grid grid-cols-6 gap-2">
          <div className="col-span-2">
            <Label htmlFor="oxygen" className="text-xs text-muted-foreground flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Sat O₂
            </Label>
            <div className="relative">
              <Input
                id="oxygen"
                type="number"
                placeholder="98"
                value={vitals.oxygen_saturation || ''}
                onChange={(e) => handleInputChange('oxygen_saturation', e.target.value)}
                className="h-8 text-xs pr-8"
              />
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">%</span>
            </div>
          </div>
          <div className="col-span-2">
            <Label htmlFor="respiratory" className="text-xs text-muted-foreground flex items-center gap-1">
              <Wind className="h-3 w-3" />
              FR
            </Label>
            <div className="relative">
              <Input
                id="respiratory"
                type="number"
                placeholder="16"
                value={vitals.respiratory_rate || ''}
                onChange={(e) => handleInputChange('respiratory_rate', e.target.value)}
                className="h-8 text-xs pr-8"
              />
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">/min</span>
            </div>
          </div>
          <div className="col-span-2">
            <Label className="text-xs text-muted-foreground">IMC</Label>
            <div className="h-8 flex items-center justify-between px-3 border rounded-md bg-muted">
              <span className="text-xs font-medium">
                {vitals.bmi ? vitals.bmi.toFixed(1) : '--'}
              </span>
              {bmiCategory && (
                <Badge className={`text-xs ${bmiCategory.color}`}>
                  {bmiCategory.label}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <Label htmlFor="notes" className="text-xs text-muted-foreground">Observações</Label>
          <Input
            id="notes"
            placeholder="Observações adicionais..."
            value={vitals.notes || ''}
            onChange={(e) => setVitals(prev => ({ ...prev, notes: e.target.value }))}
            className="h-8 text-xs"
          />
        </div>

        {/* Save button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          size="sm"
          className="h-8 text-xs mr-1"
        >
          {saving ? "Salvando..." : "Salvar Sinais Vitais"}
        </Button>
      </CardContent>
    </Card>
  );
}
