const normalize = value =>
   String(value ?? "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLocaleLowerCase("de-DE")
      .trim();

const searchFields = project => [
   project.id,
   project.name,
   project.alias,
   project.cluster,
   project.medium,
   project.networkElement,
   project.measure,
   project.projectType,
   project.builder,
   project.sapProjectNumber,
   project.networkFeatureIds?.join(" "),
   project.geography?.federalStates?.join(" ")
];

export const getSearchQuery = value => normalize(value);

export const isSearchActive = query => query.length >= 2;

export function projectMatchesSearch(project, query, active = isSearchActive(query)) {
   if (!active) return true;
   return searchFields(project).some(value => normalize(value).includes(query));
}

export function featureMatchesSearch(feature, query, active = isSearchActive(query)) {
   if (!active) return true;
   const props = feature.properties ?? {};
   return [
      props.id,
      props.projectId,
      props.name,
      props.projectName,
      props.alias,
      props.medium,
      props.networkElement,
      props.measure,
      props.builder,
      props.cluster,
      props.sourceProjectId
   ].some(value => normalize(value).includes(query));
}

export function toResultItems(projects, query) {
   const active = isSearchActive(query);
   return projects
      .filter(project => projectMatchesSearch(project, query, active))
      .map(project => ({ kind: "project", item: project }));
}
