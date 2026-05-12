import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/auth";

export default async function AppGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  if (!current.profile) {
    // The handle_new_user trigger creates this automatically, but if for any
    // reason the profile is missing, send the user back through auth.
    redirect("/login?error=missing_profile");
  }

  return <AppShell profile={current.profile}>{children}</AppShell>;
}
