import { createContext, useContext, useEffect, useMemo, useState } from "react";

/**
 * Supported platform types that the application can detect and run on.
 */
export type Platform = "win32" | "darwin" | "linux" | "unknown";

/**
 * CSS class name template for platform-specific styling.
 */
export type PlatformClassName = `platform-${Platform}`;

/**
 * Interface defining the structure of platform context data.
 */
interface PlatformContextType {
  /** The detected platform type */
  platform: Platform;
  /** CSS class name for platform-specific styling */
  platformClassName: PlatformClassName;
  /** Browser window border radius value */
  browserBorderRadius: string;
}

/**
 * React context for sharing platform information throughout the component tree.
 */
const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

/**
 * Hook to access platform context data.
 * Must be used within a PlatformProvider component.
 *
 * @returns Object containing platform type and CSS class name
 * @throws Throws an error if used outside of PlatformProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { platform, platformClassName } = usePlatform();
 *   return <div>Running on: {platform}</div>;
 * }
 * ```
 */
export function usePlatform(): PlatformContextType {
  const context = useContext(PlatformContext);
  if (context === undefined) {
    throw new Error("usePlatform must be used within a PlatformProvider");
  }
  return context;
}

/**
 * Hook to access platform context data without throwing an error.
 * Safe to use outside of PlatformProvider - returns undefined if no context is available.
 *
 * @returns Object containing platform type and CSS class name, or undefined if not in a PlatformProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const platformData = usePlatformWithoutThrow();
 *   if (platformData) {
 *     return <div>Running on: {platformData.platform}</div>;
 *   }
 *   return <div>Platform unknown</div>;
 * }
 * ```
 */
export function usePlatformWithoutThrow(): PlatformContextType | undefined {
  return useContext(PlatformContext);
}

/**
 * Provider component that detects the current platform and provides platform context to child components.
 * Automatically detects the platform using the Electron API and wraps children with platform-specific CSS class.
 *
 * @param props - Component props
 * @param props.children - Child components that will have access to platform context
 * @returns Provider component wrapping children with platform context and CSS class
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <PlatformProvider>
 *       <MyComponent />
 *     </PlatformProvider>
 *   );
 * }
 * ```
 */
export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [platform, setPlatform] = useState<Platform>("unknown");

  useEffect(() => {
    // Wrapped in try-catch so it still works when `flow` is not available
    // Because of electron preload scripts not running in iframes
    // https://www.google.com/search?q=electron+preload+not+working+in+iframe
    try {
      const foundPlatform = flow.app.getPlatform();

      if (foundPlatform === "win32") {
        setPlatform("win32");
      } else if (foundPlatform === "darwin") {
        setPlatform("darwin");
      } else if (foundPlatform === "linux") {
        setPlatform("linux");
      } else {
        setPlatform("unknown");
      }
    } catch {
      setPlatform("unknown");
    }
  }, []);

  const platformClassName = `platform-${platform}` as PlatformClassName;
  const browserBorderRadius = useMemo(() => {
    if (platform === "win32") {
      return "8px";
    } else if (platform === "darwin") {
      return "16px";
    } else if (platform === "linux") {
      return "0px";
    } else {
      return "0px";
    }
  }, [platform]);

  return (
    <PlatformContext.Provider value={{ platform, platformClassName, browserBorderRadius }}>
      <PlatformConsumer>{children}</PlatformConsumer>
    </PlatformContext.Provider>
  );
}

/**
 * Consumer component that wraps children with platform-specific CSS class.
 * Useful when you need to apply platform styling without providing a new context.
 * Must be used within a PlatformProvider.
 *
 * @param props - Component props
 * @param props.children - Child components to wrap with platform CSS class
 * @returns Div element with platform CSS class containing the children
 *
 * @example
 * ```tsx
 * function MyFeature() {
 *   return (
 *     <PlatformConsumer>
 *       <div>This will have platform-specific styling applied</div>
 *     </PlatformConsumer>
 *   );
 * }
 * ```
 */
export function PlatformConsumer({ children }: { children: React.ReactNode }) {
  const { platformClassName, browserBorderRadius } = usePlatform();

  return (
    <div
      className={platformClassName}
      style={{ "--browser-window-radius": browserBorderRadius } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
