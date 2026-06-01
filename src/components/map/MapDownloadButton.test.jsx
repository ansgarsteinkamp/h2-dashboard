/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";
import MapDownloadButton from "./MapDownloadButton";
import { createMapExportFilename, createMapSnapshot, MAP_EXPORT_EXCLUDE_ATTRIBUTE } from "./mapExport";
import { toBlob } from "html-to-image";

vi.mock("html-to-image", () => ({
   toBlob: vi.fn()
}));

const renderDownloadButton = targetRef => {
   render(
      <TooltipProvider>
         <MapDownloadButton targetRef={targetRef} />
      </TooltipProvider>
   );
};

describe("MapDownloadButton", () => {
   let clickSpy;
   let consoleErrorSpy;
   let createObjectUrlSpy;
   let clickedDownloadFilename;
   let requestAnimationFrameSpy;
   let revokeObjectUrlSpy;
   let styleElement;

   beforeEach(() => {
      toBlob.mockClear();
      document.documentElement.className = "light";
      document.documentElement.style.setProperty("--map-pipeline-oge", "#52a436");
      styleElement = document.createElement("style");
      styleElement.textContent = ".export-path { stroke: rgb(1, 2, 3); stroke-width: 8px; fill: none; opacity: 0.5; }";
      document.head.append(styleElement);
      clickedDownloadFilename = null;
      consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function () {
         clickedDownloadFilename = this.download;
      });
      createObjectUrlSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:map-export");
      requestAnimationFrameSpy = vi.spyOn(window, "requestAnimationFrame").mockImplementation(callback => {
         callback();
         return 1;
      });
      revokeObjectUrlSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
      Object.defineProperty(document, "fonts", {
         configurable: true,
         value: { ready: Promise.resolve() }
      });
      Object.defineProperty(window, "devicePixelRatio", {
         configurable: true,
         value: 3
      });
      toBlob.mockResolvedValue(new Blob(["png"], { type: "image/png" }));
   });

   afterEach(() => {
      cleanup();
      styleElement.remove();
      document.documentElement.className = "";
      document.documentElement.removeAttribute("style");
      vi.restoreAllMocks();
   });

   it("exports the target node and starts a PNG download", async () => {
      const target = document.createElement("section");
      target.innerHTML = '<svg><path class="export-path" d="M0 0L1 1"></path></svg>';
      const targetRef = { current: target };
      let resolveBlob;
      const blobPromise = new Promise(resolve => {
         resolveBlob = () => resolve(new Blob(["png"], { type: "image/png" }));
      });

      toBlob.mockReturnValueOnce(blobPromise);

      renderDownloadButton(targetRef);
      expect(screen.getAllByRole("button", { name: /Karte als PNG herunterladen/ })).toHaveLength(1);

      fireEvent.click(screen.getByRole("button", { name: "Karte als PNG herunterladen" }));

      await waitFor(() => expect(toBlob).toHaveBeenCalled());

      const [, options] = toBlob.mock.calls[0];
      const path = target.querySelector(".export-path");

      expect(toBlob).toHaveBeenCalledWith(target, expect.objectContaining({ pixelRatio: 2 }));
      expect(target.classList.contains("light")).toBe(true);
      expect(path.style.getPropertyValue("opacity")).toBe("0.5");
      expect(path.style.getPropertyValue("stroke")).toBe("rgb(1, 2, 3)");
      expect(path.style.getPropertyValue("stroke-width")).toBe("8px");

      let revokeTimer;
      const originalSetTimeout = window.setTimeout.bind(window);
      const setTimeoutSpy = vi.spyOn(window, "setTimeout").mockImplementation((callback, timeout, ...args) => {
         if (timeout === 1000) {
            revokeTimer = { callback, timeout };
            return 1;
         }

         return originalSetTimeout(callback, timeout, ...args);
      });

      resolveBlob();

      await waitFor(() => expect(clickSpy).toHaveBeenCalledTimes(1));

      expect(target.classList.contains("light")).toBe(false);
      expect(target.querySelector(".export-path").getAttribute("style")).toBeNull();
      expect(target.style.getPropertyValue("--map-pipeline-oge")).toBe("");
      expect(options.filter(document.createElement("div"))).toBe(true);

      const excluded = document.createElement("button");
      excluded.setAttribute(MAP_EXPORT_EXCLUDE_ATTRIBUTE, "");
      excluded.append(document.createElement("span"));
      expect(options.filter(excluded.firstElementChild)).toBe(false);

      expect(createObjectUrlSpy).toHaveBeenCalledWith(expect.any(Blob));
      expect(clickedDownloadFilename).toMatch(/^\d{4}_\d{2}_\d{2} Karte Technische Projekte\.png$/);
      expect(document.querySelector("a[download]")).toBeNull();

      expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(2);
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000);
      expect(revokeTimer.timeout).toBe(1000);
      expect(revokeObjectUrlSpy).not.toHaveBeenCalled();

      revokeTimer.callback();

      expect(revokeObjectUrlSpy).toHaveBeenCalledWith("blob:map-export");
   });

   it("does nothing when no export target is available", () => {
      renderDownloadButton({ current: null });

      fireEvent.click(screen.getByRole("button", { name: "Karte als PNG herunterladen" }));

      expect(toBlob).not.toHaveBeenCalled();
   });

   it("keeps the map control background token in dark mode", () => {
      renderDownloadButton({ current: document.createElement("section") });

      expect(screen.getByRole("button", { name: "Karte als PNG herunterladen" }).className).toContain(
         "dark:bg-[var(--map-legend-background)]"
      );
   });

   it("builds the PNG filename from the local calendar date", () => {
      expect(createMapExportFilename(new Date(2026, 4, 27, 23, 30))).toBe("2026_05_27 Karte Technische Projekte.png");
   });

   it("restores temporary export styles when snapshot creation fails", async () => {
      const target = document.createElement("section");
      target.innerHTML = '<svg><path class="export-path" d="M0 0L1 1" style="stroke: red"></path></svg>';
      const targetRef = { current: target };

      toBlob.mockRejectedValueOnce(new Error("boom"));

      renderDownloadButton(targetRef);

      fireEvent.click(screen.getByRole("button", { name: "Karte als PNG herunterladen" }));

      await waitFor(() => expect(toBlob).toHaveBeenCalled());
      await waitFor(() =>
         expect(screen.getByRole("button", { name: "Karte als PNG herunterladen" })).toHaveProperty("disabled", false)
      );

      expect(target.classList.contains("light")).toBe(false);
      expect(target.querySelector(".export-path").getAttribute("style")).toBe("stroke: red");
      expect(target.style.getPropertyValue("--map-pipeline-oge")).toBe("");
      expect(clickSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith("Kartenexport fehlgeschlagen:", expect.any(Error));
   });

   it("does not overwrite SVG styles changed while an export is pending", async () => {
      const target = document.createElement("section");
      target.innerHTML = '<svg><path class="export-path" d="M0 0L1 1"></path></svg>';
      const path = target.querySelector(".export-path");
      let resolveBlob;
      const blobPromise = new Promise(resolve => {
         resolveBlob = () => resolve(new Blob(["png"], { type: "image/png" }));
      });

      toBlob.mockReturnValueOnce(blobPromise);

      const snapshotPromise = createMapSnapshot(target);

      await waitFor(() => expect(toBlob).toHaveBeenCalled());

      expect(path.style.getPropertyValue("stroke-width")).toBe("8px");

      path.setAttribute("style", "stroke: blue");
      resolveBlob();
      await snapshotPromise;

      expect(path.getAttribute("style")).toBe("stroke: blue");
   });
});
