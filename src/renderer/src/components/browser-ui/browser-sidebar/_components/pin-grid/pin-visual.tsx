import { cn } from "@/lib/utils";
import { useFaviconColors, type FaviconColors, type RGB } from "@/hooks/use-favicon-color";
import { useMemo } from "react";

/**
 * Convert RGB to rgba string
 */
export function rgba(color: RGB | null, opacity: number): string {
  if (!color) return `rgba(255, 255, 255, ${opacity})`;
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;
}

/**
 * Generate a border gradient using corner colors
 */
export function generateBorderGradient(colors: FaviconColors, opacity: number): string {
  const tl = rgba(colors.topLeft, opacity);
  const tr = rgba(colors.topRight, opacity);
  const br = rgba(colors.bottomRight, opacity);
  const bl = rgba(colors.bottomLeft, opacity);
  return `conic-gradient(from 45deg, ${tr} 0deg, ${br} 90deg, ${bl} 180deg, ${tl} 270deg, ${tr} 360deg)`;
}

/**
 * Shared visual component for rendering a pinned tab's favicon with
 * color-extracted gradient borders and overlay.
 */
export function PinVisual({
  faviconUrl,
  isActive,
  isDragging,
  className
}: {
  faviconUrl: string | null;
  isActive: boolean;
  isDragging?: boolean;
  className?: string;
}) {
  const faviconColors = useFaviconColors(faviconUrl);
  const hasColors = faviconColors !== null;

  const activeBorderStyle = useMemo(() => {
    if (!isActive || !hasColors) return undefined;
    return {
      "--gradient-border": generateBorderGradient(faviconColors, 0.6)
    } as React.CSSProperties;
  }, [faviconColors, hasColors, isActive]);

  const activeOverlayStyle = useMemo(() => {
    if (!isActive || !hasColors) return undefined;
    return {
      backgroundImage: generateBorderGradient(faviconColors, 0.15)
    } as React.CSSProperties;
  }, [faviconColors, hasColors, isActive]);

  return (
    <div
      className={cn(
        "w-full h-12 rounded-xl overflow-hidden",
        "bg-black/10 hover:bg-black/15",
        "dark:bg-white/15 dark:hover:bg-white/20",
        "transition-[background-color,border-color,opacity] duration-100",
        "flex items-center justify-center",
        isActive && !hasColors && "border-2 border-white",
        isActive && hasColors && "pinned-tab-active-border",
        isDragging && "opacity-40",
        className
      )}
      style={activeBorderStyle}
    >
      <div className={cn("size-full", isActive && "bg-white/80 dark:bg-white/30")}>
        <div className={cn("size-full", "flex items-center justify-center")} style={activeOverlayStyle}>
          <div className="relative size-5">
            <img
              src={faviconUrl || undefined}
              className="absolute rounded-sm user-drag-none object-contain overflow-hidden"
            />
            <div className="img-container">
              <img src={faviconUrl || undefined} className="user-drag-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
