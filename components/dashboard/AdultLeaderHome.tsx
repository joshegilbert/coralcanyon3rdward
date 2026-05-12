import { format } from "date-fns";
import type { DashboardData } from "@/lib/queries/dashboard";
import type { Profile } from "@/lib/types";
import { ThisSundayCard } from "./ThisSundayCard";
import { LeaderCoverageBanner } from "./LeaderCoverageBanner";
import { UpNext } from "./UpNext";
import { AnnouncementsFeed } from "./AnnouncementsFeed";
import { BirthdaysStrip } from "./BirthdaysStrip";
import { LeaderQuickAddFab } from "./LeaderQuickAddFab";

interface AdultLeaderHomeProps {
  profile: Profile;
  data: DashboardData;
}

export function AdultLeaderHome({ profile, data }: AdultLeaderHomeProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-4 lg:max-w-5xl lg:space-y-5">
      <header className="px-1">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {format(new Date(), "EEEE, MMMM d")}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight lg:text-3xl">
          Hi, {profile.first_name}
        </h1>
      </header>

      <ThisSundayCard data={data.nextSunday} role={profile.role} />

      <LeaderCoverageBanner data={data.nextSunday} />

      <div className="grid gap-4 lg:grid-cols-2">
        <UpNext events={data.upcomingActivities} />
        <AnnouncementsFeed
          announcements={data.announcements}
          role={profile.role}
        />
      </div>

      <BirthdaysStrip items={data.birthdaysThisMonth} />

      <LeaderQuickAddFab />
    </div>
  );
}
