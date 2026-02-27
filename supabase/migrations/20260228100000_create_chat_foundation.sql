-- =============================================================================
-- PRD 37: Chat Foundation Schema
-- Purpose: Lay database foundation for future chat & social features
-- Phase A: Schema only — no UI or API implementation
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. CONVERSATIONS (Direct messages & League group chats)
-- -----------------------------------------------------------------------------
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_type TEXT NOT NULL CHECK (conversation_type IN ('direct', 'league_group')),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  name TEXT,
  avatar_path TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- League group chats must have a league_id
  CONSTRAINT league_group_requires_league CHECK (
    conversation_type != 'league_group' OR league_id IS NOT NULL
  )
);

CREATE INDEX idx_chat_conversations_league ON chat_conversations(league_id);
CREATE INDEX idx_chat_conversations_updated ON chat_conversations(updated_at DESC);

-- -----------------------------------------------------------------------------
-- 2. PARTICIPANTS (Who is in each conversation)
-- -----------------------------------------------------------------------------
CREATE TABLE chat_participants (
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  muted BOOLEAN DEFAULT FALSE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX idx_chat_participants_user ON chat_participants(user_id);

-- -----------------------------------------------------------------------------
-- 3. MESSAGES (The actual chat content)
-- -----------------------------------------------------------------------------
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  content TEXT CHECK (content IS NULL OR char_length(content) BETWEEN 1 AND 2000),
  message_type TEXT DEFAULT 'text' CHECK (message_type IN (
    'text',
    'image',
    'badge_share',
    'high_five',
    'achievement',
    'system'
  )),

  metadata JSONB DEFAULT '{}',
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT message_has_content CHECK (
    content IS NOT NULL OR message_type IN ('image', 'badge_share', 'high_five', 'achievement', 'system')
  )
);

CREATE INDEX idx_chat_messages_conversation_date ON chat_messages(conversation_id, created_at DESC);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_conversation_created ON chat_messages(conversation_id, created_at);

-- -----------------------------------------------------------------------------
-- 4. ATTACHMENTS (Images, files — stored in Supabase Storage)
-- -----------------------------------------------------------------------------
CREATE TABLE chat_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  thumbnail_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_attachments_message ON chat_attachments(message_id);

-- -----------------------------------------------------------------------------
-- 5. EMOJI REACTIONS
-- -----------------------------------------------------------------------------
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (char_length(emoji) BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX idx_message_reactions_user ON message_reactions(user_id);

-- -----------------------------------------------------------------------------
-- 6. ACTIVITY FEED (League member activity)
-- -----------------------------------------------------------------------------
CREATE TABLE league_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'submission',
    'achievement',
    'milestone',
    'streak',
    'joined',
    'high_five_batch',
    'custom'
  )),
  content JSONB NOT NULL,
  visibility TEXT DEFAULT 'league' CHECK (visibility IN ('league', 'public')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_league_activity_league_date ON league_activity(league_id, created_at DESC);
CREATE INDEX idx_league_activity_user ON league_activity(user_id);

-- -----------------------------------------------------------------------------
-- 7. ACTIVITY COMMENTS (Comments on feed items)
-- -----------------------------------------------------------------------------
CREATE TABLE activity_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES league_activity(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES activity_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ
);

CREATE INDEX idx_activity_comments_activity ON activity_comments(activity_id);
CREATE INDEX idx_activity_comments_parent ON activity_comments(parent_id);

-- -----------------------------------------------------------------------------
-- 8. USER BLOCKS (Safety feature)
-- -----------------------------------------------------------------------------
CREATE TABLE user_blocks (
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id)
);

CREATE INDEX idx_user_blocks_blocked ON user_blocks(blocked_id);

-- -----------------------------------------------------------------------------
-- 9. MESSAGE REPORTS (Moderation)
-- -----------------------------------------------------------------------------
CREATE TABLE message_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'other')),
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_message_reports_status ON message_reports(status) WHERE status = 'pending';

-- -----------------------------------------------------------------------------
-- 10. EXTEND USER PREFERENCES (Chat settings)
-- -----------------------------------------------------------------------------
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS chat_settings JSONB DEFAULT '{
  "allow_dm_from": "mutuals",
  "show_in_activity_feed": true,
  "activity_notifications": true,
  "comment_notifications": true,
  "message_notifications": true
}'::jsonb;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reports ENABLE ROW LEVEL SECURITY;

-- Conversations: participants can view
CREATE POLICY conversation_participant_access ON chat_conversations
  FOR SELECT USING (
    id IN (SELECT conversation_id FROM chat_participants WHERE user_id = auth.uid())
  );

-- Messages: participants can view (non-deleted)
CREATE POLICY message_participant_read ON chat_messages
  FOR SELECT USING (
    conversation_id IN (SELECT conversation_id FROM chat_participants WHERE user_id = auth.uid())
    AND deleted_at IS NULL
  );

-- Messages: participants can send (own messages only)
CREATE POLICY message_participant_send ON chat_messages
  FOR INSERT WITH CHECK (
    conversation_id IN (SELECT conversation_id FROM chat_participants WHERE user_id = auth.uid())
    AND sender_id = auth.uid()
  );

-- Participants: can view own conversations
CREATE POLICY participants_own_access ON chat_participants
  FOR SELECT USING (user_id = auth.uid());

