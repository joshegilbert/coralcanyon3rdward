import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/queries/dashboard";
import { AdultLeaderHome } from "@/components/dashboard/AdultLeaderHome";
import { YouthHome } from "@/components/dashboard/YouthHome";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { user, profile } = await requireUser();
  if (!profile) return null;

  const supabase = createClient(await cookies());
  const data = await getDashboardData(supabase, user.id);

  if (profile.role === "adult_leader") {
    return <AdultLeaderHome profile={profile} data={data} />;
  }

  return <YouthHome profile={profile} data={data} />;
}
