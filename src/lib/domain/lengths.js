const numberOrNull = value => {
   if (value === null || value === undefined || value === "") return null;
   const number = Number(value);
   return Number.isFinite(number) ? number : null;
};

export const numberOrZero = value => numberOrNull(value) ?? 0;

export function getFeatureDisplayLengthKm(featureOrProperties) {
   const props = featureOrProperties?.properties ?? featureOrProperties ?? {};
   return numberOrNull(props.lengthKm) ?? numberOrNull(props.sourceLengthKm);
}

export function getFeatureGeometryLengthKm(featureOrProperties) {
   const props = featureOrProperties?.properties ?? featureOrProperties ?? {};
   return numberOrNull(props.geometryLengthKm);
}

export function getFeatureProjectLengthKm(featureOrProperties) {
   const props = featureOrProperties?.properties ?? featureOrProperties ?? {};
   return numberOrNull(props.projectLengthKm);
}

export function sumFeatureDisplayLengths(features) {
   return features.reduce((sum, feature) => sum + numberOrZero(getFeatureDisplayLengthKm(feature)), 0);
}
