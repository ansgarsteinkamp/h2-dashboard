/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import MapViewport from "./MapViewport";

const downloadTargetRefs = [];

vi.mock("@/components/map/MapDownloadButton", () => ({
   default({ targetRef }) {
      downloadTargetRefs.push(targetRef);
      return <button aria-label="Karte als PNG herunterladen" type="button" />;
   }
}));

vi.mock("react-leaflet", () => ({
   MapContainer({ children }) {
      return <div data-testid="map-container">{children}</div>;
   },
   useMap: () => ({
      getContainer: () => document.createElement("div"),
      invalidateSize: vi.fn()
   })
}));

describe("MapViewport", () => {
   afterEach(() => {
      cleanup();
      downloadTargetRefs.length = 0;
   });

   it("passes the viewport section as the PNG export target", () => {
      render(<MapViewport />);

      const viewport = screen.getByRole("region", {
         name: "Interaktive Karte der technischen Projekte und Netzelemente"
      });

      expect(downloadTargetRefs).toHaveLength(1);
      expect(downloadTargetRefs[0].current).toBe(viewport);
   });
});
