import { format, isSameDay } from "date-fns";
import { MapPin, Tent } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EventRow } from "@/lib/types";

const TYPE_LABEL: Record<string, string> = {
  activity: "Activity",
  camp: "Camp",
  service: "Service",
  other: "Event",
};

function formatRange(start: Date, end: Date) {
  if (isSameDay(start, end)) {
    return format(start, "EEE MMM d · h:mm a");
  }
  return `${format(start, "MMM d")} – ${format(end, "MMM d")}`;
}

export function UpcomingActivities({ events }: { events: EventRow[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Tent className="h-4 w-4 text-amber-600" />
          <CardTitle className="text-base">Upcoming activities</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No activities scheduled in the next 6 weeks.
          </p>
        ) : (
          <ul className="space-y-3">
            {events.map((e) => {
              const start = new Date(e.start_at);
              const end = new Date(e.end_at);
              return (
                <li
                  key={e.id}
                  className="rounded-lg border border-border bg-card/50 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{e.title}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {TYPE_LABEL[e.type] ?? e.type}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatRange(start, end)}
                  </p>
                  {e.location ? (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {e.location}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
