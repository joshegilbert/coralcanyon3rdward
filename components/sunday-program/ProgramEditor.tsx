"use client";

import { useMemo, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { reorderBlocks } from "@/app/actions/sunday-program";
import { BlockRow } from "./BlockRow";
import { ProgramMetaForm } from "./ProgramMetaForm";
import { AddBlockButton } from "./AddBlockButton";
import type { ProgramForEdit } from "@/lib/queries/sunday-program";

interface ProgramEditorProps {
  data: ProgramForEdit;
  canEdit: boolean;
}

export function ProgramEditor({ data, canEdit }: ProgramEditorProps) {
  const [, startTransition] = useTransition();

  const orderedBlocks = useMemo(
    () => [...data.blocks].sort((a, b) => a.position - b.position),
    [data.blocks],
  );

  function moveBlock(blockId: string, direction: -1 | 1) {
    const ids = orderedBlocks.map((b) => b.id);
    const i = ids.indexOf(blockId);
    if (i < 0) return;
    const j = i + direction;
    if (j < 0 || j >= ids.length) return;
    const next = [...ids];
    [next[i], next[j]] = [next[j], next[i]];
    startTransition(async () => {
      const r = await reorderBlocks(data.program.id, next);
      if (!r.ok) toast.error(r.error);
    });
  }

  if (!canEdit) {
    return (
      <ReadOnlyView blocks={orderedBlocks} program={data.program} />
    );
  }

  return (
    <div className="space-y-6">
      <ProgramMetaForm program={data.program} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agenda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {orderedBlocks.length === 0 ? (
            <p className="text-sm italic text-muted-foreground">
              No blocks yet. Add the first one below.
            </p>
          ) : (
            <ul className="space-y-2">
              {orderedBlocks.map((b, idx) => (
                <BlockRow
                  key={b.id}
                  index={idx}
                  total={orderedBlocks.length}
                  programId={data.program.id}
                  block={b}
                  assignableProfiles={data.assignableProfiles}
                  lastPerformedByProfile={data.lastPerformed}
                  onMoveUp={() => moveBlock(b.id, -1)}
                  onMoveDown={() => moveBlock(b.id, 1)}
                />
              ))}
            </ul>
          )}

          <AddBlockButton programId={data.program.id} />
        </CardContent>
      </Card>
    </div>
  );
}

function ReadOnlyView({
  blocks,
  program,
}: {
  blocks: ProgramForEdit["blocks"];
  program: ProgramForEdit["program"];
}) {
  return (
    <div className="space-y-6">
      {program.theme || program.hymn || program.notes ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Program details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {program.theme ? (
              <p>
                <span className="text-muted-foreground">Theme: </span>
                {program.theme}
              </p>
            ) : null}
            {program.hymn ? (
              <p>
                <span className="text-muted-foreground">Hymn: </span>
                {program.hymn}
              </p>
            ) : null}
            {program.notes ? (
              <p className="mt-2 whitespace-pre-wrap text-foreground">
                {program.notes}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agenda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {blocks.length === 0 ? (
            <p className="text-sm italic text-muted-foreground">
              No agenda blocks yet.
            </p>
          ) : (
            <ol className="space-y-2">
              {blocks.map((b, idx) => {
                const a = b.assignee;
                return (
                  <li
                    key={b.id}
                    className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold tabular-nums">
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{b.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {a
                          ? `${a.first_name} ${a.last_name}${a.role === "adult_leader" ? " (Adult Advisor)" : ""}`
                          : "Unassigned"}
                      </p>
                      {b.notes ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {b.notes}
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
