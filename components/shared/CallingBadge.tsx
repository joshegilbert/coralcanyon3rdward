import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Calling } from "@/lib/types";

interface CallingBadgeProps {
  callings: Pick<Calling, "id" | "name">[];
  className?: string;
}

export function CallingBadge({ callings, className }: CallingBadgeProps) {
  if (!callings || callings.length === 0) return null;
  const [primary, ...rest] = callings;
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <Badge
        variant="secondary"
        className="border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200"
      >
        {primary.name}
      </Badge>
      {rest.length > 0 ? (
        <Badge variant="outline" className="text-[10px]">
          +{rest.length}
        </Badge>
      ) : null}
    </span>
  );
}
