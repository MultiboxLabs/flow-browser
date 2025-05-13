import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RotateCcwIcon, SearchIcon } from "lucide-react";

interface SearchHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onResetClick: () => void;
  isLoading: boolean;
}

export function SearchHeader({ searchTerm, onSearchChange, onResetClick, isLoading }: SearchHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
      <div className="relative w-full sm:max-w-xs">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search shortcuts..."
          className="pl-9 w-full"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onResetClick} disabled={isLoading} className="group">
          <RotateCcwIcon className="h-4 w-4 mr-2 group-hover:rotate-[-30deg] transition-transform" />
          Reset All Defaults
        </Button>
      </div>
    </div>
  );
}
