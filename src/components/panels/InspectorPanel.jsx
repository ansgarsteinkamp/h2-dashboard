import { MapPinOff, Search, X } from "lucide-react";
import { useRef } from "react";

import DetailPanel from "@/components/panels/DetailPanel";
import { cleanText, listLabel, mediumLabel, percentLabel, yearLabel } from "@/lib/domain/formatters";
import { cn } from "@/lib/utils";

function InlineMeta({ className, items }) {
   const visibleItems = items.filter(Boolean);

   return (
      <small className={cn("block min-w-0 text-muted-foreground", className)}>
         <span className="wrap-break-word">{visibleItems.join(" · ")}</span>
      </small>
   );
}

function ProjectCard({ project, result, onSelect }) {
   const hasGeometry = project.networkFeatureIds?.length > 0;
   const projectMeta = [project.id, mediumLabel(project.medium), project.networkElement, project.measure];
   const statusMeta = [
      `IBN ${yearLabel(project.dates?.ibnYear)}`,
      listLabel(project.geography?.federalStates),
      `OGE ${percentLabel(project.ownership?.ogeShare)}`
   ];

   return (
      <li>
         <button
            className="grid min-h-18 w-full gap-1.5 border-b border-border/45 bg-transparent px-2.5 py-3 text-left text-foreground transition-colors hover:bg-primary/10 hover:text-secondary focus-visible:ring-3 focus-visible:ring-ring/65 focus-visible:outline-none dark:focus-visible:ring-ring/50"
            data-pipeline-result-id={project.id}
            onClick={event => onSelect(result, event.currentTarget)}
            type="button"
         >
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2">
               <strong className="min-w-0 text-xs font-medium wrap-break-word text-card-foreground">
                  {project.name || project.id}
               </strong>
               {!hasGeometry ? (
                  <MapPinOff aria-label="Kein Netzelement auf der Karte" className="size-3.5 text-label-accent" />
               ) : null}
            </div>
            <InlineMeta className="text-[0.68rem]" items={projectMeta} />
            <InlineMeta className="text-[0.64rem]" items={statusMeta} />
         </button>
      </li>
   );
}

function ProjectList({ onSelect, results }) {
   return (
      <ul className="grid p-0">
         {results.items.map(result => (
            <ProjectCard key={result.item.id} onSelect={onSelect} project={result.item} result={result} />
         ))}
      </ul>
   );
}

function ProjectListHeader({ count }) {
   return (
      <div className="grid gap-1 border-b border-border/55 px-2.5 pb-2 text-[0.68rem] text-muted-foreground">
         <div className="flex items-center justify-between gap-2">
            <h2 className="text-[0.7rem] font-medium text-label-accent uppercase">Projektliste</h2>
            <span>{count} Projekte</span>
         </div>
      </div>
   );
}

export default function InspectorPanel({
   className,
   onClearSearch,
   onCloseSelection,
   onSearchTermChange,
   onSelectResult,
   results,
   searchTerm,
   selection
}) {
   const searchInputRef = useRef(null);
   const resultCount = results.items.length;
   const resultStatusText = resultCount === 0 ? "Keine Treffer" : `${resultCount} Treffer`;

   const clearSearch = () => {
      onClearSearch();
      window.requestAnimationFrame(() => searchInputRef.current?.focus());
   };

   return (
      <aside
         aria-label="Suche, Projektliste und Details"
         className={cn(
            "flex min-h-0 flex-col gap-3 focus-visible:ring-3 focus-visible:ring-ring/65 focus-visible:outline-none dark:focus-visible:ring-ring/50",
            className
         )}
         id="inspector-panel"
         tabIndex={-1}
      >
         <div className="border-b border-border/40 pb-3">
            <div className="grid min-h-10 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-primary/45 bg-field/75 px-3 text-muted-foreground shadow-none transition-colors hover:border-primary/65 focus-within:border-ring focus-within:bg-popover focus-within:ring-2 focus-within:ring-ring/65 dark:focus-within:border-primary/90 dark:focus-within:ring-primary/20">
               <Search aria-hidden="true" className="size-3.5" />
               <input
                  aria-label="Suche nach ID, Projekt, Bauherr, Cluster oder Status"
                  className="min-w-0 border-0 bg-transparent text-[0.8rem] leading-5 text-popover-foreground outline-none placeholder:text-muted-foreground/55"
                  onChange={event => onSearchTermChange(event.target.value)}
                  placeholder="Suche"
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
               />
               {searchTerm && (
                  <button
                     aria-label="Suche löschen"
                     className="inline-grid size-6 place-items-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/65 focus-visible:outline-none dark:focus-visible:ring-ring/50"
                     onClick={clearSearch}
                     type="button"
                  >
                     <X aria-hidden="true" className="size-3.5" />
                  </button>
               )}
            </div>
         </div>

         {selection ? (
            <div className="min-h-0 flex-1 overflow-hidden">
               <DetailPanel onClose={onCloseSelection} selection={selection} />
            </div>
         ) : (
            <section className="min-h-0 flex-1 overflow-auto pt-1" aria-label="Projektliste">
               <p className="sr-only" role="status" aria-live="polite">
                  {resultStatusText}
               </p>
               <ProjectListHeader count={resultCount} />
               {resultCount > 0 ? (
                  <ProjectList onSelect={onSelectResult} results={results} />
               ) : (
                  <div className="flex min-h-16 items-center justify-center px-3 text-xs text-muted-foreground/80">
                     {searchTerm
                        ? `Keine Treffer für ${cleanText(searchTerm)}`
                        : "Keine Projekte für die aktiven Filter"}
                  </div>
               )}
            </section>
         )}
      </aside>
   );
}
