import { describe, expect, it } from "vitest";

import { createPipelineDataKey } from "./mapDataKey";

const collection = feature => ({
   type: "FeatureCollection",
   features: [
      {
         type: "Feature",
         properties: {
            id: "H2-1",
            name: "Pipeline A",
            medium: "Wasserstoff",
            measure: "Neubau",
            projectId: "KLU001-01",
            contextOnly: false,
            ibnYear: 2032,
            ...feature.properties
         },
         geometry: feature.geometry ?? {
            type: "LineString",
            coordinates: [
               [7, 51],
               [8, 52]
            ]
         }
      }
   ]
});

describe("createPipelineDataKey", () => {
   it("changes when the visible pipeline identity changes", () => {
      const firstKey = createPipelineDataKey(collection({}));
      const nextKey = createPipelineDataKey(
         collection({
            properties: {
               id: "H2-2"
            }
         })
      );

      expect(nextKey).not.toBe(firstKey);
   });

   it("changes when the visible pipeline order changes", () => {
      const first = collection({});
      const second = collection({ properties: { id: "H2-2" } });
      const firstKey = createPipelineDataKey({
         type: "FeatureCollection",
         features: [...first.features, ...second.features]
      });
      const nextKey = createPipelineDataKey({
         type: "FeatureCollection",
         features: [...second.features, ...first.features]
      });

      expect(nextKey).not.toBe(firstKey);
   });

   it("changes when same-id feature objects change", () => {
      const firstKey = createPipelineDataKey(collection({}));
      const nextKey = createPipelineDataKey(
         collection({
            geometry: {
               type: "LineString",
               coordinates: [
                  [7, 51],
                  [9, 53]
               ]
            },
            properties: {
               contextOnly: true,
               measure: "Umstellung",
               name: "Pipeline B"
            }
         })
      );

      expect(nextKey).not.toBe(firstKey);
   });

   it("is stable for the same feature objects in a new collection wrapper", () => {
      const pipelines = collection({});
      const firstKey = createPipelineDataKey(pipelines);
      const nextKey = createPipelineDataKey({
         type: "FeatureCollection",
         features: [...pipelines.features]
      });

      expect(nextKey).toBe(firstKey);
   });
});
