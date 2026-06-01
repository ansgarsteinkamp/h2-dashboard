import { getLineTypeDashArray, getPipelineColor, getSelectionHaloColor } from "@/components/theme/pipelineTheme";

const BASE_WEIGHT = 3.4;
const HOVER_WEIGHT = 5.75;
const CONTEXT_OPACITY = 0.82;
const PROJECT_OPACITY = 0.97;

export const getPipelineStyle = (feature, selectedPipelineId, hoveredPipelineId = null) => {
   const pipelineId = feature.properties.id;
   const selected = pipelineId === selectedPipelineId;
   const hovered = pipelineId === hoveredPipelineId;
   const baseWeight = BASE_WEIGHT;
   const weight = selected ? baseWeight + 2.75 : baseWeight;

   return {
      className: null,
      color: getPipelineColor(feature),
      dashArray: getLineTypeDashArray(feature.properties.measure),
      fillColor: getPipelineColor(feature),
      fillOpacity: feature.geometry?.type === "Point" ? (selected || hovered ? 1 : 0.82) : 0,
      lineCap: "round",
      lineJoin: "round",
      opacity: selected || hovered ? 1 : feature.properties.contextOnly ? CONTEXT_OPACITY : PROJECT_OPACITY,
      weight: hovered ? Math.max(weight, HOVER_WEIGHT) : weight
   };
};

export const getSelectionHaloStyle = feature => ({
   color: getSelectionHaloColor(feature),
   className: "pipeline-selection-halo",
   dashArray: null,
   lineCap: "round",
   lineJoin: "round",
   opacity: 0.58,
   weight: 16
});
