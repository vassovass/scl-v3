-- PRD 41: Complete Proxy Columns Migration
-- =========================================
-- Status: Columns already added manually, this documents the complete migration
-- 
-- ALREADY EXISTS (added manually 2026-01-13):
--   ✅ managed_by UUID FK→users.id
--   ✅ is_proxy BOOLEAN DEFAULT false
--   ✅ invite_code TEXT
--   ✅ claims_remaining INTEGER DEFAULT 1
--   ✅ is_archived BOOLEAN DEFAULT false
--   ✅ deleted_at TIMESTAMPTZ

-- Step 1: Ensure columns exist (idempotent)
ALTER TABLE users ADD COLUMN IF NOT EXISTS claims_remaining INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Step 2: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_users_managed_by ON users(managed_by) WHERE managed_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_is_archived ON users(is_archived) WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_invite_code ON users(invite_code) WHERE invite_code IS NOT NULL;

-- Step 3: Add trigger to sync is_proxy from managed_by
-- Uses "UPDATE OF managed_by" to only fire when the relevant column changes,
-- avoiding unnecessary overhead on unrelated user updates (display_name, email, etc.)
CREATE OR REPLACE FUNCTION sync_is_proxy()
RETURNS TRIGGER AS $$
BEGIN
    NEW.is_proxy := (NEW.managed_by IS NOT NULL);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_is_proxy ON users;
CREATE TRIGGER trg_sync_is_proxy
    BEFORE INSERT OR UPDATE OF managed_by ON users
    FOR EACH ROW
    EXECUTE FUNCTION sync_is_proxy();

-- Step 4: Add trigger for orphan cleanup (soft delete proxies when manager deleted)
CREATE OR REPLACE FUNCTION cascade_manager_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- When a manager is soft-deleted, soft-delete their unclaimed proxies
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
        UPDATE users
        SET deleted_at = NEW.deleted_at
        WHERE managed_by = NEW.id
          AND deleted_at IS NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cascade_manager_soft_delete ON users;
CREATE TRIGGER trg_cascade_manager_soft_delete
    AFTER UPDATE OF deleted_at ON users
    FOR EACH ROW
    EXECUTE FUNCTION cascade_manager_soft_delete();

-- Step 5: Documentation comments
COMMENT ON COLUMN users.managed_by IS 'FK to manager user. NULL = real user, SET = proxy/ghost user managed by another';
COMMENT ON COLUMN users.is_proxy IS 'Auto-synced: true if managed_by IS NOT NULL. Do not set manually.';
COMMENT ON COLUMN users.invite_code IS 'Unique claim code for proxy users to be claimed by real users';
COMMENT ON COLUMN users.claims_remaining IS 'Number of times this proxy can be claimed (default 1, 0 = already claimed)';
COMMENT ON COLUMN users.is_archived IS 'Hidden from UI due to inactivity (activity decay). Not deleted, just hidden.';
COMMENT ON COLUMN users.deleted_at IS 'Soft delete timestamp. NULL = active, SET = soft-deleted';

-- Step 6: Ensure existing proxies have correct is_proxy value
UPDATE users SET is_proxy = true WHERE managed_by IS NOT NULL AND is_proxy = false;
UPDATE users SET is_proxy = false WHERE managed_by IS NULL AND is_proxy = true;
