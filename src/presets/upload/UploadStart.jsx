import { useId, useState } from "react";
import { File, FileWarning, LoaderCircle, Upload } from "lucide-react";

import ThemeToggleCorner from "@/components/theme/ThemeToggleCorner";
import FileDropzone from "@/components/upload/FileDropzone";
import { cn } from "@/lib/utils";

function formatRejection(rejections, { maxFiles, multiple }) {
   const code = rejections?.[0]?.errors?.[0]?.code;

   if (code === "too-many-files") {
      if (multiple && maxFiles) {
         return `Es dürfen maximal ${maxFiles} Dateien ausgewählt werden.`;
      }

      return "Es darf nur eine Datei ausgewählt werden.";
   }

   return (
      {
         "file-invalid-type": "Dieser Dateityp wird nicht unterstützt.",
         "file-too-large": "Die Datei ist zu groß.",
         "file-too-small": "Die Datei ist zu klein."
      }[code] || "Die Datei konnte nicht ausgewählt werden."
   );
}

export default function UploadStart({
   accept,
   className,
   description = "Die Dateien werden lokal im Browser verarbeitet. Es findet kein Upload statt.",
   disabled = false,
   heading,
   isProcessing = false,
   label = "Datei hier ablegen oder auswählen",
   maxFiles,
   maxSize,
   multiple = Boolean(maxFiles && maxFiles > 1),
   onFilesAccepted,
   onFilesRejected,
   processingLabel = "Datei wird verarbeitet..."
}) {
   const [files, setFiles] = useState([]);
   const [error, setError] = useState(null);
   const descriptionId = useId();
   const statusId = useId();

   const handleFilesAccepted = acceptedFiles => {
      setFiles(acceptedFiles);
      setError(null);
      onFilesAccepted?.(acceptedFiles);
   };

   const handleFilesRejected = rejections => {
      setFiles([]);
      setError(formatRejection(rejections, { maxFiles, multiple }));
      onFilesRejected?.(rejections);
   };

   const Icon = isProcessing ? LoaderCircle : error ? FileWarning : files.length > 0 ? File : Upload;
   const visibleFiles = files.map(file => file.name);
   const selectedLabel = visibleFiles.length === 1 ? visibleFiles[0] : `${visibleFiles.length} Dateien ausgewählt`;
   const describedBy = isProcessing ? statusId : description ? descriptionId : undefined;
   const ariaLabel =
      visibleFiles.length > 0
         ? `${visibleFiles.length} Datei${visibleFiles.length === 1 ? "" : "en"} ausgewählt`
         : label;

   return (
      <div className={cn("relative flex min-h-svh flex-col items-center justify-center gap-8 p-6", className)}>
         <ThemeToggleCorner />
         {heading ? <h1 className="sr-only">{heading}</h1> : null}
         <FileDropzone
            accept={accept}
            className="max-w-3xl"
            description={description}
            disabled={disabled}
            error={error}
            isProcessing={isProcessing}
            label={label}
            maxFiles={maxFiles}
            maxSize={maxSize}
            multiple={multiple}
            onFilesAccepted={handleFilesAccepted}
            onFilesRejected={handleFilesRejected}
            processingLabel={processingLabel}
            aria-describedby={describedBy}
            aria-label={ariaLabel}
         >
            <Icon
               className={cn(
                  "size-4.5 text-muted-foreground/90 dark:text-muted-foreground/75",
                  isProcessing && "motion-safe:animate-spin"
               )}
               aria-hidden="true"
            />
            <div className="max-w-full space-y-2">
               {isProcessing ? (
                  <p className="truncate font-medium">{processingLabel}</p>
               ) : visibleFiles.length > 0 ? (
                  <p className="truncate font-medium">{selectedLabel}</p>
               ) : (
                  <p className="font-medium">{label}</p>
               )}
               {description && !isProcessing ? (
                  <p id={descriptionId} className="text-xs text-muted-foreground/90 dark:text-muted-foreground/75">
                     {description}
                  </p>
               ) : null}
               {isProcessing ? (
                  <p
                     id={statusId}
                     role="status"
                     aria-live="polite"
                     className="text-xs text-muted-foreground/90 dark:text-muted-foreground/75"
                  >
                     Bitte kurz warten.
                  </p>
               ) : null}
            </div>
         </FileDropzone>
         {heading ? (
            <p aria-hidden="true" className="text-center text-xl text-muted-foreground/20 select-none xs:text-4xl">
               {heading}
            </p>
         ) : null}
      </div>
   );
}
