"use client";

import { WindowControls } from "@/components/window-controls";

export function SettingsTitlebar() {
  return (
    <div className="w-full h-10 border-b bg-muted/60 px-4 flex items-center app-drag">
      <span className="font-semibold text-center w-full">Flow Settings</span>
      <WindowControls />
    </div>
  );
}
