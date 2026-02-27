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
          // PRD 47: H2H fields
          h2h_enabled: boolean;
          h2h_season_weeks: number;
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
          // PRD 47: H2H fields
          h2h_enabled?: boolean;
          h2h_season_weeks?: number;
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
          // PRD 47: H2H fields
          h2h_enabled?: boolean;
          h2h_season_weeks?: number;
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
    // PRD 37: Chat Foundation Tables
      chat_conversations: {
        Row: {
          id: string;
          conversation_type: "direct" | "league_group";
          league_id: string | null;
          name: string | null;
          avatar_path: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          conversation_type: "direct" | "league_group";
          league_id?: string | null;
          name?: string | null;
          avatar_path?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          conversation_type?: "direct" | "league_group";
          league_id?: string | null;
          name?: string | null;
          avatar_path?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_conversations_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_conversations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      chat_participants: {
        Row: {
          conversation_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          joined_at: string;
          last_read_at: string;
          muted: boolean;
          notifications_enabled: boolean;
        };
        Insert: {
          conversation_id: string;
          user_id: string;
          role?: "owner" | "admin" | "member";
          joined_at?: string;
          last_read_at?: string;
          muted?: boolean;
          notifications_enabled?: boolean;
        };
        Update: {
          conversation_id?: string;
          user_id?: string;
          role?: "owner" | "admin" | "member";
          joined_at?: string;
          last_read_at?: string;
          muted?: boolean;
          notifications_enabled?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "chat_participants_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "chat_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      chat_messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string | null;
          message_type: "text" | "image" | "badge_share" | "high_five" | "achievement" | "system";
          metadata: Json;
          edited_at: string | null;
          deleted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content?: string | null;
          message_type?: "text" | "image" | "badge_share" | "high_five" | "achievement" | "system";
          metadata?: Json;
          edited_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string | null;
          message_type?: "text" | "image" | "badge_share" | "high_five" | "achievement" | "system";
          metadata?: Json;
          edited_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "chat_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      chat_attachments: {
        Row: {
          id: string;
          message_id: string;
          storage_path: string;
          file_name: string;
          file_size: number;
          mime_type: string;
          width: number | null;
          height: number | null;
          thumbnail_path: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          storage_path: string;
          file_name: string;
          file_size: number;
          mime_type: string;
          width?: number | null;
          height?: number | null;
          thumbnail_path?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          storage_path?: string;
          file_name?: string;
          file_size?: number;
          mime_type?: string;
          width?: number | null;
          height?: number | null;
          thumbnail_path?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_attachments_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "chat_messages";
            referencedColumns: ["id"];
          }
        ];
      };
      message_reactions: {
        Row: {
          id: string;
          message_id: string;
          user_id: string;
          emoji: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          user_id: string;
          emoji: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          user_id?: string;
          emoji?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "chat_messages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      league_activity: {
        Row: {
          id: string;
          league_id: string;
          user_id: string;
          activity_type: "submission" | "achievement" | "milestone" | "streak" | "joined" | "high_five_batch" | "custom";
          content: Json;
          visibility: "league" | "public";
          created_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          user_id: string;
          activity_type: "submission" | "achievement" | "milestone" | "streak" | "joined" | "high_five_batch" | "custom";
          content: Json;
          visibility?: "league" | "public";
          created_at?: string;
        };
        Update: {
          id?: string;
          league_id?: string;
          user_id?: string;
          activity_type?: "submission" | "achievement" | "milestone" | "streak" | "joined" | "high_five_batch" | "custom";
          content?: Json;
          visibility?: "league" | "public";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "league_activity_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "league_activity_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      activity_comments: {
        Row: {
          id: string;
          activity_id: string;
          user_id: string;
          parent_id: string | null;
          content: string;
          created_at: string;
          edited_at: string | null;
        };
        Insert: {
          id?: string;
          activity_id: string;
          user_id: string;
          parent_id?: string | null;
          content: string;
          created_at?: string;
          edited_at?: string | null;
        };
        Update: {
          id?: string;
          activity_id?: string;
          user_id?: string;
          parent_id?: string | null;
          content?: string;
          created_at?: string;
          edited_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "activity_comments_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "league_activity";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_comments_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "activity_comments";
            referencedColumns: ["id"];
          }
        ];
      };
      user_blocks: {
        Row: {
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: {
          blocker_id?: string;
          blocked_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_blocks_blocker_id_fkey";
            columns: ["blocker_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_blocks_blocked_id_fkey";
            columns: ["blocked_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      // PRD 47: Head-to-Head League Tables
      h2h_seasons: {
        Row: {
          id: string;
          league_id: string;
          season_number: number;
          season_type: "fixed" | "endless";
          total_weeks: number;
          start_date: string;
          end_date: string | null;
          status: "pending" | "active" | "completed" | "cancelled";
          created_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          season_number?: number;
          season_type?: "fixed" | "endless";
          total_weeks?: number;
          start_date: string;
          end_date?: string | null;
          status?: "pending" | "active" | "completed" | "cancelled";
          created_at?: string;
        };
        Update: {
          id?: string;
          league_id?: string;
          season_number?: number;
          season_type?: "fixed" | "endless";
          total_weeks?: number;
          start_date?: string;
          end_date?: string | null;
          status?: "pending" | "active" | "completed" | "cancelled";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "h2h_seasons_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          }
        ];
      };
      h2h_fixtures: {
        Row: {
          id: string;
          season_id: string;
          week_number: number;
          round_type: "regular" | "semifinal" | "final";
          home_user_id: string | null;
          away_user_id: string | null;
          home_steps: number | null;
          away_steps: number | null;
          home_points: number | null;
          away_points: number | null;
          status: "scheduled" | "in_progress" | "completed" | "cancelled";
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          season_id: string;
          week_number: number;
          round_type?: "regular" | "semifinal" | "final";
          home_user_id?: string | null;
          away_user_id?: string | null;
          home_steps?: number | null;
          away_steps?: number | null;
          home_points?: number | null;
          away_points?: number | null;
          status?: "scheduled" | "in_progress" | "completed" | "cancelled";
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          season_id?: string;
          week_number?: number;
          round_type?: "regular" | "semifinal" | "final";
          home_user_id?: string | null;
          away_user_id?: string | null;
          home_steps?: number | null;
          away_steps?: number | null;
          home_points?: number | null;
          away_points?: number | null;
          status?: "scheduled" | "in_progress" | "completed" | "cancelled";
          completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "h2h_fixtures_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "h2h_seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "h2h_fixtures_home_user_id_fkey";
            columns: ["home_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "h2h_fixtures_away_user_id_fkey";
            columns: ["away_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      h2h_standings: {
        Row: {
          id: string;
          season_id: string;
          user_id: string;
          played: number;
          won: number;
          drawn: number;
          lost: number;
          points: number;
          total_steps: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          season_id: string;
          user_id: string;
          played?: number;
          won?: number;
          drawn?: number;
          lost?: number;
          points?: number;
          total_steps?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          season_id?: string;
          user_id?: string;
          played?: number;
          won?: number;
          drawn?: number;
          lost?: number;
          points?: number;
          total_steps?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "h2h_standings_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "h2h_seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "h2h_standings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      message_reports: {
        Row: {
          id: string;
          message_id: string;
          reporter_id: string;
          reason: "spam" | "harassment" | "inappropriate" | "other";
          details: string | null;
          status: "pending" | "reviewed" | "actioned" | "dismissed";
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          reporter_id: string;
          reason: "spam" | "harassment" | "inappropriate" | "other";
          details?: string | null;
          status?: "pending" | "reviewed" | "actioned" | "dismissed";
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          reporter_id?: string;
          reason?: "spam" | "harassment" | "inappropriate" | "other";
          details?: string | null;
          status?: "pending" | "reviewed" | "actioned" | "dismissed";
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "message_reports_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "chat_messages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "message_reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "message_reports_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      user_unread_counts: {
        Row: {
          user_id: string;
          conversation_id: string;
          unread_count: number;
          last_message_at: string | null;
        };
      };
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

// PRD 37: Chat Foundation Types
export type ChatConversation = Tables<"chat_conversations">;
export type ChatParticipant = Tables<"chat_participants">;
export type ChatMessage = Tables<"chat_messages">;
export type ChatAttachment = Tables<"chat_attachments">;
export type MessageReaction = Tables<"message_reactions">;
export type LeagueActivity = Tables<"league_activity">;
export type ActivityComment = Tables<"activity_comments">;
export type UserBlock = Tables<"user_blocks">;
export type MessageReport = Tables<"message_reports">;

// PRD 47: Head-to-Head League Types
export type H2HSeason = Tables<"h2h_seasons">;
export type H2HFixture = Tables<"h2h_fixtures">;
export type H2HStanding = Tables<"h2h_standings">;

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

