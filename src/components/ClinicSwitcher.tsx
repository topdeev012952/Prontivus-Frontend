import { Check, ChevronsUpDown, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useClinicStore } from '@/stores/clinicStore';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function ClinicSwitcher() {
  const { clinics, currentClinic, setCurrentClinic } = useClinicStore();
  const [open, setOpen] = useState(false);

  if (clinics.length <= 1) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between px-2 hover:bg-sidebar-active/10"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 flex-shrink-0" />
            <span className="truncate text-sm">
              {currentClinic?.name || 'Select clinic'}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search clinic..." />
          <CommandEmpty>No clinic found.</CommandEmpty>
          <CommandGroup>
            {clinics.map((clinic) => (
              <CommandItem
                key={clinic.id}
                value={clinic.name}
                onSelect={() => {
                  setCurrentClinic(clinic);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    currentClinic?.id === clinic.id ? 'opacity-100' : 'opacity-0'
                  )}
                />
                {clinic.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
