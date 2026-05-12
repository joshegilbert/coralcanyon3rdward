"use client";

import { addDays, isSameDay, isToday, startOfWeek } from "date-fns";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  eventColors,
  eventInterval,
  fmt,
  isMultiDay,
  sundayClassification,
  WEEKDAYS,
} from "@/lib/calendar";
import type { EventRow } from "@/lib/types";

interface WeekViewProps {
  focus: Date;
  events: EventRow[];
  onSelectEvent: (id: string) => void;
}

export function WeekView({ focus, events, onSelectEvent }: WeekViewProps) {
  const start = startOfWeek(focus);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid grid-cols-7 border-b border-border bg-muted/40">
        {days.map((d, i) => {
          const sundayKind = sundayClassification(d);
          const today = isToday(d);
          return (
            <div
              key={i}
              className={cn(
                "border-r border-border px-3 py-2 last:border-r-0",
                sundayKind === "sunday_school" &&
                  "bg-emerald-50 dark:bg-emerald-950/20",
                sundayKind === "quorum_meeting" &&
                  "bg-sky-50 dark:bg-sky-950/20",
              )}
            >
              <div
                className={cn(
                  "text-xs font-medium uppercase tracking-wide",
                  WEEKDAYS[i].isSunday
                    ? "text-amber-700 dark:text-amber-300"
                    : "text-muted-foreground",
                )}
              >
                {fmt.weekdayShort(d)}
              </div>
              <div className="mt-0.5 flex items-baseline gap-2">
                <span
                  className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
                    today &&
                      "bg-amber-500 text-white dark:bg-amber-400 dark:text-amber-950",
                  )}
                >
                  {fmt.dayNum(d)}
                </span>
                {sundayKind ? (
                  <span
                    className={cn(
                      "text-[10px] font-semibold uppercase tracking-wide",
                      sundayKind === "sunday_school"
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-sky-700 dark:text-sky-300",
                    )}
                  >
                    {sundayKind === "sunday_school"
                      ? "Sunday School"
                      : "Quorum Meeting"}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-7 divide-x divide-border">
        {days.map((d, i) => {
          const dayEvents = events
            .filter((e) => {
              const { start: s, end } = eventInterval(e);
              if (isMultiDay(e)) {
                return d >= toMidnight(s) && d <= toMidnight(end);
              }
              return isSameDay(s, d);
            })
            .sort(
              (a, b) =>
                new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
            );

          return (
            <div key={i} className="min-h-72 space-y-2 p-2">
              {dayEvents.length === 0 ? (
                <p className="px-1 pt-1 text-[11px] italic text-muted-foreground/70">
                  Nothing scheduled
                </p>
              ) : (
                dayEvents.map((e) => {
                  const colors = eventColors(e.type);
                  const { start: s, end } = eventInterval(e);
                  const isFirstDay = isSameDay(s, d);
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => onSelectEvent(e.id)}
                      className={cn(
                        "block w-full rounded-md px-2 py-1.5 text-left transition-colors cursor-pointer",
                        colors.pill,
                        "hover:brightness-105",
                      )}
                    >
                      <div className="line-clamp-2 text-xs font-semibold leading-snug">
                        {e.title}
                      </div>
                      <div className="mt-0.5 text-[10px] opacity-80">
                        {isMultiDay(e)
                          ? isFirstDay
                            ? `Starts ${fmt.dayRange(s, end).split(" – ")[0]}`
                            : isSameDay(end, d)
                              ? "Last day"
                              : "All day"
                          : fmt.timeRange(s, end)}
                      </div>
                      {e.location ? (
                        <div className="mt-0.5 flex items-center gap-1 text-[10px] opacity-80">
                          <MapPin className="h-2.5 w-2.5" />
                          <span className="truncate">{e.location}</span>
                        </div>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function toMidnight(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
