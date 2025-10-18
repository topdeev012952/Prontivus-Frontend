/**
 * Medical History Timeline Component for Prontivus.
 * Displays patient consultation history in a professional timeline format.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Calendar, User, FileText, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineItem {
  id: string;
  date: string;
  time: string;
  datetime: string;
  title: string;
  doctor_name: string;
  diagnosis: string;
  summary: string;
  is_expanded: boolean;
  details: {
    chief_complaint?: string;
    diagnosis?: string;
    diagnosis_code?: string;
    treatment_plan?: string;
    vital_signs?: any;
  };
}

interface MedicalHistoryTimelineProps {
  patientName: string;
  timeline: TimelineItem[];
  totalConsultations: number;
  onPrintHistory?: () => void;
  onViewDetails?: (item: TimelineItem) => void;
  className?: string;
}

export default function MedicalHistoryTimeline({
  patientName,
  timeline,
  totalConsultations,
  onPrintHistory,
  onViewDetails,
  className
}: MedicalHistoryTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr;
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Histórico Médico - {patientName}
          </h3>
          <p className="text-sm text-gray-600">
            {totalConsultations} consulta{totalConsultations !== 1 ? 's' : ''} registrada{totalConsultations !== 1 ? 's' : ''}
          </p>
        </div>
        {onPrintHistory && (
          <Button
            onClick={onPrintHistory}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimir Histórico
          </Button>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-blue-200"></div>

        {/* Timeline items */}
        <div className="space-y-8">
          {timeline.map((item, index) => {
            const isExpanded = expandedItems.has(item.id);
            const isLeft = index % 2 === 0;

            return (
              <div
                key={item.id}
                className={cn(
                  "relative flex items-start",
                  isLeft ? "flex-row" : "flex-row-reverse"
                )}
              >
                {/* Timeline dot */}
                <div className="relative z-10 flex items-center justify-center w-16 h-16 bg-white border-4 border-blue-500 rounded-full shadow-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>

                {/* Content card */}
                <div className={cn(
                  "flex-1 mx-8",
                  isLeft ? "ml-12" : "mr-12"
                )}>
                  <Card className={cn(
                    "transition-all duration-200 hover:shadow-md",
                    isLeft ? "ml-0" : "mr-0"
                  )}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base font-medium text-gray-900 mb-2">
                            {item.title}
                          </CardTitle>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(item.datetime)}
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {item.doctor_name}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {item.date}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpanded(item.id)}
                            className="h-8 w-8 p-0"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      {/* Diagnosis */}
                      {item.diagnosis && item.diagnosis !== 'N/A' && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Diagnóstico:
                          </p>
                          <p className="text-sm text-gray-600">
                            {item.diagnosis}
                          </p>
                        </div>
                      )}

                      {/* Summary */}
                      <div className="mb-3">
                        <p className="text-sm text-gray-600">
                          {item.summary}
                        </p>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                          {/* Chief complaint */}
                          {item.details.chief_complaint && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-1">
                                Queixa Principal:
                              </p>
                              <p className="text-sm text-gray-600">
                                {item.details.chief_complaint}
                              </p>
                            </div>
                          )}

                          {/* Treatment plan */}
                          {item.details.treatment_plan && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-1">
                                Plano de Tratamento:
                              </p>
                              <p className="text-sm text-gray-600">
                                {item.details.treatment_plan}
                              </p>
                            </div>
                          )}

                          {/* Vital signs */}
                          {item.details.vital_signs && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-1">
                                Sinais Vitais:
                              </p>
                              <div className="text-sm text-gray-600">
                                {typeof item.details.vital_signs === 'string' 
                                  ? item.details.vital_signs
                                  : JSON.stringify(item.details.vital_signs, null, 2)
                                }
                              </div>
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="flex items-center gap-2 pt-2">
                            {onViewDetails && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onViewDetails(item)}
                                className="flex items-center gap-2"
                              >
                                <FileText className="h-4 w-4" />
                                Ver Detalhes
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {timeline.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma consulta registrada
            </h3>
            <p className="text-gray-600">
              O histórico médico aparecerá aqui após as consultas serem finalizadas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}