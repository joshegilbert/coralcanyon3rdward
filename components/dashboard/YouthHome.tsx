import { format } from "date-fns";
import { CalendarHeart, Megaphone, Sparkles, Tent } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  AnnouncementWithAuthor,
  NextSundayData,
} from "@/lib/queries/dashboard";
import type { EventRow, Profile } from "@/lib/types";

interface YouthHomeProps {
  profile: Profile;
  nextSunday: NextSundayData;
  announcements: AnnouncementWithAuthor[];
  upcomingActivities: EventRow[];
}

export function YouthHome({
  profile,
  nextSunday,
  announcements,
  upcomingActivities,
}: YouthHomeProps) {
  const isQuorum = nextSunday.type === "quorum_meeting";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {format(new Date(), "EEEE, MMMM d")}
        </p>
        <h1 className="mt-1 text-2xl font-bold">
          Hi, {profile.first_name}
        </h1>
      </div>

      <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-zinc-900">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarHeart className="h-4 w-4 text-amber-600" />
            <CardTitle className="text-base">Next Sunday</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-xl font-semibold">
            {format(nextSunday.date, "EEEE, MMMM d")}
          </div>
          <Badge
            variant="secondary"
            className={
              isQuorum
                ? "mt-2 border-sky-200 bg-sky-100 text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-200"
                : "mt-2 border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200"
            }
          >
            {isQuorum ? "Quorum Meeting" : "Sunday School"}
          </Badge>
          {nextSunday.event?.location ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {nextSunday.event.location}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-amber-600" />
            <CardTitle className="text-base">Announcements</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <p className="text-sm text-muted-foreground">No announcements yet.</p>
          ) : (
            <ul className="space-y-3">
              {announcements.map((a) => (
                <li
                  key={a.id}
                  className="border-l-2 border-amber-300 pl-3 dark:border-amber-900/50"
                >
                  <p className="text-sm whitespace-pre-wrap">{a.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {a.author
                      ? `${a.author.first_name} ${a.author.last_name}`
                      : "Unknown"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Tent className="h-4 w-4 text-amber-600" />
            <CardTitle className="text-base">Upcoming activities</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing on the schedule yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {upcomingActivities.map((e) => (
                <li
                  key={e.id}
                  className="rounded-lg border border-border bg-card/50 p-3 text-sm"
                >
                  <div className="font-semibold">{e.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(e.start_at), "EEE MMM d")}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {profile.role === "youth" ? (
        <p className="rounded-lg bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
          <Sparkles className="mr-1.5 inline h-3 w-3" />
          You can help plan the Sunday lesson! Open Sunday Program to edit.
        </p>
      ) : null}
    </div>
  );
}
