import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Calendar, Sparkles, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  highlight?: "warning" | "neutral";
}

function StatCard({ label, value, icon: Icon, highlight }: StatCardProps) {
  return (
    <Card
      className={cn(
        "shadow-sm",
        highlight === "warning" && value > 0
          ? "border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/30"
          : null,
      )}
    >
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full",
            highlight === "warning" && value > 0
              ? "bg-rose-200 text-rose-900 dark:bg-rose-900/40 dark:text-rose-200"
              : "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export function QuickStats({
  upcomingEventsCount,
  activeYouthCount,
  callingsFilledCount,
  underStaffedSundays,
}: {
  upcomingEventsCount: number;
  activeYouthCount: number;
  callingsFilledCount: number;
  underStaffedSundays: number;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Upcoming events"
        value={upcomingEventsCount}
        icon={Calendar}
      />
      <StatCard label="Active youth" value={activeYouthCount} icon={Users} />
      <StatCard
        label="Callings filled"
        value={callingsFilledCount}
        icon={Sparkles}
      />
      <StatCard
        label="Sundays needing leaders"
        value={underStaffedSundays}
        icon={AlertTriangle}
        highlight="warning"
      />
    </div>
  );
}
