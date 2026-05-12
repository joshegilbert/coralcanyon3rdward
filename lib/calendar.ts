import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { EventRow, EventType } from "@/lib/types";
import { classifySunday, isSunday } from "@/lib/sunday";

export type CalendarView = "month" | "week" | "year";

export function parseView(value: string | undefined | null): CalendarView {
  if (value === "week" || value === "year") return value;
  return "month";
}

/** Parse a ?date=YYYY-MM-DD param (or fall back to today). Always returns local midnight. */
export function parseDateParam(value: string | undefined | null): Date {
  if (!value) return new Date();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return new Date();
  const [, y, mm, d] = m;
  return new Date(Number(y), Number(mm) - 1, Number(d));
}

export function formatDateParam(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Return the inclusive [start, end] range a given view covers, with overlap for spillover weeks. */
export function getRangeForView(date: Date, view: CalendarView): {
  start: Date;
  end: Date;
} {
  if (view === "week") {
    return { start: startOfWeek(date), end: endOfWeek(date) };
  }
  if (view === "year") {
    return {
      start: startOfMonth(new Date(date.getFullYear(), 0, 1)),
      end: endOfMonth(new Date(date.getFullYear(), 11, 31)),
    };
  }
  const firstOfMonth = startOfMonth(date);
  const lastOfMonth = endOfMonth(date);
  return {
    start: startOfWeek(firstOfMonth),
    end: endOfWeek(lastOfMonth),
  };
}

/** Step the focus date forward/back by view-appropriate amount. */
export function stepDate(date: Date, view: CalendarView, dir: 1 | -1): Date {
  if (view === "week") return addDays(date, 7 * dir);
  if (view === "year") return new Date(date.getFullYear() + dir, date.getMonth(), 1);
  return addMonths(date, dir);
}

/** Coerce an event row's start/end into Date instances. */
export function eventInterval(e: EventRow): { start: Date; end: Date } {
  const start = parseISO(e.start_at);
  const end = parseISO(e.end_at);
  // Defensive: an "end before start" row should still render on the start day.
  return { start, end: isBefore(end, start) ? start : end };
}

export function eventSpansDay(e: EventRow, day: Date): boolean {
  const { start, end } = eventInterval(e);
  return isWithinInterval(day, { start: startOfDayLocal(start), end: endOfDayLocal(end) });
}

function startOfDayLocal(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}
function endOfDayLocal(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

export function isMultiDay(e: EventRow): boolean {
  const { start, end } = eventInterval(e);
  return !isSameDay(start, end);
}

/** Build the 6-row x 7-col grid for a month view, starting from Sunday. */
export function buildMonthGrid(focus: Date): Date[][] {
  const start = startOfWeek(startOfMonth(focus));
  const rows: Date[][] = [];
  let cursor = start;
  for (let r = 0; r < 6; r++) {
    const row: Date[] = [];
    for (let c = 0; c < 7; c++) {
      row.push(cursor);
      cursor = addDays(cursor, 1);
    }
    rows.push(row);
  }
  return rows;
}

/**
 * Each "lane" in a week row holds one or more events horizontally.
 * We pack multi-day events into the smallest set of lanes such that
 * none overlap (classic interval-graph greedy coloring).
 */
export interface LaneSegment {
  event: EventRow;
  startCol: number; // 0..6 within the row
  endCol: number; // inclusive 0..6
  lane: number;
}

export function packEventsForRow(
  row: Date[],
  events: EventRow[],
): LaneSegment[] {
  const rowStart = startOfDayLocal(row[0]);
  const rowEnd = endOfDayLocal(row[row.length - 1]);

  // Only consider events overlapping this row
  const candidates = events
    .filter((e) => {
      const { start, end } = eventInterval(e);
      return !isAfter(start, rowEnd) && !isBefore(end, rowStart);
    })
    .map((e) => {
      const { start, end } = eventInterval(e);
      const startCol = Math.max(
        0,
        differenceInCalendarDays(startOfDayLocal(start), rowStart),
      );
      const endCol = Math.min(
        6,
        differenceInCalendarDays(startOfDayLocal(end), rowStart),
      );
      return { event: e, startCol, endCol };
    })
    .sort((a, b) => {
      if (a.startCol !== b.startCol) return a.startCol - b.startCol;
      // Longer events first so they get earlier lanes
      return b.endCol - b.startCol - (a.endCol - a.startCol);
    });

  const laneEnds: number[] = []; // last occupied col per lane
  const segments: LaneSegment[] = [];

  for (const c of candidates) {
    let lane = laneEnds.findIndex((end) => end < c.startCol);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(c.endCol);
    } else {
      laneEnds[lane] = c.endCol;
    }
    segments.push({ event: c.event, startCol: c.startCol, endCol: c.endCol, lane });
  }

  return segments;
}

const EVENT_TYPE_COLORS: Record<
  EventType,
  { bar: string; pill: string; ring: string; label: string }
> = {
  sunday_school: {
    bar: "bg-emerald-200 text-emerald-950 hover:bg-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-100",
    pill: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
    ring: "ring-emerald-400/60",
    label: "Sunday School",
  },
  quorum_meeting: {
    bar: "bg-sky-200 text-sky-950 hover:bg-sky-300 dark:bg-sky-900/60 dark:text-sky-100",
    pill: "bg-sky-100 text-sky-900 dark:bg-sky-950/40 dark:text-sky-200",
    ring: "ring-sky-400/60",
    label: "Quorum Meeting",
  },
  activity: {
    bar: "bg-amber-200 text-amber-950 hover:bg-amber-300 dark:bg-amber-900/60 dark:text-amber-100",
    pill: "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
    ring: "ring-amber-400/60",
    label: "Activity",
  },
  camp: {
    bar: "bg-orange-300 text-orange-950 hover:bg-orange-400 dark:bg-orange-900/60 dark:text-orange-100",
    pill: "bg-orange-100 text-orange-900 dark:bg-orange-950/40 dark:text-orange-200",
    ring: "ring-orange-500/60",
    label: "Camp / Trip",
  },
  service: {
    bar: "bg-violet-200 text-violet-950 hover:bg-violet-300 dark:bg-violet-900/60 dark:text-violet-100",
    pill: "bg-violet-100 text-violet-900 dark:bg-violet-950/40 dark:text-violet-200",
    ring: "ring-violet-400/60",
    label: "Service",
  },
  other: {
    bar: "bg-slate-200 text-slate-950 hover:bg-slate-300 dark:bg-slate-800/60 dark:text-slate-100",
    pill: "bg-slate-100 text-slate-900 dark:bg-slate-800/40 dark:text-slate-200",
    ring: "ring-slate-400/60",
    label: "Other",
  },
};

export function eventColors(type: EventType) {
  return EVENT_TYPE_COLORS[type];
}

export const ALL_EVENT_TYPES: EventType[] = [
  "sunday_school",
  "quorum_meeting",
  "activity",
  "camp",
  "service",
  "other",
];

/**
 * Identify the kind of Sunday a given day represents in the calendar:
 *  - not a sunday -> null
 *  - "sunday_school" or "quorum_meeting"
 */
export function sundayClassification(
  day: Date,
): "sunday_school" | "quorum_meeting" | null {
  if (!isSunday(day)) return null;
  return classifySunday(day);
}

/** Format short helpers used by the calendar UI */
export const fmt = {
  weekdayShort: (d: Date) => format(d, "EEE"),
  monthLong: (d: Date) => format(d, "MMMM yyyy"),
  monthShort: (d: Date) => format(d, "MMM"),
  dayNum: (d: Date) => format(d, "d"),
  dayRange: (start: Date, end: Date) =>
    isSameDay(start, end)
      ? format(start, "EEE MMM d, yyyy")
      : isSameMonth(start, end)
        ? `${format(start, "MMM d")} – ${format(end, "d, yyyy")}`
        : `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`,
  timeRange: (start: Date, end: Date) => {
    if (isSameDay(start, end)) {
      return `${format(start, "h:mm a")} – ${format(end, "h:mm a")}`;
    }
    return `${format(start, "EEE MMM d, h:mm a")} – ${format(end, "EEE MMM d, h:mm a")}`;
  },
};

/** Day-of-week labels (Sun..Sat) for header rows. */
export const WEEKDAYS = Array.from({ length: 7 }, (_, i) => {
  const d = addDays(startOfWeek(new Date()), i);
  return { label: format(d, "EEE"), isSunday: getDay(d) === 0 };
});
