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
          units: "metric" | "imperial";
          is_superadmin: boolean;
          created_at: string;
          // PRD 41: Proxy fields
          managed_by: string | null;
          is_proxy: boolean;
          invite_code: string | null;
          claims_remaining: number;
          is_archived: boolean;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          units?: "metric" | "imperial";
          is_superadmin?: boolean;
          created_at?: string;
          // PRD 41: Proxy fields
          managed_by?: string | null;
          is_proxy?: boolean;
          invite_code?: string | null;
          claims_remaining?: number;
          is_archived?: boolean;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          units?: "metric" | "imperial";
          is_superadmin?: boolean;
          created_at?: string;
          // PRD 41: Proxy fields
          managed_by?: string | null;
          is_proxy?: boolean;
          invite_code?: string | null;
          claims_remaining?: number;
          is_archived?: boolean;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "users_managed_by_fkey";
            columns: ["managed_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
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
          created_at: string;
          // NOTE: proxy_member_id removed in PRD 41 - user_id now points directly to proxy user
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
      // NOTE: proxy_members table removed in PRD 41 - proxies are now rows in users table
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
      // PRD 51: Share Cards for Social Sharing
      share_cards: {
        Row: {
          id: string;
          short_code: string;
          user_id: string | null;
          card_type: "daily" | "weekly" | "personal_best" | "streak" | "rank" | "challenge" | "rank_change";
          metric_type: "steps" | "calories" | "slp" | "distance" | "swimming" | "cycling" | "running";
          metric_value: number;
          period_start: string | null;
          period_end: string | null;
          period_label: string | null;
          league_id: string | null;
          league_name: string | null;
          rank: number | null;
          improvement_pct: number | null;
          custom_message: string | null;
          theme: "light" | "dark";
          created_at: string;
          views: number;
          clicks: number;
          shares_completed: number;
        };
        Insert: {
          id?: string;
          short_code: string;
          user_id?: string | null;
          card_type: "daily" | "weekly" | "personal_best" | "streak" | "rank" | "challenge" | "rank_change";
          metric_type?: "steps" | "calories" | "slp" | "distance" | "swimming" | "cycling" | "running";
          metric_value: number;
          period_start?: string | null;
          period_end?: string | null;
          period_label?: string | null;
          league_id?: string | null;
          league_name?: string | null;
          rank?: number | null;
          improvement_pct?: number | null;
          custom_message?: string | null;
          theme?: "light" | "dark";
          created_at?: string;
          views?: number;
          clicks?: number;
          shares_completed?: number;
        };
        Update: {
          id?: string;
          short_code?: string;
          user_id?: string | null;
          card_type?: "daily" | "weekly" | "personal_best" | "streak" | "rank" | "challenge" | "rank_change";
          metric_type?: "steps" | "calories" | "slp" | "distance" | "swimming" | "cycling" | "running";
          metric_value?: number;
          period_start?: string | null;
          period_end?: string | null;
          period_label?: string | null;
          league_id?: string | null;
          league_name?: string | null;
          rank?: number | null;
          improvement_pct?: number | null;
          custom_message?: string | null;
          theme?: "light" | "dark";
          created_at?: string;
          views?: number;
          clicks?: number;
          shares_completed?: number;
        };
        Relationships: [
          {
            foreignKeyName: "share_cards_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "share_cards_league_id_fkey";
            columns: ["league_id"];
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
export type UserPreferences = Tables<"user_preferences">;
export type ShareCard = Tables<"share_cards">;

// PRD 41: "Act As" Proxy Types
// ============================

/** Active profile context for "Act As" system */
export interface ActiveProfile {
  id: string;
  display_name: string | null;
  is_proxy: boolean;
  managed_by: string | null;
  is_superadmin?: boolean;
}

/** Payload for creating a new proxy user */
export interface CreateProxyPayload {
  display_name: string;
}

/** Payload for claiming a proxy */
export interface ClaimProxyPayload {
  merge_strategy: 'keep_proxy_profile' | 'keep_my_profile';
}

/** Proxy user with submission count (for UI lists) */
export interface ProxyWithStats extends ActiveProfile {
  submission_count: number;
  created_at: string;
  is_archived: boolean;
}

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

