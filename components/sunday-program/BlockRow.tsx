"use client";

import { useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Loader2,
  Trash2,
  UserRound,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  deleteBlock,
  updateBlock,
} from "@/app/actions/sunday-program";
import type { Profile, ProgramBlock, ProgramBlockType } from "@/lib/types";

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

const NO_ASSIGNEE = "__none__";

type Assignable = Pick<Profile, "id" | "first_name" | "last_name" | "role">;

interface BlockRowProps {
  index: number;
  total: number;
  programId: string;
  block: ProgramBlock & {
    assignee: Pick<Profile, "id" | "first_name" | "last_name" | "role"> | null;
  };
  assignableProfiles: Assignable[];
  lastPerformedByProfile: Map<string, Map<ProgramBlockType, string>>;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function BlockRow({
  index,
  total,
  programId,
  block,
  assignableProfiles,
  lastPerformedByProfile,
  onMoveUp,
  onMoveDown,
}: BlockRowProps) {
  const [pending, startTransition] = useTransition();
  const [label, setLabel] = useState(block.label);
  const [notes, setNotes] = useState(block.notes ?? "");
  const [type, setType] = useState<ProgramBlockType>(block.type);
  const [assigneeId, setAssigneeId] = useState<string>(
    block.assignee?.id ?? NO_ASSIGNEE,
  );

  function commitLabel() {
    if (label.trim() === "" || label === block.label) {
      if (label.trim() === "") setLabel(block.label);
      return;
    }
    startTransition(async () => {
      const r = await updateBlock(programId, block.id, { label: label.trim() });
      if (!r.ok) toast.error(r.error);
    });
  }

  function commitNotes() {
    if (notes === (block.notes ?? "")) return;
    startTransition(async () => {
      const r = await updateBlock(programId, block.id, {
        notes: notes.trim() || null,
      });
      if (!r.ok) toast.error(r.error);
    });
  }

  function commitType(next: ProgramBlockType) {
    setType(next);
    startTransition(async () => {
      const r = await updateBlock(programId, block.id, { type: next });
      if (!r.ok) toast.error(r.error);
    });
  }

  function commitAssignee(nextValue: string) {
    setAssigneeId(nextValue);
    const next = nextValue === NO_ASSIGNEE ? null : nextValue;
    startTransition(async () => {
      const r = await updateBlock(programId, block.id, { assignee_id: next });
      if (!r.ok) toast.error(r.error);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const r = await deleteBlock(programId, block.id);
      if (!r.ok) toast.error(r.error);
    });
  }

  const youth = assignableProfiles.filter((p) => p.role === "youth");
  const adults = assignableProfiles.filter((p) => p.role === "adult_leader");

  return (
    <li className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-start gap-2">
        <div className="flex flex-col items-center gap-1 pt-1">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold tabular-nums text-muted-foreground">
            {index + 1}
          </span>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={commitLabel}
              maxLength={200}
              placeholder="Label"
              className="font-medium"
            />
            <Select
              value={type}
              onValueChange={(v) => v && commitType(v as ProgramBlockType)}
            >
              <SelectTrigger>
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
          </div>

          <div className="grid gap-2 sm:grid-cols-[1fr]">
            <Select
              value={assigneeId}
              onValueChange={(v) => commitAssignee(v ?? NO_ASSIGNEE)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_ASSIGNEE}>
                  <span className="text-muted-foreground">Unassigned</span>
                </SelectItem>
                {youth.length > 0 ? (
                  <SelectGroup>
                    <SelectLabel>Youth</SelectLabel>
                    {youth.map((p) => (
                      <ProfileOption
                        key={p.id}
                        profile={p}
                        blockType={type}
                        lastPerformedByProfile={lastPerformedByProfile}
                      />
                    ))}
                  </SelectGroup>
                ) : null}
                {adults.length > 0 ? (
                  <SelectGroup>
                    <SelectLabel>Adult Advisors</SelectLabel>
                    {adults.map((p) => (
                      <ProfileOption
                        key={p.id}
                        profile={p}
                        blockType={type}
                        lastPerformedByProfile={lastPerformedByProfile}
                      />
                    ))}
                  </SelectGroup>
                ) : null}
              </SelectContent>
            </Select>
          </div>

          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={commitNotes}
            rows={2}
            maxLength={2000}
            placeholder="Notes (optional)"
            className="text-sm"
          />
        </div>

        <div className="flex flex-col items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onMoveUp}
            disabled={pending || index === 0}
            aria-label="Move up"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onMoveDown}
            disabled={pending || index === total - 1}
            aria-label="Move down"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Delete"
                  className={cn(
                    "text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30",
                  )}
                />
              }
            >
              <Trash2 className="h-4 w-4" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this block?</AlertDialogTitle>
                <AlertDialogDescription>
                  Remove &ldquo;{block.label}&rdquo; from the agenda.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  type="button"
                  className="bg-rose-600 text-white hover:bg-rose-700"
                  onClick={handleDelete}
                  disabled={pending}
                >
                  {pending ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-1.5 h-4 w-4" />
                  )}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </li>
  );
}

interface ProfileOptionProps {
  profile: Assignable;
  blockType: ProgramBlockType;
  lastPerformedByProfile: Map<string, Map<ProgramBlockType, string>>;
}

function ProfileOption({
  profile,
  blockType,
  lastPerformedByProfile,
}: ProfileOptionProps) {
  const last = lastPerformedByProfile.get(profile.id)?.get(blockType);
  const lastLabel = last ? format(new Date(last), "MMM d") : null;
  const name = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();

  return (
    <SelectItem value={profile.id}>
      <span className="flex w-full items-center justify-between gap-3">
        <span className="flex items-center gap-1.5">
          <UserRound className="h-3.5 w-3.5 opacity-70" />
          {name}
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {profile.role === "adult_leader" ? "Adult" : "Youth"}
          </span>
        </span>
        {lastLabel ? (
          <span className="text-[10px] text-muted-foreground">last {lastLabel}</span>
        ) : null}
      </span>
    </SelectItem>
  );
}
