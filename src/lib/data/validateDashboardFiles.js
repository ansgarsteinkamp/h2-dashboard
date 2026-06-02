const PROJECTS_KIND = "h2-dashboard-projects";
const NETWORK_KIND = "h2-dashboard-network";
const SUPPORTED_SCHEMA_VERSION = "1.0.0";
const VALID_DATE_PRECISIONS = new Set(["day", "month", "year"]);
const FEATURE_LENGTH_FIELDS = ["lengthKm", "geometryLengthKm", "sourceLengthKm", "projectLengthKm"];

const stripBom = text => text.replace(/^\uFEFF/, "");
const isBlank = value => value === null || value === undefined || String(value).trim() === "";
const asArray = value => (Array.isArray(value) ? value : []);
const isPlainObject = value => value !== null && typeof value === "object" && !Array.isArray(value);

function parseJson(text, fileName) {
   try {
      return JSON.parse(stripBom(text));
   } catch {
      throw new Error(`${fileName}: Die Datei enthält kein gültiges JSON.`);
   }
}

function isProjectsPayload(value) {
   return value?.kind === PROJECTS_KIND || Array.isArray(value?.projects);
}

function isNetworkPayload(value) {
   return value?.type === "FeatureCollection" && Array.isArray(value?.features);
}

function normalizedFileName(fileName) {
   return String(fileName ?? "")
      .split(/[\\/]/)
      .pop()
      .toLowerCase();
}

function validateExpectedFileNames(files) {
   const names = files.map(file => normalizedFileName(file.name));
   const expected = ["network.geojson", "projects.json"];
   const unexpected = names.filter(name => !expected.includes(name));

   if (
      unexpected.length > 0 ||
      new Set(names).size !== expected.length ||
      expected.some(name => !names.includes(name))
   ) {
      throw new Error("Bitte genau die Dateien projects.json und network.geojson auswählen.");
   }
}

function assertPosition(position, path, errors) {
   if (!Array.isArray(position) || position.length < 2) {
      errors.push(`${path}: Koordinate muss Länge und Breite enthalten.`);
      return;
   }

   const [lon, lat] = position;
   if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
      errors.push(`${path}: Koordinate muss numerisch sein.`);
      return;
   }

   if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
      errors.push(`${path}: Koordinate liegt außerhalb gültiger WGS84-Grenzen.`);
   }
}

function validateGeometry(geometry, featureLabel, errors) {
   if (!geometry || typeof geometry !== "object") {
      errors.push(`${featureLabel}: Geometrie fehlt.`);
      return;
   }

   if (geometry.type === "LineString") {
      if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length < 2) {
         errors.push(`${featureLabel}: LineString braucht mindestens zwei Koordinaten.`);
         return;
      }
      geometry.coordinates.forEach((position, index) => assertPosition(position, `${featureLabel}[${index}]`, errors));
      return;
   }

   if (geometry.type === "MultiLineString") {
      if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
         errors.push(`${featureLabel}: MultiLineString braucht mindestens eine Linie.`);
         return;
      }
      geometry.coordinates.forEach((line, lineIndex) => {
         if (!Array.isArray(line) || line.length < 2) {
            errors.push(`${featureLabel}: Linie ${lineIndex + 1} braucht mindestens zwei Koordinaten.`);
            return;
         }
         line.forEach((position, positionIndex) =>
            assertPosition(position, `${featureLabel}[${lineIndex}][${positionIndex}]`, errors)
         );
      });
      return;
   }

   if (geometry.type === "Point") {
      assertPosition(geometry.coordinates, featureLabel, errors);
      return;
   }

   errors.push(`${featureLabel}: Geometrietyp ${geometry.type || "unbekannt"} wird nicht unterstützt.`);
}

function validateProjects(projectsPayload) {
   const errors = [];
   const warnings = [];

   if (projectsPayload?.kind !== PROJECTS_KIND) {
      errors.push(`projects.json: kind muss "${PROJECTS_KIND}" sein.`);
   }
   if (projectsPayload?.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
      errors.push(`projects.json: schemaVersion muss "${SUPPORTED_SCHEMA_VERSION}" sein.`);
   }
   if (!Array.isArray(projectsPayload?.projects) || projectsPayload.projects.length === 0) {
      errors.push("projects.json: projects muss eine nicht leere Liste sein.");
      return { errors, projectIds: new Set(), warnings };
   }

   const projectIds = new Set();
   projectsPayload.projects.forEach((project, index) => {
      const label = `Projekt ${index + 1}`;
      if (!project || typeof project !== "object") {
         errors.push(`${label}: Eintrag muss ein Objekt sein.`);
         return;
      }

      const id = String(project.id ?? "").trim();
      if (!id) {
         errors.push(`${label}: id fehlt.`);
      } else if (projectIds.has(id)) {
         errors.push(`${label}: id "${id}" ist doppelt vergeben.`);
      } else {
         projectIds.add(id);
      }

      if (isBlank(project.name)) warnings.push(`${id || label}: Projektname fehlt.`);
      if (!Array.isArray(project.networkFeatureIds)) {
         errors.push(`${id || label}: networkFeatureIds muss eine Liste sein.`);
      }
      if (!Array.isArray(project.geometryRefs)) {
         errors.push(`${id || label}: geometryRefs muss eine Liste sein.`);
      } else {
         project.geometryRefs.forEach((ref, refIndex) => {
            if (!isPlainObject(ref) || isBlank(ref.networkFeatureId)) {
               errors.push(`${id || label}: geometryRefs[${refIndex}] braucht eine networkFeatureId.`);
            }
         });
      }

      if (project.dates !== null && project.dates !== undefined && !isPlainObject(project.dates)) {
         errors.push(`${id || label}: dates muss ein Objekt sein.`);
      } else {
         Object.entries(project.dates ?? {}).forEach(([key, value]) => {
            if (
               key.endsWith("Precision") &&
               value !== null &&
               value !== undefined &&
               !VALID_DATE_PRECISIONS.has(value)
            ) {
               errors.push(`${id || label}: dates.${key} hat eine ungültige Datumspräzision.`);
            }
         });
      }
   });

   return { errors, projectIds, warnings };
}

