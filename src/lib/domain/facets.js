import { ALL_VALUE, MEDIUM_ORDER } from "@/lib/domain/constants";
import { mediumLabel } from "@/lib/domain/formatters";

const collator = new Intl.Collator("de", { numeric: true, sensitivity: "base" });
const nonEmpty = value => value !== null && value !== undefined && String(value).trim() !== "";
const option = value => ({ value, label: value });
const labeledOption = (value, label) => ({ value, label });
const sortedValues = values => [...values].filter(nonEmpty).sort(collator.compare);
const measureLabel = value => (value === "Drittleitung" ? "Drittleitung (Kontext)" : value);

function orderedMediums(values) {
   const set = new Set(values);
   return [...MEDIUM_ORDER.filter(value => set.delete(value)), ...sortedValues(set)];
}

function addProjectOptionSets(project, sets) {
   if (nonEmpty(project.medium)) sets.mediums.add(project.medium);
   if (nonEmpty(project.networkElement)) sets.networkElements.add(project.networkElement);
   if (nonEmpty(project.measure)) sets.measures.add(project.measure);
   if (nonEmpty(project.projectType)) sets.projectTypes.add(project.projectType);
   if (nonEmpty(project.cluster)) sets.clusters.add(project.cluster);
   if (nonEmpty(project.builder)) sets.builders.add(project.builder);
   if (nonEmpty(project.dates?.ibnYear)) sets.years.add(String(project.dates.ibnYear));
}

function addFeatureOptionSets(feature, sets) {
   const props = feature.properties ?? {};
   if (nonEmpty(props.medium)) sets.mediums.add(props.medium);
   if (nonEmpty(props.networkElement)) sets.networkElements.add(props.networkElement);
   if (nonEmpty(props.measure)) sets.measures.add(props.measure);
   if (nonEmpty(props.projectType)) sets.projectTypes.add(props.projectType);
   if (nonEmpty(props.cluster)) sets.clusters.add(props.cluster);
   if (nonEmpty(props.builder)) sets.builders.add(props.builder);
   if (nonEmpty(props.ibnYear ?? props.commissioningYear))
      sets.years.add(String(props.ibnYear ?? props.commissioningYear));
}

export function buildFilterOptions(projects, features = []) {
   const sets = {
      builders: new Set(),
      clusters: new Set(),
      featureMediums: new Set(),
      measures: new Set(),
      mediums: new Set(),
      networkElements: new Set(),
      projectTypes: new Set(),
      years: new Set()
   };

   projects.forEach(project => addProjectOptionSets(project, sets));
   features.forEach(feature => {
      if (nonEmpty(feature.properties?.medium)) sets.featureMediums.add(feature.properties.medium);
      addFeatureOptionSets(feature, sets);
   });

   return {
      builders: [{ value: ALL_VALUE, label: "Alle Bauherren" }, ...sortedValues(sets.builders).map(option)],
      clusters: [{ value: ALL_VALUE, label: "Alle Projektcluster" }, ...sortedValues(sets.clusters).map(option)],
      measures: [
         { value: ALL_VALUE, label: "Alle Maßnahmen" },
         ...sortedValues(sets.measures).map(value => labeledOption(value, measureLabel(value)))
      ],
      mediums: [
         { value: ALL_VALUE, label: "Alle" },
         ...orderedMediums(sets.mediums).map(value => labeledOption(value, mediumLabel(value)))
      ],
      networkElements: [
         { value: ALL_VALUE, label: "Alle Netzelemente" },
         ...sortedValues(sets.networkElements).map(option)
      ],
      projectTypes: [{ value: ALL_VALUE, label: "Alle Projekt-Typen" }, ...sortedValues(sets.projectTypes).map(option)],
      years: [{ value: ALL_VALUE, label: "Alle Jahre" }, ...sortedValues(sets.years).map(option)]
   };
}
