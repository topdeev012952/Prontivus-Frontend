import { useState, useEffect, useCallback } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { apiClient } from "@/lib/api";

interface CID10Code {
  id: number;
  code: string;
  description: string;
  category: string | null;
  type: string | null;
}

interface CID10AutocompleteProps {
  value?: string;
  onChange: (code: string, description: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CID10Autocomplete({
  value,
  onChange,
  placeholder = "Search CID-10 code...",
  disabled = false,
}: CID10AutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<CID10Code[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("");

  // Debounced search
  const searchCID10 = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.request<{ results: CID10Code[]; total: number }>(
        `/cid10/search?query=${encodeURIComponent(query)}&limit=20`
      );
      setResults(response.results);
    } catch (error) {
      console.error("Error searching CID-10 codes:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce the search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchCID10(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchCID10]);

  // Load initial value
  useEffect(() => {
    if (value && !selectedLabel) {
      // Try to fetch the selected code details
      apiClient.request<CID10Code>(`/cid10/${value}`)
        .then((code) => {
          setSelectedLabel(`${code.code} - ${code.description}`);
        })
        .catch(() => {
          setSelectedLabel(value);
        });
    }
  }, [value, selectedLabel]);

  const handleSelect = (code: CID10Code) => {
    onChange(code.code, code.description);
    setSelectedLabel(`${code.code} - ${code.description}`);
    setOpen(false);
    setSearchQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <span className="truncate">
            {selectedLabel || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type code or description (e.g., J06 or sinusite)..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
              </div>
            )}
            {!loading && searchQuery && results.length === 0 && (
              <CommandEmpty>
                No CID-10 codes found for "{searchQuery}".
              </CommandEmpty>
            )}
            {!loading && results.length > 0 && (
              <CommandGroup heading="CID-10 Codes">
                {results.map((code) => (
                  <CommandItem
                    key={code.id}
                    value={code.code}
                    onSelect={() => handleSelect(code)}
                    className="flex items-start gap-2 py-2"
                  >
                    <Check
                      className={cn(
                        "mt-1 h-4 w-4 shrink-0",
                        value === code.code ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{code.code}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {code.description}
                      </div>
                      {code.category && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Category: {code.category}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {!loading && !searchQuery && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Start typing to search CID-10 codes...
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

