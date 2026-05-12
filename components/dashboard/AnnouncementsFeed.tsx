import { formatDistanceToNow } from "date-fns";
import { Megaphone } from "lucide-react";
import type { AnnouncementWithAuthor } from "@/lib/queries/dashboard";
import type { Role } from "@/lib/types";

interface AnnouncementsFeedProps {
  announcements: AnnouncementWithAuthor[];
  role: Role;
}

export function AnnouncementsFeed({
  announcements,
  role,
}: AnnouncementsFeedProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <header className="mb-3 flex items-center gap-2">
        <Megaphone className="h-4 w-4 text-amber-600" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Announcements
        </h3>
      </header>

      {announcements.length === 0 ? (
        <p className="rounded-lg bg-muted/40 px-3 py-6 text-center text-sm text-muted-foreground">
          {role === "adult_leader"
            ? "No announcements yet. Post the first one."
            : "No announcements yet."}
        </p>
      ) : (
        <ul className="space-y-3">
          {announcements.slice(0, 3).map((a) => (
            <li
              key={a.id}
              className="rounded-lg border-l-2 border-amber-300 bg-amber-50/40 py-1.5 pl-3 dark:border-amber-900/50 dark:bg-amber-950/20"
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {a.body}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {a.author
                  ? `${a.author.first_name} ${a.author.last_name}`
                  : "Unknown"}
                {" · "}
                {formatDistanceToNow(new Date(a.created_at), {
                  addSuffix: true,
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
