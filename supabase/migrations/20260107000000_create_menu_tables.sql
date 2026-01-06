-- PRD 24: WordPress-Style Menu Backend System
-- Database schema for menu management

-- Menu definitions (replaces hardcoded MENUS object)
CREATE TABLE menu_definitions (
  id TEXT PRIMARY KEY,  -- e.g., 'main', 'help', 'user', 'admin'
  label TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu items (mirrors MenuItem interface from menuConfig.ts)
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id TEXT NOT NULL REFERENCES menu_definitions(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,

  -- Core properties (match MenuItem interface)
  item_key TEXT NOT NULL,  -- Unique within menu, e.g., 'dashboard', 'league-submit'
  label TEXT NOT NULL,
  href TEXT,
  icon TEXT,  -- Emoji or icon name
  description TEXT,

  -- Visibility
  visible_to TEXT[] DEFAULT '{}',  -- Empty = all authenticated
  hidden_from TEXT[] DEFAULT '{}',
  requires_league BOOLEAN DEFAULT false,

  -- Behavior
  on_click TEXT,  -- Named action, e.g., 'signOut', 'startTour'
  external BOOLEAN DEFAULT false,
  divider_before BOOLEAN DEFAULT false,

  -- Ordering
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu location assignments (which menus show where)
CREATE TABLE menu_locations (
  location TEXT PRIMARY KEY,  -- 'public_header', 'app_header', etc.
  menu_ids TEXT[] NOT NULL,  -- Array of menu_definitions.id
  show_logo BOOLEAN DEFAULT true,
  show_sign_in BOOLEAN DEFAULT true,
  show_user_menu BOOLEAN DEFAULT true,
  show_admin_menu BOOLEAN DEFAULT true,
  class_name TEXT
);

-- RLS Policies
ALTER TABLE menu_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_locations ENABLE ROW LEVEL SECURITY;

-- SuperAdmin full access
CREATE POLICY "SuperAdmin manages menus" ON menu_definitions
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = true));

CREATE POLICY "SuperAdmin manages menu items" ON menu_items
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = true));

CREATE POLICY "SuperAdmin manages locations" ON menu_locations
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = true));

-- All users can read (menus are public)
CREATE POLICY "Everyone reads menus" ON menu_definitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Everyone reads menu items" ON menu_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Everyone reads locations" ON menu_locations FOR SELECT TO authenticated USING (true);

-- Indexes for performance
CREATE INDEX idx_menu_items_menu ON menu_items(menu_id);
CREATE INDEX idx_menu_items_parent ON menu_items(parent_id);
CREATE INDEX idx_menu_items_sort ON menu_items(menu_id, sort_order);

-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION update_menu_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_menu_definitions_timestamp
  BEFORE UPDATE ON menu_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_menu_updated_at();

CREATE TRIGGER update_menu_items_timestamp
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_menu_updated_at();
