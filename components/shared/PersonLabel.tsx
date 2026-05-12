import { CallingBadge } from "./CallingBadge";
import { cn } from "@/lib/utils";
import type { Calling, Profile } from "@/lib/types";

interface PersonLabelProps {
  profile: Pick<Profile, "first_name" | "last_name" | "role">;
  callings?: Pick<Calling, "id" | "name">[];
  className?: string;
  /** When true, abbreviates last name to first initial */
  short?: boolean;
}

export function PersonLabel({
  profile,
  callings,
  className,
  short = false,
}: PersonLabelProps) {
  const last = short && profile.last_name ? `${profile.last_name[0]}.` : profile.last_name;
  const displayName = [profile.first_name, last].filter(Boolean).join(" ");
  const isAdult = profile.role === "adult_leader";

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="font-medium text-foreground">{displayName}</span>
      {isAdult ? (
        <span className="rounded-md bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-900 dark:bg-sky-950/40 dark:text-sky-200">
          Adult Advisor
        </span>
      ) : callings && callings.length > 0 ? (
        <CallingBadge callings={callings} />
      ) : null}
    </span>
  );
}
