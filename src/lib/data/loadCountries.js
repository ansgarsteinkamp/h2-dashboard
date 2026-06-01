const VALID_COUNTRY_GEOMETRY_TYPES = new Set(["Polygon", "MultiPolygon"]);

const stripBom = text => text.replace(/^\uFEFF/, "");

const isBlank = value => value === null || value === undefined || String(value).trim() === "";

const isObject = value => Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isValidPosition = position => {
   if (!Array.isArray(position) || position.length < 2) return false;

   const [longitude, latitude] = position;
   return (
      Number.isFinite(longitude) &&
      Number.isFinite(latitude) &&
      longitude >= -180 &&
      longitude <= 180 &&
      latitude >= -90 &&
      latitude <= 90
   );
};

const positionsEqual = (left, right) => left[0] === right[0] && left[1] === right[1];

const isValidLinearRing = ring => {
   if (!Array.isArray(ring) || ring.length < 4 || !ring.every(isValidPosition)) return false;

   return positionsEqual(ring[0], ring.at(-1));
};

const isValidPolygonCoordinates = coordinates => {
   return Array.isArray(coordinates) && coordinates.length > 0 && coordinates.every(isValidLinearRing);
};

const isValidCountryGeometry = geometry => {
   if (!isObject(geometry) || !VALID_COUNTRY_GEOMETRY_TYPES.has(geometry.type)) return false;

   if (geometry.type === "Polygon") {
      return isValidPolygonCoordinates(geometry.coordinates);
   }

   return (
      Array.isArray(geometry.coordinates) &&
      geometry.coordinates.length > 0 &&
      geometry.coordinates.every(isValidPolygonCoordinates)
   );
};

function validateCountryFeature(feature, index, ids) {
   if (feature?.type !== "Feature") {
      throw new Error(`Land ${index + 1}: Erwartet wird ein GeoJSON Feature.`);
   }

   if (isBlank(feature.id)) {
      throw new Error(`Land ${index + 1}: Die Länder-ID fehlt.`);
   }

   const id = String(feature.id).trim();
   if (ids.has(id)) {
      throw new Error(`Land ${index + 1}: Die Länder-ID "${id}" ist doppelt vergeben.`);
   }
   ids.add(id);

   if (!isObject(feature.properties) || isBlank(feature.properties.name)) {
      throw new Error(`Land ${index + 1}: Der Ländername fehlt.`);
   }

   if (!isValidCountryGeometry(feature.geometry)) {
      throw new Error(`Land ${index + 1}: Erwartet wird eine Polygon- oder MultiPolygon-Geometrie.`);
   }
}

export function validateCountriesGeoJson(collection) {
   if (collection?.type !== "FeatureCollection" || !Array.isArray(collection.features)) {
      throw new Error("Die Kartenbasis muss eine GeoJSON FeatureCollection sein.");
   }

   if (collection.features.length === 0) {
      throw new Error("Die Kartenbasis enthält keine Länder.");
   }

   const ids = new Set();
   collection.features.forEach((feature, index) => validateCountryFeature(feature, index, ids));

   return collection;
}

export async function loadCountries(baseUrl) {
   let response;
   try {
      response = await fetch(`${baseUrl}data/countries_v2.geojson`);
   } catch (error) {
      throw new Error("Die Kartenbasis konnte nicht geladen werden.", { cause: error });
   }

   if (!response.ok) {
      throw new Error("Die Kartenbasis konnte nicht geladen werden.");
   }

   let text;
   try {
      text = await response.text();
   } catch (error) {
      throw new Error("Die Kartenbasis konnte nicht geladen werden.", { cause: error });
   }

   try {
      return validateCountriesGeoJson(JSON.parse(stripBom(text)));
   } catch (error) {
      if (error instanceof SyntaxError) {
         throw new Error("Die Kartenbasis ist kein gültiges GeoJSON.", { cause: error });
      }

      throw error;
   }
}
