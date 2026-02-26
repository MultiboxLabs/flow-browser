"use client";

import * as React from "react";
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

interface SidebarScrollAreaProps extends React.ComponentProps<typeof ScrollAreaPrimitive.Root> {
  children: React.ReactNode;
  className?: string;
}

/**
 * A custom scroll area component designed for the browser sidebar.
 * Features:
 * - Thin scrollbar positioned in the right padding area
 * - Hover-to-highlight behavior matching existing sidebar scrollbar styles
 * - Light/dark mode support via opacity-based colors
 * - Reusable across different sidebar sections
 */
function SidebarScrollArea({ className, children, ...props }: SidebarScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="sidebar-scroll-area"
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="sidebar-scroll-area-viewport"
        className="size-full rounded-[inherit] [&>div]:!block"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <SidebarScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

interface SidebarScrollBarProps extends React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> {
  orientation?: "vertical" | "horizontal";
}

/**
 * Custom scrollbar for the sidebar that:
 * - Is positioned in the right padding area (using negative margin)
 * - Has a thin track (~4px) with no background
 * - Shows subtle thumb that brightens on hover
 * - Transitions smoothly between states
 */
function SidebarScrollBar({ className, orientation = "vertical", ...props }: SidebarScrollBarProps) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="sidebar-scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        "flex touch-none select-none transition-opacity duration-100 ease-out",
        // Vertical scrollbar positioning - sits in the right padding area
        orientation === "vertical" && "h-full w-2 p-px",
        // Horizontal scrollbar (if needed)
        orientation === "horizontal" && "h-2 w-full flex-col p-px",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="sidebar-scroll-area-thumb"
        className={cn(
          "relative flex-1 rounded-full transition-colors duration-100 ease-out",
          // Default: semi-transparent white (works for both light and dark backgrounds)
          // Using black/white with opacity for automatic theme adaptation
          "bg-black/30 dark:bg-white/40",
          // Hover state: more visible
          "hover:bg-black/50 hover:dark:bg-white/80"
        )}
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
}

export { SidebarScrollArea, SidebarScrollBar };
