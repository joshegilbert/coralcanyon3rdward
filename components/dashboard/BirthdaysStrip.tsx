import { Cake } from "lucide-react";
import type { BirthdayItem } from "@/lib/queries/dashboard";

export function BirthdaysStrip({ items }: { items: BirthdayItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <header className="mb-3 flex items-center gap-2">
        <Cake className="h-4 w-4 text-amber-600" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Birthdays this month
        </h3>
      </header>
      <ul className="-mx-1 grid grid-cols-1 gap-1 sm:grid-cols-2">
        {items.map((b) => (
          <li
            key={b.profile.id}
            className="flex items-center gap-3 rounded-lg px-2 py-1.5"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold tabular-nums text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              {b.day}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {b.profile.first_name} {b.profile.last_name}
              </p>
              <p className="text-[11px] text-muted-foreground">
                turns {b.age}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
