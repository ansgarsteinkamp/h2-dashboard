const positionToLatLng = ([lon, lat]) => [lat, lon];

const collectPositions = geometry => {
   if (!geometry) return [];

   if (geometry.type === "Point" && Array.isArray(geometry.coordinates)) return [geometry.coordinates];
   if (geometry.type === "LineString" && Array.isArray(geometry.coordinates)) return geometry.coordinates;
   if (geometry.type === "MultiLineString" && Array.isArray(geometry.coordinates)) return geometry.coordinates.flat();

   return [];
};

export const featureToLatLngs = feature =>
   collectPositions(feature.geometry).filter(Array.isArray).map(positionToLatLng);

export const featureCollectionToLatLngs = collection => collection.features.flatMap(featureToLatLngs);
