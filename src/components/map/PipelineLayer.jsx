import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { GeoJSON, Pane, useMap } from "react-leaflet";

import { createPipelineDataKey } from "@/components/map/mapDataKey";
import { getPipelineStyle, getSelectionHaloStyle } from "@/components/map/pipelineStyle";
import { getPipelineParticipationKey } from "@/components/theme/pipelineTheme";
import { pipelineMeta, pipelineTitle } from "@/lib/domain/formatters";

const MAP_TOOLTIP_OPTIONS = {
   className: "map-tooltip",
   direction: "top",
   interactive: false,
   offset: [0, -6],
   pane: "tooltipPane",
   sticky: true
};
const HITBOX_WEIGHT = 16;
const HITBOX_POINT_RADIUS = 13;
const HITBOX_STYLE = {
   className: "pipeline-hitbox",
   color: "#000000",
   dashArray: null,
   fillColor: "#000000",
   fillOpacity: 0.001,
   lineCap: "round",
   lineJoin: "round",
   opacity: 0.001,
   weight: HITBOX_WEIGHT
};

const createTooltip = feature => {
   const root = document.createElement("span");
   const title = document.createElement("strong");
   const meta = document.createElement("span");
   title.textContent = pipelineTitle(feature);
   meta.textContent = pipelineMeta(feature);
   root.append(title, meta);
   return root;
};

const bringToFront = layer => {
   if (typeof layer.bringToFront === "function") {
      layer.bringToFront();
   }
};

const createPipelineSubset = (pipelines, predicate) => ({
   ...pipelines,
   features: pipelines.features.filter(predicate)
});

const createPipelineFeatureCollection = (pipelines, features) => ({
   ...pipelines,
   features
});

const createPointLayer = (_feature, latLng) => L.circleMarker(latLng, { radius: 7 });
const createHitboxPointLayer = (_feature, latLng) =>
   L.circleMarker(latLng, {
      fillOpacity: 0.001,
      opacity: 0.001,
      radius: HITBOX_POINT_RADIUS,
      weight: 0
   });

const isProjectPipeline = feature => getPipelineParticipationKey(feature) === "project";

const sortPipelinesByDisplayPriority = features =>
   [...features].sort((left, right) => Number(isProjectPipeline(left)) - Number(isProjectPipeline(right)));

const makeLayerInert = layer => {
   const element = layer.getElement();
   if (element) {
      element.setAttribute("tabindex", "-1");
      element.setAttribute("focusable", "false");
   }
};

