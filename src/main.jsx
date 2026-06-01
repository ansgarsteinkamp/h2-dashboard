import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "@/App";
import AppErrorBoundary from "@/components/layout/AppErrorBoundary";
import { DEFAULT_THEME, THEME_STORAGE_KEY } from "@/components/theme/constants";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@/index.css";

createRoot(document.getElementById("root")).render(
   <StrictMode>
      <ThemeProvider defaultTheme={DEFAULT_THEME} storageKey={THEME_STORAGE_KEY}>
         <TooltipProvider>
            <AppErrorBoundary>
               <App />
            </AppErrorBoundary>
         </TooltipProvider>
      </ThemeProvider>
   </StrictMode>
);
