import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const css = readFileSync(resolve("src/index.css"), "utf8");

function declarations(selector) {
   const match = css.match(new RegExp(`${selector}\\s*\\{([\\s\\S]*?)\\}`));
   if (!match) throw new Error(`Missing ${selector} block`);

   return new Map(
      [...match[1].matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)].map(([, property, value]) => [property, value.trim()])
   );
}

function declarationValue(propertyName) {
   const match = css.match(new RegExp(`${propertyName}:\\s*([^;]+);`));
   if (!match) throw new Error(`Missing ${propertyName} declaration`);

   return match[1].replace(/\s+/g, " ").trim();
}

describe("font theme tokens", () => {
   it("uses Montserrat for the light UI and keeps DM Mono for the dark UI", () => {
      expect(declarations(":root").get("--font-ui")).toContain('"Montserrat"');
      expect(declarations("\\.dark").get("--font-ui")).toContain('"DM Mono"');
   });

   it("routes app typography through the theme font token", () => {
      expect(declarationValue("--font-sans")).toContain("var(--font-ui)");
      expect(css).toMatch(/body\s*\{[\s\S]*font-family:\s*var\(--font-ui\);/);
      expect(css).toMatch(/\.map-tooltip\s*\{[\s\S]*font-family:\s*var\(--font-ui\);/);
      expect(css).not.toMatch(/\.map-tooltip\s*\{[\s\S]*font-family:\s*"DM Mono"/);
   });
});
