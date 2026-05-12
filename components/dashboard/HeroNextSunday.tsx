import { AlertTriangle, CalendarHeart, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { NextSundayData } from "@/lib/queries/dashboard";

export function HeroNextSunday({ data }: { data: NextSundayData }) {
  const isQuorum = data.type === "quorum_meeting";
  const understaffed = data.event && data.attendingCount < 2;

  return (
    <Card
      className={cn(
        "overflow-hidden border-none shadow-md ring-1",
        isQuorum
          ? "bg-gradient-to-br from-sky-100 via-sky-50 to-white ring-sky-200 dark:from-sky-950/40 dark:via-sky-950/20 dark:to-zinc-900 dark:ring-sky-900/40"
          : "bg-gradient-to-br from-amber-100 via-amber-50 to-white ring-amber-200 dark:from-amber-950/40 dark:via-amber-950/20 dark:to-zinc-900 dark:ring-amber-900/40",
      )}
    >
      <CardContent className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:p-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest">
            <CalendarHeart className="h-4 w-4" />
            Next Sunday
          </div>
          <div className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {format(data.date, "EEEE, MMMM d")}
          </div>
          <div className="mt-3">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold",
                isQuorum
                  ? "bg-sky-200 text-sky-900 dark:bg-sky-900/50 dark:text-sky-200"
                  : "bg-amber-200 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200",
              )}
            >
              {isQuorum ? "Quorum Meeting" : "Sunday School"}
            </span>
            {!data.event ? (
              <span className="ml-2 text-sm text-muted-foreground">
                · no event scheduled yet
              </span>
            ) : null}
          </div>
          {data.event?.location ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {data.event.location}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium",
              understaffed
                ? "bg-rose-100 text-rose-900 ring-1 ring-rose-300 dark:bg-rose-950/40 dark:text-rose-200 dark:ring-rose-900/50"
                : "bg-card text-foreground ring-1 ring-border",
            )}
          >
            {understaffed ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <Users className="h-4 w-4" />
            )}
            <span>
              {data.attendingCount} of {data.totalLeaders} leaders attending
            </span>
          </div>
          {understaffed ? (
            <p className="text-xs font-medium text-rose-700 dark:text-rose-300">
              Need at least 2 leaders for two-deep coverage
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
