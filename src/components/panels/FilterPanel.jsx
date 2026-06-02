import { useId } from "react";
import { Check, RotateCcw } from "lucide-react";

import { HelpTooltip } from "@/components/ui/help-tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { metricIntegerLabel, metricLengthLabel } from "@/lib/domain/formatters";
import { cn } from "@/lib/utils";

const FILTER_PANEL_CLASS =
   "flex min-h-0 flex-col gap-4 overflow-hidden focus-visible:ring-3 focus-visible:ring-ring/65 focus-visible:outline-none max-lg:overflow-visible dark:focus-visible:ring-ring/50";
const FILTER_GROUP_CLASS = "flex min-h-0 flex-1 flex-col overflow-hidden border border-border bg-muted/75";
const FILTER_SCROLL_CLASS = "flex min-h-0 flex-1 flex-col gap-5 overflow-auto overscroll-contain p-4";
const FILTER_SECTION_CLASS = "flex flex-col gap-2.5";
const FILTER_CATEGORY_CLASS = "grid gap-3 border-t border-border/70 pt-4 first:border-t-0 first:pt-0";
const FILTER_CATEGORY_TITLE_CLASS = "text-[0.64rem] font-medium text-label-accent uppercase";
const FILTER_LABEL_CLASS = "text-xs leading-snug font-medium text-card-foreground";
const SEGMENT_BUTTON_CLASS =
   "inline-flex min-h-9 min-w-0 items-center justify-center gap-2 rounded-md border border-border bg-muted px-3 text-[0.72rem] text-foreground transition-colors hover:border-primary/70 hover:bg-primary/20 hover:text-secondary focus-visible:ring-3 focus-visible:ring-ring/65 focus-visible:outline-none max-lg:min-h-10 dark:focus-visible:ring-ring/50";
const ACTIVE_SEGMENT_BUTTON_CLASS = "border-primary/80 bg-primary/15 text-card-foreground";
const RESET_BUTTON_CLASS =
   "inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-primary/60 bg-primary/15 px-3.5 text-[0.72rem] font-medium text-card-foreground transition-colors hover:border-primary hover:bg-primary/20 hover:text-secondary focus-visible:ring-3 focus-visible:ring-ring/65 focus-visible:outline-none dark:focus-visible:ring-ring/50";

const HELP_TEXT = {
   builder: "Filtert nach dem in den Quelldaten gepflegten Bauherrn oder Partner.",
   cluster: "Filtert nach dem übergeordneten Projektcluster aus den Quelldaten.",
   ibn: "Filtert nach internem IBN-Jahr der Projekte. Kontextleitungen nutzen das in den Geodaten angegebene Inbetriebnahmejahr.",
   mapMode: "Kontextleitungen sind Leitungen auf der Karte, die keinem Projekt im Dashboard zugeordnet sind.",
   measure:
      "Filtert nach fachlicher Maßnahme, z. B. Neubau, Umstellung oder Umhängung. Drittleitung ist eine konkrete Maßnahme, nicht die Sammelkategorie aller Kontextleitungen.",
   medium: "Filtert Projekte und Kartenobjekte nach transportiertem Medium.",
   networkElement:
      "Filtert nach Art des Netzelements. Stationsprojekte können in der Liste erscheinen, auch wenn aktuell keine Kartenpunkte vorliegen.",
   ogeLength: "Summe der internen Projektlängen der aktuell ausgewählten Leitungsprojekte.",
   ogeResponsible:
      "Filtert auf Projekte mit „Bauverantwortung OGE = Ja“ aus den Quelldaten. Das ist nicht identisch mit „Bauherr = OGE“; Partner- und Gemeinschaftsprojekte können abweichen.",
   contextFeatures: "Anzahl der aktuell sichtbaren Leitungen, die keinem Projekt im Dashboard zugeordnet sind.",
   contextLength: "Summe der Anzeigelängen der aktuell sichtbaren Kontextleitungen.",
   projectCount: "Anzahl der Projekte, die zu den aktiven Filtern und der Suche passen.",
   mappedProjects: "Anzahl der ausgewählten Projekte mit mindestens einem Kartenobjekt."
};

function HelpLabel({ children, description, labelClassName }) {
   return (
      <span className="inline-flex min-w-0 items-center gap-1.5">
         <span className={cn("min-w-0 truncate", labelClassName)}>{children}</span>
         <HelpTooltip className="size-4" contentClassName="max-w-80" label={children}>
            {description}
         </HelpTooltip>
      </span>
   );
}

