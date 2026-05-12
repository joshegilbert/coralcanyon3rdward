"use client";

import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Profile } from "@/lib/types";

const ROLE_LABEL: Record<Profile["role"], string> = {
  adult_leader: "Adult Leader",
  youth: "Youth",
  general: "General",
};

function initials(p: Profile) {
  return `${p.first_name[0] ?? ""}${p.last_name[0] ?? ""}`.toUpperCase() || "?";
}

export function UserMenu({ profile }: { profile: Profile }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-10 items-center gap-3 rounded-full bg-transparent px-2 outline-none hover:bg-accent">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-amber-100 text-xs font-semibold text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            {initials(profile)}
          </AvatarFallback>
        </Avatar>
        <div className="hidden flex-col items-start leading-tight md:flex">
          <span className="text-sm font-medium">
            {profile.first_name} {profile.last_name}
          </span>
          <span className="text-xs text-muted-foreground">
            {ROLE_LABEL[profile.role]}
          </span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span>
              {profile.first_name} {profile.last_name}
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {profile.email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <form action="/auth/signout" method="POST">
          <DropdownMenuItem
            render={
              <button type="submit" className="w-full justify-start" />
            }
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
