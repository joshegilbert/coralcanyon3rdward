"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateProfile, type ActionResult } from "@/app/actions/people";
import { toast } from "sonner";
import type { Profile, Role } from "@/lib/types";
import type { DirectoryEntry } from "@/lib/queries/people";

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "adult_leader", label: "Adult Leader" },
  { value: "youth", label: "Youth" },
  { value: "general", label: "Parent / Member" },
];

interface EditProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: DirectoryEntry;
  allYouth: Profile[];
}

export function EditProfileSheet({
  open,
  onOpenChange,
  entry,
  allYouth,
}: EditProfileSheetProps) {
  const { profile } = entry;
  const boundUpdate = updateProfile.bind(null, profile.id);
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    boundUpdate,
    null,
  );
  const [role, setRole] = useState<Role>(profile.role);
  const [parentOf, setParentOf] = useState<Set<string>>(
    new Set(profile.parent_of_ids ?? []),
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success("Profile updated");
      onOpenChange(false);
    } else {
      toast.error(state.error);
    }
  }, [state, onOpenChange]);

  const fieldErrors = state && !state.ok ? state.fieldErrors ?? {} : {};

  function toggleParent(id: string) {
    setParentOf((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>
            Update {profile.first_name} {profile.last_name}&rsquo;s details and
            role. Changing a youth&rsquo;s role releases their callings.
          </SheetDescription>
        </SheetHeader>
        <form action={formAction} className="space-y-4 px-4 pb-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">First name</Label>
              <Input
                id="first_name"
                name="first_name"
                required
                maxLength={80}
                defaultValue={profile.first_name ?? ""}
                aria-invalid={!!fieldErrors.first_name}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">Last name</Label>
              <Input
                id="last_name"
                name="last_name"
                required
                maxLength={80}
                defaultValue={profile.last_name ?? ""}
                aria-invalid={!!fieldErrors.last_name}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="role" value={role} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="birth_date">Birthday</Label>
              <Input
                type="date"
                id="birth_date"
                name="birth_date"
                defaultValue={profile.birth_date ?? ""}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="avatar_color">Avatar color (optional hex)</Label>
            <Input
              id="avatar_color"
              name="avatar_color"
              maxLength={20}
              placeholder="#16a34a"
              defaultValue={profile.avatar_color ?? ""}
            />
          </div>
          {role === "general" && allYouth.length > 0 ? (
            <div className="space-y-1.5">
              <Label>Parent of</Label>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border bg-muted/30 p-2">
                {allYouth.map((y) => {
                  const checked = parentOf.has(y.id);
                  return (
                    <label
                      key={y.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-background"
                    >
                      <input
                        type="checkbox"
                        name="parent_of_ids[]"
                        value={y.id}
                        checked={checked}
                        onChange={() => toggleParent(y.id)}
                      />
                      <span>
                        {y.first_name} {y.last_name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : null}
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
