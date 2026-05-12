"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Home,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  roles: Role[];
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: Home, roles: ["adult_leader", "youth", "general"] },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, roles: ["adult_leader", "youth", "general"] },
  { href: "/sunday-program", label: "Sunday Program", icon: Sparkles, roles: ["adult_leader", "youth", "general"] },
  { href: "/leaders/rsvp", label: "Leader RSVP", icon: ShieldCheck, roles: ["adult_leader"] },
  { href: "/people", label: "People", icon: Users, roles: ["adult_leader"] },
];

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Stone Ridge Ward
          </span>
          <span className="text-sm font-semibold">Young Men</span>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
