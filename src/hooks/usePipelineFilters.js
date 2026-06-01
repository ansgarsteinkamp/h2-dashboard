import { useMemo, useState } from "react";

import { ALL_VALUE, MAP_MODE_OPTIONS } from "@/lib/domain/constants";
import { featureCollectionToLatLngs } from "@/lib/domain/coordinates";
import { buildFilterOptions } from "@/lib/domain/facets";
import { sumDashboardMetrics } from "@/lib/domain/metrics";
import {
   featureMatchesSearch,
   getSearchQuery,
   isSearchActive,
   projectMatchesSearch,
   toResultItems
} from "@/lib/domain/search";

export const initialPipelineFilters = {
   builder: ALL_VALUE,
   cluster: ALL_VALUE,
   mapMode: "all",
   medium: ALL_VALUE,
   measure: ALL_VALUE,
   networkElement: ALL_VALUE,
   ogeResponsibleOnly: false,
   searchTerm: "",
   yearFrom: ALL_VALUE,
   yearTo: ALL_VALUE
};

const MAX_AUTO_FIT_SEARCH_RESULTS = 30;

function matchesOption(value, selected) {
   return selected === ALL_VALUE || String(value ?? "") === selected;
}

function matchesYearRange(value, yearFrom, yearTo) {
   const year = Number(value);
   if (!Number.isInteger(year)) return yearFrom === ALL_VALUE && yearTo === ALL_VALUE;
   if (yearFrom !== ALL_VALUE && year < Number(yearFrom)) return false;
   if (yearTo !== ALL_VALUE && year > Number(yearTo)) return false;
   return true;
}

function projectMatchesFilters(project, filters, query) {
   return (
      matchesOption(project.medium, filters.medium) &&
      matchesOption(project.networkElement, filters.networkElement) &&
      matchesOption(project.measure, filters.measure) &&
      matchesOption(project.cluster, filters.cluster) &&
      matchesOption(project.builder, filters.builder) &&
      matchesYearRange(project.dates?.ibnYear, filters.yearFrom, filters.yearTo) &&
      (!filters.ogeResponsibleOnly || project.ogeResponsible === true) &&
      projectMatchesSearch(project, query)
   );
}

function featureMatchesMapMode(feature, mapMode) {
   if (mapMode === "projects") return !feature.properties.contextOnly;
   if (mapMode === "context") return feature.properties.contextOnly === true;
   return true;
}

function featureBelongsToVisibleProject(feature, visibleProjectIds) {
   const projectId = feature.properties.projectId;
   return !projectId || visibleProjectIds.has(projectId);
}

function featureMatchesFilters(feature, filters, query, visibleProjectIds) {
   const props = feature.properties;
   const hideContextForOgeResponsibleView = filters.ogeResponsibleOnly && (props.contextOnly || !props.projectId);

   return (
      !hideContextForOgeResponsibleView &&
      featureMatchesMapMode(feature, filters.mapMode) &&
      featureBelongsToVisibleProject(feature, visibleProjectIds) &&
      matchesOption(props.medium, filters.medium) &&
      matchesOption(props.networkElement, filters.networkElement) &&
      matchesOption(props.measure, filters.measure) &&
      matchesOption(props.cluster, filters.cluster) &&
      matchesOption(props.builder, filters.builder) &&
      matchesYearRange(props.ibnYear ?? props.commissioningYear, filters.yearFrom, filters.yearTo) &&
      featureMatchesSearch(feature, query)
   );
}

function filterProjects(projects, filters, query) {
   return projects.filter(project => projectMatchesFilters(project, filters, query));
}

function filterNetworkCollection(collection, filters, query, visibleProjectIds) {
   return {
      ...collection,
      features: collection.features.filter(feature => featureMatchesFilters(feature, filters, query, visibleProjectIds))
   };
}

function normalizeYearRange(filters, key, value) {
   if (
      key === "yearFrom" &&
      value !== ALL_VALUE &&
      filters.yearTo !== ALL_VALUE &&
      Number(value) > Number(filters.yearTo)
   ) {
      return { ...filters, yearFrom: value, yearTo: value };
   }

   if (
      key === "yearTo" &&
      value !== ALL_VALUE &&
      filters.yearFrom !== ALL_VALUE &&
      Number(value) < Number(filters.yearFrom)
   ) {
      return { ...filters, yearFrom: value, yearTo: value };
   }

   return { ...filters, [key]: value };
}

export function usePipelineFilters(dashboardData) {
   const [filters, setFilters] = useState(initialPipelineFilters);
   const query = getSearchQuery(filters.searchTerm);
   const hasActiveSearch = isSearchActive(query);

   const options = useMemo(
      () => buildFilterOptions(dashboardData.projects, dashboardData.network.features),
      [dashboardData.projects, dashboardData.network.features]
   );

   const filteredProjects = useMemo(
      () => filterProjects(dashboardData.projects, filters, query),
      [dashboardData.projects, filters, query]
   );

   const visibleProjectIds = useMemo(() => new Set(filteredProjects.map(project => project.id)), [filteredProjects]);

   const filteredCollection = useMemo(
      () => filterNetworkCollection(dashboardData.network, filters, query, visibleProjectIds),
      [dashboardData.network, filters, query, visibleProjectIds]
   );

   const searchBounds = useMemo(() => {
      if (!hasActiveSearch) return [];
      if (filteredCollection.features.length > MAX_AUTO_FIT_SEARCH_RESULTS) return [];
      return featureCollectionToLatLngs(filteredCollection);
   }, [filteredCollection, hasActiveSearch]);

   const results = useMemo(() => ({ items: toResultItems(filteredProjects, query) }), [filteredProjects, query]);
   const metrics = useMemo(() => {
      return sumDashboardMetrics(filteredProjects, filteredCollection.features, {
         totalProjectCount: dashboardData.projects.length
      });
   }, [dashboardData.projects.length, filteredProjects, filteredCollection]);

   const setFilter = (key, value) => setFilters(current => normalizeYearRange(current, key, value));
   const resetFilters = () => setFilters(initialPipelineFilters);

   return {
      filteredCollection,
      filteredProjects,
      filters,
      hasActiveSearch,
      mapModeOptions: MAP_MODE_OPTIONS,
      metrics,
      options,
      resetFilters,
      results,
      searchBounds,
      setFilter
   };
}
