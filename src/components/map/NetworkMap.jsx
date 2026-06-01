import { useMemo, useState } from "react";

import CountryLayers from "@/components/map/CountryLayers";
import MapCameraEffects from "@/components/map/MapCameraEffects";
import MapLegend from "@/components/map/MapLegend";
import MapViewport from "@/components/map/MapViewport";
import MapZoomControls from "@/components/map/MapZoomControls";
import PipelineLayer from "@/components/map/PipelineLayer";

export default function NetworkMap({
   europeContext,
   filteredPipelines,
   germany,
   onSelectPipeline,
   resetViewKey,
   searchActive,
   searchBounds,
   selection,
   selectionFeatures = []
}) {
   const [hiddenLegendResetKey, setHiddenLegendResetKey] = useState(null);
   const isLegendVisible = hiddenLegendResetKey !== resetViewKey;
   const selectedPipelineIds = useMemo(
      () => selectionFeatures.map(feature => feature.properties.id),
      [selectionFeatures]
   );

   return (
      <MapViewport>
         <MapCameraEffects
            resetViewKey={resetViewKey}
            searchActive={searchActive}
            searchBounds={searchBounds}
            selection={selection}
            selectionFeatures={selectionFeatures}
         />
         <MapZoomControls />
         <CountryLayers europeContext={europeContext} germany={germany} />
         <PipelineLayer
            onSelectPipeline={onSelectPipeline}
            pipelines={filteredPipelines}
            selectedPipelineIds={selectedPipelineIds}
         />
         {isLegendVisible ? (
            <MapLegend features={filteredPipelines.features} onHide={() => setHiddenLegendResetKey(resetViewKey)} />
         ) : null}
      </MapViewport>
   );
}
