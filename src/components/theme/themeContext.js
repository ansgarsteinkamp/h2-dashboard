import { createContext, useContext } from "react";

export const ThemeProviderContext = createContext(null);

export function useTheme() {
   const context = useContext(ThemeProviderContext);

   if (!context) {
      throw new Error("useTheme must be used within a ThemeProvider");
   }

   return context;
}