-- Attachments: follow message access
CREATE POLICY attachments_message_access ON chat_attachments
  FOR SELECT USING (
    message_id IN (
      SELECT id FROM chat_messages
      WHERE conversation_id IN (SELECT conversation_id FROM chat_participants WHERE user_id = auth.uid())
      AND deleted_at IS NULL
    )
  );

-- Reactions: follow message access
CREATE POLICY reactions_message_access ON message_reactions
  FOR SELECT USING (
    message_id IN (
      SELECT id FROM chat_messages
      WHERE conversation_id IN (SELECT conversation_id FROM chat_participants WHERE user_id = auth.uid())
    )
  );

-- Reactions: users can add own
CREATE POLICY reactions_own_insert ON message_reactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Reactions: users can remove own
CREATE POLICY reactions_own_delete ON message_reactions
  FOR DELETE USING (user_id = auth.uid());

-- Activity feed: league members can view
CREATE POLICY league_activity_member_access ON league_activity
  FOR SELECT USING (
    league_id IN (SELECT league_id FROM memberships WHERE user_id = auth.uid())
  );

-- Activity comments: league members can view (via activity → league)
CREATE POLICY activity_comments_member_read ON activity_comments
  FOR SELECT USING (
    activity_id IN (
      SELECT id FROM league_activity
      WHERE league_id IN (SELECT league_id FROM memberships WHERE user_id = auth.uid())
    )
  );

-- Activity comments: league members can post
CREATE POLICY activity_comments_member_insert ON activity_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND activity_id IN (
      SELECT id FROM league_activity
      WHERE league_id IN (SELECT league_id FROM memberships WHERE user_id = auth.uid())
    )
  );

-- Blocks: users manage own blocks
CREATE POLICY user_blocks_own ON user_blocks
  FOR ALL USING (blocker_id = auth.uid());

-- Reports: users can create reports
CREATE POLICY message_reports_create ON message_reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- Reports: superadmins can view all
CREATE POLICY message_reports_admin_read ON message_reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = true)
  );

-- Reports: superadmins can update (review/action)
CREATE POLICY message_reports_admin_update ON message_reports
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = true)
  );

-- =============================================================================
-- HELPER VIEW: Unread counts per conversation
-- =============================================================================
CREATE OR REPLACE VIEW user_unread_counts AS
SELECT
  cp.user_id,
  cp.conversation_id,
  COUNT(cm.id) FILTER (WHERE cm.created_at > cp.last_read_at AND cm.sender_id != cp.user_id) as unread_count,
  MAX(cm.created_at) as last_message_at
FROM chat_participants cp
LEFT JOIN chat_messages cm ON cm.conversation_id = cp.conversation_id AND cm.deleted_at IS NULL
GROUP BY cp.user_id, cp.conversation_id;

GRANT SELECT ON user_unread_counts TO authenticated;

-- =============================================================================
-- FEATURE FLAGS (dormant until ready)
-- =============================================================================
INSERT INTO app_settings (key, value, label, description, category, value_type, visible_to, editable_by)
VALUES
  ('feature_chat_activity_feed', 'false', 'Activity Feed', 'Show league activity feed with submissions, achievements, and reactions (PRD 37 Phase 1)', 'features', 'boolean', '{superadmin}', '{superadmin}'),
  ('feature_chat_comments', 'false', 'Activity Comments', 'Allow comments on activity feed items (PRD 37 Phase 2)', 'features', 'boolean', '{superadmin}', '{superadmin}'),
  ('feature_chat_direct_messages', 'false', 'Direct Messages', 'Enable direct and group messaging between users (PRD 37 Phase 3)', 'features', 'boolean', '{superadmin}', '{superadmin}')
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- STORAGE BUCKET for chat attachments
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: participants can upload to their conversations
CREATE POLICY "Chat participants can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-attachments'
    AND auth.uid() IS NOT NULL
  );

-- Storage policies: participants can view chat attachments
CREATE POLICY "Chat participants can view attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'chat-attachments'
    AND auth.uid() IS NOT NULL
  );

-- =============================================================================
-- TABLE COMMENTS
-- =============================================================================
COMMENT ON TABLE chat_conversations IS 'PRD 37: Chat conversations — direct messages and league group chats';
COMMENT ON TABLE chat_participants IS 'PRD 37: Conversation membership with read tracking and mute settings';
COMMENT ON TABLE chat_messages IS 'PRD 37: Chat messages with type variants (text, image, badge_share, high_five, achievement, system)';
COMMENT ON TABLE chat_attachments IS 'PRD 37: File attachments stored in Supabase Storage chat-attachments bucket';
COMMENT ON TABLE message_reactions IS 'PRD 37: Emoji reactions on messages (one per user per emoji per message)';
COMMENT ON TABLE league_activity IS 'PRD 37: League activity feed — submissions, achievements, milestones, streaks';
COMMENT ON TABLE activity_comments IS 'PRD 37: Threaded comments on league activity items (max depth via parent_id)';
COMMENT ON TABLE user_blocks IS 'PRD 37: User blocking for safety — prevents DMs and hides content';
COMMENT ON TABLE message_reports IS 'PRD 37: Message moderation reports with admin review workflow';
