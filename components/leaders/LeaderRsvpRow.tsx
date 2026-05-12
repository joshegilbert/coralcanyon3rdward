"use client";

import { format } from "date-fns";
import {
  AlertTriangle,
  Check,
  Clock,
  HelpCircle,
  MapPin,
  Minus,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { eventColors, fmt, isMultiDay } from "@/lib/calendar";
import { setLeaderRsvp } from "@/app/actions/leader-rsvp";
import type { LeaderRsvpBoardEvent } from "@/lib/queries/leader-rsvp";
import type { Profile } from "@/lib/types";

interface LeaderRsvpRowProps {
  entry: LeaderRsvpBoardEvent;
  allLeaders: Pick<Profile, "id" | "first_name" | "last_name">[];
  totalLeaders: number;
}

function StatusButton({
  eventId,
  current,
  status,
  className,
  children,
}: {
  eventId: string;
  current: "attending" | "unavailable" | "undecided";
  status: "attending" | "unavailable" | "undecided";
  className?: string;
  children: React.ReactNode;
}) {
  const active = current === status;
  return (
    <form action={setLeaderRsvp}>
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className={cn(
          "inline-flex h-7 items-center gap-1 rounded-md border px-2 text-xs font-medium transition-colors cursor-pointer",
          active
            ? className
            : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        {children}
      </button>
    </form>
  );
}

function leaderInitials(p: Pick<Profile, "first_name" | "last_name">) {
  const f = p.first_name?.[0] ?? "";
  const l = p.last_name?.[0] ?? "";
  return (f + l).toUpperCase() || "?";
}

export function LeaderRsvpRow({ entry, allLeaders, totalLeaders }: LeaderRsvpRowProps) {
  const { event, attendingCount, myStatus, rsvps } = entry;
  const colors = eventColors(event.type);
  const start = new Date(event.start_at);
  const end = new Date(event.end_at);
  const understaffed = attendingCount < 2;

  const statusByLeaderId = new Map<string, "attending" | "unavailable" | "undecided">();
  for (const r of rsvps) {
    statusByLeaderId.set(r.leader_id, r.status);
  }

  return (
    <article className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
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
          <h3 className="text-base font-semibold leading-tight">{event.title}</h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {format(start, "EEE MMM d")} · {fmt.timeRange(start, end)}
            </span>
            {event.location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {event.location}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium",
              understaffed
                ? "bg-rose-100 text-rose-900 ring-1 ring-rose-300 dark:bg-rose-950/40 dark:text-rose-200 dark:ring-rose-900/50"
                : "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900/50",
            )}
          >
            {understaffed ? (
              <AlertTriangle className="h-3.5 w-3.5" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            <span>
              {attendingCount} of {totalLeaders} attending
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusButton
              eventId={event.id}
              current={myStatus}
              status="attending"
              className="border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200"
            >
              <Check className="h-3 w-3" /> Attending
            </StatusButton>
            <StatusButton
              eventId={event.id}
              current={myStatus}
              status="unavailable"
              className="border-rose-300 bg-rose-100 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200"
            >
              <X className="h-3 w-3" /> Out
            </StatusButton>
            <StatusButton
              eventId={event.id}
              current={myStatus}
              status="undecided"
              className="border-border bg-muted text-foreground"
            >
              <Minus className="h-3 w-3" /> Undecided
            </StatusButton>
          </div>
        </div>
      </div>

      {totalLeaders > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Coverage
          </span>
          {allLeaders.map((l) => {
            const status = statusByLeaderId.get(l.id) ?? "undecided";
            const dotColor =
              status === "attending"
                ? "bg-emerald-500"
                : status === "unavailable"
                  ? "bg-rose-500"
                  : "bg-zinc-300 dark:bg-zinc-600";
            return (
              <span
                key={l.id}
                title={`${l.first_name ?? ""} ${l.last_name ?? ""} - ${status}`}
                className={cn(
                  "inline-flex h-6 items-center gap-1 rounded-full bg-muted px-2 text-[11px] text-foreground",
                  status === "undecided" && "text-muted-foreground",
                )}
              >
                <span className={cn("inline-block size-2 rounded-full", dotColor)} />
                {leaderInitials(l)}
                {status === "undecided" ? (
                  <HelpCircle className="h-3 w-3 opacity-60" />
                ) : null}
              </span>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}
