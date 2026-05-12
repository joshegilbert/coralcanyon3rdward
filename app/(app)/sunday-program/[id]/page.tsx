import { cookies } from "next/headers";
import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Maximize2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/server";
import { requireUser } from "@/lib/auth";
import { getProgramForEdit } from "@/lib/queries/sunday-program";
import { ProgramEditor } from "@/components/sunday-program/ProgramEditor";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SundayProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireUser();
  const supabase = createClient(await cookies());
  const data = await getProgramForEdit(supabase, id);
  if (!data) notFound();

  const canEdit =
    session.profile?.role === "adult_leader" ||
    session.profile?.role === "youth";

  const eventDate = new Date(data.event.start_at);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/sunday-program"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "-ml-2 mb-1 gap-1 text-muted-foreground",
            )}
          >
            <ChevronLeft className="h-4 w-4" /> Back to Sunday Programs
          </Link>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Sunday Program
          </p>
          <h1 className="text-2xl font-semibold">{data.event.title}</h1>
          <p className="text-sm text-muted-foreground">
            {format(eventDate, "EEEE, MMMM d, yyyy")}
            {data.event.location ? ` · ${data.event.location}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              {data.event.type === "quorum_meeting" ? "Quorum Meeting" : "Sunday School"}
            </Badge>
            {canEdit ? (
              <Badge variant="secondary" className="text-[10px]">
                Editable
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px]">
                Read-only
              </Badge>
            )}
          </div>
        </div>
        <Link href={`/sunday-program/${id}/present`} className={buttonVariants()}>
          <Maximize2 className="mr-2 h-4 w-4" />
          Present
        </Link>
      </div>

      <ProgramEditor data={data} canEdit={canEdit} />
    </div>
  );
}
