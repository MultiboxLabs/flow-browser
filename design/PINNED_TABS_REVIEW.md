# Pinned Tabs Branch Review

Source-of-truth checklist for all findings from the pinned tabs feature branch review.

## Bugs

- [x] **B1** Ephemeral tab leak in `pinned-tabs:remove` IPC handler
  - `src/main/ipc/browser/pinned-tabs.ts:199-202` vs `274-286`
  - The `pinned-tabs:remove` handler only calls `pinnedTabsController.remove()` but does NOT destroy the associated ephemeral tab. The context menu "Unpin" action does destroy it. Orphaned ephemeral tabs leak because they skip the archive check in tabs-controller.
  - Fix: Destroy the associated ephemeral tab in the `remove` handler, matching the context menu behavior.

- [x] **B2** Side effect inside `setSlots` state updater in slot machine
  - `src/renderer/src/components/browser-ui/browser-sidebar/_components/pin-grid/slot-machine/main.tsx:189-197`
  - `openWinnerTabs(winners)` is called inside a `setSlots` updater function. React may invoke updaters multiple times in StrictMode/concurrent mode, causing duplicate tab opens.
  - Fix: Use a ref to track current slots and move the side effect into a separate callback or effect.

- [x] **B3** `useEffect` dependency uses boolean expression instead of value
  - `src/renderer/src/components/browser-ui/browser-sidebar/_components/pin-grid/carousel.tsx:58`
  - Dependency is `pages.length > 0` (boolean), not `pages.length`. Effect won't re-run when page count changes (e.g., 2->3).
  - Fix: Use `pages.length` as the dependency.

- [x] **B4** Misleading error message in `useBrowserSidebar`
  - `src/renderer/src/components/browser-ui/browser-sidebar/provider.tsx:111`
  - Error says "AdaptiveTopbarProvider" but should say "BrowserSidebarProvider". Copy-paste error.
  - Fix: Correct the error message string.

- [x] **B5** Non-unique HTML `id` attributes in mapped components
  - `src/renderer/src/components/browser-ui/browser-sidebar/_components/pin-grid/pinned-tab-button.tsx:230-231`
  - `src/renderer/src/components/browser-ui/browser-sidebar/_components/pin-grid/slot-machine/main.tsx:62-63`
  - `id="overlay-overlay"` and `id="overlay"` used inside `.map()` loops, violating HTML uniqueness requirement.
  - Fix: Switch from `id` to `className` (or use `pin.css` class selectors instead).

## Code Duplication

- [x] **D1** `isPinnedTabSource()` type guard duplicated 4 times
  - `src/renderer/src/components/browser-ui/browser-sidebar/_components/pin-grid/normal/pin-grid.tsx:20`
  - `src/renderer/src/components/browser-ui/browser-sidebar/_components/pin-grid/pinned-tab-button.tsx:40`
  - `src/renderer/src/components/browser-ui/browser-sidebar/_components/tab-group.tsx:16`
  - `src/renderer/src/components/browser-ui/browser-sidebar/_components/tab-drop-target.tsx:12`
  - Fix: Extract to a shared `drag-utils.ts` file alongside the components.

- [x] **D2** `isTabGroupSource()` type guard duplicated 2 times
  - `src/renderer/src/components/browser-ui/browser-sidebar/_components/pin-grid/normal/pin-grid.tsx:16`
  - `src/renderer/src/components/browser-ui/browser-sidebar/_components/pin-grid/pinned-tab-button.tsx:44`
  - Fix: Colocate with `isPinnedTabSource` in the shared utility.

- [x] **D3** `rgba()` + `generateBorderGradient()` duplicated verbatim across 2 files
  - `src/renderer/src/components/browser-ui/browser-sidebar/_components/pin-grid/pinned-tab-button.tsx:14-31`
  - `src/renderer/src/components/browser-ui/browser-sidebar/_components/pin-grid/slot-machine/main.tsx:12-26`
  - Fix: Extract to a shared `pin-grid/utils.ts` module.

- [x] **D4** Entire pin button visual (overlay divs, dual favicon, active styles) copy-pasted into `SlotButton`
  - `src/renderer/src/components/browser-ui/browser-sidebar/_components/pin-grid/pinned-tab-button.tsx:213-243`
  - `src/renderer/src/components/browser-ui/browser-sidebar/_components/pin-grid/slot-machine/main.tsx:49-76`
  - Fix: Extract a shared `PinVisual` presentation component.

- [x] **D5** IPC: "create tab + associate + activate" pattern duplicated 3 times
  - `src/main/ipc/browser/pinned-tabs.ts:139-151`, `183-193`, `231-245`
  - Fix: Extract a `createAndAssociatePinnedTab()` helper function.

- [x] **D6** IPC: "move ephemeral tab to current space" pattern duplicated in click + double-click
  - `src/main/ipc/browser/pinned-tabs.ts:128-131`, `173-175`
  - Fix: Extract a `moveEphemeralTabToCurrentSpace()` helper.

- [x] **D7** IPC: `double-click` handler is nearly identical to `click`
  - `src/main/ipc/browser/pinned-tabs.ts:112-194`
  - Differs only by navigating the associated tab to `defaultUrl` first.
  - Fix: Refactor `click` to accept a `navigateToDefault` option, or have `double-click` call into `click` after navigation.

- [x] **D8** Mouse-press animation pattern duplicated 3 times in navigation-controls
  - `src/renderer/src/components/browser-ui/browser-sidebar/_components/navigation-controls.tsx:66-91`, `153-178`, `231-249`
  - Fix: Extract a `usePressAnimation(iconRef)` custom hook.

