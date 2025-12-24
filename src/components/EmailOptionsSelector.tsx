import { ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EmailOptionsSelectorProps {
  label: string;
  options: string[];
  selected: string | null;
  onSelect: (option: string) => void;
}

export function EmailOptionsSelector({ 
  label, 
  options, 
  selected, 
  onSelect 
}: EmailOptionsSelectorProps) {
  // Filter out empty strings to prevent Select.Item error
  const validOptions = options?.filter((opt) => opt && opt.trim() !== "") || [];

  if (validOptions.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Select value={selected || undefined} onValueChange={onSelect}>
        <SelectTrigger className="w-full text-left h-auto min-h-[40px] py-2">
          <SelectValue placeholder="Selecione...">
            {selected ? (
              <span className="text-sm line-clamp-2 text-left">{selected}</span>
            ) : null}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[300px] bg-popover z-50">
          {validOptions.map((option, index) => (
            <SelectItem 
              key={`${index}-${option.substring(0, 10)}`} 
              value={option}
              className="cursor-pointer py-2.5 px-3"
            >
              <span className="text-sm">{option}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
