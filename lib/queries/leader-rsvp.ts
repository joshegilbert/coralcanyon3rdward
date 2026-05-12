import "server-only";
import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import type { EventRow, LeaderRsvp, Profile } from "@/lib/types";

type Supabase = SupabaseClient<Database>;

export interface LeaderRsvpBoardEvent {
  event: EventRow;
  rsvps: (LeaderRsvp & {
    leader: Pick<Profile, "id" | "first_name" | "last_name"> | null;
  })[];
  attendingCount: number;
  unavailableCount: number;
  undecidedCount: number;
  myStatus: "attending" | "unavailable" | "undecided";
}

export interface LeaderRsvpBoard {
  events: LeaderRsvpBoardEvent[];
  totalLeaders: number;
  allLeaders: Pick<Profile, "id" | "first_name" | "last_name">[];
  rangeStart: Date;
  rangeEnd: Date;
}

type RsvpRow = LeaderRsvp & {
  leader:
    | Pick<Profile, "id" | "first_name" | "last_name">
    | Pick<Profile, "id" | "first_name" | "last_name">[]
    | null;
};

export async function getLeaderRsvpBoard(
  supabase: Supabase,
  currentUserId: string,
  weeks = 8,
): Promise<LeaderRsvpBoard> {
  const rangeStart = new Date();
  rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeEnd.getDate() + weeks * 7);

  const [eventsRes, leadersRes] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .eq("rsvp_required", true)
      .gte("start_at", rangeStart.toISOString())
      .lte("start_at", rangeEnd.toISOString())
      .order("start_at"),
    supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("role", "adult_leader")
      .order("first_name"),
  ]);

  if (eventsRes.error) throw eventsRes.error;
  if (leadersRes.error) throw leadersRes.error;

  const events = (eventsRes.data ?? []) as EventRow[];
  const allLeaders = (leadersRes.data ?? []) as Pick<
    Profile,
    "id" | "first_name" | "last_name"
  >[];

  let rsvps: RsvpRow[] = [];
  if (events.length > 0) {
    const ids = events.map((e) => e.id);
    const { data, error } = await supabase
      .from("leader_rsvps")
      .select("*, leader:profiles(id, first_name, last_name)")
      .in("event_id", ids);
    if (error) throw error;
    rsvps = (data ?? []) as unknown as RsvpRow[];
  }

  const rsvpsByEvent = new Map<string, LeaderRsvpBoardEvent["rsvps"]>();
  for (const r of rsvps) {
    const normalized = {
      ...r,
      leader: Array.isArray(r.leader) ? (r.leader[0] ?? null) : r.leader,
    } as LeaderRsvpBoardEvent["rsvps"][number];
    const list = rsvpsByEvent.get(r.event_id) ?? [];
    list.push(normalized);
    rsvpsByEvent.set(r.event_id, list);
  }

  const boardEvents: LeaderRsvpBoardEvent[] = events.map((event) => {
    const list = rsvpsByEvent.get(event.id) ?? [];
    const attendingCount = list.filter((r) => r.status === "attending").length;
    const unavailableCount = list.filter((r) => r.status === "unavailable").length;
    const undecidedCount = list.filter((r) => r.status === "undecided").length;
    const mine = list.find((r) => r.leader_id === currentUserId);
    return {
      event,
      rsvps: list,
      attendingCount,
      unavailableCount,
      undecidedCount,
      myStatus: mine?.status ?? "undecided",
    };
  });

  return {
    events: boardEvents,
    totalLeaders: allLeaders.length,
    allLeaders,
    rangeStart,
    rangeEnd,
  };
}
