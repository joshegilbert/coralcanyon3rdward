import { format } from "date-fns";
import { Sparkles } from "lucide-react";
import { ThisSundayCard } from "./ThisSundayCard";
import { UpNext } from "./UpNext";
import { AnnouncementsFeed } from "./AnnouncementsFeed";
import { BirthdaysStrip } from "./BirthdaysStrip";
import type { DashboardData } from "@/lib/queries/dashboard";
import type { Profile } from "@/lib/types";

interface YouthHomeProps {
  profile: Profile;
  data: DashboardData;
}

export function YouthHome({ profile, data }: YouthHomeProps) {
  const isYouth = profile.role === "youth";
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header className="px-1">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {format(new Date(), "EEEE, MMMM d")}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          Hi, {profile.first_name}
        </h1>
      </header>

      <ThisSundayCard data={data.nextSunday} role={profile.role} />

      <UpNext events={data.upcomingActivities} />

      <AnnouncementsFeed
        announcements={data.announcements}
        role={profile.role}
      />

      <BirthdaysStrip items={data.birthdaysThisMonth} />

      {isYouth ? (
        <p className="flex items-start gap-1.5 rounded-xl bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
          <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-amber-600" />
          You can help plan the Sunday lesson — tap{" "}
          <span className="font-semibold">Program</span> below to edit.
        </p>
      ) : null}
    </div>
  );
}
