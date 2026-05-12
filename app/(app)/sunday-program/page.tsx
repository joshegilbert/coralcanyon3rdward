import { format } from "date-fns";
import Link from "next/link";
import { cookies } from "next/headers";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/server";
import { classifySunday } from "@/lib/sunday";

export const metadata = { title: "Sunday Program - Coral Canyon 3rd Ward" };

export default async function SundayProgramListPage() {
  const supabase = createClient(await cookies());
  type ProgramRow = {
    id: string;
    theme: string | null;
    event:
      | { id: string; title: string; start_at: string; type: string }
      | { id: string; title: string; start_at: string; type: string }[]
      | null;
  };
  const { data } = await supabase
    .from("sunday_programs")
    .select("id, theme, event:events(id, title, start_at, type)")
    .limit(20);
  const programs = (data ?? []) as unknown as ProgramRow[];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-3">
        <Sparkles className="h-6 w-6 text-amber-600" />
        <h1 className="text-2xl font-semibold">Sunday Programs</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Plan and follow this week&apos;s lesson. Adult leaders and youth can edit.
        Tap a Sunday to open the program; use the Present view during the lesson.
      </p>

      {programs.length > 0 ? (
        <div className="space-y-2">
          {programs.map((p) => {
            const event = Array.isArray(p.event) ? p.event[0] : p.event;
            if (!event) return null;
            const date = new Date(event.start_at);
            const type = classifySunday(date);
            return (
              <Card key={p.id} className="hover:bg-accent/30">
                <Link
                  href={`/sunday-program/${p.id}`}
                  className="flex items-center justify-between p-4"
                >
                  <div>
                    <div className="text-base font-semibold">{event.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(date, "EEEE, MMMM d")}
                      {p.theme ? ` · ${p.theme}` : ""}
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      type === "quorum_meeting"
                        ? "border-sky-200 bg-sky-100 text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-200"
                        : "border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200"
                    }
                  >
                    {type === "quorum_meeting" ? "Quorum Meeting" : "Sunday School"}
                  </Badge>
                </Link>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No programs yet</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Once a Sunday program is created, it&apos;ll appear here for editing and presenting.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
