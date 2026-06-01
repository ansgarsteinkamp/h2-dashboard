import { Check, X } from "lucide-react";
import { useEffect, useRef } from "react";

import {
   boolLabel,
   cleanText,
   costLabel,
   dateLabelWithPrecision,
   dnLabel,
   listLabel,
   mediumLabel,
   numberLabel,
   percentLabel,
   pipelineMeta,
   pipelineTitle,
   yearLabel
} from "@/lib/domain/formatters";

const EMPTY_VALUE = "keine Angabe";

const PROJECT_GROUPS = [
   {
      id: "basis",
      title: "Stammdaten",
      fields: [
         ["id", "ID"],
         ["name", "Projektname"],
         ["alias", "Alias"],
         ["cluster", "Projektcluster"],
         ["medium", "Medium", "medium"],
         ["networkElement", "Netzelement"],
         ["measure", "Maßnahme"],
         ["projectType", "Projekt-Typ"],
         ["triggerProcess", "Auslösender Prozess"]
      ]
   },
   {
      id: "beteiligte",
      title: "Beteiligte",
      fields: [
         ["builder", "Bauherr"],
         ["ownership.owners", "Eigentümer"],
         ["ownership.ogeShare", "OGE-Anteil", "percent"],
         ["ogeResponsible", "Bauverantwortung OGE", "boolean"],
         ["confirmedMeasure", "Bestätigte Maßnahme", "boolean"]
      ]
   },
   {
      id: "termine",
      title: "Termine",
      fields: [
         ["dates.ibnYear", "IBN-Jahr", "year"],
         ["dates.commissioningInternal", "IBN-Termin intern", "date", "dates.commissioningInternalPrecision"],
         ["dates.commissioningExternal", "IBN-Termin extern", "date", "dates.commissioningExternalPrecision"],
         ["dates.commissioningDeltaDays", "Differenz IBN-Termine", "days"],
         ["dates.projectStart", "Projektstart", "date", "dates.projectStartPrecision"],
         ["dates.constructionStart", "Baustart", "date", "dates.constructionStartPrecision"],
         ["hasSchedule", "Terminplan-Daten vorhanden", "boolean"]
      ]
   },
   {
      id: "technik",
      title: "Technik und Lage",
      fields: [
         ["technical.lengthInternalKm", "Projektlänge intern", "km"],
         ["technical.lengthExternalKm", "Länge extern", "km"],
         ["technical.lengthDeltaKm", "Differenz Längen", "km"],
         ["technical.dnRaw", "DN", "dn"],
         ["technical.dnExternalRaw", "DN extern", "dnExternal"],
         ["technical.dpBar", "DP", "bar"],
         ["technical.lineSection", "Leitungsabschnitt"],
         ["technical.ogeLineNumber", "Leitungsnummer"],
         ["technical.drivePowerInternalMw", "Antriebsleistung intern", "mw"],
         ["technical.drivePowerExternalMw", "Antriebsleistung extern", "mw"],
         ["technical.machineUnits", "Anzahl Maschineneinheiten"],
         ["geography.federalStates", "Bundesland"]
      ]
   },
   {
      id: "wirtschaft",
      title: "CAPEX und Förderung",
      fields: [
         ["capex.externalMioEur", "CAPEX extern", "cost"],
         ["capex.internalEscalatedMioEur", "CAPEX TP eskaliert", "cost"],
         ["capex.ogeShareInternalEscalatedMioEur", "OGE-Anteil CAPEX TP eskaliert", "cost"],
         ["funding.pciProject", "PCI-Projekt"],
         ["funding.ipceiProject", "IPCEI-Projekt"],
         ["funding.otherFundingProject", "Weitere Förderung"]
      ]
   },
   {
      id: "karte",
      title: "Kartenbezug",
      fields: [["networkFeatureIds", "Netzelemente auf Karte"]]
   }
];

function getValue(object, path) {
   return path
      .split(".")
      .reduce((value, key) => (value === null || value === undefined ? undefined : value[key]), object);
}

function formatValue(value, type, context) {
   if (Array.isArray(value)) return listLabel(value);
   if (type === "boolean") return value === null || value === undefined ? EMPTY_VALUE : <BooleanValue value={value} />;
   if (type === "date") return dateLabelWithPrecision(value, context?.precision);
   if (type === "dn") return dnLabel(value, context?.project?.technical?.dnMinMm, context?.project?.technical?.dnMaxMm);
   if (type === "dnExternal")
      return dnLabel(value, context?.project?.technical?.dnExternalMinMm, context?.project?.technical?.dnExternalMaxMm);
   if (type === "medium") return mediumLabel(value);
   if (type === "year") return yearLabel(value);
   if (type === "km") return numberLabel(value, "km");
   if (type === "mm") return numberLabel(value, "mm");
   if (type === "bar") return numberLabel(value, "bar");
   if (type === "mw") return numberLabel(value, "MW");
   if (type === "days") return numberLabel(Math.abs(Number(value)), "Tage");
   if (type === "cost") return costLabel(value);
   if (type === "percent") return percentLabel(value);
   return cleanText(value);
}

