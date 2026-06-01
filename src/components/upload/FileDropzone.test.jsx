/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import FileDropzone from "./FileDropzone";

afterEach(() => {
   cleanup();
});

function getFileInput(container) {
   return container.querySelector("input[type='file']");
}

describe("FileDropzone", () => {
   it("exposes the dropzone as an accessible button with description and error state", () => {
      render(
         <FileDropzone
            label="GeoJSON auswählen"
            description="Nur lokale Dateien."
            error="Die Datei konnte nicht gelesen werden."
         />
      );

      const dropzone = screen.getByRole("button", { name: "GeoJSON auswählen" });
      const describedBy = dropzone.getAttribute("aria-describedby");

      expect(dropzone.getAttribute("aria-invalid")).toBe("true");
      expect(describedBy).toBeTruthy();
      expect(describedBy.split(" ")).toHaveLength(2);
      expect(screen.getByText("Nur lokale Dateien.").id).toBe(describedBy.split(" ")[0]);
      expect(screen.getByRole("alert").textContent).toBe("Die Datei konnte nicht gelesen werden.");
   });

   it("passes accepted files to the callback", async () => {
      const onFilesAccepted = vi.fn();
      const onFilesRejected = vi.fn();
      const file = new File(['{"type":"FeatureCollection","features":[]}'], "pipelines.geojson", {
         type: "application/geo+json"
      });
      const { container } = render(
         <FileDropzone
            accept={{ "application/geo+json": [".geojson"], "application/json": [".json"] }}
            label="Pipeline-Daten auswählen"
            onFilesAccepted={onFilesAccepted}
            onFilesRejected={onFilesRejected}
         />
      );

      fireEvent.change(getFileInput(container), { target: { files: [file] } });

      await waitFor(() => expect(onFilesAccepted).toHaveBeenCalledWith([file]));
      expect(onFilesRejected).not.toHaveBeenCalled();
   });

   it("passes rejected files to the callback", async () => {
      const onFilesAccepted = vi.fn();
      const onFilesRejected = vi.fn();
      const file = new File(["not geojson"], "notes.txt", { type: "text/plain" });
      const { container } = render(
         <FileDropzone
            accept={{ "application/geo+json": [".geojson"], "application/json": [".json"] }}
            label="Pipeline-Daten auswählen"
            onFilesAccepted={onFilesAccepted}
            onFilesRejected={onFilesRejected}
         />
      );

      fireEvent.change(getFileInput(container), { target: { files: [file] } });

      await waitFor(() => expect(onFilesRejected).toHaveBeenCalled());
      expect(onFilesRejected.mock.calls[0][0][0]).toMatchObject({
         file,
         errors: [expect.objectContaining({ code: "file-invalid-type" })]
      });
      expect(onFilesAccepted).not.toHaveBeenCalled();
   });
});
