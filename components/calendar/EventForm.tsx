"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Loader2, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
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
  createEvent,
  deleteEvent,
  updateEvent,
  type EventActionResult,
} from "@/app/actions/events";
import type { EventRow, EventType } from "@/lib/types";

const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: "sunday_school", label: "Sunday School" },
  { value: "quorum_meeting", label: "Quorum Meeting" },
  { value: "activity", label: "Activity" },
  { value: "camp", label: "Camp / Trip" },
  { value: "service", label: "Service" },
  { value: "other", label: "Other" },
];

const DEFAULT_REQUIRES_RSVP_BY_TYPE: Record<EventType, boolean> = {
  sunday_school: false,
  quorum_meeting: true,
  activity: true,
  camp: true,
  service: true,
  other: true,
};

function toLocalInputValue(iso: string | undefined, fallback?: Date): string {
  if (iso) {
    const d = new Date(iso);
    return format(d, "yyyy-MM-dd'T'HH:mm");
  }
  if (fallback) return format(fallback, "yyyy-MM-dd'T'HH:mm");
  return "";
}

interface EventFormProps {
  mode: "create" | "edit";
  event?: EventRow;
  /** Pre-filled start date for create mode (from ?date=YYYY-MM-DD). */
  defaultDate?: Date;
}

export function EventForm({ mode, event, defaultDate }: EventFormProps) {
  const [isDeleting, startDeleting] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const action = mode === "create"
    ? createEvent
    : updateEvent.bind(null, event!.id);
  const [state, formAction, pending] = useActionState<EventActionResult | null, FormData>(
    action,
    null,
  );

  // Smart RSVP-required default: flips when type changes, but respect manual edits
  const initialType: EventType = event?.type ?? "activity";
  const initialRsvp =
    event?.rsvp_required ?? DEFAULT_REQUIRES_RSVP_BY_TYPE[initialType];
  const [type, setType] = useState<EventType>(initialType);
  const [rsvpRequired, setRsvpRequired] = useState<boolean>(initialRsvp);
  const [rsvpEdited, setRsvpEdited] = useState(false);

  const start8amDefault = (() => {
    if (defaultDate) {
      const d = new Date(defaultDate);
      d.setHours(19, 0, 0, 0);
      return d;
    }
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    return d;
  })();
  const end1hDefault = new Date(start8amDefault.getTime() + 60 * 60 * 1000);

  function handleTypeChange(next: EventType) {
    setType(next);
    if (!rsvpEdited) setRsvpRequired(DEFAULT_REQUIRES_RSVP_BY_TYPE[next]);
  }

  useEffect(() => {
    if (state && !state.ok) toast.error(state.error);
  }, [state]);

  const fieldErrors = state && !state.ok ? state.fieldErrors ?? {} : {};

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          maxLength={200}
          defaultValue={event?.title ?? ""}
          autoFocus={mode === "create"}
          aria-invalid={!!fieldErrors.title}
        />
        {fieldErrors.title ? (
          <p className="text-xs text-rose-600">{fieldErrors.title}</p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => handleTypeChange(v as EventType)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="type" value={type} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            maxLength={200}
            placeholder="Chapel"
            defaultValue={event?.location ?? ""}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="start_at">Starts</Label>
          <Input
            type="datetime-local"
            id="start_at"
            name="start_at"
            required
            defaultValue={toLocalInputValue(event?.start_at, start8amDefault)}
            aria-invalid={!!fieldErrors.start_at}
          />
          {fieldErrors.start_at ? (
            <p className="text-xs text-rose-600">{fieldErrors.start_at}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="end_at">Ends</Label>
          <Input
            type="datetime-local"
            id="end_at"
            name="end_at"
            required
            defaultValue={toLocalInputValue(event?.end_at, end1hDefault)}
            aria-invalid={!!fieldErrors.end_at}
          />
          {fieldErrors.end_at ? (
            <p className="text-xs text-rose-600">{fieldErrors.end_at}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          maxLength={4000}
          placeholder="Optional details, agenda notes, what to bring..."
          defaultValue={event?.description ?? ""}
        />
      </div>

      <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3">
        <div className="space-y-0.5">
          <Label htmlFor="rsvp_required" className="cursor-pointer">
            Requires leader RSVP
          </Label>
          <p className="text-xs text-muted-foreground">
            When on, this event appears in the Leader RSVP page and the
            two-deep-coverage warning shows on the dashboard.
          </p>
        </div>
        <Switch
          id="rsvp_required"
          checked={rsvpRequired}
          onCheckedChange={(v) => {
            setRsvpEdited(true);
            setRsvpRequired(Boolean(v));
          }}
        />
        <input
          type="hidden"
          name="rsvp_required"
          value={rsvpRequired ? "on" : ""}
        />
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <div>
          {mode === "edit" ? (
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30"
                    disabled={isDeleting}
                  />
                }
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Delete event
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this event?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes &ldquo;{event!.title}&rdquo; and any leader RSVPs attached to it.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    type="button"
                    className="bg-rose-600 text-white hover:bg-rose-700"
                    onClick={() =>
                      startDeleting(async () => {
                        const result = await deleteEvent(event!.id);
                        if (result && !result.ok) toast.error(result.error);
                      })
                    }
                  >
                    {isDeleting ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-1.5 h-4 w-4" />
                    )}
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={
              mode === "edit"
                ? `/calendar?date=${(event?.start_at ?? "").slice(0, 10)}`
                : "/calendar"
            }
            className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer")}
          >
            Cancel
          </Link>
          <Button type="submit" disabled={pending || isDeleting}>
            {pending ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Saving
              </>
            ) : mode === "create" ? (
              "Create event"
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

EventForm.displayName = "EventForm";
