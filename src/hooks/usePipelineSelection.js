import { useEffect, useRef, useState } from "react";

export function usePipelineSelection(filteredCollection, filteredProjects = []) {
   const [selection, setSelection] = useState(null);
   const activationId = useRef(0);

   const nextActivationId = () => {
      activationId.current += 1;
      return activationId.current;
   };

   useEffect(() => {
      if (!selection) return;

      if (selection.kind === "project") {
         const stillVisible = filteredProjects.some(project => project.id === selection.item.id);
         if (!stillVisible) queueMicrotask(() => setSelection(null));
         return;
      }

      const selectedId = selection.item.properties.id;
      const stillVisible = filteredCollection.features.some(feature => feature.properties.id === selectedId);
      // Keep the detail panel in sync with filters: hidden selections are closed immediately.
      if (!stillVisible) queueMicrotask(() => setSelection(null));
   }, [filteredCollection, filteredProjects, selection]);

   const selectPipeline = (item, source = "map") => {
      setSelection({ kind: "pipeline", item, source, activationId: nextActivationId() });
   };

   const selectProject = (item, source = "table") => {
      setSelection({ kind: "project", item, source, activationId: nextActivationId() });
   };

   const selectResult = result => {
      selectProject(result.item, "result");
   };

   return {
      clearSelection: () => setSelection(null),
      selectProject,
      selectPipeline,
      selectResult,
      selection
   };
}
