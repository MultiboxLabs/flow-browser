"use client";

import { WindowControls } from "@/components/window-controls";

export function SettingsTitlebar() {
  return (
    <div className="relative w-full h-10 border-b bg-muted/60 px-4 flex items-center app-drag">
      <span className="absolute inset-0 flex items-center justify-center font-semibold pointer-events-none">
        Flow Settings
      </span>
      <div className="ml-auto">
        <WindowControls />
      </div>
    </div>
  );
}
