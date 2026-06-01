import { DomEvent } from "leaflet";
import { Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";

import { MAP_EXPORT_EXCLUDE_PROPS } from "@/components/map/mapExport";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const ZOOM_STEP = 0.5;
const ZOOM_BUTTON_CLASS =
   "grid size-9 place-items-center border-0 bg-[var(--map-legend-background)] text-accent-foreground transition-colors hover:bg-primary/20 hover:text-secondary focus-visible:ring-3 focus-visible:ring-ring/65 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-ring/50";

function ZoomButton({ children, className, disabled, label, onClick }) {
   return (
      <Tooltip>
         <TooltipTrigger asChild>
            <button aria-label={label} className={className} disabled={disabled} onClick={onClick} type="button">
               {children}
            </button>
         </TooltipTrigger>
         <TooltipContent side="right">
            <span>{label}</span>
         </TooltipContent>
      </Tooltip>
   );
}

export default function MapZoomControls() {
   const map = useMap();
   const controlRef = useRef(null);
   const [zoom, setZoom] = useState(map.getZoom());

   useEffect(() => {
      if (controlRef.current) {
         DomEvent.disableClickPropagation(controlRef.current);
         DomEvent.disableScrollPropagation(controlRef.current);
      }

      const syncZoom = () => setZoom(map.getZoom());
      map.on("zoomend", syncZoom);
      syncZoom();

      return () => {
         map.off("zoomend", syncZoom);
      };
   }, [map]);

   return (
      <div
         className="absolute top-3 left-3 z-500 grid overflow-hidden rounded-md border border-border bg-[var(--map-legend-background)]"
         ref={controlRef}
         role="group"
         aria-label="Kartenzoom"
         {...MAP_EXPORT_EXCLUDE_PROPS}
      >
         <ZoomButton
            className={`${ZOOM_BUTTON_CLASS} border-b border-border`}
            disabled={zoom >= map.getMaxZoom()}
            label="Karte vergrößern"
            onClick={event => {
               event.preventDefault();
               event.stopPropagation();
               map.zoomIn(ZOOM_STEP);
            }}
         >
            <Plus aria-hidden="true" className="size-4" />
         </ZoomButton>
         <ZoomButton
            className={ZOOM_BUTTON_CLASS}
            disabled={zoom <= map.getMinZoom()}
            label="Karte verkleinern"
            onClick={event => {
               event.preventDefault();
               event.stopPropagation();
               map.zoomOut(ZOOM_STEP);
            }}
         >
            <Minus aria-hidden="true" className="size-4" />
         </ZoomButton>
      </div>
   );
}
