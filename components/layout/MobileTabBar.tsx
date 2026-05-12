"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Home,
  type LucideIcon,
  Menu,
  ShieldCheck,
  Sparkles,
  Users,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Profile, Role } from "@/lib/types";

type TabItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const PRIMARY_TABS_BY_ROLE: Record<Role, TabItem[]> = {
  adult_leader: [
    { href: "/", label: "Home", icon: Home },
    { href: "/calendar", label: "Calendar", icon: CalendarDays },
    { href: "/sunday-program", label: "Program", icon: Sparkles },
    { href: "/people", label: "People", icon: Users },
  ],
  youth: [
    { href: "/", label: "Home", icon: Home },
    { href: "/calendar", label: "Calendar", icon: CalendarDays },
    { href: "/sunday-program", label: "Program", icon: Sparkles },
  ],
  general: [
    { href: "/", label: "Home", icon: Home },
    { href: "/calendar", label: "Calendar", icon: CalendarDays },
    { href: "/sunday-program", label: "Program", icon: Sparkles },
  ],
};

const MORE_ITEMS_BY_ROLE: Record<Role, TabItem[]> = {
  adult_leader: [
    { href: "/leaders/rsvp", label: "Leader RSVP", icon: ShieldCheck },
  ],
  youth: [],
  general: [],
};

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileTabBar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const primary = PRIMARY_TABS_BY_ROLE[profile.role];
  const moreItems = MORE_ITEMS_BY_ROLE[profile.role];

  const showMore = moreItems.length > 0;
  const visibleTabs = showMore ? primary : primary;

  return (
    <>
      <nav
        aria-label="Primary navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="mx-auto flex max-w-2xl items-stretch justify-around">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(pathname, tab.href);
            return (
              <li key={tab.href} className="flex-1">
                <Link
                  href={tab.href}
                  className={cn(
                    "flex h-16 flex-col items-center justify-center gap-1 text-[10px] font-medium uppercase tracking-wide transition-colors",
                    active
                      ? "text-amber-700 dark:text-amber-300"
                      : "text-muted-foreground active:text-foreground",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-transform",
                      active && "scale-110",
                    )}
                  />
                  <span>{tab.label}</span>
                </Link>
              </li>
            );
          })}
          {showMore ? (
            <li className="flex-1">
              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                className="flex h-16 w-full flex-col items-center justify-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground transition-colors active:text-foreground"
              >
                <Menu className="h-5 w-5" />
                <span>More</span>
              </button>
            </li>
          ) : null}
        </ul>
      </nav>

      {showMore ? (
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetContent
            side="bottom"
            className="rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
          >
            <SheetHeader>
              <SheetTitle>More</SheetTitle>
              <SheetDescription>
                {profile.first_name} {profile.last_name}
              </SheetDescription>
            </SheetHeader>
            <ul className="space-y-1 p-2 pb-6">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "flex h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                        active
                          ? "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                          : "hover:bg-accent",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
              <li>
                <form action="/auth/signout" method="POST">
                  <button
                    type="submit"
                    className="flex h-12 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/30"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign out
                  </button>
                </form>
              </li>
            </ul>
          </SheetContent>
        </Sheet>
      ) : null}
    </>
  );
}
