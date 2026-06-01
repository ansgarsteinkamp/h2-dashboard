import { Info } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function HelpTooltip({ children, className, contentClassName, label, side = "right", sideOffset }) {
   if (!children) return null;

   return (
      <Tooltip>
         <TooltipTrigger asChild>
            <button
               aria-label={`${label} erläutern`}
               className={cn(
                  "inline-grid size-5 shrink-0 place-items-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/65 focus-visible:outline-none dark:focus-visible:ring-ring/50",
                  className
               )}
               type="button"
            >
               <Info aria-hidden="true" className="size-3.5" />
            </button>
         </TooltipTrigger>
         <TooltipContent className={contentClassName} side={side} sideOffset={sideOffset}>
            {children}
         </TooltipContent>
      </Tooltip>
   );
}

export { HelpTooltip };
