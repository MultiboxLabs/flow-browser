import { useEffect, type RefObject } from "react";

/**
 * Forwards document-level events into a target element so that components
 * scoped to that subtree receive events that would otherwise only fire on the
 * document root.
 *
 * A listener is attached to the `ownerDocument` of `documentRef` (defaults to
 * `targetRef`). When an event of `eventType` fires and its `target` is **not**
 * inside `targetRef`, a cloned `KeyboardEvent` is dispatched on `targetRef` so
 * the event bubbles through that subtree as if it originated there.
 *
 * Renders nothing — use it as a logic-only child inside any component tree.
 *
 * Mostly used for Portal + cmdk (command component) so it can receive up and down arrow keys.
 *
 * @example
 * // Forward keyboard events from the document into a portalled overlay
 * <BubbleEvent targetRef={overlayRef} eventType="keydown" />
 */
export function BubbleEvent<EventType extends keyof DocumentEventMap>({
  targetRef,
  eventType,
  documentRef = targetRef
}: {
  targetRef: RefObject<HTMLElement | null>;
  eventType: EventType;
  documentRef?: RefObject<HTMLElement | null>;
}) {
  useEffect(() => {
    const document = documentRef.current?.ownerDocument;
    if (!document) return;

    const bubbleTarget = targetRef.current;
    if (!bubbleTarget) return;

    const handler = (event: DocumentEventMap[EventType]) => {
      if (bubbleTarget.contains(event.target as Node)) return;
      const cloned = new KeyboardEvent(event.type, event);
      bubbleTarget.dispatchEvent(cloned);
    };

    document.addEventListener(eventType, handler);
    return () => document.removeEventListener(eventType, handler);
  }, [targetRef, eventType, documentRef]);

  return null;
}
