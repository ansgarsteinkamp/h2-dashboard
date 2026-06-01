import { Download, LoaderCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
   createMapExportFilename,
   createMapSnapshot,
   MAP_EXPORT_EXCLUDE_PROPS,
   triggerBlobDownload
} from "@/components/map/mapExport";

export default function MapDownloadButton({ targetRef }) {
   const [isExporting, setIsExporting] = useState(false);

   const downloadMap = async () => {
      const target = targetRef.current;
      if (!target || isExporting) return;

      setIsExporting(true);

      try {
         const blob = await createMapSnapshot(target);
         if (!blob) throw new Error("Der Kartenexport konnte nicht erstellt werden.");
         triggerBlobDownload(blob, createMapExportFilename());
      } catch (error) {
         console.error("Kartenexport fehlgeschlagen:", error);
      } finally {
         setIsExporting(false);
      }
   };

   const tooltipLabel = isExporting ? "PNG wird erstellt" : "Karte als PNG herunterladen";

   return (
      <Tooltip>
         <TooltipTrigger asChild>
            <Button
               aria-label={tooltipLabel}
               aria-busy={isExporting}
               className="absolute top-3 right-3 z-500 border-border bg-[var(--map-legend-background)] text-accent-foreground shadow-none hover:bg-primary/20 hover:text-secondary dark:border-border dark:bg-[var(--map-legend-background)] dark:hover:bg-primary/20"
               disabled={isExporting}
               onClick={downloadMap}
               size="icon"
               type="button"
               variant="outline"
               {...MAP_EXPORT_EXCLUDE_PROPS}
            >
               {isExporting ? (
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
               ) : (
                  <Download aria-hidden="true" className="size-4" />
               )}
            </Button>
         </TooltipTrigger>
         <TooltipContent side="left">
            <span>{tooltipLabel}</span>
         </TooltipContent>
      </Tooltip>
   );
}
