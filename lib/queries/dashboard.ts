import "server-only";
import { SupabaseClient } from "@supabase/supabase-js";
import { addDays, startOfDay, startOfMonth } from "date-fns";
import type { Database } from "@/lib/types/database";
import type {
  Announcement,
  Calling,
  EventRow,
  LeaderRsvp,
  Profile,
} from "@/lib/types";
import { classifySunday, upcomingSundays } from "@/lib/sunday";

type Supabase = SupabaseClient<Database>;

export interface NextSundayData {
  date: Date;
  type: "sunday_school" | "quorum_meeting";
  event: EventRow | null;
  rsvps: (LeaderRsvp & { leader: Profile | null })[];
  attendingCount: number;
  totalLeaders: number;
}

export interface UpcomingSundayData {
  date: Date;
  type: "sunday_school" | "quorum_meeting";
  event: EventRow | null;
  myRsvpStatus: "attending" | "unavailable" | "undecided";
  attendingCount: number;
}

export interface AnnouncementWithAuthor extends Announcement {
  author: Pick<Profile, "id" | "first_name" | "last_name" | "role"> | null;
}

export interface BirthdayItem {
  profile: Profile;
  callings: Pick<Calling, "id" | "name">[];
  /** Numeric day in month (1-31) */
  day: number;
  /** Age they will turn on this birthday */
  age: number;
}

export interface DashboardData {
  nextSunday: NextSundayData;
  upcomingSundays: UpcomingSundayData[];
  announcements: AnnouncementWithAuthor[];
  birthdaysThisMonth: BirthdayItem[];
  upcomingActivities: EventRow[];
  quickStats: {
    upcomingEventsCount: number;
    activeYouthCount: number;
    callingsFilledCount: number;
    underStaffedSundays: number;
  };
}

function isoDate(date: Date) {
  return date.toISOString();
}

type CallingAssignmentJoined = {
  profile_id: string;
  calling: { id: string; name: string; sort_order: number } | null;
};

async function getActiveYouthCallings(
  supabase: Supabase,
  profileIds: string[],
): Promise<Map<string, Pick<Calling, "id" | "name">[]>> {
  if (profileIds.length === 0) return new Map();

  const { data } = await supabase
    .from("calling_assignments")
    .select("profile_id, calling:callings(id, name, sort_order)")
    .in("profile_id", profileIds)
    .is("released_at", null);

  const rows = (data ?? []) as unknown as CallingAssignmentJoined[];
  const map = new Map<string, Pick<Calling, "id" | "name">[]>();
  for (const row of rows) {
    const c = row.calling;
    if (!c) continue;
    const list = map.get(row.profile_id) ?? [];
    list.push({ id: c.id, name: c.name });
    map.set(row.profile_id, list);
  }
  return map;
}

