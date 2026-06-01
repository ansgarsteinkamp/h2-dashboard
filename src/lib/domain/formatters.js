import { EMPTY_LABEL } from "@/lib/domain/constants";

const NUMBER_FORMAT = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });
const INTEGER_FORMAT = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });
const YEAR_FORMAT = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0, useGrouping: false });
const COST_FORMAT = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });
const DATE_FORMAT = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

export const boolLabel = value => (value ? "Ja" : "Nein");

export const mediumLabel = value =>
   ({
      CO2: "CO₂",
      Erdgas: "CH₄",
      Wasserstoff: "H₂"
   })[value] ?? cleanText(value);

export const isEmpty = value =>
   value === null ||
   value === undefined ||
   value === "" ||
   (Array.isArray(value) && value.length === 0) ||
   (typeof value === "number" && !Number.isFinite(value));

export const cleanText = value => {
   if (isEmpty(value)) return EMPTY_LABEL;
   return String(value);
};

export const listLabel = value => {
   if (Array.isArray(value)) return value.length ? value.join(", ") : EMPTY_LABEL;
   return cleanText(value);
};

export const numberLabel = (value, unit = "") => {
   if (isEmpty(value)) return EMPTY_LABEL;
   return `${NUMBER_FORMAT.format(Number(value))}${unit ? ` ${unit}` : ""}`;
};

export const integerLabel = value => {
   if (isEmpty(value)) return EMPTY_LABEL;
   return INTEGER_FORMAT.format(Number(value));
};

export const yearLabel = value => {
   if (isEmpty(value)) return EMPTY_LABEL;
   return YEAR_FORMAT.format(Number(value));
};

export const costLabel = value => {
   if (isEmpty(value)) return EMPTY_LABEL;
   return `${COST_FORMAT.format(Number(value))} Mio. EUR`;
};

export const percentLabel = value => {
   if (isEmpty(value)) return EMPTY_LABEL;
   return `${NUMBER_FORMAT.format(Number(value) * 100)} %`;
};

export const dateLabel = value => {
   if (isEmpty(value)) return EMPTY_LABEL;

   const [year, month, day] = String(value).split("-").map(Number);
   if (!year || !month || !day) return cleanText(value);

   return DATE_FORMAT.format(new Date(Date.UTC(year, month - 1, day)));
};

export const dateLabelWithPrecision = (value, precision) => {
   if (isEmpty(value)) return EMPTY_LABEL;

   const [year, month] = String(value).split("-").map(Number);
   if (precision === "year" && year) return yearLabel(year);
   if (precision === "month" && year && month) return `${String(month).padStart(2, "0")}/${yearLabel(year)}`;

   return dateLabel(value);
};

export const dnLabel = (raw, minMm, maxMm) => {
   if (!isEmpty(raw)) return String(raw);
   if (!isEmpty(minMm) && !isEmpty(maxMm) && Number(minMm) !== Number(maxMm)) {
      return `${integerLabel(minMm)}-${integerLabel(maxMm)}`;
   }
   if (!isEmpty(minMm)) return integerLabel(minMm);
   return EMPTY_LABEL;
};

export const metricIntegerLabel = value => INTEGER_FORMAT.format(value ?? 0);

export const metricLengthLabel = value => INTEGER_FORMAT.format(Math.round(value ?? 0));

export const metricCostLabel = value => {
   const number = Number(value ?? 0);
   if (Math.abs(number) >= 1000) return `${COST_FORMAT.format(number / 1000)} Mrd.`;
   return `${COST_FORMAT.format(number)} Mio.`;
};

export const pipelineTitle = feature => {
   const props = feature.properties ?? {};
   return props.projectName || props.name || props.projectId || props.id || "Netzelement";
};

export const pipelineMeta = feature => {
   const props = feature.properties ?? {};
   const ibnLabel = props.commissioningDate
      ? `IBN ${dateLabelWithPrecision(props.commissioningDate, props.commissioningDatePrecision)}`
      : props.ibnYear
        ? `IBN ${yearLabel(props.ibnYear)}`
        : null;

   if (props.contextOnly) {
      return [
         "Dritte",
         props.sourceProjectId || props.id,
         mediumLabel(props.medium),
         props.networkElement,
         props.measure,
         ibnLabel
      ]
         .filter(Boolean)
         .join(" · ");
   }

   return [props.projectId || props.id, mediumLabel(props.medium), props.networkElement, props.measure, ibnLabel]
      .filter(Boolean)
      .join(" · ");
};
