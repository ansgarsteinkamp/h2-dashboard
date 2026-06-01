import { useEffect, useState } from "react";

import { ErrorState, LoadingState } from "@/components/layout/AppStates";
import PipelineWorkspace from "@/components/layout/PipelineWorkspace";
import UploadStart from "@/presets/upload/UploadStart";
import { loadCountries } from "@/lib/data/loadCountries";
import { parseDashboardFiles } from "@/lib/data/validateDashboardFiles";

const MAX_UPLOAD_SIZE = 60 * 1024 * 1024;

const DASHBOARD_FILE_ACCEPT = {
   "application/geo+json": [".geojson"],
   "application/json": [".json", ".geojson"]
};

const autoloadFileUrl = fileName => {
   const exportDir = import.meta.env.VITE_DASHBOARD_EXPORT_DIR;
   if (!exportDir) {
      throw new Error("Für ?autoload=1 muss VITE_DASHBOARD_EXPORT_DIR in .env.local gesetzt sein.");
   }

   const normalizedExportDir = exportDir.replaceAll("\\", "/").replace(/\/+$/, "");
   return `/@fs/${normalizedExportDir}/${fileName}`;
};

export default function App() {
   const [countries, setCountries] = useState(null);
   const [countriesError, setCountriesError] = useState(null);
   const [dashboardData, setDashboardData] = useState(null);
   const [uploadError, setUploadError] = useState(null);
   const [isProcessing, setIsProcessing] = useState(false);

   useEffect(() => {
      let active = true;

      loadCountries(import.meta.env.BASE_URL)
         .then(data => {
            if (active) setCountries(data);
         })
         .catch(error => {
            if (active) setCountriesError(error);
         });

      return () => {
         active = false;
      };
   }, []);

   useEffect(() => {
      if (!import.meta.env.DEV || new URLSearchParams(window.location.search).get("autoload") !== "1") return;

      let active = true;

      const loadExportFiles = async () => {
         const specs = [
            [autoloadFileUrl("projects.json"), "projects.json"],
            [autoloadFileUrl("network.geojson"), "network.geojson"]
         ];
         const files = await Promise.all(
            specs.map(async ([url, name]) => {
               const response = await fetch(url);
               if (!response.ok) throw new Error(`${name} konnte nicht per Autoload geladen werden.`);
               const blob = await response.blob();
               return new File([blob], name, { type: "application/json" });
            })
         );

         if (active) await handleFilesAccepted(files);
      };

      loadExportFiles().catch(error => {
         if (active) setUploadError(error);
      });

      return () => {
         active = false;
      };
   }, []);

   async function handleFilesAccepted(files) {
      if (files.length !== 2) {
         setUploadError(new Error("Bitte genau projects.json und network.geojson auswählen."));
         return;
      }

      const oversizedFile = files.find(file => file.size > MAX_UPLOAD_SIZE);
      if (oversizedFile) {
         setUploadError(new Error(`${oversizedFile.name} ist zu groß. Bitte Dateien bis maximal 60 MB auswählen.`));
         return;
      }

      setIsProcessing(true);
      setUploadError(null);

      try {
         const nextDashboardData = await parseDashboardFiles(files);
         setDashboardData(nextDashboardData);
      } catch (error) {
         setUploadError(error);
      } finally {
         setIsProcessing(false);
      }
   }

   const resetUpload = () => {
      setDashboardData(null);
      setUploadError(null);
      setIsProcessing(false);
   };

   if (uploadError) return <ErrorState error={uploadError} onReset={resetUpload} />;

   if (!dashboardData) {
      return (
         <UploadStart
            accept={DASHBOARD_FILE_ACCEPT}
            heading="Technische Projekte Dashboard"
            isProcessing={isProcessing}
            label="projects.json und network.geojson hier ablegen oder auswählen"
            maxFiles={2}
            maxSize={MAX_UPLOAD_SIZE}
            multiple
            onFilesAccepted={handleFilesAccepted}
            processingLabel="Dashboard-Daten werden geprüft..."
         />
      );
   }

   if (countriesError) {
      return <ErrorState error={countriesError} onReset={() => window.location.reload()} resetLabel="Neu laden" />;
   }
   if (!countries) return <LoadingState />;

   return <PipelineWorkspace countries={countries} dashboardData={dashboardData} />;
}
