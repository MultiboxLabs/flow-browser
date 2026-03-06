import { createPortal } from "react-dom";
import { useTabOverlay } from "./provider";
import { DialogOverlay } from "./dialogs/dialog-overlay";

export function TabOverlay() {
  const { pageBounds, dialogQueue } = useTabOverlay();

  if (!pageBounds) return null;

  const hasContent = dialogQueue.length > 0;
  if (!hasContent) return null;

  return createPortal(
    <div
      className="fixed pointer-events-none z-modal overflow-hidden"
      style={{
        left: pageBounds.x,
        top: pageBounds.y,
        width: pageBounds.width,
        height: pageBounds.height,
        borderRadius: 8
      }}
    >
      <DialogOverlay request={dialogQueue[0]} />
    </div>,
    document.body
  );
}
