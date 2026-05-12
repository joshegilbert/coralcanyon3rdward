import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { ChevronLeft } from "lucide-react";
import { requireAdultLeader } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import { EventForm } from "@/components/calendar/EventForm";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EventRow } from "@/lib/types";

export const metadata = { title: "Edit event - Coral Canyon 3rd Ward" };

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdultLeader();
  const { id } = await params;
  const supabase = createClient(await cookies());
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle<EventRow>();

  if (!event) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/calendar?date=${event.start_at.slice(0, 10)}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2 mb-1 gap-1 text-muted-foreground",
          )}
        >
          <ChevronLeft className="h-4 w-4" /> Back to calendar
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Edit event</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update the details below. Changes are reflected immediately on the
          calendar and Leader RSVP page.
        </p>
      </div>
      <EventForm mode="edit" event={event} />
    </div>
  );
}
