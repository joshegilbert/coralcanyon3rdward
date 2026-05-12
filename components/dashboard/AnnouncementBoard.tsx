import { formatDistanceToNow } from "date-fns";
import { Megaphone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AnnouncementWithAuthor } from "@/lib/queries/dashboard";

export function AnnouncementBoard({
  announcements,
}: {
  announcements: AnnouncementWithAuthor[];
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-amber-600" />
          <CardTitle className="text-base">Announcements</CardTitle>
        </div>
        <Button variant="ghost" size="sm" disabled>
          <Plus className="h-4 w-4" />
          New
        </Button>
      </CardHeader>
      <CardContent>
        {announcements.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing posted yet. Adult leaders can post updates here.
          </p>
        ) : (
          <ul className="space-y-4">
            {announcements.map((a) => (
              <li
                key={a.id}
                className="border-l-2 border-amber-300 pl-3 dark:border-amber-900/50"
              >
                <p className="text-sm whitespace-pre-wrap">{a.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {a.author
                    ? `${a.author.first_name} ${a.author.last_name}`
                    : "Unknown"}{" "}
                  · {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
