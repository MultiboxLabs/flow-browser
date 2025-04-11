import { useEffect, useState, createContext, useContext } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export function ThemeProvider({
  forceTheme,
  persist = false,
  children
}: {
  forceTheme?: Theme;
  persist?: boolean;
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

  useEffect(() => {
    // Determine the actual theme to apply
    const applyTheme = theme === "system" ? resolvedTheme : theme;

    // Apply theme class to document
    if (applyTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }

    if (persist) {
      // Save theme to localStorage
      localStorage.setItem("theme", theme);
    }
  }, [theme, resolvedTheme, persist]);

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

  const value = { theme, setTheme, resolvedTheme };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
