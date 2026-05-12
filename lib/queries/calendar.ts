import "server-only";
import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import type { EventRow, LeaderRsvp, Profile } from "@/lib/types";

type Supabase = SupabaseClient<Database>;

/**
 * Fetch events whose interval overlaps [rangeStart, rangeEnd].
 * Postgres ranges are half-open; we use the inclusive-style filter:
 *   start_at <= rangeEnd AND end_at >= rangeStart
 */
export async function getEventsInRange(
  supabase: Supabase,
  rangeStart: Date,
  rangeEnd: Date,
): Promise<EventRow[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .lte("start_at", rangeEnd.toISOString())
    .gte("end_at", rangeStart.toISOString())
    .order("start_at");
  if (error) throw error;
  return (data ?? []) as EventRow[];
}

export interface EventDetail extends EventRow {
  rsvps: (LeaderRsvp & { leader: Pick<Profile, "id" | "first_name" | "last_name"> | null })[];
  myRsvp: LeaderRsvp | null;
}

type RsvpJoined = LeaderRsvp & {
  leader:
    | Pick<Profile, "id" | "first_name" | "last_name">
    | Pick<Profile, "id" | "first_name" | "last_name">[]
    | null;
};

export async function getEventDetail(
  supabase: Supabase,
  eventId: string,
  currentUserId: string,
): Promise<EventDetail | null> {
  const [eventRes, rsvpsRes] = await Promise.all([
    supabase.from("events").select("*").eq("id", eventId).maybeSingle(),
    supabase
      .from("leader_rsvps")
      .select("*, leader:profiles(id, first_name, last_name)")
      .eq("event_id", eventId),
  ]);
  if (!eventRes.data) return null;

  const rsvpsRaw = (rsvpsRes.data ?? []) as unknown as RsvpJoined[];
  const rsvps = rsvpsRaw.map((r) => ({
    ...r,
    leader: Array.isArray(r.leader) ? (r.leader[0] ?? null) : r.leader,
  })) as EventDetail["rsvps"];
  const myRsvp = rsvps.find((r) => r.leader_id === currentUserId) ?? null;
  return { ...(eventRes.data as EventRow), rsvps, myRsvp };
}
