// Hand-mirrored from supabase/migrations/* until we can run
// `supabase gen types typescript --linked` against the cloud DB.
// Keep this in sync with migrations or regenerate.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole = "adult_leader" | "youth" | "general";

export type EventTypeEnum =
  | "sunday_school"
  | "quorum_meeting"
  | "activity"
  | "camp"
  | "service"
  | "other";

export type LeaderRsvpStatusEnum = "attending" | "unavailable" | "undecided";

export type ProgramBlockTypeEnum =
  | "presiding"
  | "conducting"
  | "youth_theme"
  | "opening_prayer"
  | "teacher"
  | "announcements"
  | "musical_number"
  | "lesson"
  | "custom";

interface RowTimestamps {
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          first_name: string;
          last_name: string;
          role: AppRole;
          birth_date: string | null;
          avatar_color: string | null;
          parent_of_ids: string[];
        } & RowTimestamps;
        Insert: {
          id: string;
          email?: string | null;
          first_name?: string;
          last_name?: string;
          role?: AppRole;
          birth_date?: string | null;
          avatar_color?: string | null;
          parent_of_ids?: string[];
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      callings: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          sort_order: number;
          archived_at: string | null;
        } & RowTimestamps;
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          sort_order?: number;
          archived_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["callings"]["Insert"]>;
        Relationships: [];
      };
      calling_assignments: {
        Row: {
          id: string;
          profile_id: string;
          calling_id: string;
          assigned_at: string;
          released_at: string | null;
        } & RowTimestamps;
        Insert: {
          id?: string;
          profile_id: string;
          calling_id: string;
          assigned_at?: string;
          released_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["calling_assignments"]["Insert"]
        >;
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          title: string;
          type: EventTypeEnum;
          start_at: string;
          end_at: string;
          location: string | null;
          description: string | null;
          rsvp_required: boolean;
        } & RowTimestamps;
        Insert: {
          id?: string;
          title: string;
          type: EventTypeEnum;
          start_at: string;
          end_at: string;
          location?: string | null;
          description?: string | null;
          rsvp_required?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [];
      };
      announcements: {
        Row: {
          id: string;
          author_id: string;
          body: string;
        } & RowTimestamps;
        Insert: {
          id?: string;
          author_id: string;
          body: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["announcements"]["Insert"]
        >;
        Relationships: [];
      };
      leader_rsvps: {
        Row: {
          id: string;
          event_id: string;
          leader_id: string;
          status: LeaderRsvpStatusEnum;
        } & RowTimestamps;
        Insert: {
          id?: string;
          event_id: string;
          leader_id: string;
          status?: LeaderRsvpStatusEnum;
        };
        Update: Partial<
          Database["public"]["Tables"]["leader_rsvps"]["Insert"]
        >;
        Relationships: [];
      };
      sunday_programs: {
        Row: {
          id: string;
          event_id: string;
          theme: string | null;
          hymn: string | null;
          notes: string | null;
        } & RowTimestamps;
        Insert: {
          id?: string;
          event_id: string;
          theme?: string | null;
          hymn?: string | null;
          notes?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["sunday_programs"]["Insert"]
        >;
        Relationships: [];
      };
      program_blocks: {
        Row: {
          id: string;
          sunday_program_id: string;
          type: ProgramBlockTypeEnum;
          label: string;
          assignee_id: string | null;
          notes: string | null;
          position: number;
          completed_at: string | null;
        } & RowTimestamps;
        Insert: {
          id?: string;
          sunday_program_id: string;
          type: ProgramBlockTypeEnum;
          label: string;
          assignee_id?: string | null;
          notes?: string | null;
          position?: number;
          completed_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["program_blocks"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_adult_leader: { Args: Record<PropertyKey, never>; Returns: boolean };
      can_edit_program: { Args: Record<PropertyKey, never>; Returns: boolean };
    };
    Enums: {
      app_role: AppRole;
      event_type: EventTypeEnum;
      leader_rsvp_status: LeaderRsvpStatusEnum;
      program_block_type: ProgramBlockTypeEnum;
    };
    CompositeTypes: { [_ in never]: never };
  };
}

type PublicTable = Database["public"]["Tables"];
export type Tables<T extends keyof PublicTable> = PublicTable[T]["Row"];
export type TablesInsert<T extends keyof PublicTable> = PublicTable[T]["Insert"];
export type TablesUpdate<T extends keyof PublicTable> = PublicTable[T]["Update"];
