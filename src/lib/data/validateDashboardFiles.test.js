import { describe, expect, it } from "vitest";

import { parseDashboardFiles } from "@/lib/data/validateDashboardFiles";

const projectsPayload = {
   kind: "h2-dashboard-projects",
   schemaVersion: "1.0.0",
   projects: [
      {
         id: "KLU001-01",
         name: "Leitung A",
         medium: "Wasserstoff",
         networkElement: "Leitung",
         measure: "Neubau",
         projectType: "Kernnetz",
         builder: "OGE",
         dates: { ibnYear: 2030 },
         ownership: { ogeShare: 1 },
         geometryRefs: [{ networkFeatureId: "h2-KLU001-01-1" }],
         networkFeatureIds: ["h2-KLU001-01-1"]
      }
   ]
};

const networkPayload = {
   type: "FeatureCollection",
   metadata: { kind: "h2-dashboard-network" },
   features: [
      {
         type: "Feature",
         id: "h2-KLU001-01-1",
         properties: {
            id: "h2-KLU001-01-1",
            projectId: "KLU001-01",
            medium: "Wasserstoff",
            networkElement: "Leitung",
            measure: "Neubau",
            lengthKm: 12.4,
            contextOnly: false,
            ogeParticipation: true
         },
         geometry: {
            type: "LineString",
            coordinates: [
               [7, 51],
               [7.2, 51.1]
            ]
         }
      }
   ]
};

const fileFromJson = (name, payload) => new File([JSON.stringify(payload)], name, { type: "application/json" });

describe("parseDashboardFiles", () => {
   it("validiert und verknüpft projects.json und network.geojson unabhängig von der Reihenfolge", async () => {
      const data = await parseDashboardFiles([
         fileFromJson("network.geojson", networkPayload),
         fileFromJson("projects.json", projectsPayload)
      ]);

      expect(data.projects).toHaveLength(1);
      expect(data.network.features).toHaveLength(1);
      expect(data.network.features[0].properties.project.name).toBe("Leitung A");
      expect(data.metadata.projectCount).toBe(1);
   });

   it("blockiert umbenannte Datenpaket-Dateien", async () => {
      await expect(
         parseDashboardFiles([fileFromJson("foo.json", projectsPayload), fileFromJson("bar.geojson", networkPayload)])
      ).rejects.toThrow(/projects\.json und network\.geojson/);
   });

   it("blockiert unbekannte projectId-Verweise", async () => {
      const brokenNetwork = structuredClone(networkPayload);
      brokenNetwork.features[0].properties.projectId = "FEHLT";

      await expect(
         parseDashboardFiles([
            fileFromJson("projects.json", projectsPayload),
            fileFromJson("network.geojson", brokenNetwork)
         ])
      ).rejects.toThrow(/unbekannte|verweist auf kein Projekt/);
   });

   it("blockiert Projektfeatures ohne projectId", async () => {
      const brokenNetwork = structuredClone(networkPayload);
      brokenNetwork.features[0].properties.projectId = null;

      await expect(
         parseDashboardFiles([
            fileFromJson("projects.json", projectsPayload),
            fileFromJson("network.geojson", brokenNetwork)
         ])
      ).rejects.toThrow(/Projektfeature braucht eine projectId/);
   });

   it("blockiert widersprüchliche geometryRefs und networkFeatureIds", async () => {
      const brokenProjects = structuredClone(projectsPayload);
      brokenProjects.projects[0].geometryRefs = [];

      await expect(
         parseDashboardFiles([
            fileFromJson("projects.json", brokenProjects),
            fileFromJson("network.geojson", networkPayload)
         ])
      ).rejects.toThrow(/geometryRefs und networkFeatureIds/);
   });

   it("meldet kaputte projects.json-Strukturen fachlich statt mit TypeError", async () => {
      const brokenProjects = { kind: "h2-dashboard-projects" };

      await expect(
         parseDashboardFiles([
            fileFromJson("projects.json", brokenProjects),
            fileFromJson("network.geojson", networkPayload)
         ])
      ).rejects.toThrow(/projects muss eine nicht leere Liste/);
   });

   it("blockiert String-Koordinaten wie der lokale Exportvalidator", async () => {
      const brokenNetwork = structuredClone(networkPayload);
      brokenNetwork.features[0].geometry.coordinates[0] = ["7", 51];

      await expect(
         parseDashboardFiles([
            fileFromJson("projects.json", projectsPayload),
            fileFromJson("network.geojson", brokenNetwork)
         ])
      ).rejects.toThrow(/Koordinate muss numerisch/);
   });

   it("verlangt eine top-level feature.id passend zu properties.id", async () => {
      const brokenNetwork = structuredClone(networkPayload);
      delete brokenNetwork.features[0].id;

      await expect(
         parseDashboardFiles([
            fileFromJson("projects.json", projectsPayload),
            fileFromJson("network.geojson", brokenNetwork)
         ])
      ).rejects.toThrow(/feature.id fehlt/);
   });
});
