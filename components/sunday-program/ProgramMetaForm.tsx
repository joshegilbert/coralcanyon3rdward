"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProgram } from "@/app/actions/sunday-program";
import { toast } from "sonner";
import type { SundayProgram } from "@/lib/types";

interface ProgramMetaFormProps {
  program: SundayProgram;
}

export function ProgramMetaForm({ program }: ProgramMetaFormProps) {
  const [theme, setTheme] = useState(program.theme ?? "");
  const [hymn, setHymn] = useState(program.hymn ?? "");
  const [notes, setNotes] = useState(program.notes ?? "");
  const [, startTransition] = useTransition();

  function commit(patch: { theme?: string; hymn?: string; notes?: string }) {
    startTransition(async () => {
      const r = await updateProgram(program.id, patch);
      if (!r.ok) toast.error(r.error);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Program details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="theme">Theme</Label>
            <Input
              id="theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              onBlur={() => commit({ theme })}
              maxLength={200}
              placeholder="e.g. Faith in Jesus Christ"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hymn">Opening hymn</Label>
            <Input
              id="hymn"
              value={hymn}
              onChange={(e) => setHymn(e.target.value)}
              onBlur={() => commit({ hymn })}
              maxLength={200}
              placeholder="e.g. #19 We Thank Thee, O God, for a Prophet"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => commit({ notes })}
            rows={3}
            maxLength={4000}
            placeholder="Anything else worth remembering"
          />
        </div>
        <p className="text-xs italic text-muted-foreground">
          Changes save when you click out of a field.
        </p>
      </CardContent>
    </Card>
  );
}
