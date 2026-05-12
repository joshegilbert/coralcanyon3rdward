"use client";

import { useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteProfile } from "@/app/actions/people";
import { toast } from "sonner";
import type { DirectoryEntry } from "@/lib/queries/people";

interface DeleteProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: DirectoryEntry;
}

export function DeleteProfileDialog({
  open,
  onOpenChange,
  entry,
}: DeleteProfileDialogProps) {
  const [pending, startTransition] = useTransition();
  const fullName = `${entry.profile.first_name} ${entry.profile.last_name}`.trim();

  function handleDelete() {
    startTransition(async () => {
      const r = await deleteProfile(entry.profile.id);
      if (r.ok) {
        toast.success(`${fullName} removed`);
        onOpenChange(false);
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {fullName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This deletes their account and all of their data including RSVPs
            and calling assignments. They&rsquo;ll need a fresh invite to
            return.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
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
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
