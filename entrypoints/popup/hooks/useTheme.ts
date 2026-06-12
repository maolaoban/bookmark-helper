import { useCallback, useEffect } from "react";
import type { AppConfig } from "../../../types";

export function useTheme(theme: AppConfig["theme"]) {
  const applyTheme = useCallback(() => {
    const html = document.documentElement;
    if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      html.classList.toggle("dark", prefersDark);
    } else {
      html.classList.toggle("dark", theme === "dark");
    }
  }, [theme]);

  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", applyTheme);
    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, [applyTheme]);
}
