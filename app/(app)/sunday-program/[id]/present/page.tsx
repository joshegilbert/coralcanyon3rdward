import { cookies } from "next/headers";
import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import { X } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { requireUser } from "@/lib/auth";
import { PresentBlock } from "@/components/sunday-program/PresentBlock";

export const dynamic = "force-dynamic";

export default async function SundayProgramPresentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireUser();
  const supabase = createClient(await cookies());

  type ProgramJoined = {
    id: string;
    theme: string | null;
    hymn: string | null;
    event:
      | { id: string; title: string; start_at: string }
      | { id: string; title: string; start_at: string }[]
      | null;
  };

  type BlockJoined = {
    id: string;
    label: string;
    notes: string | null;
    position: number;
    completed_at: string | null;
    assignee:
      | { first_name: string; last_name: string; role: "adult_leader" | "youth" | "general" }
      | { first_name: string; last_name: string; role: "adult_leader" | "youth" | "general" }[]
      | null;
  };

  const { data: programData } = await supabase
    .from("sunday_programs")
    .select("id, theme, hymn, event:events(id, title, start_at)")
    .eq("id", id)
    .maybeSingle();

  const program = programData as unknown as ProgramJoined | null;
  if (!program) notFound();

  const { data: blocksData } = await supabase
    .from("program_blocks")
    .select(
      "id, label, notes, position, completed_at, assignee:profiles(first_name, last_name, role)",
    )
    .eq("sunday_program_id", id)
    .order("position", { ascending: true });

  const blocks = (blocksData ?? []) as unknown as BlockJoined[];

  const event = Array.isArray(program.event) ? program.event[0] : program.event;
  const eventDate = event ? new Date(event.start_at) : null;
  const canEdit =
    session.profile?.role === "adult_leader" ||
    session.profile?.role === "youth";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-amber-50 via-white to-sky-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="mx-auto max-w-4xl px-6 py-12 lg:px-12 lg:py-20">
        <div className="mb-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">
              Coral Canyon 3rd Ward
            </p>
            <h1 className="mt-1 text-4xl font-bold tracking-tight lg:text-5xl">
              {event?.title}
            </h1>
            {eventDate ? (
              <p className="mt-1 text-lg text-muted-foreground">
                {format(eventDate, "EEEE, MMMM d")}
              </p>
            ) : null}
            {program.theme ? (
              <p className="mt-3 text-xl font-medium text-amber-700 dark:text-amber-400">
                {program.theme}
              </p>
            ) : null}
            {canEdit ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Tap a block to mark it complete.
              </p>
            ) : null}
          </div>
          <Link
            href={`/sunday-program/${id}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-card text-foreground shadow-sm ring-1 ring-border hover:bg-muted"
            aria-label="Close present view"
          >
            <X className="h-5 w-5" />
          </Link>
        </div>

        <ol className="space-y-4">
          {blocks.map((b, idx) => {
            const assignee = Array.isArray(b.assignee)
              ? b.assignee[0]
              : b.assignee;
            const name = assignee
              ? `${assignee.first_name} ${assignee.last_name}`
              : "Unassigned";
            const isAdult = assignee?.role === "adult_leader";
            return (
              <PresentBlock
                key={b.id}
                programId={id}
                blockId={b.id}
                index={idx}
                label={b.label}
                name={name}
                isAdult={isAdult}
                notes={b.notes}
                completedAt={b.completed_at}
                canEdit={canEdit}
              />
            );
          })}
        </ol>

        {program.hymn ? (
          <div className="mt-10 rounded-2xl bg-card p-6 text-center shadow-sm ring-1 ring-border">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Opening Hymn
            </p>
            <p className="mt-2 text-2xl font-semibold">{program.hymn}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
