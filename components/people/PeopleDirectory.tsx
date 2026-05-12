"use client";

import { useState } from "react";
import {
  Pencil,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CallingBadge } from "@/components/shared/CallingBadge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Calling, Profile, Role } from "@/lib/types";
import type { DirectoryEntry } from "@/lib/queries/people";
import { InvitePersonSheet } from "./InvitePersonSheet";
import { EditProfileSheet } from "./EditProfileSheet";
import { ManageCallingsSheet } from "./ManageCallingsSheet";
import { CallingsAdmin } from "./CallingsAdmin";
import { DeleteProfileDialog } from "./DeleteProfileDialog";

const ROLE_META: Record<Role, { label: string; icon: typeof Users }> = {
  adult_leader: { label: "Adult Leaders", icon: ShieldCheck },
  youth: { label: "Youth", icon: Sparkles },
  general: { label: "Parents & Members", icon: Users },
};

interface PeopleDirectoryProps {
  byRole: Record<Role, DirectoryEntry[]>;
  allYouth: Profile[];
  allCallings: Calling[];
  currentUserId: string;
}

interface DirectoryRowState {
  edit: DirectoryEntry | null;
  callings: DirectoryEntry | null;
  delete: DirectoryEntry | null;
}

function formatBirthday(birth_date: string | null): string | null {
  if (!birth_date) return null;
  const [y, m, d] = birth_date.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return format(date, "MMM d");
}

export function PeopleDirectory({
  byRole,
  allYouth,
  allCallings,
  currentUserId,
}: PeopleDirectoryProps) {
  const [invite, setInvite] = useState(false);
  const [state, setState] = useState<DirectoryRowState>({
    edit: null,
    callings: null,
    delete: null,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">People</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Adult leaders, youth, and parents. Invite new members, edit roles,
            and manage youth callings here.
          </p>
        </div>
        <Button onClick={() => setInvite(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Invite person
        </Button>
      </div>

      <CallingsAdmin callings={allCallings} />

      <div className="space-y-8">
        {(Object.keys(ROLE_META) as Role[]).map((role) => {
          const entries = byRole[role] ?? [];
          const meta = ROLE_META[role];
          const Icon = meta.icon;
          return (
            <section key={role} className="space-y-3">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {meta.label}
                </h2>
                <span className="text-xs text-muted-foreground">
                  ({entries.length})
                </span>
              </div>

              {entries.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm italic text-muted-foreground">
                  No {meta.label.toLowerCase()} yet.
                </p>
              ) : (
                <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
                  {entries.map((entry) => (
                    <PersonRow
                      key={entry.profile.id}
                      entry={entry}
                      isSelf={entry.profile.id === currentUserId}
                      onEdit={() => setState((s) => ({ ...s, edit: entry }))}
                      onCallings={() =>
                        setState((s) => ({ ...s, callings: entry }))
                      }
                      onDelete={() =>
                        setState((s) => ({ ...s, delete: entry }))
                      }
                    />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <InvitePersonSheet open={invite} onOpenChange={setInvite} />
      {state.edit ? (
        <EditProfileSheet
          open
          onOpenChange={(open) =>
            !open && setState((s) => ({ ...s, edit: null }))
          }
          entry={state.edit}
          allYouth={allYouth}
        />
      ) : null}
      {state.callings ? (
        <ManageCallingsSheet
          open
          onOpenChange={(open) =>
            !open && setState((s) => ({ ...s, callings: null }))
          }
          entry={state.callings}
          allCallings={allCallings.filter((c) => c.archived_at === null)}
        />
      ) : null}
      {state.delete ? (
        <DeleteProfileDialog
          open
          onOpenChange={(open) =>
            !open && setState((s) => ({ ...s, delete: null }))
          }
          entry={state.delete}
        />
      ) : null}
    </div>
  );
}

interface PersonRowProps {
  entry: DirectoryEntry;
  isSelf: boolean;
  onEdit: () => void;
  onCallings: () => void;
  onDelete: () => void;
}

function PersonRow({ entry, isSelf, onEdit, onCallings, onDelete }: PersonRowProps) {
  const { profile, callings, children, parents } = entry;
  const fullName = `${profile.first_name} ${profile.last_name}`.trim() || "(no name)";
  const birthday = formatBirthday(profile.birth_date);
  const initials =
    `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase() ||
    "?";

  return (
    <li className="flex flex-wrap items-center gap-3 p-3 sm:p-4">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold uppercase",
          profile.avatar_color ?? "bg-muted text-foreground",
        )}
        style={
          profile.avatar_color &&
          /^#[0-9a-f]{3,8}$/i.test(profile.avatar_color)
            ? { backgroundColor: profile.avatar_color, color: "white" }
            : undefined
        }
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{fullName}</span>
          {isSelf ? (
            <Badge variant="outline" className="text-[10px]">
              You
            </Badge>
          ) : null}
          {profile.email ? (
            <span className="text-xs text-muted-foreground">{profile.email}</span>
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {birthday ? <span>Birthday {birthday}</span> : null}
          {profile.role === "youth" && parents.length > 0 ? (
            <span>
              Parent(s):{" "}
              {parents
                .map((p) => `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim())
                .join(", ")}
            </span>
          ) : null}
          {profile.role === "general" && children.length > 0 ? (
            <span>
              Child(ren):{" "}
              {children
                .map((c) => `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim())
                .join(", ")}
            </span>
          ) : null}
        </div>
        {callings.length > 0 ? (
          <div className="mt-2">
            <CallingBadge callings={callings} />
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-1">
        {profile.role === "youth" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onCallings}
            className="gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Callings
          </Button>
        ) : null}
        <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label="Edit">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          disabled={isSelf}
          aria-label="Delete"
          className={cn(!isSelf && "text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30")}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}
