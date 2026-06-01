import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

import { INITIAL_BOUNDS } from "@/lib/domain/constants";
import { featureCollectionToLatLngs, featureToLatLngs } from "@/lib/domain/coordinates";

const INITIAL_CAMERA_PADDING = [48, 48];
const SEARCH_CAMERA_PADDING = [48, 48];
const SEARCH_MAX_FIT_ZOOM = 8;
const SELECTION_CAMERA_PADDING = [80, 80];
const SELECTION_MAX_FIT_ZOOM = 7;

export default function MapCameraEffects({
   resetViewKey,
   searchActive,
   searchBounds,
   selection,
   selectionFeatures = []
}) {
   const map = useMap();
   const previousMapRef = useRef(null);
   const previousResetViewKeyRef = useRef(resetViewKey);
   const previousSearchActiveRef = useRef(searchActive);
   const previousSearchBoundsRef = useRef(null);
   const previousSelectionRef = useRef(null);

   useEffect(() => {
      map.fitBounds(INITIAL_BOUNDS, { padding: INITIAL_CAMERA_PADDING });
   }, [map, resetViewKey]);

   useEffect(() => {
      const mapChanged = map !== previousMapRef.current;
      const resetViewChanged = resetViewKey !== previousResetViewKeyRef.current;
      const selectionChanged = selection !== previousSelectionRef.current;
      const selectionCleared = Boolean(previousSelectionRef.current && !selection);
      const searchCleared = previousSearchActiveRef.current && !searchActive;
      const searchBoundsChanged = searchBounds !== previousSearchBoundsRef.current;

      previousMapRef.current = map;
      previousResetViewKeyRef.current = resetViewKey;
      previousSearchActiveRef.current = searchActive;
      previousSelectionRef.current = selection;
      previousSearchBoundsRef.current = searchBounds;

      if (resetViewChanged) return;

      // Selection owns contextual camera movement while active; search resumes only after it clears.
      if (selection) {
         if (!selectionChanged && !mapChanged) return;

         const selectionBounds =
            selection.kind === "project"
               ? featureCollectionToLatLngs({ type: "FeatureCollection", features: selectionFeatures })
               : featureToLatLngs(selection.item);
         if (selectionBounds.length) {
            map.fitBounds(selectionBounds, {
               animate: true,
               maxZoom: SELECTION_MAX_FIT_ZOOM,
               padding: SELECTION_CAMERA_PADDING
            });
         }

         return;
      }

      if (!searchBounds.length) {
         if (searchCleared || selectionCleared || (searchActive && searchBoundsChanged)) {
            map.fitBounds(INITIAL_BOUNDS, { animate: true, padding: INITIAL_CAMERA_PADDING });
         }
         return;
      }

      if (!searchBoundsChanged && !selectionCleared && !mapChanged) return;
      map.fitBounds(searchBounds, { animate: true, maxZoom: SEARCH_MAX_FIT_ZOOM, padding: SEARCH_CAMERA_PADDING });
   }, [map, resetViewKey, searchActive, searchBounds, selection, selectionFeatures]);

   return null;
}
