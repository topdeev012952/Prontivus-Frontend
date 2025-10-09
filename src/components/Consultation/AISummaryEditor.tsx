import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Check, X, Sparkles, FileText } from 'lucide-react';

interface Diagnosis {
  description: string;
  cid_code?: string;
  confidence?: number;
}

interface SuggestedExam {
  name: string;
  justification: string;
  selected?: boolean;
}

interface AISummaryData {
  anamnese: string;
  diagnoses: Diagnosis[];
  suggested_exams: SuggestedExam[];
  treatment_plan: string;
}

interface AISummaryEditorProps {
  summaryId: string;
  initialData: AISummaryData;
  transcript: string;
  onAccept: (editedData: AISummaryData) => void;
  onReject: () => void;
  isLoading?: boolean;
}

export function AISummaryEditor({ 
  summaryId, 
  initialData, 
  transcript,
  onAccept, 
  onReject,
  isLoading 
}: AISummaryEditorProps) {
  const [editedData, setEditedData] = useState<AISummaryData>({
    ...initialData,
    suggested_exams: initialData.suggested_exams.map(exam => ({ ...exam, selected: true })),
  });

  const handleDiagnosisChange = (index: number, field: keyof Diagnosis, value: string) => {
    const updated = [...editedData.diagnoses];
    updated[index] = { ...updated[index], [field]: value };
    setEditedData({ ...editedData, diagnoses: updated });
  };

  const handleExamToggle = (index: number) => {
    const updated = [...editedData.suggested_exams];
    updated[index] = { ...updated[index], selected: !updated[index].selected };
    setEditedData({ ...editedData, suggested_exams: updated });
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'secondary';
    if (confidence >= 0.8) return 'default';
    if (confidence >= 0.6) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">Resumo Gerado por IA</h2>
        </div>
        <Badge variant="secondary">ID: {summaryId}</Badge>
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="summary">Resumo Editável</TabsTrigger>
          <TabsTrigger value="transcript">
            <FileText className="h-4 w-4 mr-2" />
            Transcrição
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          {/* Anamnese */}
          <Card>
            <CardHeader>
              <CardTitle>Anamnese</CardTitle>
              <CardDescription>História clínica e queixa principal</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editedData.anamnese}
                onChange={(e) => setEditedData({ ...editedData, anamnese: e.target.value })}
                className="min-h-[150px]"
                placeholder="Anamnese..."
              />
            </CardContent>
          </Card>

          {/* Diagnoses */}
          <Card>
            <CardHeader>
              <CardTitle>Diagnósticos</CardTitle>
              <CardDescription>Hipóteses diagnósticas com códigos CID sugeridos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {editedData.diagnoses.map((diagnosis, index) => (
                <div key={index} className="space-y-2 p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant={getConfidenceColor(diagnosis.confidence)}>
                      {diagnosis.confidence ? `${(diagnosis.confidence * 100).toFixed(0)}%` : 'N/A'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Confiança</span>
                  </div>
                  
                  <div className="grid gap-3">
                    <div>
                      <Label htmlFor={`diagnosis-${index}`}>Descrição</Label>
                      <Input
                        id={`diagnosis-${index}`}
                        value={diagnosis.description}
                        onChange={(e) => handleDiagnosisChange(index, 'description', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`cid-${index}`}>Código CID</Label>
                      <Input
                        id={`cid-${index}`}
                        value={diagnosis.cid_code || ''}
                        onChange={(e) => handleDiagnosisChange(index, 'cid_code', e.target.value)}
                        placeholder="Ex: A00.0"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Suggested Exams */}
          <Card>
            <CardHeader>
              <CardTitle>Exames Sugeridos</CardTitle>
              <CardDescription>Selecione os exames que deseja solicitar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {editedData.suggested_exams.map((exam, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={`exam-${index}`}
                    checked={exam.selected}
                    onCheckedChange={() => handleExamToggle(index)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={`exam-${index}`} className="font-medium cursor-pointer">
                      {exam.name}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">{exam.justification}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Treatment Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Plano de Tratamento</CardTitle>
              <CardDescription>Conduta e orientações</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editedData.treatment_plan}
                onChange={(e) => setEditedData({ ...editedData, treatment_plan: e.target.value })}
                className="min-h-[150px]"
                placeholder="Plano de tratamento..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transcript">
          <Card>
            <CardHeader>
              <CardTitle>Transcrição Completa</CardTitle>
              <CardDescription>Texto transcrito da gravação</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                <p className="whitespace-pre-wrap text-sm">{transcript}</p>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={onReject}
          disabled={isLoading}
          aria-label="Rejeitar resumo"
        >
          <X className="h-4 w-4 mr-2" />
          Rejeitar
        </Button>
        <Button 
          onClick={() => onAccept(editedData)}
          disabled={isLoading}
          aria-label="Aceitar e salvar resumo"
        >
          <Check className="h-4 w-4 mr-2" />
          {isLoading ? 'Salvando...' : 'Aceitar e Salvar'}
        </Button>
      </div>
    </div>
  );
}
