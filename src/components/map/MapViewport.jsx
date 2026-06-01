import "leaflet/dist/leaflet.css";

import { useEffect, useRef } from "react";
import { MapContainer, useMap } from "react-leaflet";

import MapDownloadButton from "@/components/map/MapDownloadButton";

const requestFrame = callback => {
   if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
      return window.requestAnimationFrame(callback);
   }

   return setTimeout(callback, 0);
};

const cancelFrame = frameId => {
   if (typeof window !== "undefined" && typeof window.cancelAnimationFrame === "function") {
      window.cancelAnimationFrame(frameId);
      return;
   }

   clearTimeout(frameId);
};

const MAP_LABEL = "Interaktive Karte der technischen Projekte und Netzelemente";

function MapContainerA11yAttributes() {
   const map = useMap();

   useEffect(() => {
      const container = map.getContainer();
      container.setAttribute("aria-label", MAP_LABEL);
      container.removeAttribute("role");
   }, [map]);

   return null;
}

function MapResizeInvalidator() {
   const map = useMap();

   useEffect(() => {
      const container = map.getContainer();
      let frameId = null;

      const invalidateMapSize = () => {
         if (frameId !== null) {
            cancelFrame(frameId);
         }

         frameId = requestFrame(() => {
            frameId = null;
            map.invalidateSize({ animate: false, pan: false });
         });
      };

      invalidateMapSize();

      if (typeof ResizeObserver === "undefined") {
         window.addEventListener("resize", invalidateMapSize);

         return () => {
            window.removeEventListener("resize", invalidateMapSize);
            if (frameId !== null) cancelFrame(frameId);
         };
      }

      const observer = new ResizeObserver(invalidateMapSize);
      observer.observe(container);

      return () => {
         observer.disconnect();
         if (frameId !== null) cancelFrame(frameId);
      };
   }, [map]);

   return null;
}

export default function MapViewport({ children }) {
   const exportTargetRef = useRef(null);

   return (
      <section
         aria-label={MAP_LABEL}
         className="relative h-full min-h-110 overflow-hidden border border-border bg-muted/75 min-[1360px]:min-h-0 max-lg:h-auto max-lg:min-h-[58vh] max-sm:min-h-[54vh]"
         ref={exportTargetRef}
         role="region"
      >
         <MapDownloadButton targetRef={exportTargetRef} />
         <MapContainer
            attributionControl={false}
            center={[51.1, 10.3]}
            className="h-full min-h-110 bg-map-background min-[1360px]:min-h-0 max-lg:h-auto max-lg:min-h-[58vh] max-sm:min-h-[54vh]"
            keyboard={false}
            maxZoom={10}
            minZoom={5}
            scrollWheelZoom
            zoom={6}
            zoomControl={false}
            zoomDelta={0.5}
            zoomSnap={0.25}
         >
            <MapContainerA11yAttributes />
            <MapResizeInvalidator />
            {children}
         </MapContainer>
      </section>
   );
}
