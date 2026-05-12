import { format } from "date-fns";
import { Cake } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CallingBadge } from "@/components/shared/CallingBadge";
import type { BirthdayItem } from "@/lib/queries/dashboard";

export function BirthdaysWidget({ items }: { items: BirthdayItem[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Cake className="h-4 w-4 text-amber-600" />
          <CardTitle className="text-base">
            Birthdays in {format(new Date(), "MMMM")}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No youth birthdays this month.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((b) => (
              <li
                key={b.profile.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-xs font-bold tabular-nums text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                    {b.day}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {b.profile.first_name} {b.profile.last_name}
                    </span>
                    <CallingBadge callings={b.callings} />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  turns {b.age}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
