import { cookies } from "next/headers";
import { requireAdultLeader } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import { getDirectory } from "@/lib/queries/people";
import { PeopleDirectory } from "@/components/people/PeopleDirectory";

export const metadata = { title: "People - Coral Canyon 3rd Ward" };

export default async function PeoplePage() {
  const { user } = await requireAdultLeader();
  const supabase = createClient(await cookies());
  const directory = await getDirectory(supabase);

  return (
    <PeopleDirectory
      byRole={directory.byRole}
      allYouth={directory.allYouth}
      allCallings={directory.allCallings}
      currentUserId={user.id}
    />
  );
}
