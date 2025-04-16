import { useState, useEffect, useRef, useMemo, memo } from "react";
import { Search } from "lucide-react";
import { motion } from "motion/react";
import { Input } from "@/components/ui/input";
import { getLucideIcon } from "@/lib/utils";
import dynamicIconImports from "lucide-react/dynamicIconImports";

// ==============================
// LucideIconPicker Component
// ==============================
interface LucideIconPickerProps {
  selectedIcon: string;
  onSelectIcon: (iconId: string) => void;
}

export function LucideIconPicker({ selectedIcon, onSelectIcon }: LucideIconPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [iconList, setIconList] = useState<string[]>([]);
  const [filteredIcons, setFilteredIcons] = useState<string[]>([]);

  // Use a ref to store the selected icon to avoid re-renders
  const selectedIconRef = useRef(selectedIcon);

  // Load icons only once on component mount
  useEffect(() => {
    const icons = Object.keys(dynamicIconImports);
    setIconList(icons);
    setFilteredIcons(icons);
    selectedIconRef.current = selectedIcon;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Memoize filter operation to prevent excessive re-renders
  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      setFilteredIcons(iconList);
    } else {
      const filtered = iconList.filter((icon) => icon.toLowerCase().includes(query));
      setFilteredIcons(filtered);
    }
  }, [searchQuery, iconList]);

  // Memoize the icon grid to prevent re-renders
  const IconGrid = useMemo(() => {
    return (
      <div className="grid grid-cols-8 gap-1 p-1">
        {filteredIcons.map((icon) => (
          <IconItem
            key={icon}
            iconId={icon}
            isSelected={selectedIconRef.current === icon}
            onSelect={() => {
              selectedIconRef.current = icon;
              onSelectIcon(icon);
            }}
          />
        ))}
      </div>
    );
  }, [filteredIcons, onSelectIcon]);

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

// Helper function to transform icon ID to human readable name
function transformIconName(iconId: string): string {
  return iconId
    .split(/(?=[A-Z])/) // Split on uppercase letters (for camelCase)
    .join(" ") // Join with spaces
    .replace(/-/g, " ") // Replace hyphens with spaces (for kebab-case)
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter of each word
}

// Extracted IconItem to a separate component with memo for performance
export const IconItem = memo(function IconItem({
  iconId,
  isSelected,
  onSelect
}: {
  iconId: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`flex flex-col items-center justify-center p-1 cursor-pointer rounded-md ${
        isSelected ? "bg-primary/10 border-primary border" : "border border-muted/50"
      }`}
      onClick={onSelect}
      title={transformIconName(iconId)}
    >
      <div className="relative h-6 w-6 flex items-center justify-center">
        <IconPreview iconId={iconId} />
      </div>
    </motion.div>
  );
});

// Helper component to display icon preview
export function IconPreview({ iconId }: { iconId: string }) {
  const [Icon, setIcon] = useState<React.ComponentType<{ className?: string }> | null>(null);
  const hasLoaded = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const componentRef = useRef<HTMLDivElement>(null);

  // Set up intersection observer for lazy loading
  useEffect(() => {
    const component = componentRef.current;

    // Only load icon when component is visible
    if (!hasLoaded.current) {
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          // Load icon when visible
          loadIcon();
          // Stop observing after loading
          if (observerRef.current && componentRef.current) {
            observerRef.current.unobserve(componentRef.current);
          }
        }
      });

      if (component) {
        observerRef.current.observe(component);
      }
    }

    return () => {
      // Clean up observer on unmount
      if (observerRef.current && component) {
        observerRef.current.unobserve(component);
        observerRef.current.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iconId]);

  const loadIcon = async () => {
    try {
      hasLoaded.current = true;
      const icon = await getLucideIcon(iconId);
      setIcon(() => icon);
    } catch (error) {
      console.error("Failed to load icon:", error);
    }
  };

  if (Icon) {
    return <Icon className="h-5 w-5" />;
  }

  return (
    <div ref={componentRef} className="h-5 w-5 flex items-center justify-center">
      <div className="h-3 w-3 rounded-full bg-muted animate-pulse"></div>
    </div>
  );
}
