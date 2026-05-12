"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addBlock } from "@/app/actions/sunday-program";
import { toast } from "sonner";
import type { ProgramBlockType } from "@/lib/types";

const BLOCK_TYPE_OPTIONS: { value: ProgramBlockType; label: string }[] = [
  { value: "presiding", label: "Presiding" },
  { value: "conducting", label: "Conducting" },
  { value: "youth_theme", label: "Youth Theme" },
  { value: "opening_prayer", label: "Opening Prayer" },
  { value: "teacher", label: "Teacher" },
  { value: "lesson", label: "Lesson" },
  { value: "announcements", label: "Announcements" },
  { value: "musical_number", label: "Musical Number" },
  { value: "custom", label: "Custom" },
];

const LABEL_FOR: Record<ProgramBlockType, string> = {
  presiding: "Presiding",
  conducting: "Conducting",
  youth_theme: "Youth Theme",
  opening_prayer: "Opening Prayer",
  teacher: "Teacher",
  lesson: "Lesson",
  announcements: "Announcements",
  musical_number: "Musical Number",
  custom: "New section",
};

interface AddBlockButtonProps {
  programId: string;
}

export function AddBlockButton({ programId }: AddBlockButtonProps) {
  const [type, setType] = useState<ProgramBlockType>("custom");
  const [pending, startTransition] = useTransition();

  function handleAdd() {
    startTransition(async () => {
      const r = await addBlock(programId, { type, label: LABEL_FOR[type] });
      if (!r.ok) toast.error(r.error);
    });
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-3">
      <Select value={type} onValueChange={(v) => v && setType(v as ProgramBlockType)}>
        <SelectTrigger className="w-full sm:w-60">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {BLOCK_TYPE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={handleAdd} disabled={pending} className="gap-1.5">
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        Add block
      </Button>
    </div>
  );
}
