"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdultLeader } from "@/lib/auth";
import type { TablesInsert, TablesUpdate } from "@/lib/types/database";
import type { Role } from "@/lib/types";

const ROLES = ["adult_leader", "youth", "general"] as const satisfies readonly Role[];

const inviteSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  first_name: z.string().trim().min(1, "First name is required").max(80),
  last_name: z.string().trim().min(1, "Last name is required").max(80),
  role: z.enum(ROLES),
  birth_date: z.string().optional().or(z.literal("")),
});

const profileSchema = z.object({
  first_name: z.string().trim().min(1).max(80),
  last_name: z.string().trim().min(1).max(80),
  role: z.enum(ROLES),
  birth_date: z.string().optional().or(z.literal("")),
  avatar_color: z.string().trim().max(20).optional().or(z.literal("")),
  parent_of_ids: z.array(z.string().uuid()).optional(),
});

const callingSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, hyphens only"),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  sort_order: z.coerce.number().int().min(0).max(999).default(0),
});

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function fieldErrorsFromZod(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const path = issue.path.join(".");
    if (path) out[path] = issue.message;
  }
  return out;
}

function formObject(formData: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) {
    if (k.endsWith("[]")) {
      const key = k.slice(0, -2);
      const prev = (obj[key] as string[]) ?? [];
      if (typeof v === "string") prev.push(v);
      obj[key] = prev;
    } else if (typeof v === "string") {
      obj[k] = v;
    }
  }
  return obj;
}

function getSiteUrl(reqHeaders: Headers): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const host = reqHeaders.get("host");
  const proto =
    reqHeaders.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") ? "http" : "https");
  if (host) return `${proto}://${host}`;
  return "http://localhost:3000";
}

export async function invitePerson(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdultLeader();
  const parsed = inviteSchema.safeParse(formObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const admin = createAdminClient();
  const siteUrl = getSiteUrl(await headers());
  const { data, error } = await admin.auth.admin.inviteUserByEmail(
    parsed.data.email,
    {
      data: {
        first_name: parsed.data.first_name,
        last_name: parsed.data.last_name,
      },
      redirectTo: `${siteUrl}/auth/callback`,
    },
  );
  if (error || !data.user) {
    return { ok: false, error: error?.message ?? "Failed to invite user" };
  }

  // handle_new_user trigger created the profile row; backfill role/birth_date.
  const profileUpdate: TablesUpdate<"profiles"> = {
    first_name: parsed.data.first_name,
    last_name: parsed.data.last_name,
    role: parsed.data.role,
    birth_date: parsed.data.birth_date || null,
  };
  const { error: profileError } = await admin
    .from("profiles")
    .update(profileUpdate)
    .eq("id", data.user.id);
  if (profileError) {
    return { ok: false, error: profileError.message };
  }

  revalidatePath("/people");
  revalidatePath("/");
  return { ok: true, message: `Invite sent to ${parsed.data.email}` };
}

export async function updateProfile(
  id: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdultLeader();
  const parsed = profileSchema.safeParse(formObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const supabase = createClient(await cookies());
  // Use admin client for updates that may include role changes, since RLS only
  // permits leaders to write profiles in the first place; we still ran the
  // guard above. Use RLS-aware client where possible.
  const patch: TablesUpdate<"profiles"> = {
    first_name: parsed.data.first_name,
    last_name: parsed.data.last_name,
    role: parsed.data.role,
    birth_date: parsed.data.birth_date || null,
    avatar_color: parsed.data.avatar_color || null,
    parent_of_ids: parsed.data.parent_of_ids ?? [],
  };

  // If switching away from "youth", release any active callings to keep the
  // role-vs-callings invariant clean.
  if (parsed.data.role !== "youth") {
    const admin = createAdminClient();
    await admin
      .from("calling_assignments")
      .update({ released_at: new Date().toISOString() })
      .eq("profile_id", id)
      .is("released_at", null);
  }

  const { error } = await supabase.from("profiles").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/people");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteProfile(id: string): Promise<ActionResult> {
  await requireAdultLeader();
  const admin = createAdminClient();
  // Deleting the auth user cascades to public.profiles.
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/people");
  revalidatePath("/");
  return { ok: true };
}

export async function createCalling(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdultLeader();
  const parsed = callingSchema.safeParse(formObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }
  const supabase = createClient(await cookies());
  const insert: TablesInsert<"callings"> = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description || null,
    sort_order: parsed.data.sort_order,
  };
  const { error } = await supabase.from("callings").insert(insert);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/people");
  return { ok: true };
}

export async function updateCalling(
  id: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdultLeader();
  const parsed = callingSchema.safeParse(formObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }
  const supabase = createClient(await cookies());
  const patch: TablesUpdate<"callings"> = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description || null,
    sort_order: parsed.data.sort_order,
  };
  const { error } = await supabase.from("callings").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/people");
  return { ok: true };
}

export async function archiveCalling(id: string): Promise<ActionResult> {
  await requireAdultLeader();
  const supabase = createClient(await cookies());
  const { error } = await supabase
    .from("callings")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/people");
  return { ok: true };
}

export async function restoreCalling(id: string): Promise<ActionResult> {
  await requireAdultLeader();
  const supabase = createClient(await cookies());
  const { error } = await supabase
    .from("callings")
    .update({ archived_at: null })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/people");
  return { ok: true };
}

export async function assignCalling(
  profileId: string,
  callingId: string,
): Promise<ActionResult> {
  await requireAdultLeader();
  const supabase = createClient(await cookies());
  const insert: TablesInsert<"calling_assignments"> = {
    profile_id: profileId,
    calling_id: callingId,
  };
  const { error } = await supabase.from("calling_assignments").insert(insert);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/people");
  return { ok: true };
}

export async function releaseCalling(assignmentId: string): Promise<ActionResult> {
  await requireAdultLeader();
  const supabase = createClient(await cookies());
  const { error } = await supabase
    .from("calling_assignments")
    .update({ released_at: new Date().toISOString() })
    .eq("id", assignmentId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/people");
  return { ok: true };
}

export async function releaseCallingForProfile(
  profileId: string,
  callingId: string,
): Promise<ActionResult> {
  await requireAdultLeader();
  const supabase = createClient(await cookies());
  const { error } = await supabase
    .from("calling_assignments")
    .update({ released_at: new Date().toISOString() })
    .eq("profile_id", profileId)
    .eq("calling_id", callingId)
    .is("released_at", null);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/people");
  return { ok: true };
}
