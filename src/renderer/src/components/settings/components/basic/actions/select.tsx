import { useSettingsWindowContext } from "@/components/settings/context";
import { cn } from "@/lib/utils";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { ChevronDownIcon } from "lucide-react";
import { useRef } from "react";

interface SelectItem {
  id: string;
  name: string;
}

const triggerClassName = cn(
  "flex items-center gap-2",
  "py-0.5 px-2 rounded-md",
  "hover:border hover:m-0 m-px",
  "focus-visible:border focus-visible:border-black! focus-visible:dark:border-white! focus-visible:m-0",
  "border-black/20 dark:border-white/20",
  "outline-none cursor-default"
);

function MacNativeSelect({
  value,
  onValueChange,
  items
}: {
  value: string;
  onValueChange: (value: string) => void;
  items: SelectItem[];
}) {
  const resolvedValue = items.some((item) => item.id === value) ? value : (items[0]?.id ?? "");
  const selectedItem = items.find((item) => item.id === resolvedValue);
  const selectRef = useRef<HTMLSelectElement>(null);

  const handleClick = () => {
    selectRef.current?.showPicker();
  };

  return (
    <div className={cn("relative")}>
      <button type="button" className={triggerClassName} onClick={handleClick}>
        <span className="text-sm pointer-events-none">{selectedItem?.name}</span>
        <ChevronDownIcon className={cn("size-3 pointer-events-none", "text-black/80 dark:text-white/80")} />
      </button>
      <select
        ref={selectRef}
        value={resolvedValue}
        onChange={(e) => onValueChange(e.target.value)}
        className={cn(
          "absolute inset-0 w-full h-full ml-2 opacity-0",
          "pointer-events-none select-none appearance-none outline-none text-sm"
        )}
        tabIndex={-1}
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

function BaseUiSelect({
  value,
  onValueChange,
  items
}: {
  value: string;
  onValueChange: (value: string) => void;
  items: SelectItem[];
}) {
  const selectItems = items.map((item) => ({ value: item.id, label: item.name }));
  const resolvedValue = items.some((item) => item.id === value) ? value : (items[0]?.id ?? "");

  return (
    <SelectPrimitive.Root
      value={resolvedValue}
      onValueChange={(newValue) => {
        if (typeof newValue === "string") {
          onValueChange(newValue);
        }
      }}
      items={selectItems}
    >
      <SelectPrimitive.Trigger className={triggerClassName}>
        <SelectPrimitive.Value className="text-sm" />
        <SelectPrimitive.Icon>
          <ChevronDownIcon className={cn("size-3", "text-black/80 dark:text-white/80")} />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner alignItemWithTrigger={false} side="bottom" sideOffset={4} className="z-50">
          <SelectPrimitive.Popup
            className={cn(
              "min-w-(--anchor-width)",
              "rounded-xl border border-black/20 dark:border-white/20 overflow-clip",
              "bg-background/5 backdrop-blur-sm",
              "shadow-md p-1",
              "origin-(--transform-origin)",
              "transition-[transform,scale,opacity] duration-150",
              "data-starting-style:scale-95 data-starting-style:opacity-0",
              "data-ending-style:scale-95 data-ending-style:opacity-0",
              "focus-visible:outline-0"
            )}
          >
            <SelectPrimitive.List>
              {items.map((item) => (
                <SelectPrimitive.Item
                  key={item.id}
                  value={item.id}
                  className={cn(
                    "flex cursor-default items-center px-2 py-1.5 text-sm outline-none select-none rounded-md",
                    "data-highlighted:bg-black/5 dark:data-highlighted:bg-white/10",
                    "data-selected:font-medium"
                  )}
                >
                  <SelectPrimitive.ItemText>{item.name}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
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
  const { isMac } = useSettingsWindowContext();

  if (isMac) {
    return <MacNativeSelect value={value} onValueChange={onValueChange} items={items} />;
  }

  return <BaseUiSelect value={value} onValueChange={onValueChange} items={items} />;
}
