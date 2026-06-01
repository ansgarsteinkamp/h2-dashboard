import { useId } from "react";
import { FileWarning, LoaderCircle, Upload } from "lucide-react";
import { useDropzone } from "react-dropzone";

import { cn } from "@/lib/utils";

export default function FileDropzone({
   accept,
   children,
   className,
   description,
   disabled = false,
   error,
   isProcessing = false,
   label = "Datei hier ablegen oder auswählen",
   maxFiles,
   maxSize,
   multiple = Boolean(maxFiles && maxFiles > 1),
   onFilesAccepted,
   onFilesRejected,
   processingLabel = "Datei wird verarbeitet...",
   ...props
}) {
   const { "aria-describedby": ariaDescribedBy, "aria-label": ariaLabel, ...rootProps } = props;
   const descriptionId = useId();
   const errorId = useId();
   const statusId = useId();
   const isDisabled = disabled || isProcessing;
   const hasCustomContent = Boolean(children);

   const { getRootProps, getInputProps, isDragActive, isDragReject, isFocused } = useDropzone({
      accept,
      disabled: isDisabled,
      maxFiles,
      maxSize,
      multiple,
      onDropAccepted: files => onFilesAccepted?.(files),
      onDropRejected: rejections => onFilesRejected?.(rejections)
   });

   const describedBy =
      [
         ariaDescribedBy,
         description && !hasCustomContent ? descriptionId : null,
         error ? errorId : null,
         isProcessing && !hasCustomContent ? statusId : null
      ]
         .filter(Boolean)
         .join(" ") || undefined;

   const Icon = isProcessing ? LoaderCircle : error ? FileWarning : Upload;

   return (
      <div className={cn("w-full space-y-2", className)}>
         <div
            {...getRootProps({
               ...rootProps,
               role: "button",
               "aria-busy": isProcessing || undefined,
               "aria-describedby": describedBy,
               "aria-disabled": isDisabled || undefined,
               "aria-invalid": error ? true : undefined,
               "aria-label": ariaLabel || (typeof label === "string" ? label : "Datei auswählen")
            })}
            className={cn(
               "flex min-h-36 w-full flex-col items-center justify-center gap-4 rounded-md border bg-field px-6 py-6 text-center shadow-xs outline-none transition-[background-color,border-color,box-shadow,color,opacity]",
               "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/65 dark:focus-visible:ring-ring/50",
               isFocused && "border-ring ring-3 ring-ring/65 dark:ring-ring/50",
               isDragActive && "border-primary ring-2 ring-primary/70",
               (isDragReject || error) && "border-destructive ring-2 ring-destructive/20",
               !isDragActive && !isDragReject && !error && "border-input",
               isDisabled && "cursor-not-allowed opacity-50",
               !isDisabled && "cursor-pointer"
            )}
         >
            <input {...getInputProps()} />
            {hasCustomContent ? (
               children
            ) : (
               <>
                  <Icon
                     className={cn(
                        "size-4.5 text-muted-foreground/90 dark:text-muted-foreground/75",
                        isProcessing && "motion-safe:animate-spin"
                     )}
                     aria-hidden="true"
                  />
                  <div className="max-w-full space-y-2">
                     <p className="truncate font-medium">{isProcessing ? processingLabel : label}</p>
                     {description && !isProcessing ? (
                        <p
                           id={descriptionId}
                           className="text-xs text-muted-foreground/90 dark:text-muted-foreground/75"
                        >
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
               </>
            )}
         </div>
         {error ? (
            <p id={errorId} role="alert" className="text-xs text-destructive">
               {error}
            </p>
         ) : null}
      </div>
   );
}
