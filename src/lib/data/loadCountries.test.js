import { afterEach, describe, expect, it, vi } from "vitest";

import { loadCountries, validateCountriesGeoJson } from "./loadCountries";

function country(overrides = {}) {
   return {
      type: "Feature",
      id: "276",
      properties: {
         name: "Germany"
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
      },
      ...overrides
   };
}

function collection(features = [country()]) {
   return {
      type: "FeatureCollection",
      features
   };
}

describe("validateCountriesGeoJson", () => {
   it("keeps a valid countries FeatureCollection unchanged", () => {
      const countries = collection();

      expect(validateCountriesGeoJson(countries)).toBe(countries);
   });

   it("rejects non-FeatureCollection country data", () => {
      expect(() => validateCountriesGeoJson({ type: "Feature", features: [] })).toThrow(/FeatureCollection/);
   });

   it("rejects country features without an id, name, or polygon geometry", () => {
      expect(() => validateCountriesGeoJson(collection([country({ id: "" })]))).toThrow(/Länder-ID/);
      expect(() => validateCountriesGeoJson(collection([country({ properties: {} })]))).toThrow(/Ländername/);
      expect(() =>
         validateCountriesGeoJson(
            collection([
               country({
                  geometry: {
                     type: "LineString",
                     coordinates: [
                        [7, 51],
                        [8, 52]
                     ]
                  }
               })
            ])
         )
      ).toThrow(/Polygon/);
   });

   it("rejects malformed polygon coordinates", () => {
      expect(() =>
         validateCountriesGeoJson(collection([country({ geometry: { type: "Polygon", coordinates: [] } })]))
      ).toThrow(/Polygon/);
      expect(() =>
         validateCountriesGeoJson(
            collection([
               country({
                  geometry: {
                     type: "Polygon",
                     coordinates: [
                        [
                           [7, 51],
                           [8, 51],
                           [8, 52],
                           [7, 52]
                        ]
                     ]
                  }
               })
            ])
         )
      ).toThrow(/Polygon/);
      expect(() =>
         validateCountriesGeoJson(
            collection([
               country({
                  geometry: {
                     type: "Polygon",
                     coordinates: [
                        [
                           [7, 51],
                           [181, 51],
                           [8, 52],
                           [7, 51]
                        ]
                     ]
                  }
               })
            ])
         )
      ).toThrow(/Polygon/);
   });

   it("rejects duplicate country ids", () => {
      expect(() => validateCountriesGeoJson(collection([country(), country()]))).toThrow(/doppelt vergeben/);
   });
});

describe("loadCountries", () => {
   afterEach(() => {
      vi.unstubAllGlobals();
   });

   it("fetches, parses, and validates the countries GeoJSON", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
         ok: true,
         text: () => Promise.resolve(JSON.stringify(collection()))
      });
      vi.stubGlobal("fetch", fetchMock);

      await expect(loadCountries("/base/")).resolves.toEqual(collection());
      expect(fetchMock).toHaveBeenCalledWith("/base/data/countries_v2.geojson");
   });

   it("uses a clear error when the countries file cannot be fetched", async () => {
      vi.stubGlobal(
         "fetch",
         vi.fn().mockResolvedValue({
            ok: false,
            text: () => Promise.resolve("")
         })
      );

      await expect(loadCountries("/")).rejects.toThrow(/konnte nicht geladen/);
   });

   it("uses a clear error when the countries request rejects", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("NetworkError")));

      await expect(loadCountries("/")).rejects.toThrow(/konnte nicht geladen/);
   });

   it("uses a clear error when the countries file is not valid JSON", async () => {
      vi.stubGlobal(
         "fetch",
         vi.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve("{")
         })
      );

      await expect(loadCountries("/")).rejects.toThrow(/kein gültiges GeoJSON/);
   });
});
