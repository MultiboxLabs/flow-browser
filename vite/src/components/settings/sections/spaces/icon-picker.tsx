import { useState, useEffect, useMemo, memo } from "react";
import { Search } from "lucide-react";
import { motion } from "motion/react";
import { Input } from "@/components/ui/input";
import { PhosphorIcons, SpaceIcon } from "@/lib/phosphor-icons";
import { IconEntry } from "@phosphor-icons/core";

// ==============================
// PhosphorIconPicker Component
// ==============================
interface SpaceIconPickerProps {
  selectedIcon: string;
  onSelectIcon: (iconId: string) => void;
}

export function SpaceIconPicker({ selectedIcon, onSelectIcon }: SpaceIconPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [iconList, setIconList] = useState<IconEntry[]>([]);
  const [filteredIcons, setFilteredIcons] = useState<IconEntry[]>([]);

  // Load icons only once on component mount
  useEffect(() => {
    setIconList(PhosphorIcons);
    setFilteredIcons(PhosphorIcons);
  }, []);

  // Memoize filter operation to prevent excessive re-renders
  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      setFilteredIcons(iconList);
    } else {
      const filtered = iconList.filter((icon) => {
        const searchValues = [...icon.tags, ...icon.categories, icon.name, icon.pascal_name].map((s) =>
          s.toLowerCase()
        );

        return searchValues.some((value) => value.includes(query));
      });
      setFilteredIcons(filtered);
    }
  }, [searchQuery, iconList]);

  // Use the selectedIcon prop directly instead of selectedIconRef
  const IconGrid = useMemo(() => {
    return (
      <div className="grid grid-cols-8 gap-1 p-1">
        {filteredIcons.map((icon) => (
          <MemoizedIconItem
            key={icon.name}
            icon={icon}
            isSelected={selectedIcon === icon.pascal_name}
            onSelect={() => {
              onSelectIcon(icon.pascal_name);
            }}
          />
        ))}
      </div>
    );
  }, [filteredIcons, onSelectIcon, selectedIcon]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute left-2.5 top-2.5 text-muted-foreground">
          <Search className="h-4 w-4" />
        </div>
        <Input
          id="icon-search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search icons..."
          className="pl-8"
        />
      </div>

      <div className="h-[180px] overflow-y-auto border rounded-md">{IconGrid}</div>
    </div>
  );
}

function IconItem({ icon, isSelected, onSelect }: { icon: IconEntry; isSelected: boolean; onSelect: () => void }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`flex flex-col items-center justify-center p-1 cursor-pointer rounded-md ${
        isSelected ? "bg-primary/10 border-primary border" : "border border-muted/50"
      }`}
      onClick={onSelect}
      title={icon.name}
    >
      <div className="relative h-6 w-6 flex items-center justify-center">
        <SpaceIcon id={icon.pascal_name} className="h-5 w-5" />
      </div>
    </motion.div>
  );
}

export const MemoizedIconItem = memo(IconItem);
