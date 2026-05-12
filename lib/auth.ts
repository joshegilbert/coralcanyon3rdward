import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import type { Profile, Role } from "@/lib/types";

/**
 * Fetches the current Supabase user and their profile row. Cached per-request
 * via React's `cache` so multiple components can call this without making
 * extra DB requests.
 */
export const getCurrentUser = cache(async () => {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return {
    user,
    profile: (profile as Profile | null) ?? null,
  };
});

export async function requireUser() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  return current;
}

export async function requireRole(roles: Role[]) {
  const current = await requireUser();
  if (!current.profile || !roles.includes(current.profile.role)) {
    redirect("/");
  }
  return current;
}

export async function requireAdultLeader() {
  return requireRole(["adult_leader"]);
}