function MetricTile({ description, label, suffix, value }) {
   return (
      <div className="min-w-0 px-3 first:pl-0 last:pr-0">
         <div className="mb-1 flex min-w-0 items-center gap-1.5 text-[0.62rem] font-medium text-label-accent uppercase">
            {description ? (
               <HelpLabel
                  description={description}
                  labelClassName="overflow-visible whitespace-normal text-clip leading-tight"
               >
                  {label}
               </HelpLabel>
            ) : (
               <span>{label}</span>
            )}
         </div>
         <div className="flex min-w-0 items-baseline gap-1.5 overflow-hidden">
            <strong className="shrink-0 whitespace-nowrap text-lg leading-none font-medium text-card-foreground">
               {value}
            </strong>
            {suffix ? <span className="min-w-0 truncate text-[0.62rem] text-muted-foreground">{suffix}</span> : null}
         </div>
      </div>
   );
}

function MetricsDashboard({ mapMode, metrics }) {
   const projectTotalLabel = metricIntegerLabel(metrics.totalProjectCount);

   if (mapMode === "context") {
      return (
         <section
            className="border border-border bg-muted/75 px-3.5 py-3"
            aria-label="Kennzahlen der aktuellen Ansicht"
         >
            <div className="grid grid-cols-[0.95fr_1.1fr_1.1fr] divide-x divide-border/70">
               <MetricTile
                  label="Projekte"
                  value={metricIntegerLabel(metrics.projectCount)}
                  suffix="in Liste"
                  description={HELP_TEXT.projectCount}
               />
               <MetricTile
                  label="Ohne Projekt"
                  value={metricIntegerLabel(metrics.featureCount)}
                  suffix="Leitungen"
                  description={HELP_TEXT.contextFeatures}
               />
               <MetricTile
                  label="Leitungslänge"
                  value={metricLengthLabel(metrics.lengthKm)}
                  suffix="km"
                  description={HELP_TEXT.contextLength}
               />
            </div>
         </section>
      );
   }

   return (
      <section className="border border-border bg-muted/75 px-3.5 py-3" aria-label="Kennzahlen der aktuellen Ansicht">
         <div className="grid grid-cols-[0.95fr_0.95fr_1.1fr] divide-x divide-border/70">
            <MetricTile
               label="Projekte"
               value={metricIntegerLabel(metrics.projectCount)}
               suffix={`von ${projectTotalLabel}`}
               description={HELP_TEXT.projectCount}
            />
            <MetricTile
               label="Auf Karte"
               value={metricIntegerLabel(metrics.mappedProjectCount)}
               suffix={`von ${projectTotalLabel}`}
               description={HELP_TEXT.mappedProjects}
            />
            <MetricTile
               label="Projektlänge"
               value={metricLengthLabel(metrics.lineProjectLengthKm)}
               suffix="km"
               description={HELP_TEXT.ogeLength}
            />
         </div>
      </section>
   );
}

function FilterCategory({ children, title }) {
   return (
      <section className={FILTER_CATEGORY_CLASS} aria-label={title}>
         <h2 className={FILTER_CATEGORY_TITLE_CLASS}>{title}</h2>
         <div className="grid gap-4">{children}</div>
      </section>
   );
}

function SegmentGroup({ description, label, options, value, onChange }) {
   return (
      <section className={FILTER_SECTION_CLASS} aria-label={label}>
         <h3 className={FILTER_LABEL_CLASS}>
            {description ? <HelpLabel description={description}>{label}</HelpLabel> : label}
         </h3>
         <div className="flex flex-wrap items-start gap-2" role="group" aria-label={label}>
            {options.map(option => {
               const active = value === option.value;
               return (
                  <button
                     aria-label={`${label}: ${option.label}`}
                     aria-pressed={active}
                     className={cn(SEGMENT_BUTTON_CLASS, active && ACTIVE_SEGMENT_BUTTON_CLASS)}
                     key={option.value}
                     onClick={() => onChange(option.value)}
                     type="button"
                  >
                     {active ? <Check aria-hidden="true" className="size-3" /> : null}
                     <span className="min-w-0 whitespace-nowrap">{option.label}</span>
                  </button>
               );
            })}
         </div>
      </section>
   );
}

function SelectField({ description, label, options, value, onChange }) {
   const selectedOption = options.find(option => option.value === value);
   const selectedLabel = selectedOption?.label ?? "";

   return (
      <div className="grid gap-2">
         <span className={FILTER_LABEL_CLASS}>
            {description ? <HelpLabel description={description}>{label}</HelpLabel> : label}
         </span>
         <Select value={value} onValueChange={onChange}>
            <SelectTrigger aria-label={label}>
               <SelectValue placeholder={selectedLabel} />
            </SelectTrigger>
            <SelectContent>
               {options.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                     {option.label}
                  </SelectItem>
               ))}
            </SelectContent>
         </Select>
      </div>
   );
}

