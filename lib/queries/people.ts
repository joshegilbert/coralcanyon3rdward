import "server-only";
import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import type { Calling, Profile, Role } from "@/lib/types";

type Supabase = SupabaseClient<Database>;

export interface DirectoryEntry {
  profile: Profile;
  callings: Calling[];
  parents: Pick<Profile, "id" | "first_name" | "last_name">[];
  children: Pick<Profile, "id" | "first_name" | "last_name">[];
}

export interface Directory {
  byRole: Record<Role, DirectoryEntry[]>;
  total: number;
  allYouth: Profile[];
  allCallings: Calling[];
}

type AssignmentJoined = {
  profile_id: string;
  released_at: string | null;
  callings: Calling | Calling[] | null;
};

export async function getDirectory(supabase: Supabase): Promise<Directory> {
  const [profilesRes, callingsRes, assignmentsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .order("role")
      .order("first_name", { nullsFirst: false })
      .order("last_name", { nullsFirst: false }),
    supabase
      .from("callings")
      .select("*")
      .order("sort_order")
      .order("name"),
    supabase
      .from("calling_assignments")
      .select("profile_id, released_at, callings(*)")
      .is("released_at", null),
  ]);

  if (profilesRes.error) throw profilesRes.error;
  if (callingsRes.error) throw callingsRes.error;
  if (assignmentsRes.error) throw assignmentsRes.error;

  const profiles = (profilesRes.data ?? []) as Profile[];
  const callings = (callingsRes.data ?? []) as Calling[];
  const assignments = (assignmentsRes.data ?? []) as unknown as AssignmentJoined[];

  const callingsByProfile = new Map<string, Calling[]>();
  for (const a of assignments) {
    const c = Array.isArray(a.callings) ? a.callings[0] : a.callings;
    if (!c) continue;
    const list = callingsByProfile.get(a.profile_id) ?? [];
    list.push(c);
    callingsByProfile.set(a.profile_id, list);
  }

  const youthById = new Map<string, Profile>();
  for (const p of profiles) {
    if (p.role === "youth") youthById.set(p.id, p);
  }

  // Build entries with parent/child links from parent_of_ids
  const childrenByParent = new Map<string, Profile[]>();
  for (const p of profiles) {
    for (const childId of p.parent_of_ids ?? []) {
      const child = youthById.get(childId);
      if (!child) continue;
      const list = childrenByParent.get(p.id) ?? [];
      list.push(child);
      childrenByParent.set(p.id, list);
    }
  }
  const parentsByChild = new Map<string, Profile[]>();
  for (const p of profiles) {
    if (p.role === "general" && (p.parent_of_ids ?? []).length > 0) {
      for (const childId of p.parent_of_ids ?? []) {
        const list = parentsByChild.get(childId) ?? [];
        list.push(p);
        parentsByChild.set(childId, list);
      }
    }
  }

  const byRole: Record<Role, DirectoryEntry[]> = {
    adult_leader: [],
    youth: [],
    general: [],
  };
  for (const p of profiles) {
    byRole[p.role].push({
      profile: p,
      callings: callingsByProfile.get(p.id) ?? [],
      children: (childrenByParent.get(p.id) ?? []).map((c) => ({
        id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
      })),
      parents: (parentsByChild.get(p.id) ?? []).map((c) => ({
        id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
      })),
    });
  }

  return {
    byRole,
    total: profiles.length,
    allYouth: profiles.filter((p) => p.role === "youth"),
    allCallings: callings,
  };
}
