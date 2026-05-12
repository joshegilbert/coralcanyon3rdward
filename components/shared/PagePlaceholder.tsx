import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function PagePlaceholder({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <Icon className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p className="max-w-md text-sm text-muted-foreground">{description}</p>
          <p className="rounded-md bg-muted px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
