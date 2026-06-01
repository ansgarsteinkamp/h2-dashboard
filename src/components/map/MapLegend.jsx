import { X } from "lucide-react";

import { MAP_EXPORT_EXCLUDE_PROPS } from "@/components/map/mapExport";
import { PIPELINE_CONTEXT_COLORS, PIPELINE_SYMBOL_COLORS } from "@/components/theme/pipelineTheme";
import { PipelineLineSymbol } from "@/components/ui/pipeline-line-symbol";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MEDIUM_ORDER } from "@/lib/domain/constants";
import { mediumLabel } from "@/lib/domain/formatters";

const LEGEND_SYMBOL_OPACITY = 0.95;
const PARTICIPATION_ORDER = ["project", "context"];
const LINE_TYPE_ORDER = ["Bestand", "Neubau"];

function participationKey(feature) {
   return feature.properties?.contextOnly ? "context" : "project";
}

function participationLabel(key) {
   return key === "context" ? "Dritte" : "OGE";
}

function lineTypeKey(feature) {
   const measure = feature.properties?.measure;
   if (measure === "Neubau") return "Neubau";
   return "Bestand";
}

function lineTypeLabel(key) {
   if (key === "Neubau") return "Neubau";
   return "Umstellung";
}

function entryLabel(medium, participation, lineType) {
   return `${mediumLabel(medium)} | ${participationLabel(participation)} | ${lineTypeLabel(lineType)}`;
}

function colorForEntry(medium, participation) {
   if (participation === "context") return PIPELINE_CONTEXT_COLORS[medium] ?? PIPELINE_SYMBOL_COLORS[medium];
   return PIPELINE_SYMBOL_COLORS[medium];
}

function sortEntries(left, right) {
   const leftMedium = MEDIUM_ORDER.includes(left.medium) ? MEDIUM_ORDER.indexOf(left.medium) : MEDIUM_ORDER.length;
   const rightMedium = MEDIUM_ORDER.includes(right.medium) ? MEDIUM_ORDER.indexOf(right.medium) : MEDIUM_ORDER.length;
   if (leftMedium !== rightMedium) return leftMedium - rightMedium;

   const leftParticipation = PARTICIPATION_ORDER.indexOf(left.participation);
   const rightParticipation = PARTICIPATION_ORDER.indexOf(right.participation);
   if (leftParticipation !== rightParticipation) return leftParticipation - rightParticipation;

   return LINE_TYPE_ORDER.indexOf(left.lineType) - LINE_TYPE_ORDER.indexOf(right.lineType);
}

function buildEntries(features = []) {
   const byKey = new Map();

   features.forEach(feature => {
      if (feature.geometry?.type === "Point") return;

      const medium = feature.properties?.medium;
      if (!medium) return;

      const participation = participationKey(feature);
      const lineType = lineTypeKey(feature);
      const key = `${medium}:${participation}:${lineType}`;

      if (!byKey.has(key)) {
         byKey.set(key, {
            color: colorForEntry(medium, participation),
            label: entryLabel(medium, participation, lineType),
            lineType: lineType === "Neubau" ? "Neubau" : null,
            medium,
            participation
         });
      }
   });

   if (features.some(feature => feature.geometry?.type === "Point")) {
      byKey.set("points", {
         label: "Anlage / Station",
         lineType: "point",
         medium: "zz",
         participation: "project"
      });
   }

   return [...byKey.values()].sort(sortEntries);
}

function LegendSymbol({ color = "currentColor", lineType }) {
   if (lineType === "point") {
      return <span className="size-2.5 rounded-full border border-current bg-current" aria-hidden="true" />;
   }

   return (
      <PipelineLineSymbol
         className="h-0.75 w-5 rounded-full"
         color={color}
         lineType={lineType}
         opacity={LEGEND_SYMBOL_OPACITY}
      />
   );
}

export default function MapLegend({ features, onHide }) {
   const entries = buildEntries(features);

   if (entries.length === 0) return null;

   return (
      <aside
         aria-label="Kartenlegende"
         className="absolute right-3.5 bottom-3.5 z-500 w-fit max-w-[min(20rem,calc(100%-1.75rem))] rounded-md border border-border bg-[var(--map-legend-background)] px-3 py-2.5 text-[0.6rem] text-muted-foreground backdrop-blur-md max-sm:hidden"
      >
         {onHide ? (
            <Tooltip>
               <TooltipTrigger asChild>
                  <button
                     aria-label="Legende ausblenden"
                     className="absolute top-1.5 right-1.5 grid size-4.5 place-items-center rounded-sm text-muted-foreground transition-colors hover:bg-primary/15 hover:text-secondary focus-visible:ring-3 focus-visible:ring-ring/35 focus-visible:outline-none"
                     onClick={onHide}
                     type="button"
                     {...MAP_EXPORT_EXCLUDE_PROPS}
                  >
                     <X aria-hidden="true" className="size-3" strokeWidth={2} />
                  </button>
               </TooltipTrigger>
               <TooltipContent side="left">
                  <span>Legende ausblenden</span>
               </TooltipContent>
            </Tooltip>
         ) : null}
         <ul className="grid gap-1.5 pr-4">
            {entries.map(entry => (
               <li key={entry.label} className="inline-flex items-center gap-2">
                  <LegendSymbol color={entry.color} lineType={entry.lineType} />
                  {entry.label}
               </li>
            ))}
         </ul>
      </aside>
   );
}
