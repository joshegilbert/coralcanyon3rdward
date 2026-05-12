import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAdultLeader } from "@/lib/auth";
import { parseDateParam } from "@/lib/calendar";
import { EventForm } from "@/components/calendar/EventForm";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = { title: "New event - Coral Canyon 3rd Ward" };

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  await requireAdultLeader();
  const params = await searchParams;
  const defaultDate = params.date ? parseDateParam(params.date) : new Date();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/calendar?date=${params.date ?? ""}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2 mb-1 gap-1 text-muted-foreground",
          )}
        >
          <ChevronLeft className="h-4 w-4" /> Back to calendar
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">New event</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a Sunday meeting, mid-week activity, camp, service project, or
          anything else to the master calendar.
        </p>
      </div>
      <EventForm mode="create" defaultDate={defaultDate} />
    </div>
  );
}