export async function getDashboardData(
  supabase: Supabase,
  currentUserId: string,
): Promise<DashboardData> {
  const now = new Date();
  const sundays = upcomingSundays(4, now);
  const firstSunday = sundays[0];
  const lastSunday = sundays[sundays.length - 1];

  const sixWeeksOut = addDays(now, 42);

  const [
    sundayEventsRes,
    allLeadersRes,
    sundayRsvpsRes,
    myRsvpsRes,
    announcementsRes,
    youthProfilesRes,
    upcomingActivitiesRes,
    upcomingEventsRes,
  ] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .in("type", ["sunday_school", "quorum_meeting"])
      .gte("start_at", startOfDay(firstSunday).toISOString())
      .lte("start_at", addDays(lastSunday, 1).toISOString())
      .order("start_at"),
    supabase
      .from("profiles")
      .select("*")
      .eq("role", "adult_leader"),
    supabase
      .from("leader_rsvps")
      .select("*, leader:profiles(*)")
      .gte("created_at", startOfDay(addDays(now, -30)).toISOString()),
    supabase
      .from("leader_rsvps")
      .select("*")
      .eq("leader_id", currentUserId),
    supabase
      .from("announcements")
      .select(
        "*, author:profiles(id, first_name, last_name, role)",
      )
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("profiles")
      .select("*")
      .eq("role", "youth"),
    supabase
      .from("events")
      .select("*")
      .in("type", ["activity", "camp", "service", "other"])
      .gte("start_at", isoDate(now))
      .order("start_at")
      .limit(3),
    supabase
      .from("events")
      .select("id, type")
      .gte("start_at", isoDate(now))
      .lte("start_at", isoDate(sixWeeksOut)),
  ]);

  const sundayEvents = (sundayEventsRes.data ?? []) as EventRow[];
  const allLeaders = (allLeadersRes.data ?? []) as Profile[];
  const sundayRsvps = (sundayRsvpsRes.data ?? []) as (LeaderRsvp & {
    leader: Profile | null;
  })[];
  const myRsvps = (myRsvpsRes.data ?? []) as LeaderRsvp[];
  type AnnouncementJoinedRow = Announcement & {
    author:
      | Pick<Profile, "id" | "first_name" | "last_name" | "role">
      | Pick<Profile, "id" | "first_name" | "last_name" | "role">[]
      | null;
  };
  const announcements: AnnouncementWithAuthor[] = (
    (announcementsRes.data ?? []) as unknown as AnnouncementJoinedRow[]
  ).map((row) => {
    const author = Array.isArray(row.author) ? row.author[0] : row.author;
    return { ...row, author } as AnnouncementWithAuthor;
  });
  const youthProfiles = (youthProfilesRes.data ?? []) as Profile[];
  const upcomingActivities = (upcomingActivitiesRes.data ?? []) as EventRow[];
  const allUpcomingEvents = upcomingEventsRes.data ?? [];

  // Build per-Sunday RSVP map keyed by event_id
  const rsvpByEvent = new Map<string, typeof sundayRsvps>();
  for (const r of sundayRsvps) {
    const arr = rsvpByEvent.get(r.event_id) ?? [];
    arr.push(r);
    rsvpByEvent.set(r.event_id, arr);
  }

  // Match Sunday dates to events
  const sundayCards: UpcomingSundayData[] = sundays.map((date) => {
    const event =
      sundayEvents.find(
        (e) =>
          startOfDay(new Date(e.start_at)).getTime() ===
          startOfDay(date).getTime(),
      ) ?? null;
    const eventRsvps = event ? (rsvpByEvent.get(event.id) ?? []) : [];
    const mine = event
      ? myRsvps.find((r) => r.event_id === event.id)
      : undefined;
    const attendingCount = eventRsvps.filter(
      (r) => r.status === "attending",
    ).length;
    return {
      date,
      type: classifySunday(date),
      event,
      myRsvpStatus: mine?.status ?? "undecided",
      attendingCount,
    };
  });

  const next = sundayCards[0];
  const nextSundayRsvps = next.event
    ? (rsvpByEvent.get(next.event.id) ?? [])
    : [];

  const nextSunday: NextSundayData = {
    date: next.date,
    type: next.type,
    event: next.event,
    rsvps: nextSundayRsvps,
    attendingCount: next.attendingCount,
    totalLeaders: allLeaders.length,
  };

  // Birthdays this month
  const youthIds = youthProfiles.map((p) => p.id);
  const callingsByProfile = await getActiveYouthCallings(supabase, youthIds);

  const currentYear = now.getFullYear();
  const currentMonth = startOfMonth(now).getMonth();
  const birthdaysThisMonth: BirthdayItem[] = youthProfiles
    .filter((p) => p.birth_date)
    .map((p) => {
      const b = new Date(p.birth_date as string);
      return {
        profile: p,
        callings: callingsByProfile.get(p.id) ?? [],
        day: b.getDate(),
        month: b.getMonth(),
        birthYear: b.getFullYear(),
      };
    })
    .filter((item) => item.month === currentMonth)
    .sort((a, b) => a.day - b.day)
    .map((item) => ({
      profile: item.profile,
      callings: item.callings,
      day: item.day,
      age: currentYear - item.birthYear,
    }));

  const callingsFilledCount = Array.from(callingsByProfile.values()).reduce(
    (sum, list) => sum + list.length,
    0,
  );

  const underStaffedSundays = sundayCards.filter(
    (s) => s.event && s.attendingCount < 2,
  ).length;

  return {
    nextSunday,
    upcomingSundays: sundayCards,
    announcements,
    birthdaysThisMonth,
    upcomingActivities,
    quickStats: {
      upcomingEventsCount: allUpcomingEvents.length,
      activeYouthCount: youthProfiles.length,
      callingsFilledCount,
      underStaffedSundays,
    },
  };
}