function BooleanValue({ value }) {
   const label = boolLabel(value);
   const Icon = value ? Check : X;

   return (
      <span
         aria-label={label}
         className={
            value
               ? "inline-flex items-center gap-1.5 text-primary"
               : "inline-flex items-center gap-1.5 text-muted-foreground"
         }
      >
         <Icon aria-hidden="true" className="size-4" />
         <span>{label}</span>
      </span>
   );
}

function DetailRow({ context, label, value, type }) {
   return (
      <div className="grid min-h-9 grid-cols-[minmax(8.5rem,0.42fr)_minmax(0,1fr)] gap-x-3 gap-y-1 border-b border-border/45 py-2.5 text-xs @max-[430px]:grid-cols-1">
         <dt className="min-w-0 wrap-break-word text-muted-foreground">{label}</dt>
         <dd className="m-0 min-w-0 font-normal wrap-break-word text-card-foreground">
            {formatValue(value, type, context)}
         </dd>
      </div>
   );
}

function projectFromSelection(selection) {
   if (selection.kind === "project") return selection.item;
   return selection.item.properties.project;
}

function featureFromSelection(selection) {
   return selection.kind === "pipeline" ? selection.item : null;
}

export default function DetailPanel({ selection, onClose }) {
   const panelRef = useRef(null);

   useEffect(() => {
      if (!selection) return;
      panelRef.current?.focus();
   }, [selection]);

   if (!selection) return null;

   const project = projectFromSelection(selection);
   const feature = featureFromSelection(selection);
   const title = project?.name ?? (feature ? pipelineTitle(feature) : "Auswahl");
   const meta = project
      ? [
           project.id,
           mediumLabel(project.medium),
           project.networkElement,
           project.dates?.ibnYear ? `IBN ${yearLabel(project.dates.ibnYear)}` : null
        ]
           .filter(Boolean)
           .join(" · ")
      : pipelineMeta(feature);

   return (
      <section
         aria-labelledby="selection-panel-title"
         className="@container h-full max-h-full overflow-auto border border-border/60 bg-muted/55 p-4 focus-visible:ring-3 focus-visible:ring-ring/65 focus-visible:outline-none dark:focus-visible:ring-ring/50"
         ref={panelRef}
         tabIndex={-1}
      >
         <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
            <div className="grid min-w-0 gap-1">
               <p className="m-0 text-[0.72rem] font-medium text-label-accent uppercase">{meta}</p>
               <h2 id="selection-panel-title" className="m-0 text-sm leading-snug font-medium text-card-foreground">
                  {title}
               </h2>
            </div>
            <button
               aria-label="Auswahl schließen"
               className="grid size-8 flex-none place-items-center rounded-md border border-border bg-transparent text-foreground transition-colors hover:border-primary/70 hover:bg-primary/15 focus-visible:ring-3 focus-visible:ring-ring/65 focus-visible:outline-none dark:focus-visible:ring-ring/50"
               onClick={onClose}
               type="button"
            >
               <X aria-hidden="true" className="size-4" />
            </button>
         </div>

         {project ? (
            <div className="mt-4 grid gap-5">
               {PROJECT_GROUPS.map(group => (
                  <section aria-labelledby={`detail-group-${group.id}`} className="grid gap-2.5" key={group.id}>
                     <h3
                        id={`detail-group-${group.id}`}
                        className="m-0 text-[0.7rem] font-medium text-label-accent uppercase"
                     >
                        {group.title}
                     </h3>
                     <dl className="grid border-t border-border/50">
                        {group.fields.map(([path, label, type, precisionPath]) => (
                           <DetailRow
                              context={{ precision: precisionPath ? getValue(project, precisionPath) : null, project }}
                              key={path}
                              label={label}
                              type={type}
                              value={getValue(project, path)}
                           />
                        ))}
                     </dl>
                  </section>
               ))}
            </div>
         ) : (
            <div className="mt-4 grid gap-2.5">
               <h3 className="m-0 text-[0.7rem] font-medium text-label-accent uppercase">Leitung Dritter</h3>
               <dl className="grid border-t border-border/50">
                  {[
                     ["id", "Netzelement-ID"],
                     ["sourceProjectId", "Quell-ID"],
                     ["medium", "Medium", "medium"],
                     ["networkElement", "Netzelement"],
                     ["measure", "Maßnahme"],
                     ["lengthKm", "Leitungslänge", "km"],
                     ["source", "Quelle"]
                  ].map(([path, label, type]) => (
                     <DetailRow
                        context={{ precision: feature.properties.commissioningDatePrecision }}
                        key={path}
                        label={label}
                        type={type}
                        value={getValue(feature.properties, path)}
                     />
                  ))}
               </dl>
            </div>
         )}
      </section>
   );
}
