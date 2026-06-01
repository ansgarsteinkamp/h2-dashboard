const numberOrZero = value => (Number.isFinite(Number(value)) ? Number(value) : 0);

const isProjectType = (project, needle) => String(project.projectType ?? project.measure ?? "").includes(needle);
const hasMapElement = project => Array.isArray(project.networkFeatureIds) && project.networkFeatureIds.length > 0;
const sumInternalLength = projects =>
   projects.reduce((sum, project) => sum + numberOrZero(project.technical?.lengthInternalKm), 0);

export function sumDashboardMetrics(projects, features, { totalProjectCount = projects.length } = {}) {
   const projectFeatureCount = features.filter(feature => !feature.properties.contextOnly).length;
   const contextFeatureCount = features.length - projectFeatureCount;
   const lineProjects = projects.filter(project => project.networkElement === "Leitung");
   const conversionLineProjects = lineProjects.filter(project => isProjectType(project, "Umstellung"));
   const newLineProjects = lineProjects.filter(project => isProjectType(project, "Neubau"));
   const relocationLineProjects = lineProjects.filter(project => isProjectType(project, "Umhängung"));
   const compressorProjects = projects.filter(project => project.networkElement === "Verdichter");
   const gdrmProjects = projects.filter(project => project.networkElement === "GDRM-Anlage");
   const stationProjects = projects.filter(project => project.networkElement !== "Leitung");
   const ogeShareProjects = projects.filter(project => Number(project.ownership?.ogeShare ?? 0) > 0);
   const mappedProjects = projects.filter(hasMapElement);

   return {
      contextFeatureCount,
      conversionLineProjectCount: conversionLineProjects.length,
      conversionLineProjectLengthKm: sumInternalLength(conversionLineProjects),
      featureCount: features.length,
      gdrmProjectCount: gdrmProjects.length,
      lengthKm: features.reduce((sum, feature) => sum + numberOrZero(feature.properties.lengthKm), 0),
      lineProjectCount: lineProjects.length,
      lineProjectLengthKm: sumInternalLength(lineProjects),
      mappedProjectCount: mappedProjects.length,
      newLineProjectCount: newLineProjects.length,
      newLineProjectLengthKm: sumInternalLength(newLineProjects),
      ogeShareProjectCount: ogeShareProjects.length,
      projectCount: projects.length,
      projectFeatureCount,
      projectsWithoutGeometry: projects.length - mappedProjects.length,
      relocationLineProjectCount: relocationLineProjects.length,
      relocationLineProjectLengthKm: sumInternalLength(relocationLineProjects),
      stationProjectCount: stationProjects.length,
      totalProjectCount,
      vdsProjectCount: compressorProjects.length
   };
}
