import { IPCListener } from "@/lib/flow/types";

// API //
export interface FlowInterfaceAPI {
  /**
   * Sets the position of the window button
   * This can only be called from the Browser UI
   * @param position The position object containing x and y coordinates
   */
  setWindowButtonPosition: (position: { x: number; y: number }) => void;

  /**
   * Sets the visibility of the window button
   * This can only be called from the Browser UI
   * @param visible Whether the window button should be visible
   */
  setWindowButtonVisibility: (visible: boolean) => void;

  /**
   * Adds a callback to be called when the sidebar is toggled
   */
  onToggleSidebar: IPCListener<[void]>;
}
