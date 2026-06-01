/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DEFAULT_THEME, THEME_STORAGE_KEY } from "@/components/theme/constants";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { TooltipProvider } from "@/components/ui/tooltip";

function renderThemeToggle() {
   return render(
      <ThemeProvider>
         <TooltipProvider>
            <ThemeToggle />
         </TooltipProvider>
      </ThemeProvider>
   );
}

afterEach(() => {
   cleanup();
   window.localStorage.clear();
   document.documentElement.className = "";
   document.documentElement.style.colorScheme = "";
});

describe("ThemeProvider", () => {
   it("uses dark mode as the default theme", () => {
      renderThemeToggle();

      expect(document.documentElement.classList.contains(DEFAULT_THEME)).toBe(true);
      expect(document.documentElement.classList.contains("light")).toBe(false);
      expect(document.documentElement.style.colorScheme).toBe(DEFAULT_THEME);
      expect(screen.getByRole("button", { name: "OGE-Theme" }).getAttribute("aria-pressed")).toBe("false");
   });

   it("switches from the default theme to the OGE theme", () => {
      renderThemeToggle();

      const toggle = screen.getByRole("button", { name: "OGE-Theme" });
      fireEvent.click(toggle);

      expect(document.documentElement.classList.contains("light")).toBe(true);
      expect(document.documentElement.classList.contains("dark")).toBe(false);
      expect(document.documentElement.style.colorScheme).toBe("light");
      expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
      expect(toggle.getAttribute("aria-pressed")).toBe("true");
   });

   it("uses a stored light theme and persists theme changes", () => {
      window.localStorage.setItem(THEME_STORAGE_KEY, "light");

      renderThemeToggle();

      const toggle = screen.getByRole("button", { name: "OGE-Theme" });
      expect(document.documentElement.classList.contains("light")).toBe(true);
      expect(document.documentElement.classList.contains("dark")).toBe(false);
      expect(toggle.getAttribute("aria-pressed")).toBe("true");

      fireEvent.click(toggle);

      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(document.documentElement.classList.contains("light")).toBe(false);
      expect(document.documentElement.style.colorScheme).toBe("dark");
      expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
      expect(screen.getByRole("button", { name: "OGE-Theme" }).getAttribute("aria-pressed")).toBe("false");
   });

   it("falls back to the default theme for invalid stored values", () => {
      window.localStorage.setItem(THEME_STORAGE_KEY, "system");

      renderThemeToggle();

      expect(document.documentElement.classList.contains(DEFAULT_THEME)).toBe(true);
      expect(document.documentElement.classList.contains("light")).toBe(false);
      expect(screen.getByRole("button", { name: "OGE-Theme" }).getAttribute("aria-pressed")).toBe("false");
   });
});
