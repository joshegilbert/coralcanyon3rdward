"use client";

import { isSameDay, isSameMonth, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import {
  buildMonthGrid,
  fmt,
  isMultiDay,
  packEventsForRow,
  sundayClassification,
  WEEKDAYS,
} from "@/lib/calendar";
import type { EventRow } from "@/lib/types";
import { EventChip } from "@/components/calendar/EventChip";

interface MonthViewProps {
  focus: Date;
  events: EventRow[];
  onSelectEvent: (id: string) => void;
  onSelectDate: (date: Date) => void;
}

export function MonthView({
  focus,
  events,
  onSelectEvent,
  onSelectDate,
}: MonthViewProps) {
  const rows = buildMonthGrid(focus);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-xs font-medium text-muted-foreground">
        {WEEKDAYS.map((w) => (
          <div
            key={w.label}
            className={cn(
              "px-2 py-2 text-center uppercase tracking-wide",
              w.isSunday && "text-amber-700 dark:text-amber-300",
            )}
          >
            {w.label}
          </div>
        ))}
      </div>
      <div className="divide-y divide-border">
        {rows.map((row, rowIdx) => {
          const lanes = packEventsForRow(row, events);
          const maxLane = lanes.reduce((m, l) => Math.max(m, l.lane), -1);
          const laneCount = maxLane + 1;

          return (
            <div key={rowIdx} className="relative grid grid-cols-7">
              {row.map((day, colIdx) => {
                const inMonth = isSameMonth(day, focus);
                const today = isToday(day);
                const sundayKind = sundayClassification(day);
                // Single-day events for this day (rendered below the bars)
                const singleDay = events.filter((e) => {
                  if (isMultiDay(e)) return false;
                  return isSameDay(new Date(e.start_at), day);
                });
                return (
                  <div
                    key={colIdx}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectDate(day)}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter" || ev.key === " ") {
                        ev.preventDefault();
                        onSelectDate(day);
                      }
                    }}
                    className={cn(
                      "group/cell relative flex min-h-32 flex-col gap-0.5 border-r border-border px-1.5 pt-1 pb-1 text-left transition-colors last:border-r-0",
                      !inMonth && "bg-muted/30 text-muted-foreground",
                      sundayKind === "sunday_school" &&
                        inMonth &&
                        "bg-emerald-50/60 dark:bg-emerald-950/20",
                      sundayKind === "quorum_meeting" &&
                        inMonth &&
                        "bg-sky-50/60 dark:bg-sky-950/20",
                      "hover:bg-accent/40 cursor-pointer",
                    )}
                  >
                    <div className="flex items-baseline justify-between gap-1">
                      <span
                        className={cn(
                          "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                          today &&
                            "bg-amber-500 text-white dark:bg-amber-400 dark:text-amber-950",
                        )}
                      >
                        {fmt.dayNum(day)}
                      </span>
                      {sundayKind ? (
                        <span
                          className={cn(
                            "text-[9px] font-medium uppercase tracking-wide",
                            sundayKind === "sunday_school"
                              ? "text-emerald-700 dark:text-emerald-300"
                              : "text-sky-700 dark:text-sky-300",
                          )}
                        >
                          {sundayKind === "sunday_school" ? "SS" : "Quorum"}
                        </span>
                      ) : null}
                    </div>

                    {/* Reserve vertical space for multi-day lane bars */}
                    {laneCount > 0 ? (
                      <div
                        aria-hidden
                        style={{ height: `${laneCount * 18}px` }}
                      />
                    ) : null}

                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      {singleDay.slice(0, Math.max(0, 3 - laneCount)).map((e) => (
                        <EventChip
                          key={e.id}
                          event={e}
                          onSelect={onSelectEvent}
                        />
                      ))}
                      {singleDay.length > Math.max(0, 3 - laneCount) ? (
                        <span className="px-1 text-[10px] text-muted-foreground">
                          +{singleDay.length - Math.max(0, 3 - laneCount)} more
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}

              {/* Absolute-positioned multi-day bars overlaying the row */}
              <div className="pointer-events-none absolute inset-0">
                <div className="grid h-full grid-cols-7">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} />
                  ))}
                </div>
                {lanes
                  .filter((s) => isMultiDay(s.event))
                  .map((seg, i) => {
                    const widthCols = seg.endCol - seg.startCol + 1;
                    const top = 28 + seg.lane * 18;
                    return (
                      <div
                        key={`${seg.event.id}-${i}`}
                        className="pointer-events-auto absolute px-0.5"
                        style={{
                          top,
                          left: `calc(${(seg.startCol / 7) * 100}% + 4px)`,
                          width: `calc(${(widthCols / 7) * 100}% - 8px)`,
                          height: 16,
                        }}
                      >
                        <EventChip
                          event={seg.event}
                          onSelect={onSelectEvent}
                          variant="bar"
                          startCol={seg.startCol}
                          endCol={seg.endCol}
                        />
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
