import type { Database, Tables } from "@/lib/types/database";

export type Role = Database["public"]["Enums"]["app_role"];
export type EventType = Database["public"]["Enums"]["event_type"];
export type LeaderRsvpStatus = Database["public"]["Enums"]["leader_rsvp_status"];
export type ProgramBlockType = Database["public"]["Enums"]["program_block_type"];

export type Profile = Tables<"profiles">;
export type Calling = Tables<"callings">;
export type CallingAssignment = Tables<"calling_assignments">;
export type EventRow = Tables<"events">;
export type Announcement = Tables<"announcements">;
export type LeaderRsvp = Tables<"leader_rsvps">;
export type SundayProgram = Tables<"sunday_programs">;
export type ProgramBlock = Tables<"program_blocks">;

export type ProfileWithCallings = Profile & {
  callings: Calling[];
};

export type SundayProgramWithBlocks = SundayProgram & {
  blocks: (ProgramBlock & { assignee: Profile | null })[];
  event: EventRow;
};

export type AnnouncementWithAuthor = Announcement & {
  author: Pick<Profile, "id" | "first_name" | "last_name" | "role"> | null;
};

export type LeaderRsvpWithLeader = LeaderRsvp & {
  leader: Pick<Profile, "id" | "first_name" | "last_name"> | null;
};
