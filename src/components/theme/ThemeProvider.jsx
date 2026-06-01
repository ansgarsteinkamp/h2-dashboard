import { useEffect, useMemo, useState } from "react";

import { DEFAULT_THEME, isTheme, THEME_STORAGE_KEY } from "@/components/theme/constants";
import { ThemeProviderContext } from "@/components/theme/themeContext";

function getStoredTheme(storageKey, defaultTheme) {
   if (typeof window === "undefined") return defaultTheme;

   try {
      const storedTheme = window.localStorage.getItem(storageKey);
      return isTheme(storedTheme) ? storedTheme : defaultTheme;
   } catch {
      return defaultTheme;
   }
}

export function ThemeProvider({ children, defaultTheme = DEFAULT_THEME, storageKey = THEME_STORAGE_KEY, ...props }) {
   const [theme, setThemeState] = useState(() => getStoredTheme(storageKey, defaultTheme));

   useEffect(() => {
      const root = window.document.documentElement;

      root.classList.remove("light", "dark");
      root.classList.add(theme);
      root.style.colorScheme = theme;
   }, [theme]);

   const value = useMemo(
      () => ({
         setTheme: nextTheme => {
            if (!isTheme(nextTheme)) return;

            try {
               window.localStorage.setItem(storageKey, nextTheme);
            } catch {
               // Keep the in-memory theme usable when storage is unavailable.
            }

            setThemeState(nextTheme);
         },
         theme
      }),
      [storageKey, theme]
   );

   return (
      <ThemeProviderContext.Provider {...props} value={value}>
         {children}
      </ThemeProviderContext.Provider>
   );
}
