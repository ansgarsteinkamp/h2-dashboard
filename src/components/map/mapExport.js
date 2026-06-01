const EXPORT_FILENAME_TITLE = "Karte Technische Projekte";
const EXPORT_PIXEL_RATIO = 2;
const SVG_STYLE_SELECTOR = "svg path, svg line, svg polyline, svg polygon, svg circle, svg ellipse, svg rect, svg text";
const SVG_STYLE_PROPERTIES = [
   "fill",
   "fill-opacity",
   "opacity",
   "stroke",
   "stroke-dasharray",
   "stroke-linecap",
   "stroke-linejoin",
   "stroke-opacity",
   "stroke-width"
];

export const MAP_EXPORT_EXCLUDE_ATTRIBUTE = "data-map-export-exclude";
export const MAP_EXPORT_EXCLUDE_PROPS = { [MAP_EXPORT_EXCLUDE_ATTRIBUTE]: "" };

function formatLocalDate(date) {
   const year = date.getFullYear();
   const month = String(date.getMonth() + 1).padStart(2, "0");
   const day = String(date.getDate()).padStart(2, "0");

   return `${year}_${month}_${day}`;
}

export function createMapExportFilename(date = new Date()) {
   return `${formatLocalDate(date)} ${EXPORT_FILENAME_TITLE}.png`;
}

function copyRootCustomProperties(target) {
   const rootStyles = window.getComputedStyle(document.documentElement);
   const previousValues = new Map();

   for (let index = 0; index < rootStyles.length; index += 1) {
      const property = rootStyles.item(index);
      if (!property.startsWith("--")) continue;

      previousValues.set(property, target.style.getPropertyValue(property));
      target.style.setProperty(property, rootStyles.getPropertyValue(property));
   }

   return previousValues;
}

function applyExportThemeContext(target) {
   const rootClassNames = [...document.documentElement.classList];
   const addedClassNames = rootClassNames.filter(className => !target.classList.contains(className));
   const previousPropertyValues = copyRootCustomProperties(target);

   target.classList.add(...addedClassNames);

   return () => {
      addedClassNames.forEach(className => target.classList.remove(className));

      previousPropertyValues.forEach((value, property) => {
         if (value) {
            target.style.setProperty(property, value);
            return;
         }

         target.style.removeProperty(property);
      });
   };
}

function pinSvgComputedStyles(target) {
   const previousStyleAttributes = [...target.querySelectorAll(SVG_STYLE_SELECTOR)].map(element => {
      const computedStyle = window.getComputedStyle(element);
      const previousStyleAttribute = element.getAttribute("style");

      SVG_STYLE_PROPERTIES.forEach(property => {
         const value = computedStyle.getPropertyValue(property);
         if (value) element.style.setProperty(property, value);
      });

      return [element, previousStyleAttribute, element.getAttribute("style")];
   });

   return () => {
      previousStyleAttributes.forEach(([element, previousStyleAttribute, pinnedStyleAttribute]) => {
         if (element.getAttribute("style") !== pinnedStyleAttribute) return;

         if (previousStyleAttribute === null) {
            element.removeAttribute("style");
            return;
         }

         element.setAttribute("style", previousStyleAttribute);
      });
   };
}

function nextFrame() {
   return new Promise(resolve => {
      if (typeof window.requestAnimationFrame === "function") {
         window.requestAnimationFrame(() => resolve());
         return;
      }

      window.setTimeout(resolve, 0);
   });
}

export function triggerBlobDownload(blob, filename) {
   const url = URL.createObjectURL(blob);
   const link = document.createElement("a");

   link.href = url;
   link.download = filename;
   link.style.display = "none";

   document.body.append(link);
   link.click();
   link.remove();

   window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function shouldIncludeInMapExport(node) {
   return !node?.closest?.(`[${MAP_EXPORT_EXCLUDE_ATTRIBUTE}]`);
}

export async function createMapSnapshot(node) {
   const { toBlob } = await import("html-to-image");
   const restoreExportContext = applyExportThemeContext(node);
   let restoreSvgStyles = () => {};

   try {
      await document.fonts?.ready;
      await nextFrame();
      await nextFrame();

      restoreSvgStyles = pinSvgComputedStyles(node);

      return await toBlob(node, {
         filter: shouldIncludeInMapExport,
         pixelRatio: EXPORT_PIXEL_RATIO
      });
   } finally {
      restoreSvgStyles();
      restoreExportContext();
   }
}
