import { format } from "date-fns";
import { Check, Minus, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { setLeaderRsvp } from "@/app/actions/leader-rsvp";
import type { UpcomingSundayData } from "@/lib/queries/dashboard";

function StatusButton({
  eventId,
  current,
  status,
  children,
  className,
}: {
  eventId: string;
  current: "attending" | "unavailable" | "undecided";
  status: "attending" | "unavailable" | "undecided";
  children: React.ReactNode;
  className?: string;
}) {
  const active = current === status;
  return (
    <form action={setLeaderRsvp}>
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className={cn(
          "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
          active
            ? className
            : "border-border bg-card text-muted-foreground hover:bg-accent",
        )}
      >
        {children}
      </button>
    </form>
  );
}

export function LeaderRsvpStatus({ sundays }: { sundays: UpcomingSundayData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your upcoming Sundays</CardTitle>
        <CardDescription>
          Mark availability so we keep two-deep coverage.
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-border">
        {sundays.map((s) => {
          const isQuorum = s.type === "quorum_meeting";
          const noEvent = !s.event;
          return (
            <div
              key={s.date.toISOString()}
              className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {format(s.date, "MMM d")}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                      isQuorum
                        ? "bg-sky-100 text-sky-900 dark:bg-sky-950/40 dark:text-sky-200"
                        : "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
                    )}
                  >
                    {isQuorum ? "Quorum" : "Sunday School"}
                  </span>
                </div>
                {noEvent ? (
                  <p className="text-xs italic text-muted-foreground">
                    no event yet
                  </p>
                ) : !s.rsvpRequired ? (
                  <p className="text-xs italic text-muted-foreground">
                    No RSVP required
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {s.attendingCount} attending
                    {s.attendingCount < 2 ? (
                      <span className="ml-1 font-medium text-rose-600 dark:text-rose-400">
                        · needs more
                      </span>
                    ) : null}
                  </p>
                )}
              </div>
              {s.event && s.rsvpRequired ? (
                <div className="flex items-center gap-1.5">
                  <StatusButton
                    eventId={s.event.id}
                    current={s.myRsvpStatus}
                    status="attending"
                    className="border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200"
                  >
                    <Check className="h-3 w-3" />
                    Attending
                  </StatusButton>
                  <StatusButton
                    eventId={s.event.id}
                    current={s.myRsvpStatus}
                    status="unavailable"
                    className="border-rose-300 bg-rose-100 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200"
                  >
                    <X className="h-3 w-3" />
                    Out
                  </StatusButton>
                  {s.myRsvpStatus !== "undecided" ? (
                    <StatusButton
                      eventId={s.event.id}
                      current={s.myRsvpStatus}
                      status="undecided"
                      className="border-border bg-muted text-foreground"
                    >
                      <Minus className="h-3 w-3" />
                    </StatusButton>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
