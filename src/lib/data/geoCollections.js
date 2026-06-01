import { validateCountriesGeoJson } from "./loadCountries";

const GERMANY_ID = "276";

const parseCountryId = id => String(id).trim().padStart(3, "0");

const createFeatureCollection = features => ({
   type: "FeatureCollection",
   features
});

const partitionCountries = countries => {
   const collection = validateCountriesGeoJson(countries);
   const germany = [];
   const context = [];

   collection.features.forEach(country => {
      if (parseCountryId(country.id) === GERMANY_ID) {
         germany.push(country);
      } else {
         context.push(country);
      }
   });

   return { context, germany };
};

export const buildCountryCollections = countries => {
   const { context, germany } = partitionCountries(countries);

   if (germany.length !== 1) {
      throw new Error("Die Kartenbasis muss genau ein Deutschland-Feature enthalten.");
   }

   return {
      europeContext: createFeatureCollection(context),
      germany: createFeatureCollection(germany)
   };
};
