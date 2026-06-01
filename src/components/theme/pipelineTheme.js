export const PIPELINE_MEDIUM_COLORS = {
   CO2: "var(--map-pipeline-co2, #d01d74)",
   Erdgas: "var(--map-pipeline-gas, #8a8f98)",
   Wasserstoff: "var(--map-pipeline-h2, #52a436)"
};

export const PIPELINE_CONTEXT_COLORS = {
   CO2: "var(--map-pipeline-co2-context, #f3c9dd)",
   Erdgas: "var(--map-pipeline-gas-context, #c7ccd1)",
   Wasserstoff: "var(--map-pipeline-h2-context, #bedfd9)"
};

export const SELECTION_HALO_COLORS = {
   CO2: "var(--map-pipeline-co2-halo, #a8165f)",
   Erdgas: "var(--map-pipeline-gas-halo, #636972)",
   Wasserstoff: "var(--map-pipeline-h2-halo, #3f8429)"
};

export const PIPELINE_SYMBOL_COLORS = {
   CO2: "var(--map-pipeline-co2, #d01d74)",
   Erdgas: "var(--map-pipeline-gas, #8a8f98)",
   Wasserstoff: "var(--map-pipeline-h2, #52a436)"
};

export const PIPELINE_FALLBACK_COLOR = "var(--map-pipeline-fallback, #013c74)";
export const SELECTION_HALO_FALLBACK_COLOR = "var(--map-pipeline-selection-halo-fallback, #013c74)";

const NEW_BUILD_DASH_LENGTH = 8;
const NEW_BUILD_DASH_GAP = 5;

export const LINE_TYPE_DASH_ARRAYS = {
   Neubau: `${NEW_BUILD_DASH_LENGTH} ${NEW_BUILD_DASH_GAP}`,
   Umstellung: null
};

export function getPipelineParticipationKey(featureOrProps) {
   const props = featureOrProps?.properties ?? featureOrProps ?? {};
   return props.contextOnly ? "context" : "project";
}

export function getPipelineColor(input) {
   const props = input?.properties ?? input ?? {};
   if (props.contextOnly) {
      return PIPELINE_CONTEXT_COLORS[props.medium] ?? PIPELINE_FALLBACK_COLOR;
   }
   return PIPELINE_MEDIUM_COLORS[props.medium] ?? PIPELINE_FALLBACK_COLOR;
}

export function getLineTypeDashArray(measure) {
   return LINE_TYPE_DASH_ARRAYS[measure] ?? null;
}

export function getLineTypeSymbolBackground(measure, color) {
   const dashArray = getLineTypeDashArray(measure);
   if (!dashArray) return color;

   const [dashLength, dashGap] = dashArray.split(/\s+/).map(Number);
   const dashEnd = Number.isFinite(dashLength) ? dashLength : NEW_BUILD_DASH_LENGTH;
   const gapEnd = dashEnd + (Number.isFinite(dashGap) ? dashGap : NEW_BUILD_DASH_GAP);
   return `repeating-linear-gradient(90deg, ${color} 0 ${dashEnd}px, transparent ${dashEnd}px ${gapEnd}px)`;
}

export function getSelectionHaloColor(input) {
   const props = input?.properties ?? input ?? {};
   return SELECTION_HALO_COLORS[props.medium] ?? SELECTION_HALO_FALLBACK_COLOR;
}
