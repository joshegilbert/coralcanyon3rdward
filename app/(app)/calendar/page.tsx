import { CalendarDays } from "lucide-react";
import { PagePlaceholder } from "@/components/shared/PagePlaceholder";

export const metadata = { title: "Calendar - Coral Canyon 3rd Ward" };

export default function CalendarPage() {
  return (
    <PagePlaceholder
      icon={CalendarDays}
      title="Master Calendar"
      description="Yearly, monthly, and weekly views with 1st/3rd Sunday School and 2nd/4th Quorum Meeting distinctions, plus multi-day camps and activities. Adult leaders edit; everyone views."
    />
  );
}