function OgeResponsibleSwitch({ active, onChange }) {
   const inputId = useId();
   const state = active ? "checked" : "unchecked";

   return (
      <div className="flex min-h-8 min-w-0 items-center gap-2.5">
         <label className="flex min-w-0 cursor-pointer items-center gap-2.5" htmlFor={inputId}>
            <input
               checked={active}
               className="peer sr-only"
               id={inputId}
               onChange={event => onChange(event.target.checked)}
               role="switch"
               type="checkbox"
            />
            <span
               aria-hidden="true"
               data-state={state}
               className="relative h-4.5 w-8 shrink-0 rounded-full border border-border bg-field transition-colors peer-focus-visible:ring-3 peer-focus-visible:ring-ring/65 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-background peer-focus-visible:outline-none data-[state=checked]:border-primary/70 data-[state=checked]:bg-primary/80 dark:peer-focus-visible:ring-ring/50"
            >
               <span
                  data-state={state}
                  className="absolute top-1/2 left-0.5 size-3.5 -translate-y-1/2 rounded-full bg-muted-foreground transition-transform data-[state=checked]:translate-x-3.25 data-[state=checked]:bg-primary-foreground"
               />
            </span>
            <span className="min-w-0 truncate text-xs font-medium text-card-foreground">Nur Bauverantwortung OGE</span>
         </label>
         <HelpTooltip className="size-4" contentClassName="max-w-80" label="Bauverantwortung OGE">
            {HELP_TEXT.ogeResponsible}
         </HelpTooltip>
      </div>
   );
}

function ResetAction({ onResetFilters }) {
   return (
      <div className="shrink-0">
         <button className={RESET_BUTTON_CLASS} onClick={onResetFilters} type="button">
            <RotateCcw aria-hidden="true" className="size-4" />
            <span>Filter und Karte zurücksetzen</span>
         </button>
      </div>
   );
}

export default function FilterPanel({
   className,
   filters,
   mapModeOptions,
   metrics,
   onResetFilters,
   options,
   setFilter
}) {
   return (
      <aside
         aria-label="Kennzahlen und Filter"
         className={cn(FILTER_PANEL_CLASS, className)}
         id="filter-panel"
         tabIndex={-1}
      >
         <MetricsDashboard mapMode={filters.mapMode} metrics={metrics} />
         <div className={FILTER_GROUP_CLASS}>
            <div className={FILTER_SCROLL_CLASS}>
               <FilterCategory title="Kartenauswahl">
                  <SegmentGroup
                     label="Medium"
                     description={HELP_TEXT.medium}
                     onChange={value => setFilter("medium", value)}
                     options={options.mediums}
                     value={filters.medium}
                  />
                  <SegmentGroup
                     label="Kartendarstellung"
                     description={HELP_TEXT.mapMode}
                     onChange={value => setFilter("mapMode", value)}
                     options={mapModeOptions}
                     value={filters.mapMode}
                  />
                  <SelectField
                     label="Netzelement"
                     description={HELP_TEXT.networkElement}
                     onChange={value => setFilter("networkElement", value)}
                     options={options.networkElements}
                     value={filters.networkElement}
                  />
               </FilterCategory>

               <FilterCategory title="Projektmerkmale">
                  <SelectField
                     label="Maßnahme"
                     description={HELP_TEXT.measure}
                     onChange={value => setFilter("measure", value)}
                     options={options.measures}
                     value={filters.measure}
                  />
                  <SelectField
                     label="Projektcluster"
                     description={HELP_TEXT.cluster}
                     onChange={value => setFilter("cluster", value)}
                     options={options.clusters}
                     value={filters.cluster}
                  />
                  <SelectField
                     label="Bauherr"
                     description={HELP_TEXT.builder}
                     onChange={value => setFilter("builder", value)}
                     options={options.builders}
                     value={filters.builder}
                  />
               </FilterCategory>

               <FilterCategory title="Zeitraum">
                  <section className={FILTER_SECTION_CLASS} aria-label="IBN-Zeitraum">
                     <span className={FILTER_LABEL_CLASS}>
                        <HelpLabel description={HELP_TEXT.ibn}>IBN-Zeitraum</HelpLabel>
                     </span>
                     <div className="grid grid-cols-2 gap-2">
                        <SelectField
                           label="Von"
                           onChange={value => setFilter("yearFrom", value)}
                           options={options.years}
                           value={filters.yearFrom}
                        />
                        <SelectField
                           label="Bis"
                           onChange={value => setFilter("yearTo", value)}
                           options={options.years}
                           value={filters.yearTo}
                        />
                     </div>
                  </section>
               </FilterCategory>

               <FilterCategory title="OGE-Sicht">
                  <OgeResponsibleSwitch
                     active={filters.ogeResponsibleOnly}
                     onChange={value => setFilter("ogeResponsibleOnly", value)}
                  />
               </FilterCategory>
            </div>
         </div>
         <ResetAction onResetFilters={onResetFilters} />
      </aside>
   );
}
