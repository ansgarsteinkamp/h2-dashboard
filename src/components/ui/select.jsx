"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

function Select({ ...props }) {
   return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectTrigger({ className, children, ...props }) {
   return (
      <SelectPrimitive.Trigger
         className={cn(
            "flex min-h-10 w-full min-w-0 items-center justify-between gap-2.5 rounded-md border border-border bg-field px-3 text-left text-[0.72rem] text-popover-foreground outline-none transition-colors hover:border-primary/70 hover:bg-primary/10 focus:border-ring focus:ring-2 focus:ring-ring/65 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:border-primary dark:focus:ring-primary/25",
            className
         )}
         data-slot="select-trigger"
         {...props}
      >
         {children}
         <SelectPrimitive.Icon asChild>
            <ChevronDown aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
         </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
   );
}

function SelectValue({ className, ...props }) {
   return <SelectPrimitive.Value className={cn("min-w-0 truncate", className)} data-slot="select-value" {...props} />;
}

function SelectContent({ className, children, ...props }) {
   return (
      <SelectPrimitive.Portal>
         <SelectPrimitive.Content
            className={cn(
               "z-1300 max-h-72 w-(--radix-select-trigger-width) overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-lg",
               className
            )}
            data-slot="select-content"
            position="popper"
            sideOffset={5}
            {...props}
         >
            <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
         </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
   );
}

function SelectItem({ className, children, ...props }) {
   return (
      <SelectPrimitive.Item
         className={cn(
            "relative flex min-h-9 cursor-pointer select-none items-center rounded-sm py-2 pr-2.5 pl-8 text-[0.72rem] outline-none transition-colors data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-primary/20 data-highlighted:text-secondary",
            className
         )}
         data-slot="select-item"
         {...props}
      >
         <span className="absolute left-2 grid size-3.5 place-items-center">
            <SelectPrimitive.ItemIndicator>
               <Check aria-hidden="true" className="size-3" />
            </SelectPrimitive.ItemIndicator>
         </span>
         <SelectPrimitive.ItemText>
            <span className="block max-w-[calc(var(--radix-select-trigger-width)-3rem)] truncate">{children}</span>
         </SelectPrimitive.ItemText>
      </SelectPrimitive.Item>
   );
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
