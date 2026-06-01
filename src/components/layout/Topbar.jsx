import ThemeToggle from "@/components/theme/ThemeToggle";

export default function Topbar() {
   return (
      <header className="mx-auto mb-4 flex w-full max-w-440 shrink-0 items-center justify-between gap-3 max-xs:flex-col max-xs:justify-center">
         <div className="min-w-0 max-xs:order-2 max-xs:text-center">
            <p className="m-0 text-[0.72rem] font-medium tracking-normal text-label-accent">
               Technische Projekte, Netzelemente und IBN-Termine
            </p>
            <h1 className="m-0 text-base leading-tight font-medium text-card-foreground 3xs:text-lg xs:text-2xl">
               Technische Projekte Dashboard
            </h1>
         </div>
         <div className="max-xs:order-1 max-xs:self-center">
            <ThemeToggle />
         </div>
      </header>
   );
}
