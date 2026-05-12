"use client";

import {
  addDays,
  endOfMonth,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { cn } from "@/lib/utils";
import { eventInterval, eventColors, sundayClassification } from "@/lib/calendar";
import type { EventRow } from "@/lib/types";

interface YearViewProps {
  focus: Date;
  events: EventRow[];
  onSelectMonth: (month: Date) => void;
  onSelectDate: (date: Date) => void;
}

export function YearView({
  focus,
  events,
  onSelectMonth,
  onSelectDate,
}: YearViewProps) {
  const year = focus.getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));

  // Map "yyyy-MM-dd" -> events for fast lookup
  const eventsByDay = new Map<string, EventRow[]>();
  for (const e of events) {
    const { start, end } = eventInterval(e);
    let cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    while (cursor <= last) {
      const key = format(cursor, "yyyy-MM-dd");
      const arr = eventsByDay.get(key) ?? [];
      arr.push(e);
      eventsByDay.set(key, arr);
      cursor = addDays(cursor, 1);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {months.map((m) => (
        <MiniMonth
          key={m.toISOString()}
          month={m}
          eventsByDay={eventsByDay}
          onSelectMonth={onSelectMonth}
          onSelectDate={onSelectDate}
        />
      ))}
    </div>
  );
}

function MiniMonth({
  month,
  eventsByDay,
  onSelectMonth,
  onSelectDate,
}: {
  month: Date;
  eventsByDay: Map<string, EventRow[]>;
  onSelectMonth: (month: Date) => void;
  onSelectDate: (date: Date) => void;
}) {
  const first = startOfWeek(startOfMonth(month));
  const last = endOfMonth(month);
  const days: Date[] = [];
  let cursor = first;
  while (cursor <= last || days.length % 7 !== 0) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
    if (days.length > 42) break;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <button
        type="button"
        onClick={() => onSelectMonth(month)}
        className="mb-2 w-full text-left text-sm font-semibold hover:text-amber-700 dark:hover:text-amber-300 cursor-pointer"
      >
        {format(month, "MMMM")}
      </button>
      <div className="grid grid-cols-7 gap-y-0.5 text-[10px]">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div
            key={i}
            className={cn(
              "text-center font-medium uppercase tracking-wide text-muted-foreground",
              (i === 0 || i === 6) && "text-amber-700/80 dark:text-amber-300/80",
            )}
          >
            {d}
          </div>
        ))}
        {days.map((d, i) => {
          const inMonth = isSameMonth(d, month);
          const key = format(d, "yyyy-MM-dd");
          const dayEvents = eventsByDay.get(key) ?? [];
          const sundayKind = sundayClassification(d);
          const today = isToday(d);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectDate(d)}
              disabled={!inMonth}
              className={cn(
                "relative flex h-7 items-center justify-center rounded text-[11px] tabular-nums transition-colors cursor-pointer",
                !inMonth && "text-muted-foreground/30 cursor-default",
                inMonth && "hover:bg-accent",
                today &&
                  "bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-amber-950",
                sundayKind === "sunday_school" &&
                  inMonth &&
                  !today &&
                  "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
                sundayKind === "quorum_meeting" &&
                  inMonth &&
                  !today &&
                  "bg-sky-100 text-sky-900 dark:bg-sky-950/40 dark:text-sky-200",
              )}
            >
              <span>{format(d, "d")}</span>
              {dayEvents.length > 0 && inMonth ? (
                <span className="absolute bottom-0.5 flex gap-px">
                  {dayEvents.slice(0, 3).map((e, idx) => {
                    const c = eventColors(e.type);
                    return (
                      <span
                        key={idx}
                        className={cn(
                          "h-1 w-1 rounded-full",
                          c.bar.split(" ")[0],
                        )}
                        aria-hidden
                      />
                    );
                  })}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
