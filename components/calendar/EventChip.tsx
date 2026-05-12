"use client";

import * as React from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { eventColors, eventInterval, isMultiDay } from "@/lib/calendar";
import type { EventRow } from "@/lib/types";

interface EventChipProps {
  event: EventRow;
  onSelect: (eventId: string) => void;
  variant?: "pill" | "bar";
  /** For multi-day bars: which segment of the event this represents. */
  startCol?: number;
  endCol?: number;
  /** When true, hide the title and show a continuation chevron. */
  isContinuation?: boolean;
}

// Renders the chip as a div+role=button rather than a real <button> because
// these chips frequently nest inside a day cell that's also clickable, and
// HTML disallows button-in-button. The outer click handlers stop propagation
// so the day cell doesn't also fire.
export function EventChip({
  event,
  onSelect,
  variant = "pill",
  isContinuation = false,
}: EventChipProps) {
  const colors = eventColors(event.type);
  const { start } = eventInterval(event);
  const multi = isMultiDay(event);

  const handleClick = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    onSelect(event.id);
  };
  const handleKeyDown = (ev: React.KeyboardEvent) => {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      ev.stopPropagation();
      onSelect(event.id);
    }
  };

  if (variant === "bar") {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "block w-full truncate rounded-sm px-1.5 py-0.5 text-left text-[11px] font-medium leading-tight transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-500",
          colors.bar,
        )}
        title={event.title}
      >
        {isContinuation ? (
          <span className="opacity-70">↩ {event.title}</span>
        ) : (
          event.title
        )}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex w-full items-center gap-1 truncate rounded-sm px-1.5 py-0.5 text-left text-[11px] font-medium leading-tight transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-500",
        colors.pill,
        "hover:brightness-105",
      )}
      title={event.title}
    >
      {!multi ? (
        <span className="shrink-0 tabular-nums opacity-70">
          {format(start, "h:mma").replace(":00", "").toLowerCase()}
        </span>
      ) : null}
      <span className="truncate">{event.title}</span>
    </div>
  );
}
