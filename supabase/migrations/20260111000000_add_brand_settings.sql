-- Migration: Add brand_settings table for customizable logos and favicons
-- SuperAdmins can customize branding via /admin/branding settings page

-- Create brand_settings table
CREATE TABLE IF NOT EXISTS brand_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Logo settings
    logo_emoji TEXT NOT NULL DEFAULT '👟',
    logo_text_primary TEXT NOT NULL DEFAULT 'Step',
    logo_text_secondary TEXT NOT NULL DEFAULT 'League',
    logo_image_url TEXT, -- Custom logo for light mode (optional)
    logo_image_url_dark TEXT, -- Custom logo for dark mode (optional)

    -- Favicon settings (store Supabase Storage URLs or public paths)
    favicon_32 TEXT NOT NULL DEFAULT '/favicon.ico',
    favicon_16 TEXT NOT NULL DEFAULT '/favicon.ico',
    favicon_svg TEXT, -- NULL by default (no SVG file)
    apple_touch_icon TEXT NOT NULL DEFAULT '/apple-icon.png',
    icon_192 TEXT NOT NULL DEFAULT '/icon.png',
    icon_512 TEXT NOT NULL DEFAULT '/icon.png',
    icon_maskable TEXT, -- Android adaptive icon (optional)

    -- Theme colors
    theme_color_light TEXT NOT NULL DEFAULT '#ffffff',
    theme_color_dark TEXT NOT NULL DEFAULT '#020617',

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES users(id),

    -- Singleton pattern: only one row allowed
    CONSTRAINT singleton_brand_settings CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid)
);

-- Insert default brand settings (singleton row)
INSERT INTO brand_settings (id)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (id) DO NOTHING;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_brand_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER brand_settings_updated_at
    BEFORE UPDATE ON brand_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_brand_settings_timestamp();

-- Row-Level Security (RLS)
ALTER TABLE brand_settings ENABLE ROW LEVEL SECURITY;

-- Public can read brand settings (needed for client-side rendering)
CREATE POLICY "Anyone can view brand settings"
    ON brand_settings FOR SELECT
    USING (true);

-- Only superadmins can update brand settings
CREATE POLICY "Only superadmins can update brand settings"
    ON brand_settings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_superadmin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_superadmin = true
        )
    );

-- Create Supabase Storage bucket for brand assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for brand-assets bucket
-- Anyone can view brand assets (logos/favicons)
CREATE POLICY "Public can view brand assets"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'brand-assets');

-- Only superadmins can upload brand assets
CREATE POLICY "Superadmins can upload brand assets"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'brand-assets' AND
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_superadmin = true
        )
    );

-- Only superadmins can update brand assets
CREATE POLICY "Superadmins can update brand assets"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'brand-assets' AND
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_superadmin = true
        )
    );

-- Only superadmins can delete brand assets
CREATE POLICY "Superadmins can delete brand assets"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'brand-assets' AND
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_superadmin = true
        )
    );

-- Create index for faster lookups (though only 1 row exists)
CREATE INDEX idx_brand_settings_updated_at ON brand_settings(updated_at DESC);

-- Add comment
COMMENT ON TABLE brand_settings IS 'Singleton table for storing customizable branding (logos, favicons, theme colors). SuperAdmin-only editing via /admin/branding.';
