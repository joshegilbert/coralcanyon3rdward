"use client";

import { useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { toggleBlockComplete } from "@/app/actions/sunday-program";

interface PresentBlockProps {
  programId: string;
  blockId: string;
  index: number;
  label: string;
  name: string;
  isAdult: boolean;
  notes: string | null;
  completedAt: string | null;
  canEdit: boolean;
}

export function PresentBlock({
  programId,
  blockId,
  index,
  label,
  name,
  isAdult,
  notes,
  completedAt,
  canEdit,
}: PresentBlockProps) {
  const [pending, startTransition] = useTransition();
  const completed = !!completedAt;

  function toggle() {
    if (!canEdit) return;
    startTransition(async () => {
      const r = await toggleBlockComplete(programId, blockId, !completed);
      if (!r.ok) toast.error(r.error);
    });
  }

  return (
    <li
      onClick={toggle}
      onKeyDown={(e) => {
        if (canEdit && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          toggle();
        }
      }}
      role={canEdit ? "button" : undefined}
      tabIndex={canEdit ? 0 : undefined}
      className={cn(
        "flex items-start gap-5 rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border transition-all",
        canEdit && "cursor-pointer hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-amber-500",
        completed && "opacity-60",
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl font-bold tabular-nums transition-colors",
          completed
            ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
            : "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
        )}
      >
        {pending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : completed ? (
          <Check className="h-6 w-6" />
        ) : (
          index + 1
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className={cn("text-2xl font-semibold leading-tight", completed && "line-through")}>
          {label}
        </div>
        <div className="mt-1 text-lg text-muted-foreground">
          {name}
          {isAdult ? (
            <span className="ml-2 rounded-md bg-sky-100 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-sky-900 dark:bg-sky-950/40 dark:text-sky-200">
              Adult Advisor
            </span>
          ) : null}
        </div>
        {notes ? (
          <p className="mt-2 text-base text-muted-foreground">{notes}</p>
        ) : null}
      </div>
    </li>
  );
}
