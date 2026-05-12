"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2, Plus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  type CalendarView,
  formatDateParam,
  fmt,
  stepDate,
} from "@/lib/calendar";
import type { EventRow, Role } from "@/lib/types";
import { MonthView } from "./MonthView";
import { WeekView } from "./WeekView";
import { YearView } from "./YearView";
import { DayEventsSheet } from "./DayEventsSheet";
import { EventDetailSheet } from "./EventDetailSheet";
import { CalendarLegend } from "./CalendarLegend";

interface CalendarShellProps {
  focus: Date;
  view: CalendarView;
  events: EventRow[];
  role: Role;
}

export function CalendarShell({
  focus,
  view,
  events,
  role,
}: CalendarShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const eventsById = useMemo(() => {
    const m = new Map<string, EventRow>();
    for (const e of events) m.set(e.id, e);
    return m;
  }, [events]);

  const updateParams = useCallback(
    (next: { date?: Date; view?: CalendarView }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.date) params.set("date", formatDateParam(next.date));
      if (next.view) params.set("view", next.view);
      startTransition(() => {
        router.replace(`/calendar?${params.toString()}`, { scroll: false });
      });
    },
    [router, searchParams],
  );

  const handlePrev = () => updateParams({ date: stepDate(focus, view, -1) });
  const handleNext = () => updateParams({ date: stepDate(focus, view, 1) });
  const handleToday = () => updateParams({ date: new Date() });
  const handleViewChange = (v: string) =>
    updateParams({ view: v as CalendarView });

  const handleSelectMonth = (m: Date) =>
    updateParams({ date: m, view: "month" });

  const title =
    view === "year"
      ? String(focus.getFullYear())
      : view === "week"
        ? `Week of ${format(focus, "MMM d, yyyy")}`
        : fmt.monthLong(focus);

  const selectedEvent = selectedEventId
    ? eventsById.get(selectedEventId) ?? null
    : null;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex items-center rounded-lg border border-border bg-card">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handlePrev}
              className="h-9 w-9 rounded-r-none md:h-8 md:w-8"
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <button
              type="button"
              onClick={handleToday}
              className="border-x border-border px-3 py-1.5 text-xs font-medium hover:bg-accent cursor-pointer md:py-1"
            >
              Today
            </button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleNext}
              className="h-9 w-9 rounded-l-none md:h-8 md:w-8"
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="truncate text-base font-semibold tracking-tight sm:text-xl">
            {title}
          </h2>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={handleViewChange}>
            <TabsList>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="year" className="hidden md:inline-flex">
                Year
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {role === "adult_leader" ? (
            <Link
              href={`/calendar/new?date=${formatDateParam(focus)}`}
              className={cn(
                buttonVariants({ size: "sm" }),
                "gap-1.5 cursor-pointer",
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New event</span>
              <span className="sm:hidden">New</span>
            </Link>
          ) : null}
        </div>
      </header>

      <CalendarLegend />

      <div className={cn(isPending && "opacity-60 transition-opacity")}>
        {view === "month" ? (
          <MonthView
            focus={focus}
            events={events}
            onSelectEvent={setSelectedEventId}
            onSelectDate={setSelectedDate}
          />
        ) : view === "week" ? (
          <WeekView
            focus={focus}
            events={events}
            onSelectEvent={setSelectedEventId}
          />
        ) : (
          <YearView
            focus={focus}
            events={events}
            onSelectMonth={handleSelectMonth}
            onSelectDate={(d) => {
              setSelectedDate(d);
            }}
          />
        )}
      </div>

      <DayEventsSheet
        open={!!selectedDate}
        onOpenChange={(open) => !open && setSelectedDate(null)}
        date={selectedDate}
        events={events}
        onSelectEvent={(id) => {
          setSelectedDate(null);
          setSelectedEventId(id);
        }}
      />

      <EventDetailSheet
        open={!!selectedEventId}
        onOpenChange={(open) => !open && setSelectedEventId(null)}
        event={selectedEvent}
        role={role}
      />
    </div>
  );
}
