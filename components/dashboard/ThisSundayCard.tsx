import Link from "next/link";
import { format } from "date-fns";
import { ChevronRight, MapPin, Pencil, Play, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NextSundayData } from "@/lib/queries/dashboard";
import type { Role } from "@/lib/types";

interface ThisSundayCardProps {
  data: NextSundayData;
  role: Role;
}

function timeLine(start: Date | string | null, end: Date | string | null) {
  if (!start) return null;
  const s = typeof start === "string" ? new Date(start) : start;
  const e = end ? (typeof end === "string" ? new Date(end) : end) : null;
  if (e) return `${format(s, "h:mm a")} – ${format(e, "h:mm a")}`;
  return format(s, "h:mm a");
}

export function ThisSundayCard({ data, role }: ThisSundayCardProps) {
  const isQuorum = data.type === "quorum_meeting";
  const time = data.event
    ? timeLine(data.event.start_at, data.event.end_at)
    : null;
  const canEdit = role === "adult_leader";
  const canCreateProgram = role === "adult_leader" && !data.program && isQuorum;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border shadow-sm",
        isQuorum
          ? "border-sky-200 bg-gradient-to-br from-sky-50 via-white to-white dark:border-sky-900/50 dark:from-sky-950/40 dark:via-zinc-900 dark:to-zinc-900"
          : "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white dark:border-amber-900/50 dark:from-amber-950/40 dark:via-zinc-900 dark:to-zinc-900",
      )}
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
              isQuorum
                ? "bg-sky-200/80 text-sky-900 dark:bg-sky-900/60 dark:text-sky-100"
                : "bg-amber-200/80 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100",
            )}
          >
            {isQuorum ? "Quorum Meeting" : "Sunday School"}
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            This Sunday
          </span>
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {format(data.date, "EEE, MMM d")}
          </h2>
          {time ? (
            <span className="text-sm text-muted-foreground">{time}</span>
          ) : null}
        </div>

        {data.program?.theme ? (
          <p className="mt-2 flex items-start gap-1.5 text-sm font-medium text-foreground/90">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
            {data.program.theme}
          </p>
        ) : null}

        {data.event?.location ? (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {data.event.location}
          </p>
        ) : null}

        {data.program ? (
          <dl className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {data.program.presiding ? (
              <RoleChip label="Presiding" value={data.program.presiding} />
            ) : null}
            {data.program.conducting ? (
              <RoleChip label="Conducting" value={data.program.conducting} />
            ) : null}
            {data.program.teacher ? (
              <RoleChip
                label="Teacher"
                value={data.program.teacher.name}
                tag={
                  data.program.teacher.role === "adult_leader"
                    ? "Adult"
                    : "Youth"
                }
              />
            ) : null}
          </dl>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {data.program ? (
            <Link
              href={`/sunday-program/${data.program.id}/present`}
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-11 gap-2 px-4",
              )}
            >
              <Play className="h-4 w-4" />
              Follow program
            </Link>
          ) : canCreateProgram ? (
            <Link
              href={`/sunday-program`}
              className={cn(buttonVariants({ size: "lg" }), "h-11 gap-2 px-4")}
            >
              <Sparkles className="h-4 w-4" />
              Create program
            </Link>
          ) : data.event ? (
            <Link
              href={`/calendar?date=${format(data.date, "yyyy-MM-dd")}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 gap-2 px-4",
              )}
            >
              View event
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : null}
          {data.program && canEdit ? (
            <Link
              href={`/sunday-program/${data.program.id}`}
              className={cn(
                buttonVariants({ variant: "ghost", size: "lg" }),
                "h-11 gap-1.5 px-3",
              )}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          ) : null}
        </div>

        {!data.event ? (
          <p className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            No event scheduled for this Sunday yet.
            {role === "adult_leader" ? (
              <>
                {" "}
                <Link
                  href={`/calendar/new?date=${format(data.date, "yyyy-MM-dd")}`}
                  className="font-semibold underline-offset-2 hover:underline"
                >
                  Add one
                </Link>
                .
              </>
            ) : null}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function RoleChip({
  label,
  value,
  tag,
}: {
  label: string;
  value: string;
  tag?: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/70 px-3 py-2">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 flex items-center gap-1.5 text-sm font-medium leading-tight">
        <span className="truncate">{value}</span>
        {tag ? (
          <span className="rounded-full bg-muted px-1.5 text-[9px] uppercase tracking-wider text-muted-foreground">
            {tag}
          </span>
        ) : null}
      </dd>
    </div>
  );
}