- [x] **D9** `GoBackButton` and `GoForwardButton` are structurally near-identical
  - `src/renderer/src/components/browser-ui/browser-sidebar/_components/navigation-controls.tsx:55-139` vs `142-226`
  - Same structure: icon ref, press handling, context menu, popover, entry list. Only differ by direction and icon.
  - Fix: Create a single `NavigationButton` component parameterized by direction.

- [x] **D10** Tab serialization + `markDirty` pattern repeated 5 times in tabs-controller
  - `src/main/controllers/tabs-controller/index.ts` — multiple event handlers
  - Fix: Extract a private `persistTab(tab: Tab)` method.

## Architectural Improvements

- [x] **A1** `PinnedTabsController` uses custom Set-based listener instead of `TypedEventEmitter`
  - `src/main/controllers/pinned-tabs-controller/index.ts:49-83`
  - Every other controller extends `TypedEventEmitter`. This one uses a bespoke system, missing `once()`, `removeListener()`, etc.
  - Fix: Extend `TypedEventEmitter<{ changed: [] }>` and use `emit`/`on` pattern.

- [x] **A2** `normalizePositions` runs in a separate DB transaction from its caller
  - `src/main/controllers/pinned-tabs-controller/index.ts:320-341`
  - Called from `create`, `remove`, and `reorder` — each already does a DB write, then `normalizePositions` opens another transaction.
  - Fix: Wrap the outer operation + `normalizePositions` in a single atomic transaction.

- [x] **A3** Identity mapping functions add boilerplate without transformation
  - `src/main/controllers/pinned-tabs-controller/index.ts:9-27`
  - `pinnedTabRowToPersistedData` and `persistedDataToPinnedTabInsert` manually copy fields between structurally identical types.
  - Fix: Use spread or direct assignment since the types have the same shape.

- [x] **A4** Controller not imported through `controllers/index.ts` barrel file
  - `src/main/browser.ts:17` imports `pinned-tabs-controller` directly instead of through `controllers/index.ts` like all others.
  - Fix: Add the import to the barrel file.

- [x] **A5** Redundant `pendingChange` flag in IPC debounce
  - `src/main/ipc/browser/pinned-tabs.ts:11-22`
  - The `pendingChange` boolean is always `true` when the timeout fires. A simple trailing-edge debounce suffices.
  - Fix: `let timeout; function schedule() { clearTimeout(timeout); timeout = setTimeout(process, 80); }`

## Dead Code / Cleanup

- [x] **C1** `intervalRef` in SlotMachinePinGrid is never written to
  - `src/renderer/src/components/browser-ui/browser-sidebar/_components/pin-grid/slot-machine/main.tsx:150`
  - `clearInterval(intervalRef.current)` on unmount is always a no-op.
  - Fix: Remove the ref and its cleanup.

- [x] **C2** `triggerRef` in GoBack/GoForward buttons is assigned but never read
  - `src/renderer/src/components/browser-ui/browser-sidebar/_components/navigation-controls.tsx:67,154`
  - Fix: Remove the refs.

- [x] **C3** `NAVIGATION_ANIMATION_ENABLED = true` — dead toggle constant
  - `src/renderer/src/components/browser-ui/browser-sidebar/_components/navigation-controls.tsx:16`
  - Fix: Remove the constant and its conditionals.

- [x] **C4** `{false && <UpdateEffect />}` — permanently disabled dead code
  - `src/renderer/src/components/browser-ui/main.tsx:295`
  - Fix: Remove the expression and the unused import.

- [x] **C5** `"use client"` directive in an Electron/Vite app
  - `src/renderer/src/components/browser-ui/browser-sidebar/_components/sidebar-scroll-area.tsx:1`
  - No Next.js — directive has no effect.
  - Fix: Remove the directive.

- [x] **C6** Commented-out fullscreen implementation block
  - `src/renderer/src/components/browser-ui/main.tsx:208-216`
  - Fix: Remove the commented-out code.

- [x] **C7** `remove` function exported from pinned-tabs-provider but never consumed
  - `src/renderer/src/components/providers/pinned-tabs-provider.tsx:16,78,119`
  - No component calls `usePinnedTabs().remove()`. Removal goes through `showContextMenu`.
  - Fix: Keep if intentionally for future use, or remove to reduce API surface.

## Minor Improvements

- [x] **M1** Optimistic reorder spreads non-matching tabs unnecessarily
  - `src/renderer/src/components/providers/pinned-tabs-provider.tsx:98`
  - `{ ...t }` on non-matching branch creates new objects for every tab, breaking reference equality.
  - Fix: Use `t` (no spread) for non-matching entries.

- [x] **M2** `handleReorder` and `handleCreateFromTab` are identity wrappers
  - `src/renderer/src/components/browser-ui/browser-sidebar/_components/pin-grid/normal/pin-grid.tsx:214-228`
  - Wrap already-stable `useCallback` from the provider with no additional logic.
  - Fix: Pass `reorder` and `createFromTab` directly as props.

- [x] **M3** Two `useEffect` calls in provider (initial fetch + subscribe) could be merged
  - `src/renderer/src/components/providers/pinned-tabs-provider.tsx:45-57`
  - Subscribe-first-then-fetch pattern closes the race window between initial fetch resolving and listener registration.
  - Fix: Merge into a single effect.

- [x] **M4** Misleading comment about `loadAll()` having an "async signature"
  - `src/main/browser.ts:23-25`
  - The method is synchronous. Comment is stale.
  - Fix: Update the comment.

- [x] **M5** `useMemo` used for side effect (setting a ref) in sidebar provider
  - `src/renderer/src/components/browser-ui/browser-sidebar/provider.tsx:133-135`
  - Fix: Use `useRef(getInitialSidebarSize())` directly in the declaration.
