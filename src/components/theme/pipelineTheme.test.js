import { describe, expect, it } from "vitest";

import { getLineTypeDashArray, getLineTypeSymbolBackground } from "@/components/theme/pipelineTheme";

describe("getLineTypeSymbolBackground", () => {
   it("verwendet ein gestricheltes Muster für Neubau", () => {
      const newBuild = getLineTypeSymbolBackground("Neubau", "#52a436");

      expect(newBuild).toContain("#52a436 0 8px");
      expect(newBuild).toContain("transparent 8px 13px");
   });

   it("zeichnet Drittleitungen nicht als eigenen Linientyp", () => {
      expect(getLineTypeDashArray("Drittleitung")).toBeNull();
      expect(getLineTypeSymbolBackground("Drittleitung", "#52a436")).toBe("#52a436");
   });
});
