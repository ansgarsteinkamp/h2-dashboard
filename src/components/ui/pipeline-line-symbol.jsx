import { getLineTypeSymbolBackground } from "@/components/theme/pipelineTheme";

export function PipelineLineSymbol({ className = "h-0.75 w-6", color, lineType, opacity }) {
   return (
      <span
         aria-hidden="true"
         className={className}
         style={{ background: getLineTypeSymbolBackground(lineType, color), opacity }}
      />
   );
}

export function PipelineLineSymbolStack({
   className = "grid w-5 shrink-0 gap-0.75",
   colors,
   lineType,
   segmentClassName = "h-0.75 rounded-full"
}) {
   return (
      <span aria-hidden="true" className={className}>
         {colors.map(color => (
            <PipelineLineSymbol className={segmentClassName} color={color} key={color} lineType={lineType} />
         ))}
      </span>
   );
}
