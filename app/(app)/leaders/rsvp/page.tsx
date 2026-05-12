import { ShieldCheck } from "lucide-react";
import { PagePlaceholder } from "@/components/shared/PagePlaceholder";
import { requireAdultLeader } from "@/lib/auth";

export const metadata = { title: "Leader RSVP - Coral Canyon 3rd Ward" };

export default async function LeaderRsvpPage() {
  await requireAdultLeader();
  return (
    <PagePlaceholder
      icon={ShieldCheck}
      title="Leader RSVP"
      description="Private to adult leaders. Mark Attending or Unavailable for upcoming Sundays so we keep two-deep leadership. The home dashboard already shows red warnings for under-staffed weeks."
    />
  );
}
