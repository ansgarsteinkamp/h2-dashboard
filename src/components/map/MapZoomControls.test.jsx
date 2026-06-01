/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import { DomEvent } from "leaflet";
import { afterEach, describe, expect, it, vi } from "vitest";

import MapZoomControls from "./MapZoomControls";
import { MAP_EXPORT_EXCLUDE_ATTRIBUTE } from "./mapExport";
import { TooltipProvider } from "@/components/ui/tooltip";

const { map } = vi.hoisted(() => ({
   map: {
      getMaxZoom: () => 10,
      getMinZoom: () => 5,
      getZoom: () => 6,
      off: vi.fn(),
      on: vi.fn(),
      zoomIn: vi.fn(),
      zoomOut: vi.fn()
   }
}));

vi.mock("react-leaflet", () => ({
   useMap: () => map
}));

describe("MapZoomControls", () => {
   afterEach(() => {
      cleanup();
      vi.restoreAllMocks();
   });

   it("excludes the zoom controls from PNG exports", () => {
      vi.spyOn(DomEvent, "disableClickPropagation").mockImplementation(() => {});
      vi.spyOn(DomEvent, "disableScrollPropagation").mockImplementation(() => {});

      render(
         <TooltipProvider>
            <MapZoomControls />
         </TooltipProvider>
      );

      expect(screen.getByRole("group", { name: "Kartenzoom" }).getAttribute(MAP_EXPORT_EXCLUDE_ATTRIBUTE)).toBe("");
   });
});
