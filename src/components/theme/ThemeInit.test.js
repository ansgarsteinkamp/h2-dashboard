/**
 * @vitest-environment jsdom
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { DEFAULT_THEME, THEME_STORAGE_KEY } from "@/components/theme/constants";

const indexHtml = readFileSync(resolve("index.html"), "utf8");
const script = readFileSync(resolve("public/theme-init.js"), "utf8");

function runThemeInit() {
   window.eval(script);
}

afterEach(() => {
   window.localStorage.clear();
   document.documentElement.className = "";
   document.documentElement.style.colorScheme = "";
});

describe("theme-init", () => {
   it("loads the init script from a CSP-compatible external file", () => {
      const themeInitScript = '<script src="%BASE_URL%theme-init.js"></script>';
      const appScript = '<script type="module" src="/src/main.jsx"></script>';

      expect(indexHtml).toContain(themeInitScript);
      expect(indexHtml.indexOf(themeInitScript)).toBeLessThan(indexHtml.indexOf(appScript));
      expect(indexHtml).not.toMatch(/<script data-theme-init>/);
      expect(indexHtml).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>/);
   });

   it("uses dark mode by default before React starts", () => {
      runThemeInit();

      expect(document.documentElement.classList.contains(DEFAULT_THEME)).toBe(true);
      expect(document.documentElement.classList.contains("light")).toBe(false);
      expect(document.documentElement.style.colorScheme).toBe(DEFAULT_THEME);
   });

   it("uses a stored light theme before React starts", () => {
      window.localStorage.setItem(THEME_STORAGE_KEY, "light");

      runThemeInit();

      expect(document.documentElement.classList.contains("light")).toBe(true);
      expect(document.documentElement.classList.contains("dark")).toBe(false);
      expect(document.documentElement.style.colorScheme).toBe("light");
   });

   it("ignores unsupported stored themes", () => {
      window.localStorage.setItem(THEME_STORAGE_KEY, "system");

      runThemeInit();

      expect(document.documentElement.classList.contains(DEFAULT_THEME)).toBe(true);
      expect(document.documentElement.classList.contains("light")).toBe(false);
      expect(document.documentElement.style.colorScheme).toBe(DEFAULT_THEME);
   });
});
