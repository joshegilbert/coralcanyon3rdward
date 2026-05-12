"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarPlus, Plus, UserPlus, X } from "lucide-react";
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ResponsiveSheetContent } from "@/components/ui/responsive-sheet";
import { cn } from "@/lib/utils";

export function LeaderQuickAddFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Quick add"
        className={cn(
          "fixed right-4 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg shadow-amber-500/30 transition-transform hover:scale-105 active:scale-95 lg:hidden",
        )}
        style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}
      >
        <Plus className="h-6 w-6" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <ResponsiveSheetContent>
          <SheetHeader>
            <SheetTitle>Quick add</SheetTitle>
            <SheetDescription>
              Start something new — fill in the details on the next screen.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-2 px-4 pb-6">
            <Link
              href="/calendar/new"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors active:bg-muted"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                <CalendarPlus className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">New event</p>
                <p className="text-xs text-muted-foreground">
                  Activity, camp, service, Sunday meeting, etc.
                </p>
              </div>
            </Link>
            <Link
              href="/people"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors active:bg-muted"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                <UserPlus className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Invite person</p>
                <p className="text-xs text-muted-foreground">
                  Add a new leader, youth, or parent.
                </p>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-2 flex h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card text-sm font-medium text-muted-foreground"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </ResponsiveSheetContent>
      </Sheet>
    </>
  );
}
