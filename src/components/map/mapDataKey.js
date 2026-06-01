const featureVersions = new WeakMap();
let nextFeatureVersion = 0;

const getFeatureVersion = feature => {
   if (!featureVersions.has(feature)) {
      nextFeatureVersion += 1;
      featureVersions.set(feature, nextFeatureVersion);
   }

   return featureVersions.get(feature);
};

export const createPipelineDataKey = pipelines => {
   const visibleFeatures = pipelines.features.map(feature => `${feature.properties.id}:${getFeatureVersion(feature)}`);

   return JSON.stringify(visibleFeatures);
};
