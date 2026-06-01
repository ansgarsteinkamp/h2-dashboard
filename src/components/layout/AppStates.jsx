import { useEffect, useRef } from "react";

import ThemeToggleCorner from "@/components/theme/ThemeToggleCorner";

export function LoadingState({ label = "Daten werden geladen" }) {
   return (
      <main className="grid min-h-svh place-items-center bg-background p-4 text-center text-card-foreground">
         <div role="status" aria-label={label}>
            <div className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
            <span className="sr-only">{label}</span>
         </div>
      </main>
   );
}

export function ErrorState({ error, onReset, resetLabel = "Neue Dateien wählen" }) {
   const errorRef = useRef(null);

   useEffect(() => {
      errorRef.current?.focus();
   }, []);

   return (
      <main className="relative grid min-h-svh place-items-center bg-background p-4 text-center text-card-foreground">
         <ThemeToggleCorner />
         <div
            aria-live="assertive"
            className="max-w-lg whitespace-pre-line focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            ref={errorRef}
            role="alert"
            tabIndex={-1}
         >
            <h1 className="mb-2 text-xl font-medium">Datenfehler</h1>
            <p className="m-0 text-sm text-muted-foreground">{error.message}</p>
            <button
               className="mt-4 inline-flex min-h-9 items-center justify-center rounded-md border border-border bg-transparent px-3 text-sm text-foreground transition-colors hover:border-primary/70 hover:bg-primary/15 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
               onClick={onReset}
               type="button"
            >
               {resetLabel}
            </button>
         </div>
      </main>
   );
}
