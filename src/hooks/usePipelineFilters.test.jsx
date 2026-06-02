/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { usePipelineFilters } from "@/hooks/usePipelineFilters";
import { ALL_VALUE } from "@/lib/domain/constants";

const dashboardData = {
   network: {
      features: [
         {
            geometry: {
               coordinates: [
                  [7, 51],
                  [7.1, 51.1]
               ],
               type: "LineString"
            },
            properties: {
               contextOnly: true,
               geometryLengthKm: 11.4,
               id: "ctx-1",
               lengthKm: 20,
               medium: "Wasserstoff",
               measure: "Drittleitung",
               networkElement: "Leitung",
               sourceLengthKm: 18
            },
            type: "Feature"
         }
      ]
   },
   projects: [
      {
         builder: "OGE",
         cluster: "A",
         dates: { ibnYear: 2029 },
         id: "A-1",
         measure: "Neubau",
         medium: "Wasserstoff",
         name: "Projekt A",
         networkElement: "Leitung",
         networkFeatureIds: [],
         ownership: { ogeShare: 100 },
         technical: { lengthInternalKm: 1 }
      },
      {
         builder: "OGE",
         cluster: "B",
         dates: { ibnYear: 2032 },
         id: "B-1",
         measure: "Umstellung",
         medium: "Wasserstoff",
         name: "Projekt B",
         networkElement: "Leitung",
         networkFeatureIds: [],
         ownership: { ogeShare: 100 },
         technical: { lengthInternalKm: 2 }
      }
   ]
};

describe("usePipelineFilters", () => {
   it("keeps IBN year ranges valid when the lower bound moves above the upper bound", () => {
      const { result } = renderHook(() => usePipelineFilters(dashboardData));

      act(() => result.current.setFilter("yearTo", "2029"));
      act(() => result.current.setFilter("yearFrom", "2032"));

      expect(result.current.filters.yearFrom).toBe("2032");
      expect(result.current.filters.yearTo).toBe("2032");
      expect(result.current.filteredProjects).toHaveLength(1);
      expect(result.current.filteredProjects[0].id).toBe("B-1");
   });

   it("keeps IBN year ranges valid when the upper bound moves below the lower bound", () => {
      const { result } = renderHook(() => usePipelineFilters(dashboardData));

      act(() => result.current.setFilter("yearFrom", "2032"));
      act(() => result.current.setFilter("yearTo", "2029"));

      expect(result.current.filters.yearFrom).toBe("2029");
      expect(result.current.filters.yearTo).toBe("2029");
      expect(result.current.filteredProjects).toHaveLength(1);
      expect(result.current.filteredProjects[0].id).toBe("A-1");
   });

   it("allows open-ended IBN year ranges", () => {
      const { result } = renderHook(() => usePipelineFilters(dashboardData));

      act(() => result.current.setFilter("yearFrom", "2032"));
      act(() => result.current.setFilter("yearTo", ALL_VALUE));

      expect(result.current.filters.yearFrom).toBe("2032");
      expect(result.current.filters.yearTo).toBe(ALL_VALUE);
      expect(result.current.filteredProjects).toHaveLength(1);
      expect(result.current.filteredProjects[0].id).toBe("B-1");
   });

   it("uses display length for context feature metrics when available", () => {
      const { result } = renderHook(() => usePipelineFilters(dashboardData));

      act(() => result.current.setFilter("mapMode", "context"));

      expect(result.current.metrics.lengthKm).toBe(20);
   });

   it("falls back to source length for feature metrics when display length is missing", () => {
      const fallbackData = structuredClone(dashboardData);
      fallbackData.network.features[0].properties.lengthKm = null;

      const { result } = renderHook(() => usePipelineFilters(fallbackData));

      act(() => result.current.setFilter("mapMode", "context"));

      expect(result.current.metrics.lengthKm).toBe(18);
   });
});
