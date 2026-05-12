import "server-only";
import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import type {
  EventRow,
  Profile,
  ProgramBlock,
  ProgramBlockType,
  SundayProgram,
} from "@/lib/types";

type Supabase = SupabaseClient<Database>;

export interface ProgramForEdit {
  program: SundayProgram;
  event: EventRow;
  blocks: (ProgramBlock & {
    assignee: Pick<Profile, "id" | "first_name" | "last_name" | "role"> | null;
  })[];
  assignableProfiles: Pick<Profile, "id" | "first_name" | "last_name" | "role">[];
  /** profileId -> blockType -> lastPerformedAt ISO string. */
  lastPerformed: Map<string, Map<ProgramBlockType, string>>;
}

type AssigneeJoin = Pick<Profile, "id" | "first_name" | "last_name" | "role">;
type BlockJoined = ProgramBlock & {
  assignee: AssigneeJoin | AssigneeJoin[] | null;
};

type EventJoin = Pick<
  EventRow,
  "id" | "title" | "type" | "start_at" | "end_at" | "location" | "description" | "rsvp_required" | "created_at" | "updated_at"
>;
type ProgramWithEvent = SundayProgram & {
  event: EventJoin | EventJoin[] | null;
};

export async function getProgramForEdit(
  supabase: Supabase,
  id: string,
): Promise<ProgramForEdit | null> {
  const [progRes, blocksRes, profilesRes] = await Promise.all([
    supabase
      .from("sunday_programs")
      .select("*, event:events(*)")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("program_blocks")
      .select("*, assignee:profiles(id, first_name, last_name, role)")
      .eq("sunday_program_id", id)
      .order("position"),
    supabase
      .from("profiles")
      .select("id, first_name, last_name, role")
      .in("role", ["adult_leader", "youth"])
      .order("role")
      .order("first_name"),
  ]);

  if (progRes.error) throw progRes.error;
  if (blocksRes.error) throw blocksRes.error;
  if (profilesRes.error) throw profilesRes.error;

  if (!progRes.data) return null;
  const progRaw = progRes.data as unknown as ProgramWithEvent;
  const eventVal = Array.isArray(progRaw.event)
    ? progRaw.event[0]
    : progRaw.event;
  if (!eventVal) return null;

  const blocksRaw = (blocksRes.data ?? []) as unknown as BlockJoined[];
  const blocks: ProgramForEdit["blocks"] = blocksRaw.map((b) => ({
    ...b,
    assignee: Array.isArray(b.assignee) ? (b.assignee[0] ?? null) : b.assignee,
  }));

  // Last-performed map: scan completed historical blocks for each (assignee, type).
  // Restrict to blocks that completed_at is not null and are <= now to keep this small.
  const { data: histRaw } = await supabase
    .from("program_blocks")
    .select("assignee_id, type, completed_at")
    .not("assignee_id", "is", null)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(2000);

  const lastPerformed = new Map<string, Map<ProgramBlockType, string>>();
  for (const row of histRaw ?? []) {
    const r = row as Pick<ProgramBlock, "assignee_id" | "type" | "completed_at">;
    if (!r.assignee_id || !r.completed_at) continue;
    const inner = lastPerformed.get(r.assignee_id) ?? new Map();
    if (!inner.has(r.type)) inner.set(r.type, r.completed_at);
    lastPerformed.set(r.assignee_id, inner);
  }

  return {
    program: progRaw as SundayProgram,
    event: eventVal as EventRow,
    blocks,
    assignableProfiles: (profilesRes.data ?? []) as Pick<
      Profile,
      "id" | "first_name" | "last_name" | "role"
    >[],
    lastPerformed,
  };
}
