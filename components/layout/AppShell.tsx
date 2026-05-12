import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { UserMenu } from "./UserMenu";
import { MobileTabBar } from "./MobileTabBar";
import type { Profile } from "@/lib/types";

export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-svh w-full bg-background">
      <Sidebar role={profile.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur lg:h-16 lg:px-8"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="lg:hidden">
            <span className="text-sm font-semibold tracking-tight">
              Stone Ridge Ward
            </span>
          </div>
          <div className="hidden lg:block" />
          <UserMenu profile={profile} />
        </header>
        <main className="flex-1 px-4 py-5 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:py-8 lg:pb-8">
          {children}
        </main>
        <MobileTabBar profile={profile} />
      </div>
    </div>
  );
}
