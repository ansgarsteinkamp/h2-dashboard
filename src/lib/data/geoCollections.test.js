import { describe, expect, it } from "vitest";

import { buildCountryCollections } from "./geoCollections";

function country(id, name = `Country ${id}`) {
   return {
      type: "Feature",
      id,
      properties: {
         name
      },
      geometry: {
         type: "Polygon",
         coordinates: [
            [
               [7, 51],
               [8, 51],
               [8, 52],
               [7, 51]
            ]
         ]
      }
   };
}

function collection(features = [country("276", "Germany"), country("250", "France")]) {
   return {
      type: "FeatureCollection",
      features
   };
}

describe("geoCollections", () => {
   it("builds separate Germany and context collections without changing feature objects", () => {
      const countries = collection();

      const { europeContext, germany } = buildCountryCollections(countries);

      expect(germany).toEqual({
         type: "FeatureCollection",
         features: [countries.features[0]]
      });
      expect(europeContext).toEqual({
         type: "FeatureCollection",
         features: [countries.features[1]]
      });
   });

   it("matches numeric Germany ids after padding", () => {
      expect(
         buildCountryCollections(collection([country(276, "Germany"), country("250", "France")])).germany.features
      ).toHaveLength(1);
   });

   it("matches Germany ids with surrounding whitespace", () => {
      expect(
         buildCountryCollections(collection([country("276 ", "Germany"), country("250", "France")])).germany.features
      ).toHaveLength(1);
   });

   it("does not require context countries when building the Germany collection", () => {
      expect(buildCountryCollections(collection([country("276", "Germany")])).germany.features).toHaveLength(1);
   });

   it("rejects collections without a Germany feature", () => {
      expect(() => buildCountryCollections(collection([country("250", "France")]))).toThrow(/Deutschland/);
   });

   it("allows empty context collections", () => {
      expect(buildCountryCollections(collection([country("276", "Germany")])).europeContext).toEqual({
         type: "FeatureCollection",
         features: []
      });
   });

   it("reuses the country GeoJSON validation before splitting", () => {
      expect(() => buildCountryCollections({ type: "FeatureCollection", features: [country("")] })).toThrow(
         /Länder-ID/
      );
   });
});
