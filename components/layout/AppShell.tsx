import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { UserMenu } from "./UserMenu";
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
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-8">
          <div className="lg:hidden">
            <span className="text-sm font-semibold">Coral Canyon 3rd Ward</span>
          </div>
          <div className="hidden lg:block" />
          <UserMenu profile={profile} />
        </header>
        <main className="flex-1 px-4 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
