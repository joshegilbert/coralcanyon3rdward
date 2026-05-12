"use client";

import { format, isSameDay } from "date-fns";
import { CalendarPlus, MapPin } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  eventColors,
  eventInterval,
  fmt,
  isMultiDay,
  sundayClassification,
} from "@/lib/calendar";
import type { EventRow } from "@/lib/types";

interface DayEventsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  events: EventRow[];
  onSelectEvent: (id: string) => void;
}

export function DayEventsSheet({
  open,
  onOpenChange,
  date,
  events,
  onSelectEvent,
}: DayEventsSheetProps) {
  if (!date) return null;
  const sundayKind = sundayClassification(date);
  const dayEvents = events
    .filter((e) => {
      const { start, end } = eventInterval(e);
      const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const en = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      return d >= s && d <= en;
    })
    .sort(
      (a, b) =>
        new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
    );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-lg">
            {format(date, "EEEE, MMMM d")}
          </SheetTitle>
          <SheetDescription>
            {sundayKind === "sunday_school"
              ? "Sunday School (1st/3rd Sunday – no quorum meeting)"
              : sundayKind === "quorum_meeting"
                ? "Quorum Meeting (2nd/4th Sunday)"
                : `${format(date, "yyyy")} · ${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}`}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-2 overflow-y-auto px-4 pb-4">
          {dayEvents.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              <CalendarPlus className="mx-auto mb-2 h-5 w-5 opacity-60" />
              Nothing scheduled on this day.
            </div>
          ) : (
            dayEvents.map((e) => {
              const colors = eventColors(e.type);
              const { start, end } = eventInterval(e);
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => onSelectEvent(e.id)}
                  className={cn(
                    "block w-full rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-accent cursor-pointer",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold">{e.title}</span>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px]", colors.pill)}
                    >
                      {colors.label}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {isMultiDay(e)
                      ? fmt.dayRange(start, end)
                      : isSameDay(start, end)
                        ? fmt.timeRange(start, end)
                        : fmt.timeRange(start, end)}
                  </p>
                  {e.location ? (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {e.location}
                    </p>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
