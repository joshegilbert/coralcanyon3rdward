import { cookies } from "next/headers";
import { format } from "date-fns";
import { createClient } from "@/utils/supabase/server";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/queries/dashboard";
import { HeroNextSunday } from "@/components/dashboard/HeroNextSunday";
import { LeaderRsvpStatus } from "@/components/dashboard/LeaderRsvpStatus";
import { AnnouncementBoard } from "@/components/dashboard/AnnouncementBoard";
import { BirthdaysWidget } from "@/components/dashboard/BirthdaysWidget";
import { UpcomingActivities } from "@/components/dashboard/UpcomingActivities";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { YouthHome } from "@/components/dashboard/YouthHome";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { user, profile } = await requireUser();
  if (!profile) return null;

  const supabase = createClient(await cookies());
  const data = await getDashboardData(supabase, user.id);

  if (profile.role !== "adult_leader") {
    return (
      <YouthHome
        profile={profile}
        nextSunday={data.nextSunday}
        announcements={data.announcements}
        upcomingActivities={data.upcomingActivities}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d")}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {profile.first_name}
          </h1>
        </div>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky-900 dark:bg-sky-950/40 dark:text-sky-200">
          Adult Leader
        </span>
      </div>

      <HeroNextSunday data={data.nextSunday} />

      <QuickStats
        upcomingEventsCount={data.quickStats.upcomingEventsCount}
        activeYouthCount={data.quickStats.activeYouthCount}
        callingsFilledCount={data.quickStats.callingsFilledCount}
        underStaffedSundays={data.quickStats.underStaffedSundays}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <LeaderRsvpStatus sundays={data.upcomingSundays} />
        <AnnouncementBoard announcements={data.announcements} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BirthdaysWidget items={data.birthdaysThisMonth} />
        <UpcomingActivities events={data.upcomingActivities} />
      </div>
    </div>
  );
}
