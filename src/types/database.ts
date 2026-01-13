// Database types for StepLeague
// Based on the Supabase migrations schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          display_name: string | null;
          nickname: string | null;
          units: "metric" | "imperial";
          is_superadmin: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          units?: "metric" | "imperial";
          is_superadmin?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          units?: "metric" | "imperial";
          is_superadmin?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      leagues: {
        Row: {
          id: string;
          name: string;
          stepweek_start: "monday" | "sunday" | "mon" | "sun";
          invite_code: string;
          owner_id: string;
          created_at: string;
          counting_start_date: string | null;
          description: string | null;
          is_public: boolean;
          allow_manual_entry: boolean;
          require_verification_photo: boolean;
          daily_step_goal: number;
          max_members: number;
          category: string;
        };
        Insert: {
          id?: string;
          name: string;
          stepweek_start?: "monday" | "sunday" | "mon" | "sun";
          invite_code: string;
          owner_id: string;
          created_at?: string;
          counting_start_date?: string | null;
          description?: string | null;
          is_public?: boolean;
          allow_manual_entry?: boolean;
          require_verification_photo?: boolean;
          daily_step_goal?: number;
          max_members?: number;
          category?: string;
        };
        Update: {
          id?: string;
          name?: string;
          stepweek_start?: "monday" | "sunday" | "mon" | "sun";
          invite_code?: string;
          owner_id?: string;
          created_at?: string;
          counting_start_date?: string | null;
          description?: string | null;
          is_public?: boolean;
          allow_manual_entry?: boolean;
          require_verification_photo?: boolean;
          daily_step_goal?: number;
          max_members?: number;
          category?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leagues_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      memberships: {
        Row: {
          league_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          joined_at: string;
        };
        Insert: {
          league_id: string;
          user_id: string;
          role?: "owner" | "admin" | "member";
          joined_at?: string;
        };
        Update: {
          league_id?: string;
          user_id?: string;
          role?: "owner" | "admin" | "member";
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memberships_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "memberships_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      submissions: {
        Row: {
          id: string;
          league_id: string;
          user_id: string;
          for_date: string;
          steps: number;
          km: number | null;
          calories: number | null;
          proof_path: string | null;
          verified: boolean | null;
          ai_extracted_steps: number | null;
          tolerance_used: number | null;
          proxy_member_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          user_id: string;
          for_date: string;
          steps: number;
          km?: number | null;
          calories?: number | null;
          proof_path?: string | null;
          verified?: boolean | null;
          ai_extracted_steps?: number | null;
          tolerance_used?: number | null;
          proxy_member_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          league_id?: string;
          user_id?: string;
          for_date?: string;
          steps?: number;
          km?: number | null;
          calories?: number | null;
          proof_path?: string | null;
          verified?: boolean | null;
          ai_extracted_steps?: number | null;
          tolerance_used?: number | null;
          proxy_member_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "submissions_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "submissions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "submissions_proxy_member_id_fkey";
            columns: ["proxy_member_id"];
            isOneToOne: false;
            referencedRelation: "proxy_members";
            referencedColumns: ["id"];
          }
        ];
      };
      site_settings: {
        Row: {
          key: string;
          value: string;
          description: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          key: string;
          value: string;
          description?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          key?: string;
          value?: string;
          description?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "site_settings_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      audit_log: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          target_id: string | null;
          details: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          target_id?: string | null;
          details?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          action?: string;
          target_id?: string | null;
          details?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      proxy_members: {
        Row: {
          id: string;
          league_id: string;
          display_name: string;
          created_by: string;
          created_at: string;
          invite_code: string | null;
        };
        Insert: {
          id?: string;
          league_id: string;
          display_name: string;
          created_by: string;
          created_at?: string;
          invite_code?: string | null;
        };
        Update: {
          id?: string;
          league_id?: string;
          display_name?: string;
          created_by?: string;
          created_at?: string;
          invite_code?: string | null;
        };
        Relations: [
          {
            foreignKeyName: "proxy_members_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proxy_members_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      feedback: {
        Row: {
          id: string;
          user_id: string | null;
          type: "bug" | "feature" | "general" | "positive" | "negative";
          subject: string | null;
          description: string | null;
          page_url: string | null;
          screenshot_url: string | null;
          user_agent: string | null;
          status: "new" | "in_progress" | "resolved" | "ignored";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          type: "bug" | "feature" | "general" | "positive" | "negative";
          subject?: string | null;
          description?: string | null;
          page_url?: string | null;
          screenshot_url?: string | null;
          user_agent?: string | null;
          status?: "new" | "in_progress" | "resolved" | "ignored";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          type?: "bug" | "feature" | "general" | "positive" | "negative";
          subject?: string | null;
          description?: string | null;
          page_url?: string | null;
          screenshot_url?: string | null;
          user_agent?: string | null;
          status?: "new" | "in_progress" | "resolved" | "ignored";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "feedback_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      user_preferences: {
        Row: {
          user_id: string;
          default_landing: "dashboard" | "submit" | "progress" | "rankings";
          primary_league_id: string | null;
          reminder_style: "floating" | "badge" | "card";
          reminder_dismissed_until: string | null;
          theme: "dark" | "light" | "system";
          email_daily_reminder: boolean;
          email_weekly_digest: boolean;
          push_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          default_landing?: "dashboard" | "submit" | "progress" | "rankings";
          primary_league_id?: string | null;
          reminder_style?: "floating" | "badge" | "card";
          reminder_dismissed_until?: string | null;
          theme?: "dark" | "light" | "system";
          email_daily_reminder?: boolean;
          email_weekly_digest?: boolean;
          push_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          default_landing?: "dashboard" | "submit" | "progress" | "rankings";
          primary_league_id?: string | null;
          reminder_style?: "floating" | "badge" | "card";
          reminder_dismissed_until?: string | null;
          theme?: "dark" | "light" | "system";
          email_daily_reminder?: boolean;
          email_weekly_digest?: boolean;
          push_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_preferences_primary_league_id_fkey";
            columns: ["primary_league_id"];
            isOneToOne: false;
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      leaderboard_period: {
        Args: {
          _league_id: string;
          _dates: string[];
          _limit?: number;
          _offset?: number;
        };
        Returns: {
          rank: number;
          user_id: string;
          display_name: string | null;
          total_steps: number;
          total_km: number;
          total_calories: number;
          partial_days: number;
          missed_days: number;
          verified_days: number;
          unverified_days: number;
          member_total: number;
          team_total_steps: number;
        }[];
      };
      is_superadmin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      set_superadmin: {
        Args: {
          target_user_id: string;
          is_super: boolean;
        };
        Returns: undefined;
      };
      update_site_setting: {
        Args: {
          setting_key: string;
          setting_value: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Helper types for easier access
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Insertable<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updatable<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Specific table row types
export type User = Tables<"users">;
export type League = Tables<"leagues">;
export type Membership = Tables<"memberships">;
export type Submission = Tables<"submissions">;
export type SiteSetting = Tables<"site_settings">;
export type AuditLog = Tables<"audit_log">;
export type ProxyMember = Tables<"proxy_members">;
export type UserPreferences = Tables<"user_preferences">;

// Submission change audit type (defined manually as table is new)
export interface SubmissionChange {
  id: string;
  submission_id: string;
  user_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  reason: string | null;
  created_at: string;
}

