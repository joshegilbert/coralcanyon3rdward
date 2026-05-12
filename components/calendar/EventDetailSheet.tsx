"use client";

import Link from "next/link";
import { Clock, MapPin, NotebookText, Pencil, ShieldCheck } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { eventColors, eventInterval, fmt, isMultiDay } from "@/lib/calendar";
import type { EventRow, Role } from "@/lib/types";

interface EventDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: EventRow | null;
  role?: Role;
}

export function EventDetailSheet({
  open,
  onOpenChange,
  event,
  role,
}: EventDetailSheetProps) {
  if (!event) return null;
  const colors = eventColors(event.type);
  const { start, end } = eventInterval(event);
  const canEdit = role === "adult_leader";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("text-[10px]", colors.pill)}>
              {colors.label}
            </Badge>
            {isMultiDay(event) ? (
              <Badge variant="secondary" className="text-[10px]">
                Multi-day
              </Badge>
            ) : null}
          </div>
          <SheetTitle className="text-xl leading-tight">
            {event.title}
          </SheetTitle>
          <SheetDescription>
            {isMultiDay(event)
              ? fmt.dayRange(start, end)
              : fmt.dayRange(start, end)}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-muted-foreground">
              <Clock className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{fmt.timeRange(start, end)}</span>
            </div>
            {event.location ? (
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{event.location}</span>
              </div>
            ) : null}
            {event.description ? (
              <div className="flex items-start gap-2 text-muted-foreground">
                <NotebookText className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="whitespace-pre-wrap text-foreground">
                  {event.description}
                </p>
              </div>
            ) : null}
            <div className="flex items-start gap-2 text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {event.rsvp_required
                  ? "Two-deep leader coverage required"
                  : "No leader RSVP required"}
              </span>
            </div>
          </div>

          {canEdit ? (
            <div className="border-t border-border pt-4">
              <Link
                href={`/calendar/${event.id}/edit`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "gap-1.5 cursor-pointer",
                )}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit event
              </Link>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
