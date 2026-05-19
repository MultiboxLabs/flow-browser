import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";

interface SelectItem {
  id: string;
  name: string;
}

export function Select({
  value,
  onValueChange,
  items
}: {
  value: string;
  onValueChange: (value: string) => void;
  items: SelectItem[];
}) {
  const selectedItem = items.find((item) => item.id === value);

  return (
    <div
      className={cn(
        "relative py-0.5 px-2 rounded-md",
        "hover:border hover:m-0 m-px",
        "border-black/20 dark:border-white/20",
        "flex items-center gap-2"
      )}
    >
      <span className="text-sm pointer-events-none">{selectedItem?.name}</span>
      <ChevronDownIcon className={cn("size-3 pointer-events-none", "text-black/80 dark:text-white/80")} />
      <select
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={cn(
          "absolute inset-0 w-full h-full opacity-0",
          "cursor-default select-none appearance-none outline-none"
        )}
      >
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </div>
  );
}
