import { Palette } from "lucide-react";

import { useTheme } from "@/components/theme/themeContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

export default function ThemeToggle() {
   const { theme, setTheme } = useTheme();
   const isOgeTheme = theme === "light";
   const nextTheme = isOgeTheme ? "dark" : "light";
   const tooltipLabel = isOgeTheme ? "Dark-Mode aktivieren" : "OGE-Theme aktivieren";

   return (
      <Tooltip>
         <TooltipTrigger asChild>
            <Button
               aria-label="OGE-Theme"
               aria-pressed={isOgeTheme}
               className="h-9 gap-1.5 px-2.5 aria-pressed:bg-accent aria-pressed:text-accent-foreground"
               onClick={() => setTheme(nextTheme)}
               size="sm"
               type="button"
               variant="outline"
            >
               <Palette aria-hidden="true" className="size-3.5" />
               <span aria-hidden="true" className="flex items-center gap-1">
                  <span className="size-2.5 rounded-full border border-border bg-background ring-1 ring-foreground/15" />
                  <span className="size-2.5 rounded-full border border-border bg-label-accent" />
                  <span className="size-2.5 rounded-full border border-border bg-foreground" />
               </span>
            </Button>
         </TooltipTrigger>
         <TooltipContent>
            <span>{tooltipLabel}</span>
         </TooltipContent>
      </Tooltip>
   );
}