export default function PipelineLayer({ onSelectPipeline, pipelines, selectedPipelineIds = [] }) {
   const map = useMap();
   const projectGeoJsonRef = useRef(null);
   const contextGeoJsonRef = useRef(null);
   const hitboxGeoJsonRef = useRef(null);
   const [hoveredPipelineId, setHoveredPipelineId] = useState(null);
   const hoveredPipelineIdRef = useRef(null);
   const openTooltipLayerRef = useRef(null);
   const previousPipelinesRef = useRef(pipelines);
   const selectedPipelineIdsRef = useRef(new Set(selectedPipelineIds));
   const selectedPipelineIdSet = useMemo(() => new Set(selectedPipelineIds), [selectedPipelineIds]);
   const pipelineDataKey = useMemo(() => createPipelineDataKey(pipelines), [pipelines]);
   const projectPipelineData = useMemo(() => createPipelineSubset(pipelines, isProjectPipeline), [pipelines]);
   const contextPipelineData = useMemo(
      () => createPipelineSubset(pipelines, feature => !isProjectPipeline(feature)),
      [pipelines]
   );
   const hitboxPipelineData = useMemo(
      () => createPipelineFeatureCollection(pipelines, sortPipelinesByDisplayPriority(pipelines.features)),
      [pipelines]
   );
   const selectedPipelineData = useMemo(() => {
      const selectedPipelines = pipelines.features.filter(feature => selectedPipelineIdSet.has(feature.properties.id));
      if (selectedPipelines.length === 0) return null;
      return createPipelineFeatureCollection(pipelines, selectedPipelines);
   }, [pipelines, selectedPipelineIdSet]);
   const activePipelineData = useMemo(() => {
      const activeIds = [...selectedPipelineIds, hoveredPipelineId].filter(Boolean);
      if (activeIds.length === 0) return null;

      const activeIdSet = new Set(activeIds);
      const activeFeatures = sortPipelinesByDisplayPriority(
         pipelines.features.filter(feature => activeIdSet.has(feature.properties.id))
      );
      if (activeFeatures.length === 0) return null;

      return createPipelineFeatureCollection(pipelines, activeFeatures);
   }, [hoveredPipelineId, pipelines, selectedPipelineIds]);

   const closeOpenTooltip = useCallback(() => {
      openTooltipLayerRef.current?.closeTooltip();
      openTooltipLayerRef.current = null;
   }, []);

   const clearLayerTooltip = useCallback(layer => {
      layer.closeTooltip();
      if (openTooltipLayerRef.current === layer) {
         openTooltipLayerRef.current = null;
      }
   }, []);

   const eachPipelineLayer = useCallback(callback => {
      contextGeoJsonRef.current?.eachLayer(callback);
      projectGeoJsonRef.current?.eachLayer(callback);
   }, []);

   const eachHitboxLayer = useCallback(callback => {
      hitboxGeoJsonRef.current?.eachLayer(callback);
   }, []);

   const closeAllTooltips = useCallback(() => {
      closeOpenTooltip();
      eachHitboxLayer(layer => layer.closeTooltip());
   }, [closeOpenTooltip, eachHitboxLayer]);

   const bringSelectedPipelinesToFront = useCallback(() => {
      const selectedIds = selectedPipelineIdsRef.current;
      if (selectedIds.size === 0) return;

      eachPipelineLayer(layer => {
         if (selectedIds.has(layer.feature?.properties.id)) {
            bringToFront(layer);
         }
      });
   }, [eachPipelineLayer]);

   const refreshPipelineStyles = useCallback(
      (activeSelectedIds, activeHoveredPipelineId = null, { bringActiveLayersForward = true } = {}) => {
         const activeSelectedSet = new Set(activeSelectedIds);
         const selectedLayers = [];
         let hoveredLayer = null;

         eachPipelineLayer(layer => {
            const feature = layer.feature;
            if (!feature) return;

            const featureId = feature.properties.id;
            layer.setStyle(
               getPipelineStyle(feature, activeSelectedSet.has(featureId) ? featureId : null, activeHoveredPipelineId)
            );

            if (activeSelectedSet.has(featureId)) selectedLayers.push(layer);
            if (featureId === activeHoveredPipelineId) hoveredLayer = layer;
         });

         if (!bringActiveLayersForward) return;

         selectedLayers.forEach(bringToFront);
         if (hoveredLayer) bringToFront(hoveredLayer);
      },
      [eachPipelineLayer]
   );

   useEffect(() => {
      const closeTooltipOnMapMove = () => {
         hoveredPipelineIdRef.current = null;
         setHoveredPipelineId(null);
         closeAllTooltips();
         refreshPipelineStyles([...selectedPipelineIdsRef.current]);
      };
      const closeTooltipOnWindowBlur = () => closeTooltipOnMapMove();
      const closeTooltipOnVisibilityChange = () => {
         if (document.hidden) closeTooltipOnMapMove();
      };
      const mapContainer = map.getContainer();

      map.on("click movestart zoomstart dragstart", closeTooltipOnMapMove);
      mapContainer.addEventListener("mouseleave", closeTooltipOnMapMove);
      document.addEventListener("visibilitychange", closeTooltipOnVisibilityChange);
      window.addEventListener("pagehide", closeTooltipOnWindowBlur);
      window.addEventListener("pointercancel", closeTooltipOnWindowBlur);
      window.addEventListener("blur", closeTooltipOnWindowBlur);

      return () => {
         map.off("click movestart zoomstart dragstart", closeTooltipOnMapMove);
         mapContainer.removeEventListener("mouseleave", closeTooltipOnMapMove);
         document.removeEventListener("visibilitychange", closeTooltipOnVisibilityChange);
         window.removeEventListener("pagehide", closeTooltipOnWindowBlur);
         window.removeEventListener("pointercancel", closeTooltipOnWindowBlur);
         window.removeEventListener("blur", closeTooltipOnWindowBlur);
      };
   }, [closeAllTooltips, map, refreshPipelineStyles]);

   useEffect(() => {
      if (previousPipelinesRef.current !== pipelines) {
         closeAllTooltips();
         hoveredPipelineIdRef.current = null;
         setHoveredPipelineId(null);
         previousPipelinesRef.current = pipelines;
      }

      selectedPipelineIdsRef.current = new Set(selectedPipelineIds);
      refreshPipelineStyles(selectedPipelineIds, hoveredPipelineIdRef.current);
   }, [closeAllTooltips, pipelines, refreshPipelineStyles, selectedPipelineIds]);

   const bindPipeline = (feature, layer) => {
      layer.bindTooltip(createTooltip(feature), MAP_TOOLTIP_OPTIONS);

      const pipelineId = feature.properties.id;

      const selectPipeline = () => {
         closeOpenTooltip();
         onSelectPipeline(feature);
      };

      const showPipelineTooltip = event => {
         if (openTooltipLayerRef.current && openTooltipLayerRef.current !== event.target) {
            openTooltipLayerRef.current.closeTooltip();
         }
         openTooltipLayerRef.current = event.target;
         hoveredPipelineIdRef.current = pipelineId;
         setHoveredPipelineId(pipelineId);
         refreshPipelineStyles([...selectedPipelineIdsRef.current], pipelineId);
      };

      const hidePipelineTooltip = event => {
         hoveredPipelineIdRef.current = null;
         setHoveredPipelineId(null);
         clearLayerTooltip(event.target);
         refreshPipelineStyles([...selectedPipelineIdsRef.current]);
         bringSelectedPipelinesToFront();
      };

      layer.on({
         add: () => makeLayerInert(layer),
         click: selectPipeline,
         mouseout: hidePipelineTooltip,
         mouseover: showPipelineTooltip,
         tooltipopen: event => {
            openTooltipLayerRef.current = event.target;
         },
         remove: event => clearLayerTooltip(event.target)
      });
   };

   return (
      <>
         {selectedPipelineData ? (
            <Pane name="pipeline-selection-halo" style={{ zIndex: 410 }}>
               <GeoJSON
                  key={`selection-halo:${pipelineDataKey}:${selectedPipelineIds.join("|")}`}
                  data={selectedPipelineData}
                  interactive={false}
                  pointToLayer={createPointLayer}
                  style={getSelectionHaloStyle}
               />
            </Pane>
         ) : null}
         <Pane name="pipelines" style={{ zIndex: 420 }}>
            <GeoJSON
               key={`pipelines-context:${pipelineDataKey}`}
               ref={contextGeoJsonRef}
               data={contextPipelineData}
               interactive={false}
               pointToLayer={createPointLayer}
               style={feature =>
                  getPipelineStyle(
                     feature,
                     selectedPipelineIdSet.has(feature.properties.id) ? feature.properties.id : null
                  )
               }
            />
         </Pane>
         <Pane name="pipelines-project" style={{ zIndex: 430 }}>
            <GeoJSON
               key={`pipelines-project:${pipelineDataKey}`}
               ref={projectGeoJsonRef}
               data={projectPipelineData}
               interactive={false}
               pointToLayer={createPointLayer}
               style={feature =>
                  getPipelineStyle(
                     feature,
                     selectedPipelineIdSet.has(feature.properties.id) ? feature.properties.id : null
                  )
               }
            />
         </Pane>
         <Pane name="pipeline-hitbox" style={{ zIndex: 450 }}>
            <GeoJSON
               key={`pipeline-hitbox:${pipelineDataKey}`}
               ref={hitboxGeoJsonRef}
               data={hitboxPipelineData}
               onEachFeature={bindPipeline}
               pointToLayer={createHitboxPointLayer}
               style={HITBOX_STYLE}
            />
         </Pane>
         {activePipelineData ? (
            <Pane name="pipeline-active-overlay" style={{ zIndex: 440 }}>
               <GeoJSON
                  key={`pipeline-active:${pipelineDataKey}:${selectedPipelineIds.join("|")}:${hoveredPipelineId ?? ""}`}
                  data={activePipelineData}
                  interactive={false}
                  pointToLayer={createPointLayer}
                  style={feature =>
                     getPipelineStyle(
                        feature,
                        selectedPipelineIdSet.has(feature.properties.id) ? feature.properties.id : null,
                        hoveredPipelineId
                     )
                  }
               />
            </Pane>
         ) : null}
      </>
   );
}
