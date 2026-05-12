import { Users } from "lucide-react";
import { PagePlaceholder } from "@/components/shared/PagePlaceholder";
import { requireAdultLeader } from "@/lib/auth";

export const metadata = { title: "People - Coral Canyon 3rd Ward" };

export default async function PeoplePage() {
  await requireAdultLeader();
  return (
    <PagePlaceholder
      icon={Users}
      title="People & Callings"
      description="Manage roles (adult leader, youth, general) and assign callings like President, First Counselor, Sports Captain, or any custom calling you define."
    />
  );
}
