"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { requireUser } from "@/lib/auth";
import type { TablesInsert, TablesUpdate } from "@/lib/types/database";
import type { ProgramBlockType } from "@/lib/types";

const BLOCK_TYPES = [
  "presiding",
  "conducting",
  "youth_theme",
  "opening_prayer",
  "teacher",
  "announcements",
  "musical_number",
  "lesson",
  "custom",
] as const satisfies readonly ProgramBlockType[];

export type ProgramActionResult =
  | { ok: true }
  | { ok: false; error: string };

async function ensureCanEdit() {
  // RLS enforces edit access via the can_edit_program() helper (adult_leader OR
  // youth). We only need to ensure the user is signed in here; RLS will reject
  // any write coming from a general user.
  const session = await requireUser();
  if (!session.profile) return { ok: false as const, error: "Sign in required" };
  return { ok: true as const, profile: session.profile };
}

const programMetaSchema = z.object({
  theme: z.string().trim().max(200).optional().or(z.literal("")),
  hymn: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
});

export async function updateProgram(
  id: string,
  patch: { theme?: string | null; hymn?: string | null; notes?: string | null },
): Promise<ProgramActionResult> {
  const guard = await ensureCanEdit();
  if (!guard.ok) return guard;

  const parsed = programMetaSchema.safeParse({
    theme: patch.theme ?? "",
    hymn: patch.hymn ?? "",
    notes: patch.notes ?? "",
  });
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const supabase = createClient(await cookies());
  const update: TablesUpdate<"sunday_programs"> = {
    theme: parsed.data.theme?.trim() || null,
    hymn: parsed.data.hymn?.trim() || null,
    notes: parsed.data.notes?.trim() || null,
  };
  const { error } = await supabase
    .from("sunday_programs")
    .update(update)
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/sunday-program/${id}`);
  revalidatePath(`/sunday-program/${id}/present`);
  return { ok: true };
}

export async function addBlock(
  programId: string,
  input: { type: ProgramBlockType; label: string },
): Promise<ProgramActionResult> {
  const guard = await ensureCanEdit();
  if (!guard.ok) return guard;
  if (!BLOCK_TYPES.includes(input.type))
    return { ok: false, error: "Invalid block type" };

  const supabase = createClient(await cookies());

  // Compute next position
  const { data: existing } = await supabase
    .from("program_blocks")
    .select("position")
    .eq("sunday_program_id", programId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPos = (existing?.position ?? -1) + 1;

  const insert: TablesInsert<"program_blocks"> = {
    sunday_program_id: programId,
    type: input.type,
    label: input.label.trim() || defaultLabelFor(input.type),
    position: nextPos,
  };
  const { error } = await supabase.from("program_blocks").insert(insert);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/sunday-program/${programId}`);
  revalidatePath(`/sunday-program/${programId}/present`);
  return { ok: true };
}

const blockPatchSchema = z.object({
  label: z.string().trim().min(1).max(200).optional(),
  type: z.enum(BLOCK_TYPES).optional(),
  assignee_id: z.string().uuid().nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
});

export async function updateBlock(
  programId: string,
  blockId: string,
  patch: z.infer<typeof blockPatchSchema>,
): Promise<ProgramActionResult> {
  const guard = await ensureCanEdit();
  if (!guard.ok) return guard;
  const parsed = blockPatchSchema.safeParse(patch);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const supabase = createClient(await cookies());
  const update: TablesUpdate<"program_blocks"> = {
    ...(parsed.data.label !== undefined ? { label: parsed.data.label } : {}),
    ...(parsed.data.type !== undefined ? { type: parsed.data.type } : {}),
    ...(parsed.data.assignee_id !== undefined
      ? { assignee_id: parsed.data.assignee_id }
      : {}),
    ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
  };
  const { error } = await supabase
    .from("program_blocks")
    .update(update)
    .eq("id", blockId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/sunday-program/${programId}`);
  revalidatePath(`/sunday-program/${programId}/present`);
  return { ok: true };
}

export async function deleteBlock(
  programId: string,
  blockId: string,
): Promise<ProgramActionResult> {
  const guard = await ensureCanEdit();
  if (!guard.ok) return guard;
  const supabase = createClient(await cookies());
  const { error } = await supabase
    .from("program_blocks")
    .delete()
    .eq("id", blockId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/sunday-program/${programId}`);
  revalidatePath(`/sunday-program/${programId}/present`);
  return { ok: true };
}

export async function reorderBlocks(
  programId: string,
  orderedIds: string[],
): Promise<ProgramActionResult> {
  const guard = await ensureCanEdit();
  if (!guard.ok) return guard;
  const supabase = createClient(await cookies());

  // Two-phase update to avoid the (program, position) being treated as unique.
  // First push everything to a large unique negative space, then assign final
  // positions. This keeps things simple even though there's no real unique
  // constraint here.
  const tempUpdates = orderedIds.map((id, idx) =>
    supabase
      .from("program_blocks")
      .update({ position: -1000 - idx })
      .eq("id", id)
      .eq("sunday_program_id", programId),
  );
  const tempResults = await Promise.all(tempUpdates);
  for (const r of tempResults) {
    if (r.error) return { ok: false, error: r.error.message };
  }
  const finalUpdates = orderedIds.map((id, idx) =>
    supabase
      .from("program_blocks")
      .update({ position: idx })
      .eq("id", id)
      .eq("sunday_program_id", programId),
  );
  const finalResults = await Promise.all(finalUpdates);
  for (const r of finalResults) {
    if (r.error) return { ok: false, error: r.error.message };
  }

  revalidatePath(`/sunday-program/${programId}`);
  revalidatePath(`/sunday-program/${programId}/present`);
  return { ok: true };
}

export async function toggleBlockComplete(
  programId: string,
  blockId: string,
  complete: boolean,
): Promise<ProgramActionResult> {
  const guard = await ensureCanEdit();
  if (!guard.ok) return guard;
  const supabase = createClient(await cookies());
  const { error } = await supabase
    .from("program_blocks")
    .update({ completed_at: complete ? new Date().toISOString() : null })
    .eq("id", blockId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/sunday-program/${programId}`);
  revalidatePath(`/sunday-program/${programId}/present`);
  return { ok: true };
}

function defaultLabelFor(type: ProgramBlockType): string {
  switch (type) {
    case "presiding":
      return "Presiding";
    case "conducting":
      return "Conducting";
    case "youth_theme":
      return "Youth Theme";
    case "opening_prayer":
      return "Opening Prayer";
    case "teacher":
      return "Teacher";
    case "announcements":
      return "Announcements";
    case "musical_number":
      return "Musical Number";
    case "lesson":
      return "Lesson";
    case "custom":
    default:
      return "New section";
  }
}
