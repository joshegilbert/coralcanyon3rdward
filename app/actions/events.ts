"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { requireAdultLeader } from "@/lib/auth";
import type { TablesInsert, TablesUpdate } from "@/lib/types/database";
import type { EventType } from "@/lib/types";

const EVENT_TYPES = [
  "sunday_school",
  "quorum_meeting",
  "activity",
  "camp",
  "service",
  "other",
] as const satisfies readonly EventType[];

const eventInputSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200),
    type: z.enum(EVENT_TYPES),
    // datetime-local returns "YYYY-MM-DDTHH:mm" with no timezone offset; we
    // interpret it as the user's local time and convert to ISO.
    start_at: z.string().min(1),
    end_at: z.string().min(1),
    location: z.string().trim().max(200).optional().or(z.literal("")),
    description: z.string().trim().max(4000).optional().or(z.literal("")),
    rsvp_required: z.union([z.literal("on"), z.literal("true"), z.literal(""), z.undefined()]).optional(),
  })
  .refine(
    (data) => new Date(data.end_at).getTime() >= new Date(data.start_at).getTime(),
    {
      message: "End must be after start",
      path: ["end_at"],
    },
  );

function parseLocalDateTime(value: string): string {
  // <input type="datetime-local"> emits ISO-ish "YYYY-MM-DDTHH:mm" without
  // a zone. `new Date(s)` parses that as local time, which is what we want.
  return new Date(value).toISOString();
}

function formDataToObject(formData: FormData): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string") obj[k] = v;
  }
  return obj;
}

export type EventActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function createEvent(
  _prev: EventActionResult | null,
  formData: FormData,
): Promise<EventActionResult> {
  await requireAdultLeader();
  const parsed = eventInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      if (path) fieldErrors[path] = issue.message;
    }
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }

  const supabase = createClient(await cookies());
  const insert: TablesInsert<"events"> = {
    title: parsed.data.title,
    type: parsed.data.type,
    start_at: parseLocalDateTime(parsed.data.start_at),
    end_at: parseLocalDateTime(parsed.data.end_at),
    location: parsed.data.location?.trim() || null,
    description: parsed.data.description?.trim() || null,
    rsvp_required:
      parsed.data.rsvp_required === "on" || parsed.data.rsvp_required === "true",
  };
  const { data, error } = await supabase
    .from("events")
    .insert(insert)
    .select("id, start_at")
    .single();
  if (error) return { ok: false, error: error.message };

  revalidatePath("/calendar");
  revalidatePath("/");
  revalidatePath("/leaders/rsvp");
  const dateParam = data.start_at.slice(0, 10);
  redirect(`/calendar?date=${dateParam}&created=${data.id}`);
}

export async function updateEvent(
  id: string,
  _prev: EventActionResult | null,
  formData: FormData,
): Promise<EventActionResult> {
  await requireAdultLeader();
  const parsed = eventInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      if (path) fieldErrors[path] = issue.message;
    }
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }

  const supabase = createClient(await cookies());
  const patch: TablesUpdate<"events"> = {
    title: parsed.data.title,
    type: parsed.data.type,
    start_at: parseLocalDateTime(parsed.data.start_at),
    end_at: parseLocalDateTime(parsed.data.end_at),
    location: parsed.data.location?.trim() || null,
    description: parsed.data.description?.trim() || null,
    rsvp_required:
      parsed.data.rsvp_required === "on" || parsed.data.rsvp_required === "true",
  };
  const { data, error } = await supabase
    .from("events")
    .update(patch)
    .eq("id", id)
    .select("id, start_at")
    .single();
  if (error) return { ok: false, error: error.message };

  revalidatePath("/calendar");
  revalidatePath("/");
  revalidatePath("/leaders/rsvp");
  const dateParam = data.start_at.slice(0, 10);
  redirect(`/calendar?date=${dateParam}&updated=${data.id}`);
}

export async function deleteEvent(id: string): Promise<EventActionResult> {
  await requireAdultLeader();
  const supabase = createClient(await cookies());
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/calendar");
  revalidatePath("/");
  revalidatePath("/leaders/rsvp");
  redirect(`/calendar?deleted=1`);
}
