import { useEffect, useLayoutEffect, useState, createContext, useContext, useMemo } from "react";

type Theme = "light" | "dark" | "system";

/**
 * CSS class name template for theme-specific styling (mirrors document `light` / `dark` classes).
 */
export type ThemeClassName = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  appliedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";

  /** CSS class name for theme-specific styling on a subtree */
  themeClassName: ThemeClassName;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// Helper function to apply theme class synchronously
function applyThemeClass(theme: "light" | "dark") {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
  } else {
    document.documentElement.classList.add("light");
    document.documentElement.classList.remove("dark");
  }
}

export function ThemeProvider({
  forceTheme,
  persist = false,
  shouldApplyClass = true,
  children
}: {
  forceTheme?: Theme;
  persist?: boolean;
  shouldApplyClass?: boolean;
  children: React.ReactNode;
}) {
  const [_theme, setTheme] = useState<Theme>(() => {
    // If forceTheme is provided, use it
    if (forceTheme) {
      return forceTheme;
    }

    if (persist) {
      // Check if there's a saved theme in localStorage
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "light" || savedTheme === "dark" || savedTheme === "system") {
        return savedTheme as Theme;
      }
    }

    // Default to system
    return "system";
  });

  // If forceTheme is provided, use it
  const theme = forceTheme ? forceTheme : _theme;

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );

  const appliedTheme = useMemo(() => {
    return theme === "system" ? resolvedTheme : theme;
  }, [theme, resolvedTheme]);

  // Use useLayoutEffect to apply theme synchronously before browser paint
  // This prevents flicker when theme changes or forceTheme is provided
  useLayoutEffect(() => {
    // Apply theme class to document
    if (shouldApplyClass) {
      applyThemeClass(appliedTheme);
    }

    if (persist) {
      // Save theme to localStorage
      localStorage.setItem("theme", theme);
    }
  }, [theme, resolvedTheme, persist, appliedTheme, shouldApplyClass]);

  useEffect(() => {
    // Listen for changes in color scheme preference
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      const newSystemTheme = e.matches ? "dark" : "light";
      setResolvedTheme(newSystemTheme);
    };

    // Set initial resolved theme
    setResolvedTheme(mediaQuery.matches ? "dark" : "light");

    mediaQuery.addEventListener("change", handleChange);

    // Cleanup listener on unmount
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  const themeClassName: ThemeClassName = appliedTheme === "dark" ? "dark" : "light";
  const value = { theme, appliedTheme, setTheme, resolvedTheme, themeClassName };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Consumer that wraps children with theme classes so `dark` / `light` and Tailwind `dark:` apply under this subtree.
 * Must be used within a ThemeProvider (included by default inside ThemeProvider).
 */
export function ThemeConsumer({ children }: { children: React.ReactNode }) {
  const { themeClassName } = useTheme();

  return <div className={themeClassName}>{children}</div>;
}