function validateLengthField(props, field, id, label, errors) {
   if (props[field] === null || props[field] === undefined) return;

   if (typeof props[field] !== "number") {
      errors.push(`${id || label}: ${field} muss eine Zahl sein.`);
      return;
   }

   const length = Number(props[field]);
   if (!Number.isFinite(length) || length < 0 || length > 1000) {
      errors.push(`${id || label}: ${field} ist nicht plausibel.`);
   }
}

function validateNetwork(networkPayload, projectIds) {
   const errors = [];
   const warnings = [];

   if (networkPayload?.metadata?.kind !== NETWORK_KIND) {
      errors.push(`network.geojson: metadata.kind muss "${NETWORK_KIND}" sein.`);
   }
   if (networkPayload?.metadata?.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
      errors.push(`network.geojson: metadata.schemaVersion muss "${SUPPORTED_SCHEMA_VERSION}" sein.`);
   }
   if (networkPayload?.type !== "FeatureCollection" || !Array.isArray(networkPayload.features)) {
      errors.push("network.geojson: Erwartet wird eine GeoJSON FeatureCollection.");
      return { errors, featureIds: new Set(), projectFeatureIds: new Map(), warnings };
   }
   if (networkPayload.features.length === 0) {
      errors.push("network.geojson: features darf nicht leer sein.");
   }

   const featureIds = new Set();
   const projectFeatureIds = new Map();
   const featureProjectIds = new Map();

   networkPayload.features.forEach((feature, index) => {
      const label = `Feature ${index + 1}`;
      if (feature?.type !== "Feature") {
         errors.push(`${label}: Eintrag muss ein GeoJSON Feature sein.`);
         return;
      }

      const props = feature.properties ?? {};
      const id = String(props.id ?? "").trim();
      const featureId = String(feature.id ?? "").trim();
      if (!id) {
         errors.push(`${label}: properties.id fehlt.`);
      } else if (featureIds.has(id)) {
         errors.push(`${label}: Feature-ID "${id}" ist doppelt vergeben.`);
      } else {
         featureIds.add(id);
      }

      if (!featureId) {
         errors.push(`${id || label}: feature.id fehlt.`);
      }
      if (featureId && id && featureId !== id) {
         errors.push(`${id}: feature.id und properties.id stimmen nicht überein.`);
      }

      const projectId = isBlank(props.projectId) ? null : String(props.projectId).trim();
      const contextOnly = props.contextOnly === true;
      if (!contextOnly && !projectId) {
         errors.push(`${id || label}: Projektfeature braucht eine projectId.`);
      }
      if (contextOnly && projectId) {
         errors.push(`${id || label}: contextOnly-Feature darf keine projectId setzen.`);
      }
      if (projectId && !projectIds.has(projectId)) {
         errors.push(`${id || label}: projectId "${projectId}" verweist auf kein Projekt.`);
      }
      if (projectId && id) {
         if (!projectFeatureIds.has(projectId)) projectFeatureIds.set(projectId, new Set());
         projectFeatureIds.get(projectId).add(id);
         featureProjectIds.set(id, projectId);
      }

      if (!["Wasserstoff", "CO2", "Erdgas"].includes(props.medium)) {
         warnings.push(`${id || label}: medium fehlt oder ist ungewöhnlich.`);
      }

      FEATURE_LENGTH_FIELDS.forEach(field => validateLengthField(props, field, id, label, errors));

      if (
         props.commissioningDatePrecision !== null &&
         props.commissioningDatePrecision !== undefined &&
         !VALID_DATE_PRECISIONS.has(props.commissioningDatePrecision)
      ) {
         errors.push(`${id || label}: commissioningDatePrecision hat eine ungültige Datumspräzision.`);
      }

      validateGeometry(feature.geometry, id || label, errors);
   });

   return { errors, featureIds, featureProjectIds, projectFeatureIds, warnings };
}

function sameSet(left, right) {
   if (left.size !== right.size) return false;
   return [...left].every(value => right.has(value));
}

