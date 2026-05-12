import { cookies } from "next/headers";
import { CalendarOff } from "lucide-react";
import { requireAdultLeader } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import { getLeaderRsvpBoard } from "@/lib/queries/leader-rsvp";
import { LeaderRsvpRow } from "@/components/leaders/LeaderRsvpRow";

export const metadata = { title: "Leader RSVP - Coral Canyon 3rd Ward" };

const MONTH_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

export default async function LeaderRsvpPage() {
  const { user } = await requireAdultLeader();
  const supabase = createClient(await cookies());
  const board = await getLeaderRsvpBoard(supabase, user.id, 8);

  // Group events by month for sticky headers.
  const groups = new Map<string, typeof board.events>();
  for (const entry of board.events) {
    const key = MONTH_FORMATTER.format(new Date(entry.event.start_at));
    const list = groups.get(key) ?? [];
    list.push(entry);
    groups.set(key, list);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leader RSVP</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Private to adult leaders. Every event that needs two-deep coverage
            in the next 8 weeks. Red means fewer than 2 attending.
          </p>
        </div>
        <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          {board.totalLeaders} {board.totalLeaders === 1 ? "leader" : "leaders"} on the roster
        </div>
      </div>

      {board.events.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <CalendarOff className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-3 text-base font-semibold">All clear</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            No events requiring RSVPs in the next 8 weeks.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(groups.entries()).map(([month, entries]) => (
            <section key={month} className="space-y-3">
              <div className="sticky top-0 z-10 -mx-1 bg-background/95 px-1 py-1 backdrop-blur">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {month}
                </h2>
              </div>
              <div className="space-y-3">
                {entries.map((entry) => (
                  <LeaderRsvpRow
                    key={entry.event.id}
                    entry={entry}
                    allLeaders={board.allLeaders}
                    totalLeaders={board.totalLeaders}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
