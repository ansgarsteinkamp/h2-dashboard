import { ErrorBoundary } from "react-error-boundary";

import { Button } from "@/components/ui/button";

function ErrorFallback() {
   return (
      <main className="min-h-screen bg-background text-foreground">
         <div
            className="flex min-h-screen flex-col items-start justify-center gap-4 p-6"
            role="alert"
            aria-live="assertive"
         >
            <h1 className="text-sm font-normal text-muted-foreground">Etwas ist schiefgelaufen.</h1>
            <Button type="button" onClick={() => window.location.reload()}>
               Neu laden
            </Button>
         </div>
      </main>
   );
}

export default function AppErrorBoundary({ children }) {
   return (
      <ErrorBoundary FallbackComponent={ErrorFallback} onError={error => console.error(error)}>
         {children}
      </ErrorBoundary>
   );
}
