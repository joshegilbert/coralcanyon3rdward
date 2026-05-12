import Link from "next/link";
import { format, isSameDay } from "date-fns";
import { ChevronRight, MapPin, Tent } from "lucide-react";
import { cn } from "@/lib/utils";
import { eventColors } from "@/lib/calendar";
import type { EventRow } from "@/lib/types";

interface UpNextProps {
  events: EventRow[];
}

function dayPill(d: Date) {
  return (
    <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-muted text-center">
      <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
        {format(d, "MMM")}
      </span>
      <span className="text-base font-bold tabular-nums leading-none">
        {format(d, "d")}
      </span>
    </div>
  );
}

export function UpNext({ events }: UpNextProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <header className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Tent className="h-4 w-4 text-amber-600" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Up next
          </h3>
        </div>
        <Link
          href="/calendar"
          className="text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          View all
        </Link>
      </header>

      {events.length === 0 ? (
        <p className="rounded-lg bg-muted/40 px-3 py-6 text-center text-sm text-muted-foreground">
          Nothing on the schedule.
        </p>
      ) : (
        <ul className="-mx-1 divide-y divide-border">
          {events.map((e) => {
            const start = new Date(e.start_at);
            const end = new Date(e.end_at);
            const colors = eventColors(e.type);
            return (
              <li key={e.id}>
                <Link
                  href={`/calendar?date=${format(start, "yyyy-MM-dd")}`}
                  className="flex items-center gap-3 rounded-lg px-1 py-3 transition-colors active:bg-muted/60"
                >
                  {dayPill(start)}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{e.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {isSameDay(start, end)
                        ? format(start, "EEE · h:mm a")
                        : `${format(start, "MMM d")} – ${format(end, "MMM d")}`}
                    </p>
                    {e.location ? (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{e.location}</span>
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                        colors.pill,
                      )}
                    >
                      {colors.label}
                    </span>
                    {e.rsvp_required ? (
                      <span className="text-[10px] font-medium uppercase tracking-wider text-rose-600 dark:text-rose-400">
                        RSVP
                      </span>
                    ) : null}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
