"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Archive, Loader2, Pencil, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  createCalling,
  updateCalling,
  archiveCalling,
  restoreCalling,
  type ActionResult,
} from "@/app/actions/people";
import { toast } from "sonner";
import type { Calling } from "@/lib/types";

interface CallingsAdminProps {
  callings: Calling[];
}

export function CallingsAdmin({ callings }: CallingsAdminProps) {
  const [editing, setEditing] = useState<Calling | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, startTransition] = useTransition();
  const [showArchived, setShowArchived] = useState(false);

  const active = callings.filter((c) => !c.archived_at);
  const archived = callings.filter((c) => c.archived_at);

  function handleArchive(id: string) {
    startTransition(async () => {
      const r = await archiveCalling(id);
      if (r.ok) toast.success("Calling archived");
      else toast.error(r.error);
    });
  }

  function handleRestore(id: string) {
    startTransition(async () => {
      const r = await restoreCalling(id);
      if (r.ok) toast.success("Calling restored");
      else toast.error(r.error);
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-base">Callings</CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Organizational titles you can assign to youth (purely for display).
          </p>
        </div>
        <Button
          onClick={() => setCreating(true)}
          size="sm"
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Add calling
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {active.length === 0 ? (
          <p className="text-sm italic text-muted-foreground">
            No callings yet. Create one to start assigning.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {active.map((c) => (
              <li
                key={c.id}
                className="flex items-start justify-between gap-2 rounded-md border border-border bg-background px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.slug}</p>
                  {c.description ? (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {c.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setEditing(c)}
                    aria-label="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleArchive(c.id)}
                    disabled={pending}
                    aria-label="Archive"
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {archived.length > 0 ? (
          <div className="border-t border-border pt-3">
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              className="text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {showArchived ? "Hide" : "Show"} archived ({archived.length})
            </button>
            {showArchived ? (
              <ul className="mt-2 space-y-1.5">
                {archived.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-dashed border-border bg-muted/20 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        Archived
                      </Badge>
                      <span className="font-medium">{c.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRestore(c.id)}
                      disabled={pending}
                      className="gap-1"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Restore
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </CardContent>

      <CallingFormSheet
        open={creating}
        onOpenChange={setCreating}
        mode="create"
      />
      {editing ? (
        <CallingFormSheet
          open
          onOpenChange={(open) => !open && setEditing(null)}
          mode="edit"
          calling={editing}
        />
      ) : null}
    </Card>
  );
}

interface CallingFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  calling?: Calling;
}

function CallingFormSheet({
  open,
  onOpenChange,
  mode,
  calling,
}: CallingFormSheetProps) {
  const action =
    mode === "create"
      ? createCalling
      : updateCalling.bind(null, calling!.id);
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    action,
    null,
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(mode === "create" ? "Calling created" : "Calling updated");
      onOpenChange(false);
    } else {
      toast.error(state.error);
    }
  }, [state, mode, onOpenChange]);

  const fieldErrors = state && !state.ok ? state.fieldErrors ?? {} : {};

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {mode === "create" ? "New calling" : "Edit calling"}
          </SheetTitle>
        </SheetHeader>
        <form action={formAction} className="space-y-4 px-4 pb-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              required
              maxLength={120}
              placeholder="President"
              defaultValue={calling?.name ?? ""}
              aria-invalid={!!fieldErrors.name}
            />
            {fieldErrors.name ? (
              <p className="text-xs text-rose-600">{fieldErrors.name}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
              required
              maxLength={120}
              placeholder="president"
              defaultValue={calling?.slug ?? ""}
              aria-invalid={!!fieldErrors.slug}
            />
            <p className="text-xs text-muted-foreground">
              Lowercase, numbers, and hyphens only.
            </p>
            {fieldErrors.slug ? (
              <p className="text-xs text-rose-600">{fieldErrors.slug}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              name="description"
              rows={2}
              maxLength={500}
              defaultValue={calling?.description ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sort_order">Sort order</Label>
            <Input
              type="number"
              id="sort_order"
              name="sort_order"
              min={0}
              max={999}
              defaultValue={calling?.sort_order ?? 0}
            />
          </div>
          <SheetFooter className="p-0 pt-2">
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving
                  </>
                ) : mode === "create" ? (
                  "Create calling"
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
