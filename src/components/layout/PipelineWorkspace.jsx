import { useMemo, useRef, useState } from "react";

import NetworkMap from "@/components/map/NetworkMap";
import FilterPanel from "@/components/panels/FilterPanel";
import InspectorPanel from "@/components/panels/InspectorPanel";
import Topbar from "@/components/layout/Topbar";
import { buildCountryCollections } from "@/lib/data/geoCollections";
import { usePipelineFilters } from "@/hooks/usePipelineFilters";
import { usePipelineSelection } from "@/hooks/usePipelineSelection";

function restoreSelectionFocus(previousResultId, previousTrigger) {
   const restoreFallbackFocus = () => {
      if (previousTrigger?.isConnected) {
         previousTrigger.focus();
         return;
      }

      document.getElementById("inspector-panel")?.focus();
   };

   window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
         const resultButton = [...document.querySelectorAll("[data-pipeline-result-id]")].find(
            button => button.dataset.pipelineResultId === previousResultId
         );

         if (resultButton) {
            resultButton.focus();
            return;
         }

         restoreFallbackFocus();
      });
   });
}

export default function PipelineWorkspace({ countries, dashboardData }) {
   const [resetViewKey, setResetViewKey] = useState(0);
   const lastSelectionResultIdRef = useRef(null);
   const lastSelectionTriggerRef = useRef(null);
   const { europeContext, germany } = useMemo(() => buildCountryCollections(countries), [countries]);

   const filters = usePipelineFilters(dashboardData);
   const selection = usePipelineSelection(filters.filteredCollection, filters.filteredProjects);
   const selectionFeatures = useMemo(() => {
      if (!selection.selection) return [];
      if (selection.selection.kind === "pipeline") return [selection.selection.item];

      const selectedFeatureIds = new Set(selection.selection.item.networkFeatureIds ?? []);
      return filters.filteredCollection.features.filter(feature => selectedFeatureIds.has(feature.properties.id));
   }, [filters.filteredCollection.features, selection.selection]);

   const resetFilters = () => {
      filters.resetFilters();
      selection.clearSelection();
      setResetViewKey(value => value + 1);
   };

   const closeSelection = () => {
      const previousResultId = lastSelectionResultIdRef.current;
      const previousTrigger = lastSelectionTriggerRef.current;

      selection.clearSelection();
      restoreSelectionFocus(previousResultId, previousTrigger);
   };

   const clearSearchTerm = () => {
      filters.setFilter("searchTerm", "");
   };

   const searchPipelines = value => {
      if (selection.selection) selection.clearSelection();
      filters.setFilter("searchTerm", value);
   };

   const setWorkspaceFilter = (key, value) => {
      if (selection.selection) selection.clearSelection();
      filters.setFilter(key, value);
   };

   const selectResult = (result, trigger) => {
      lastSelectionResultIdRef.current = result.item.id;
      lastSelectionTriggerRef.current = trigger ?? null;
      if (filters.filters.mapMode === "context") {
         filters.setFilter("mapMode", "projects");
      }
      selection.selectResult(result);
   };

   const selectPipeline = (item, source) => {
      const project = item.properties?.project;
      lastSelectionResultIdRef.current = project?.id ?? null;
      lastSelectionTriggerRef.current = null;
      if (project) {
         selection.selectProject(project, source ?? "map");
         return;
      }
      selection.selectPipeline(item, source);
   };

   return (
      <main className="app-shell min-h-svh bg-background p-4 text-foreground max-lg:p-3">
         <Topbar />
         <section className="mx-auto grid w-full max-w-440 grid-cols-[24rem_minmax(0,1fr)] items-stretch gap-4 min-[1360px]:h-[calc(100svh-112px)] min-[1360px]:min-h-0 min-[1360px]:grid-cols-[26rem_minmax(340px,1fr)_26.5rem] max-lg:grid-cols-1">
            <FilterPanel
               className={
                  selection.selection
                     ? "max-h-[calc(100svh-112px)] min-[1360px]:h-full max-lg:order-3 max-lg:h-auto max-lg:max-h-none"
                     : "max-h-[calc(100svh-112px)] min-[1360px]:h-full max-lg:order-1 max-lg:h-auto max-lg:max-h-none"
               }
               filters={filters.filters}
               metrics={filters.metrics}
               metadata={dashboardData.metadata}
               onResetFilters={resetFilters}
               mapModeOptions={filters.mapModeOptions}
               options={filters.options}
               setFilter={setWorkspaceFilter}
            />

            <div className="col-start-2 row-start-1 flex min-h-0 flex-col self-stretch min-[1360px]:col-auto min-[1360px]:row-auto max-lg:col-start-auto max-lg:row-start-auto max-lg:order-2">
               <div className="min-h-0 flex-1">
                  <NetworkMap
                     europeContext={europeContext}
                     filteredPipelines={filters.filteredCollection}
                     germany={germany}
                     onSelectPipeline={selectPipeline}
                     resetViewKey={resetViewKey}
                     searchActive={filters.hasActiveSearch}
                     searchBounds={filters.searchBounds}
                     selection={selection.selection}
                     selectionFeatures={selectionFeatures}
                  />
               </div>
            </div>

            <InspectorPanel
               className={`col-span-2 row-start-2 max-h-104 min-[1360px]:col-span-1 min-[1360px]:row-auto min-[1360px]:max-h-none max-lg:col-span-1 max-lg:row-start-auto max-lg:h-auto max-lg:max-h-[min(78svh,44rem)] ${selection.selection ? "max-lg:order-1" : "max-lg:order-3"}`}
               onClearSearch={clearSearchTerm}
               onCloseSelection={closeSelection}
               onSearchTermChange={searchPipelines}
               onSelectResult={selectResult}
               projects={filters.filteredProjects}
               results={filters.results}
               searchTerm={filters.filters.searchTerm}
               selection={selection.selection}
            />
         </section>
      </main>
   );
}
