import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { requireUser } from "@/lib/auth";
import {
  getRangeForView,
  parseDateParam,
  parseView,
} from "@/lib/calendar";
import { getEventsInRange } from "@/lib/queries/calendar";
import { CalendarShell } from "@/components/calendar/CalendarShell";

export const metadata = { title: "Calendar - Stone Ridge Ward" };

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; view?: string }>;
}) {
  const params = await searchParams;
  const current = await requireUser();
  if (!current.profile) {
    // The (app) layout already guards this; this satisfies the type checker.
    throw new Error("Profile missing for authenticated user");
  }
  const profile = current.profile;
  const focus = parseDateParam(params.date);
  const view = parseView(params.view);

  const supabase = createClient(await cookies());
  const { start, end } = getRangeForView(focus, view);
  // Pad the range a bit so multi-day events overlapping the edges still load
  const padStart = new Date(start);
  padStart.setDate(padStart.getDate() - 7);
  const padEnd = new Date(end);
  padEnd.setDate(padEnd.getDate() + 7);

  const events = await getEventsInRange(supabase, padStart, padEnd);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Master Calendar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {profile.role === "adult_leader"
            ? "Plan Sundays, activities, and camps. 1st/3rd Sundays are Sunday School; 2nd/4th are Quorum Meetings."
            : "What's coming up in the quorum. 1st/3rd Sundays are Sunday School; 2nd/4th are Quorum Meetings."}
        </p>
      </div>

      <CalendarShell
        focus={focus}
        view={view}
        events={events}
        role={profile.role}
      />
    </div>
  );
}
