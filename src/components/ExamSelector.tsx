import React, { useState, useEffect } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';

interface Exam {
  id: string;
  name: string;
  tuss_code: string;
  category: string;
  description?: string;
  preparation_instructions?: string;
  normal_values?: string;
}

interface ExamSelectorProps {
  value?: Exam[];
  onChange: (exams: Exam[]) => void;
  placeholder?: string;
  multiple?: boolean;
}

export function ExamSelector({ value = [], onChange, placeholder = "Buscar exames...", multiple = true }: ExamSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);

  // Search exams
  useEffect(() => {
    const searchExams = async () => {
      if (searchQuery.length < 2) {
        setExams([]);
        return;
      }

      setLoading(true);
      try {
        const response = await apiClient.request<Exam[]>(`/exam-database/exams?q=${encodeURIComponent(searchQuery)}&limit=20`);
        setExams(response);
      } catch (error) {
        console.error('Erro ao buscar exames:', error);
        setExams([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchExams, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSelect = (exam: Exam) => {
    if (multiple) {
      const isSelected = value.some(e => e.id === exam.id);
      if (isSelected) {
        onChange(value.filter(e => e.id !== exam.id));
      } else {
        onChange([...value, exam]);
      }
    } else {
      onChange([exam]);
      setOpen(false);
    }
  };

  const handleRemove = (examId: string) => {
    onChange(value.filter(e => e.id !== examId));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {value.length === 0 ? placeholder : `${value.length} exame(s) selecionado(s)`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Digite o nome do exame ou código TUSS..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {loading ? (
                <CommandEmpty>Buscando exames...</CommandEmpty>
              ) : exams.length === 0 ? (
                <CommandEmpty>Nenhum exame encontrado.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {exams.map((exam) => (
                    <CommandItem
                      key={exam.id}
                      value={exam.name}
                      onSelect={() => handleSelect(exam)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value.some(e => e.id === exam.id) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{exam.name}</span>
                          <span className="text-sm text-muted-foreground">
                            TUSS: {exam.tuss_code} • {exam.category}
                          </span>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected exams */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((exam) => (
            <Badge key={exam.id} variant="secondary" className="flex items-center gap-1">
              {exam.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => handleRemove(exam.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Add custom exam button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => {
          // TODO: Implement custom exam creation
          console.log('Adicionar exame personalizado');
        }}
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Exame Personalizado
      </Button>
    </div>
  );
}
