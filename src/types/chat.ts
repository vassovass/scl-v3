/**
 * PRD 37: Chat Foundation Types
 *
 * TypeScript interfaces for all chat & social tables.
 * Phase A: Types only — no UI or API implementation yet.
 */

import type { Json } from "./database";

// ---------------------------------------------------------------------------
// Enums / Union Types
// ---------------------------------------------------------------------------

export type ConversationType = "direct" | "league_group";

export type ChatParticipantRole = "owner" | "admin" | "member";

export type MessageType =
  | "text"
  | "image"
  | "badge_share"
  | "high_five"
  | "achievement"
  | "system";

export type ActivityType =
  | "submission"
  | "achievement"
  | "milestone"
  | "streak"
  | "joined"
  | "high_five_batch"
  | "custom";

export type ActivityVisibility = "league" | "public";

export type ReportReason = "spam" | "harassment" | "inappropriate" | "other";

export type ReportStatus = "pending" | "reviewed" | "actioned" | "dismissed";

export type DmPermission = "no_one" | "mutuals" | "all";

// ---------------------------------------------------------------------------
// Table Row Types
// ---------------------------------------------------------------------------

export interface ChatConversation {
  id: string;
  conversation_type: ConversationType;
  league_id: string | null;
  name: string | null;
  avatar_path: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatParticipant {
  conversation_id: string;
  user_id: string;
  role: ChatParticipantRole;
  joined_at: string;
  last_read_at: string;
  muted: boolean;
  notifications_enabled: boolean;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  message_type: MessageType;
  metadata: Json;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
}

export interface ChatAttachment {
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
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface LeagueActivity {
  id: string;
  league_id: string;
  user_id: string;
  activity_type: ActivityType;
  content: Json;
  visibility: ActivityVisibility;
  created_at: string;
}

export interface ActivityComment {
  id: string;
  activity_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  edited_at: string | null;
}

export interface UserBlock {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface MessageReport {
  id: string;
  message_id: string;
  reporter_id: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// User Preferences Extension
// ---------------------------------------------------------------------------

export interface ChatSettings {
  allow_dm_from: DmPermission;
  show_in_activity_feed: boolean;
  activity_notifications: boolean;
  comment_notifications: boolean;
  message_notifications: boolean;
}

export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  allow_dm_from: "mutuals",
  show_in_activity_feed: true,
  activity_notifications: true,
  comment_notifications: true,
  message_notifications: true,
};

// ---------------------------------------------------------------------------
// Helper / View Types
// ---------------------------------------------------------------------------

export interface UnreadCount {
  user_id: string;
  conversation_id: string;
  unread_count: number;
  last_message_at: string | null;
}

// ---------------------------------------------------------------------------
// Metadata Types (for message_type variants)
// ---------------------------------------------------------------------------

export interface BadgeShareMetadata {
  badge_type: string;
  badge_name: string;
  earned_at: string;
}

export interface HighFiveMetadata {
  high_five_id: string;
  recipient_id: string;
}

export interface AchievementMetadata {
  achievement_type: string;
  value: number;
  label: string;
}

export interface SystemMessageMetadata {
  event: "user_joined" | "user_left" | "conversation_created" | "name_changed";
  actor_id?: string;
  details?: string;
}

// ---------------------------------------------------------------------------
// Activity Content Types (for league_activity.content)
// ---------------------------------------------------------------------------

export interface SubmissionActivityContent {
  steps: number;
  for_date: string;
  league_name?: string;
}

export interface AchievementActivityContent {
  badge_type: string;
  badge_name: string;
}

export interface MilestoneActivityContent {
  milestone_type: "total_steps";
  value: number;
  label: string;
}

export interface StreakActivityContent {
  streak_days: number;
  is_personal_best: boolean;
}

export interface CustomActivityContent {
  message: string;
}
