import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { buildCountryCollections } from "./geoCollections";
import { validateCountriesGeoJson } from "./loadCountries";

const countriesAssetUrl = new URL("../../../public/data/countries_v2.geojson", import.meta.url);

const collectRings = geometry => {
   if (geometry.type === "Polygon") return geometry.coordinates;

   return geometry.coordinates.flat();
};

const segmentKey = (start, end) => {
   const left = `${start[0]},${start[1]}`;
   const right = `${end[0]},${end[1]}`;

   return left < right ? `${left}|${right}` : `${right}|${left}`;
};

const collectSegmentKeys = feature => {
   const segments = new Set();

   collectRings(feature.geometry).forEach(ring => {
      for (let index = 1; index < ring.length; index += 1) {
         segments.add(segmentKey(ring[index - 1], ring[index]));
      }
   });

   return segments;
};

const countSharedSegments = (leftFeature, rightFeature) => {
   const leftSegments = collectSegmentKeys(leftFeature);
   const rightSegments = collectSegmentKeys(rightFeature);

   return [...leftSegments].filter(segment => rightSegments.has(segment)).length;
};

describe("countries_v2.geojson asset", () => {
   it("contains valid country polygons with exactly one Germany feature", () => {
      const countries = JSON.parse(readFileSync(countriesAssetUrl, "utf8"));

      expect(validateCountriesGeoJson(countries)).toBe(countries);

      const { europeContext, germany } = buildCountryCollections(countries);

      expect(germany.features).toHaveLength(1);
      expect(europeContext.features.length).toBeGreaterThan(0);
      expect(germany.features[0].geometry.type).toMatch(/^(Multi)?Polygon$/);
   });

   it("keeps the Germany-Netherlands border topologically aligned", () => {
      const countries = JSON.parse(readFileSync(countriesAssetUrl, "utf8"));
      const { germany } = buildCountryCollections(countries);
      const netherlands = countries.features.find(feature => feature.properties.name === "Netherlands");

      expect(netherlands).toBeTruthy();
      expect(countSharedSegments(germany.features[0], netherlands)).toBeGreaterThanOrEqual(50);
   });
});
