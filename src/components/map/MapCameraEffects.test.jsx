/**
 * @vitest-environment jsdom
 */
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { INITIAL_BOUNDS } from "@/lib/domain/constants";
import MapCameraEffects from "./MapCameraEffects";

const mockMap = vi.hoisted(() => ({
   fitBounds: vi.fn()
}));

vi.mock("react-leaflet", () => ({
   useMap: () => mockMap
}));

afterEach(() => {
   cleanup();
   mockMap.fitBounds.mockClear();
});

describe("MapCameraEffects", () => {
   it("resumes active search bounds when a selection is closed without an explicit reset", () => {
      const searchBounds = [
         [51, 7],
         [52, 8]
      ];
      const selection = {
         item: {
            type: "Feature",
            geometry: {
               type: "LineString",
               coordinates: [
                  [7.1, 51.1],
                  [7.2, 51.2]
               ]
            },
            properties: { id: "H2-001-01" }
         }
      };
      const { rerender } = render(
         <MapCameraEffects resetViewKey={0} searchActive searchBounds={searchBounds} selection={selection} />
      );

      mockMap.fitBounds.mockClear();

      rerender(<MapCameraEffects resetViewKey={0} searchActive searchBounds={searchBounds} selection={null} />);

      expect(mockMap.fitBounds).toHaveBeenCalledTimes(1);
      expect(mockMap.fitBounds).toHaveBeenCalledWith(searchBounds, {
         animate: true,
         maxZoom: 8,
         padding: [48, 48]
      });
   });

   it("returns to the initial view when an indirect selection clear has no search bounds", () => {
      const selection = {
         item: {
            type: "Feature",
            geometry: {
               type: "LineString",
               coordinates: [
                  [7.1, 51.1],
                  [7.2, 51.2]
               ]
            },
            properties: { id: "H2-001-01" }
         }
      };
      const { rerender } = render(
         <MapCameraEffects resetViewKey={0} searchActive={false} searchBounds={[]} selection={selection} />
      );

      mockMap.fitBounds.mockClear();

      rerender(<MapCameraEffects resetViewKey={0} searchActive={false} searchBounds={[]} selection={null} />);

      expect(mockMap.fitBounds).toHaveBeenCalledTimes(1);
      expect(mockMap.fitBounds).toHaveBeenCalledWith(INITIAL_BOUNDS, { animate: true, padding: [48, 48] });
   });

   it("returns to the initial view when active search bounds become empty", () => {
      const searchBounds = [
         [51, 7],
         [52, 8]
      ];
      const { rerender } = render(
         <MapCameraEffects resetViewKey={0} searchActive searchBounds={searchBounds} selection={null} />
      );

      mockMap.fitBounds.mockClear();

      rerender(<MapCameraEffects resetViewKey={0} searchActive searchBounds={[]} selection={null} />);

      expect(mockMap.fitBounds).toHaveBeenCalledTimes(1);
      expect(mockMap.fitBounds).toHaveBeenCalledWith(INITIAL_BOUNDS, { animate: true, padding: [48, 48] });
   });

   it("lets an explicit reset take precedence over active search bounds", () => {
      const searchBounds = [
         [51, 7],
         [52, 8]
      ];
      const { rerender } = render(
         <MapCameraEffects resetViewKey={0} searchActive searchBounds={searchBounds} selection={null} />
      );

      mockMap.fitBounds.mockClear();

      rerender(<MapCameraEffects resetViewKey={1} searchActive searchBounds={searchBounds} selection={null} />);

      expect(mockMap.fitBounds).toHaveBeenCalledTimes(1);
      expect(mockMap.fitBounds).toHaveBeenCalledWith(INITIAL_BOUNDS, { padding: [48, 48] });
   });
});
