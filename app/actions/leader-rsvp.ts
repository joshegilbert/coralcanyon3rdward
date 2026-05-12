"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import type { TablesInsert } from "@/lib/types/database";

const schema = z.object({
  eventId: z.uuid(),
  status: z.enum(["attending", "unavailable", "undecided"]),
});

export async function setLeaderRsvp(formData: FormData): Promise<void> {
  const parsed = schema.safeParse({
    eventId: formData.get("eventId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const values: TablesInsert<"leader_rsvps"> = {
    event_id: parsed.data.eventId,
    leader_id: user.id,
    status: parsed.data.status,
  };

  await supabase
    .from("leader_rsvps")
    .upsert(values, { onConflict: "event_id,leader_id" });

  revalidatePath("/");
  revalidatePath("/leaders/rsvp");
}
