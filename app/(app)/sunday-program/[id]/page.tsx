import { cookies } from "next/headers";
import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Maximize2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/utils/supabase/server";
import { PersonLabel } from "@/components/shared/PersonLabel";

export const dynamic = "force-dynamic";

const BLOCK_TYPE_LABEL: Record<string, string> = {
  presiding: "Presiding",
  conducting: "Conducting",
  youth_theme: "Youth Theme",
  opening_prayer: "Opening Prayer",
  teacher: "Teacher",
  announcements: "Announcements",
  musical_number: "Musical Number",
  lesson: "Lesson",
  custom: "",
};

export default async function SundayProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createClient(await cookies());

  type ProgramJoined = {
    id: string;
    theme: string | null;
    hymn: string | null;
    notes: string | null;
    event:
      | {
          id: string;
          title: string;
          start_at: string;
          end_at: string;
          location: string | null;
        }
      | { id: string; title: string; start_at: string; end_at: string; location: string | null }[]
      | null;
  };

  type BlockJoined = {
    id: string;
    type: string;
    label: string;
    notes: string | null;
    position: number;
    assignee:
      | { id: string; first_name: string; last_name: string; role: "adult_leader" | "youth" | "general" }
      | { id: string; first_name: string; last_name: string; role: "adult_leader" | "youth" | "general" }[]
      | null;
  };

  const { data: programData } = await supabase
    .from("sunday_programs")
    .select(
      "id, theme, hymn, notes, event:events(id, title, start_at, end_at, location)",
    )
    .eq("id", id)
    .maybeSingle();

  const program = programData as unknown as ProgramJoined | null;
  if (!program) notFound();

  const { data: blocksData } = await supabase
    .from("program_blocks")
    .select(
      "id, type, label, notes, position, assignee:profiles(id, first_name, last_name, role)",
    )
    .eq("sunday_program_id", id)
    .order("position", { ascending: true });

  const blocks = (blocksData ?? []) as unknown as BlockJoined[];

  const event = Array.isArray(program.event) ? program.event[0] : program.event;
  const eventDate = event ? new Date(event.start_at) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Sunday Program
          </p>
          <h1 className="text-2xl font-semibold">{event?.title}</h1>
          {eventDate ? (
            <p className="text-sm text-muted-foreground">
              {format(eventDate, "EEEE, MMMM d, yyyy")}
              {event?.location ? ` · ${event.location}` : ""}
            </p>
          ) : null}
          {program.theme ? (
            <p className="mt-2 text-sm font-medium text-amber-700 dark:text-amber-400">
              Theme: {program.theme}
            </p>
          ) : null}
        </div>
        <Link
          href={`/sunday-program/${id}/present`}
          className={buttonVariants()}
        >
          <Maximize2 className="mr-2 h-4 w-4" />
          Present
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agenda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {blocks.length > 0 ? (
            blocks.map((b, idx) => {
              const assignee = Array.isArray(b.assignee)
                ? b.assignee[0]
                : b.assignee;
              const typeLabel = BLOCK_TYPE_LABEL[b.type] || "";
              return (
                <div
                  key={b.id}
                  className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-semibold tabular-nums">
                    {idx + 1}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-medium">{b.label}</span>
                      {typeLabel && typeLabel !== b.label ? (
                        <span className="text-xs uppercase tracking-wider text-muted-foreground">
                          {typeLabel}
                        </span>
                      ) : null}
                    </div>
                    {assignee ? (
                      <PersonLabel profile={assignee} short />
                    ) : (
                      <span className="text-sm italic text-muted-foreground">
                        Unassigned
                      </span>
                    )}
                    {b.notes ? (
                      <p className="text-sm text-muted-foreground">{b.notes}</p>
                    ) : null}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">
              No agenda blocks yet. The editor is coming soon.
            </p>
          )}
        </CardContent>
      </Card>

      {program.notes ? (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap text-sm">
            {program.notes}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
