import { ALL_EVENT_TYPES, eventColors } from "@/lib/calendar";
import { cn } from "@/lib/utils";

export function CalendarLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {ALL_EVENT_TYPES.map((t) => {
        const c = eventColors(t);
        return (
          <span key={t} className="inline-flex items-center gap-1.5">
            <span
              className={cn("h-2.5 w-2.5 rounded-sm", c.bar.split(" ")[0])}
              aria-hidden
            />
            {c.label}
          </span>
        );
      })}
    </div>
  );
}
