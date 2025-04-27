import { useEffect, useRef } from "react";

export function SidebarWindowControls() {
  const titlebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const titlebar = titlebarRef.current;

    const updateButtonPosition = () => {
      if (titlebar) {
        const titlebarBounds = titlebar.getBoundingClientRect();
        flow.interface.setWindowButtonPosition({
          x: titlebarBounds.x,
          y: titlebarBounds.y
        });
      }
    };

    // Initial position setup
    updateButtonPosition();

    // Use ResizeObserver to track position and size changes
    const resizeObserver = new ResizeObserver(() => {
      updateButtonPosition();
    });

    if (titlebar) {
      resizeObserver.observe(titlebar);

      // Also observe parent elements to catch position changes
      let parent = titlebar.parentElement;
      while (parent) {
        resizeObserver.observe(parent);
        parent = parent.parentElement;
      }
    }

    flow.interface.setWindowButtonVisibility(true);

    return () => {
      flow.interface.setWindowButtonVisibility(false);
      resizeObserver.disconnect();
    };
  }, []);

  return <div ref={titlebarRef} className="mb-3 mt-0.5 mx-1 h-2 w-full" />;
}
