import { format } from "date-fns";
import { Check, ShieldCheck, X, Minus, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { setLeaderRsvp } from "@/app/actions/leader-rsvp";
import type { NextSundayData } from "@/lib/queries/dashboard";

interface LeaderCoverageBannerProps {
  data: NextSundayData;
}

function StatusButton({
  eventId,
  status,
  active,
  className,
  children,
}: {
  eventId: string;
  status: "attending" | "unavailable" | "undecided";
  active: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <form action={setLeaderRsvp} className="flex-1">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        aria-pressed={active}
        className={cn(
          "flex h-11 w-full items-center justify-center gap-1.5 rounded-lg border text-sm font-medium transition-colors active:scale-[0.98]",
          active
            ? className
            : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        {children}
      </button>
    </form>
  );
}

export function LeaderCoverageBanner({ data }: LeaderCoverageBannerProps) {
  if (!data.event || !data.rsvpRequired) return null;

  const understaffed = data.attendingCount < 2;

  return (
    <section
      className={cn(
        "rounded-2xl border p-4 shadow-sm",
        understaffed
          ? "border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-950/30"
          : "border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/30",
      )}
    >
      <div className="flex items-center gap-2">
        {understaffed ? (
          <AlertTriangle className="h-4 w-4 text-rose-700 dark:text-rose-300" />
        ) : (
          <ShieldCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
        )}
        <h3
          className={cn(
            "text-sm font-semibold",
            understaffed
              ? "text-rose-900 dark:text-rose-100"
              : "text-emerald-900 dark:text-emerald-100",
          )}
        >
          {understaffed
            ? "Two-deep coverage needed"
            : "Two-deep coverage confirmed"}
        </h3>
      </div>
      <p
        className={cn(
          "mt-1 text-xs",
          understaffed
            ? "text-rose-800/90 dark:text-rose-200/90"
            : "text-emerald-800/90 dark:text-emerald-200/90",
        )}
      >
        {format(data.date, "EEEE, MMM d")} ·{" "}
        <span className="font-semibold">
          {data.attendingCount} of {data.totalLeaders} leaders attending
        </span>
      </p>

      <div className="mt-3 flex items-stretch gap-2">
        <StatusButton
          eventId={data.event.id}
          status="attending"
          active={data.myRsvpStatus === "attending"}
          className="border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-900/40 dark:text-emerald-100"
        >
          <Check className="h-4 w-4" />
          I&apos;m in
        </StatusButton>
        <StatusButton
          eventId={data.event.id}
          status="unavailable"
          active={data.myRsvpStatus === "unavailable"}
          className="border-rose-300 bg-rose-100 text-rose-900 dark:border-rose-800/60 dark:bg-rose-900/40 dark:text-rose-100"
        >
          <X className="h-4 w-4" />
          Out
        </StatusButton>
        <StatusButton
          eventId={data.event.id}
          status="undecided"
          active={data.myRsvpStatus === "undecided"}
          className="border-zinc-300 bg-zinc-100 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        >
          <Minus className="h-4 w-4" />
          Maybe
        </StatusButton>
      </div>
    </section>
  );
}
