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
import { invitePerson, type ActionResult } from "@/app/actions/people";
import { toast } from "sonner";
import type { Role } from "@/lib/types";

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "adult_leader", label: "Adult Leader" },
  { value: "youth", label: "Youth" },
  { value: "general", label: "Parent / Member" },
];

interface InvitePersonSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvitePersonSheet({ open, onOpenChange }: InvitePersonSheetProps) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    invitePerson,
    null,
  );
  const [role, setRole] = useState<Role>("general");

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Invite sent");
      onOpenChange(false);
    } else {
      toast.error(state.error);
    }
  }, [state, onOpenChange]);

  const fieldErrors = state && !state.ok ? state.fieldErrors ?? {} : {};

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Invite person</SheetTitle>
          <SheetDescription>
            Send a magic-link invite. They&rsquo;ll get an email to set their
            password and finish signing up.
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
                aria-invalid={!!fieldErrors.first_name}
              />
              {fieldErrors.first_name ? (
                <p className="text-xs text-rose-600">{fieldErrors.first_name}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">Last name</Label>
              <Input
                id="last_name"
                name="last_name"
                required
                maxLength={80}
                aria-invalid={!!fieldErrors.last_name}
              />
              {fieldErrors.last_name ? (
                <p className="text-xs text-rose-600">{fieldErrors.last_name}</p>
              ) : null}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              aria-invalid={!!fieldErrors.email}
            />
            {fieldErrors.email ? (
              <p className="text-xs text-rose-600">{fieldErrors.email}</p>
            ) : null}
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
              <Label htmlFor="birth_date">Birthday (optional)</Label>
              <Input type="date" id="birth_date" name="birth_date" />
            </div>
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
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Sending
                  </>
                ) : (
                  "Send invite"
                )}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