function validateCrossReferences(projectsPayload, featureIds, featureProjectIds, projectFeatureIds) {
   const errors = [];
   const warnings = [];
   const projects = asArray(projectsPayload?.projects).filter(project => project && typeof project === "object");

   projects.forEach(project => {
      const projectId = String(project.id);
      const listed = new Set(asArray(project.networkFeatureIds).filter(Boolean));
      const refs = new Set(
         asArray(project.geometryRefs)
            .map(ref => ref?.networkFeatureId)
            .filter(Boolean)
      );
      const fromNetwork = projectFeatureIds.get(projectId) ?? new Set();

      listed.forEach(id => {
         if (!featureIds.has(id)) errors.push(`${projectId}: networkFeatureIds enthält unbekanntes Feature "${id}".`);
         if (featureProjectIds.has(id) && featureProjectIds.get(id) !== projectId) {
            errors.push(`${projectId}: networkFeatureId "${id}" verweist in network.geojson auf ein anderes Projekt.`);
         }
      });
      refs.forEach(id => {
         if (!featureIds.has(id)) errors.push(`${projectId}: geometryRefs enthält unbekanntes Feature "${id}".`);
         if (featureProjectIds.has(id) && featureProjectIds.get(id) !== projectId) {
            errors.push(`${projectId}: geometryRef "${id}" verweist in network.geojson auf ein anderes Projekt.`);
         }
      });
      if (!sameSet(listed, refs)) {
         errors.push(`${projectId}: geometryRefs und networkFeatureIds müssen dieselben Feature-IDs enthalten.`);
      }
      fromNetwork.forEach(id => {
         if (!listed.has(id))
            warnings.push(
               `${projectId}: Feature "${id}" ist in network.geojson verknüpft, aber nicht in networkFeatureIds gelistet.`
            );
      });

      if (listed.size === 0) warnings.push(`${projectId}: Projekt hat kein Netzelement auf der Karte.`);
   });

   return { errors, warnings };
}

function buildDashboardData(projectsPayload, networkPayload, warnings) {
   const projects = projectsPayload.projects;
   const projectsById = new Map(projects.map(project => [String(project.id), project]));
   const features = networkPayload.features.map(feature => {
      const props = feature.properties ?? {};
      const project = props.projectId ? (projectsById.get(String(props.projectId)) ?? null) : null;

      return {
         ...feature,
         id: props.id,
         properties: {
            ...props,
            project,
            projectName: project?.name ?? props.name ?? null,
            projectAlias: project?.alias ?? props.alias ?? null,
            ibnYear: project?.dates?.ibnYear ?? props.commissioningYear ?? null,
            ogeShare: project?.ownership?.ogeShare ?? props.ogeShare ?? null,
            ogeParticipation: Boolean(props.ogeParticipation || (project?.ownership?.ogeShare ?? 0) > 0)
         }
      };
   });

   const linkedProjectIds = new Set(features.map(feature => feature.properties.projectId).filter(Boolean));

   return {
      projects,
      projectsById,
      network: { ...networkPayload, features },
      metadata: {
         generatedAt: projectsPayload.generatedAt ?? networkPayload.metadata?.generatedAt ?? null,
         projectCount: projects.length,
         featureCount: features.length,
         linkedProjectCount: linkedProjectIds.size,
         warnings
      }
   };
}

export async function parseDashboardFiles(files) {
   if (!Array.isArray(files) || files.length !== 2) {
      throw new Error("Bitte genau projects.json und network.geojson auswählen.");
   }
   validateExpectedFileNames(files);

   const parsed = await Promise.all(
      files.map(async file => ({
         fileName: file.name,
         json: parseJson(await file.text(), file.name)
      }))
   );

   const projectsEntry = parsed.find(entry => isProjectsPayload(entry.json));
   const networkEntry = parsed.find(entry => isNetworkPayload(entry.json));

   if (!projectsEntry)
      throw new Error('projects.json wurde nicht erkannt. Erwartet wird kind "h2-dashboard-projects".');
   if (!networkEntry)
      throw new Error("network.geojson wurde nicht erkannt. Erwartet wird eine GeoJSON FeatureCollection.");
   if (projectsEntry === networkEntry)
      throw new Error("Die beiden Dateien müssen projects.json und network.geojson sein.");

   const projectValidation = validateProjects(projectsEntry.json);
   const networkValidation = validateNetwork(networkEntry.json, projectValidation.projectIds);
   const canValidateCrossReferences = projectValidation.errors.length === 0 && networkValidation.errors.length === 0;
   const crossValidation = canValidateCrossReferences
      ? validateCrossReferences(
           projectsEntry.json,
           networkValidation.featureIds,
           networkValidation.featureProjectIds,
           networkValidation.projectFeatureIds
        )
      : { errors: [], warnings: [] };

   const errors = [...projectValidation.errors, ...networkValidation.errors, ...crossValidation.errors];
   if (errors.length > 0) {
      throw new Error(`Die Eingangsdaten sind nicht gültig:\n${errors.slice(0, 12).join("\n")}`);
   }

   return buildDashboardData(projectsEntry.json, networkEntry.json, [
      ...projectValidation.warnings,
      ...networkValidation.warnings,
      ...crossValidation.warnings
   ]);
}
