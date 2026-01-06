-- PRD 24 Enhancement: Add SEO and Open Graph metadata to menu items
-- This allows menu items to control page metadata dynamically

ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS seo_keywords TEXT[],
ADD COLUMN IF NOT EXISTS og_title TEXT,
ADD COLUMN IF NOT EXISTS og_description TEXT,
ADD COLUMN IF NOT EXISTS og_image TEXT,
ADD COLUMN IF NOT EXISTS og_type TEXT DEFAULT 'website';

-- Add comments for documentation
COMMENT ON COLUMN menu_items.seo_title IS 'Page title tag - overrides default if set';
COMMENT ON COLUMN menu_items.seo_description IS 'Meta description for search engines';
COMMENT ON COLUMN menu_items.seo_keywords IS 'SEO keywords array';
COMMENT ON COLUMN menu_items.og_title IS 'Open Graph title for social sharing';
COMMENT ON COLUMN menu_items.og_description IS 'Open Graph description for social sharing';
COMMENT ON COLUMN menu_items.og_image IS 'Open Graph image URL for social previews';
COMMENT ON COLUMN menu_items.og_type IS 'Open Graph content type (website, article, etc.)';

-- Create index for faster SEO lookups by href
CREATE INDEX IF NOT EXISTS idx_menu_items_href ON menu_items(href) WHERE href IS NOT NULL;
