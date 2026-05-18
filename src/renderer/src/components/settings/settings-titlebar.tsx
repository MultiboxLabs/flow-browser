"use client";

import { WindowControls } from "@/components/window-controls";

export function SettingsTitlebar() {
  return (
    <div className="relative w-full h-10 border-b px-4 flex items-center app-drag">
      <span className="absolute inset-0 pl-3.5 flex items-center justify-start pointer-events-none text-sm">
        Flow Settings
      </span>
      <div className="ml-auto">
        <WindowControls />
      </div>
    </div>
  );
}
