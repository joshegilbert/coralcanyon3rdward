"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CallingBadge } from "@/components/shared/CallingBadge";
import { assignCalling, releaseCallingForProfile } from "@/app/actions/people";
import { toast } from "sonner";
import type { Calling } from "@/lib/types";
import type { DirectoryEntry } from "@/lib/queries/people";

interface ManageCallingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: DirectoryEntry;
  allCallings: Calling[];
}

export function ManageCallingsSheet({
  open,
  onOpenChange,
  entry,
  allCallings,
}: ManageCallingsSheetProps) {
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string>("");
  const heldIds = new Set(entry.callings.map((c) => c.id));
  const available = allCallings.filter((c) => !heldIds.has(c.id));

  function handleAssign() {
    if (!selected) return;
    startTransition(async () => {
      const r = await assignCalling(entry.profile.id, selected);
      if (r.ok) {
        toast.success("Calling assigned");
        setSelected("");
      } else {
        toast.error(r.error);
      }
    });
  }

  function handleRelease(callingId: string) {
    startTransition(async () => {
      const r = await releaseCallingForProfile(entry.profile.id, callingId);
      if (r.ok) toast.success("Calling released");
      else toast.error(r.error);
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Callings for {entry.profile.first_name}</SheetTitle>
          <SheetDescription>
            Assign or release organizational titles. Callings are display-only -
            they don&rsquo;t change permissions.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-5 px-4 pb-4">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Current callings
            </h3>
            {entry.callings.length === 0 ? (
              <p className="mt-2 text-sm italic text-muted-foreground">
                No callings held.
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {entry.callings.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2"
                  >
                    <CallingBadge callings={[c]} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRelease(c.id)}
                      disabled={pending}
                      className="gap-1 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30"
                    >
                      <X className="h-3.5 w-3.5" />
                      Release
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Add a calling
            </h3>
            {available.length === 0 ? (
              <p className="mt-2 text-sm italic text-muted-foreground">
                No additional callings available. Create one in the Callings
                admin card on the People page.
              </p>
            ) : (
              <div className="mt-2 flex items-center gap-2">
                <Select value={selected} onValueChange={(v) => setSelected(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a calling...">
                      {(value) => {
                        if (!value) return "Choose a calling...";
                        const c = available.find((x) => x.id === value);
                        return c?.name ?? "Choose a calling...";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {available.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={handleAssign}
                  disabled={!selected || pending}
                  className="gap-1.5"
                >
                  {pending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Assign
                </Button>
              </div>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
