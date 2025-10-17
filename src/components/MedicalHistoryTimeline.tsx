import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, Stethoscope, Eye, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ConsultationHistoryItem {
  id: string;
  date: string;
  doctor_name: string;
  diagnosis?: string;
  summary: string;
  chief_complaint?: string;
  anamnesis?: string;
  evolucao?: string;
}

interface MedicalHistoryTimelineProps {
  consultations: ConsultationHistoryItem[];
  onViewDetails: (consultation: ConsultationHistoryItem) => void;
  onPrintHistory: () => void;
}

export function MedicalHistoryTimeline({ 
  consultations, 
  onViewDetails, 
  onPrintHistory 
}: MedicalHistoryTimelineProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "HH:mm", { locale: ptBR });
    } catch {
      return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-blue-600" />
            Histórico de Consultas
          </h3>
          <p className="text-sm text-muted-foreground">
            {consultations.length} consulta{consultations.length !== 1 ? 's' : ''} registrada{consultations.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button 
          onClick={onPrintHistory}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Imprimir Histórico
        </Button>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-blue-200"></div>
        
        <div className="space-y-6">
          {consultations.map((consultation, index) => (
            <div key={consultation.id} className="relative flex items-start">
              {/* Timeline dot */}
              <div className="relative z-10 flex items-center justify-center w-16 h-16 bg-white border-4 border-blue-600 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              
              {/* Content card */}
              <div className={`ml-6 flex-1 ${index % 2 === 0 ? 'mr-0' : 'mr-16'}`}>
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span className="text-blue-600">
                          📅 {formatDate(consultation.date)} às {formatTime(consultation.date)}
                        </span>
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        Consulta
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {/* Doctor info */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Dr(a). {consultation.doctor_name}</span>
                    </div>
                    
                    {/* Chief complaint */}
                    {consultation.chief_complaint && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-700">Queixa Principal:</p>
                        <p className="text-sm text-gray-600 pl-2 border-l-2 border-blue-200">
                          {consultation.chief_complaint}
                        </p>
                      </div>
                    )}
                    
                    {/* Diagnosis */}
                    {consultation.diagnosis && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-700">Diagnóstico:</p>
                        <p className="text-sm text-gray-600 pl-2 border-l-2 border-green-200">
                          {consultation.diagnosis}
                        </p>
                      </div>
                    )}
                    
                    {/* Summary */}
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-700">Resumo:</p>
                      <p className="text-sm text-gray-600 pl-2 border-l-2 border-gray-200">
                        {consultation.summary}
                      </p>
                    </div>
                    
                    {/* Action button */}
                    <div className="pt-2">
                      <Button
                        onClick={() => onViewDetails(consultation)}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {consultations.length === 0 && (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Stethoscope className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma consulta registrada</h3>
            <p className="text-muted-foreground">
              O histórico de consultas aparecerá aqui após as consultas serem finalizadas.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
