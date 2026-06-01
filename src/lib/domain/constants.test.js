import { describe, expect, it } from "vitest";

import { INITIAL_BOUNDS } from "@/lib/domain/constants";

describe("INITIAL_BOUNDS", () => {
   it("setzt den Startausschnitt eng um Deutschland", () => {
      const [[south, west], [north, east]] = INITIAL_BOUNDS;

      expect(south).toBeGreaterThanOrEqual(47);
      expect(west).toBeGreaterThanOrEqual(5);
      expect(north).toBeLessThanOrEqual(56);
      expect(east).toBeLessThanOrEqual(15);
      expect(north - south).toBeLessThanOrEqual(8);
      expect(east - west).toBeLessThanOrEqual(10);
   });
});
