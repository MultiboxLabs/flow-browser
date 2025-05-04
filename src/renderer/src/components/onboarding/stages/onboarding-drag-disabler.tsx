export function OnboardingDragDisabler() {
  // Enable drag for Topbar
  // Disable drag for rest of the window
  return (
    <div className="absolute flex flex-col top-0 w-screen h-screen">
      <div className="top-0 h-[calc(env(titlebar-area-y)+env(titlebar-area-height))] w-screen app-drag -z-10" />
    </div>
  );
}
