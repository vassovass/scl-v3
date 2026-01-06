# Database-Driven Menu Systems with SEO Optimization - Best Practices Research

## Executive Summary

This research document compiles industry best practices for building scalable, performant database-driven menu systems with integrated SEO optimization. Based on analysis of leading CMS platforms (WordPress, Webflow, Shopify), modern frameworks (Next.js 14+), and progressive web app patterns, this guide provides actionable recommendations for StepLeague's menu system expansion.

**Key Findings:**
- Database-first with static fallback is the optimal pattern for menu systems
- Next.js 14+ `generateMetadata` API provides type-safe, cacheable SEO metadata
- Bidirectional sync between menu items and page metadata prevents content drift
- Character limits and validation at write-time prevent SEO issues
- Stale-while-revalidate (SWR) caching balances freshness with performance
- Menu versioning and rollback are critical for production systems

---

## 1. Menu Management UX/UI Best Practices

### 1.1 Modern Admin Interfaces Analysis

**WordPress Menu Editor (Industry Standard)**

WordPress's menu system, refined over 15+ years, provides the gold standard for database-driven navigation:

**Key Features:**
- **Drag-and-drop reordering** using @wordpress/draggable (React-based)
- **Unlimited nesting depth** with visual indentation
- **Live preview** in sidebar while editing
- **Menu locations** concept (primary, footer, mobile)
- **Custom fields** per menu item (CSS classes, title attributes, rel attributes)
- **Screen Options** toggle for advanced fields (visibility, display order)

**UI Pattern:**
```
┌─────────────────────────────────────────┐
│ Menu Structure          │ Menu Settings │
├─────────────────────────┼───────────────┤
│ ☰ Home                  │ Label: Home   │
│   ☰ About               │ Href: /about  │
│   ☰ Contact             │ Icon: 📧      │
│ ☰ Products              │ Visible: All  │
│   ☰ Category 1          │               │
│     ☰ Subcategory A     │ [Advanced ▼]  │
│     ☰ Subcategory B     │ CSS: ...      │
│ + Add Menu Item         │ Rel: ...      │
└─────────────────────────┴───────────────┘
```

**Webflow CMS Navigation**

Webflow combines visual design with CMS-driven menus:

**Key Features:**
- **Visual menu builder** embedded in page designer
- **Collection-driven menus** (auto-populate from database)
- **Conditional visibility** based on user roles or custom logic
- **Responsive breakpoint previews** (mobile, tablet, desktop)
- **Component-based system** (reusable nav components)

**Shopify Admin (Shopify Navigation)**

Shopify's menu editor optimizes for e-commerce:

**Key Features:**
- **Quick add from catalog** (products, collections, pages)
- **Bulk operations** (delete, reorder, change visibility)
- **Search-as-you-type** for large product catalogs
- **Mobile preview** with device frames
- **A/B testing integration** (via Shopify Plus apps)

### 1.2 Drag-and-Drop Implementation

**Recommended Library: @dnd-kit/core**

Already used in StepLeague's Kanban board, @dnd-kit provides:
- **Accessibility** - Full keyboard navigation (WCAG 2.1 AA)
- **Touch support** - Mobile-friendly drag operations
- **Virtualization** - Handles 1000+ items without performance issues
- **Nested sortable** - Tree structures with unlimited depth
- **Optimistic updates** - UI updates before server confirmation

**Example Pattern for Menu Items:**

```typescript
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';

interface MenuEditorProps {
  items: MenuItem[];
  onReorder: (items: MenuItem[]) => Promise<void>;
}

function MenuEditor({ items, onReorder }: MenuEditorProps) {
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const reordered = reorderMenuItems(items, active.id, over.id);

    // Optimistic UI update
    setItems(reordered);

    // Persist to database
    try {
      await onReorder(reordered);
    } catch (err) {
      // Rollback on error
      setItems(items);
      toast.error('Failed to reorder items');
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {items.map(item => (
          <SortableMenuItem key={item.id} item={item} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

**Visual Feedback Best Practices:**

1. **Drag overlay** - Show semi-transparent copy of item being dragged
2. **Drop indicators** - Blue line showing insert position
3. **Nesting indicators** - Indent levels visualized with connecting lines
4. **Disabled states** - Grey out items that can't be nested (e.g., max depth reached)
5. **Haptic feedback** - Vibration on mobile when item is picked up/dropped

### 1.3 Bulk Operations & Batch Editing

**Pattern: Multi-select with Toolbar**

```tsx
function MenuItemList({ items }: { items: MenuItem[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  return (
    <>
      {selected.size > 0 && (
        <BulkActionToolbar>
          <Button onClick={() => bulkDelete(selected)}>Delete ({selected.size})</Button>
          <Button onClick={() => bulkVisibility(selected, 'hidden')}>Hide All</Button>
          <Button onClick={() => bulkVisibility(selected, 'visible')}>Show All</Button>
        </BulkActionToolbar>
      )}

      {items.map(item => (
        <MenuItemRow
          key={item.id}
          item={item}
          selected={selected.has(item.id)}
          onSelect={() => toggleSelection(item.id)}
        />
      ))}
    </>
  );
}
```

**Batch Edit Scenarios:**
- Change visibility for multiple items
- Apply same icon to category
- Set external link attribute on all social media items
- Delete unused menu items
- Duplicate menu structure to new location

### 1.4 Menu Preview & Testing Tools

**Live Preview Pattern:**

```tsx
function MenuPreview({ menuId }: { menuId: string }) {
  const { items, loading } = useMenuPreview(menuId);
  const [viewport, setViewport] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  return (
    <div className="preview-panel">
      <ViewportToggle value={viewport} onChange={setViewport} />

      <iframe
        src={`/preview/menu/${menuId}?viewport=${viewport}`}
        className={cn('preview-frame', {
          'w-[375px]': viewport === 'mobile',
          'w-[768px]': viewport === 'tablet',
          'w-full': viewport === 'desktop'
        })}
      />
    </div>
  );
}
```

**Testing Checklist (Auto-generated):**
- [ ] All links resolve (no 404s)
- [ ] Icons render correctly
- [ ] Mobile menu collapses properly
- [ ] Keyboard navigation works
- [ ] Screen reader announces items correctly
- [ ] No orphaned children (parent deleted but children remain)
- [ ] No circular references in submenu structure

---

## 2. SEO & Open Graph Optimization

### 2.1 Dynamic Metadata Management in Next.js

**Next.js 14+ Metadata API (Recommended)**

Next.js provides a type-safe, cacheable metadata system through the `generateMetadata` function:

```typescript
import type { Metadata } from 'next';
import { cache } from 'react';

// Memoize data fetching to avoid duplicate requests
export const getPageMetadata = cache(async (slug: string) => {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('menu_items')
    .select('label, description, og_title, og_description, og_image')
    .eq('href', `/${slug}`)
    .single();

  return data;
});

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const meta = await getPageMetadata(params.slug);

  return {
    title: meta?.og_title || meta?.label,
    description: meta?.og_description || meta?.description,
    openGraph: {
      title: meta?.og_title || meta?.label,
      description: meta?.og_description || meta?.description,
      images: meta?.og_image ? [{ url: meta.og_image, width: 1200, height: 630 }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: meta?.og_title || meta?.label,
      description: meta?.og_description || meta?.description,
      images: meta?.og_image ? [meta.og_image] : [],
    },
  };
}
```

**Key Benefits:**
- **Automatic deduplication** - React's `cache()` prevents duplicate fetches for metadata + page content
- **Type safety** - TypeScript ensures valid metadata structure
- **Streaming optimization** - Metadata loads separately from page content
- **Bot detection** - Next.js disables streaming for crawlers (ensures complete metadata)

### 2.2 Bidirectional Sync Pattern

**Problem:** Menu items and page metadata can drift out of sync when edited separately.

**Solution:** Two-way binding with validation at write-time.

**Database Schema:**

```sql
-- Add SEO fields to menu_items table
ALTER TABLE menu_items ADD COLUMN og_title TEXT;
ALTER TABLE menu_items ADD COLUMN og_description TEXT;
ALTER TABLE menu_items ADD COLUMN og_image TEXT;
ALTER TABLE menu_items ADD COLUMN meta_keywords TEXT[];
ALTER TABLE menu_items ADD COLUMN canonical_url TEXT;
ALTER TABLE menu_items ADD COLUMN robots TEXT DEFAULT 'index,follow';

-- Character limit constraints
ALTER TABLE menu_items ADD CONSTRAINT og_title_length
  CHECK (length(og_title) <= 60);

ALTER TABLE menu_items ADD CONSTRAINT og_description_length
  CHECK (length(og_description) <= 160);

-- Trigger to auto-populate og_title from label if empty
CREATE OR REPLACE FUNCTION sync_menu_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-fill og_title from label if not provided
  IF NEW.og_title IS NULL OR NEW.og_title = '' THEN
    NEW.og_title := NEW.label;
  END IF;

  -- Auto-fill og_description from description if not provided
  IF NEW.og_description IS NULL OR NEW.og_description = '' THEN
    NEW.og_description := NEW.description;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_menu_metadata_trigger
  BEFORE INSERT OR UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION sync_menu_metadata();
```

**Admin UI with Character Counter:**

```tsx
function MetadataEditor({ item }: { item: MenuItem }) {
  const [ogTitle, setOgTitle] = useState(item.og_title || item.label);
  const [ogDescription, setOgDescription] = useState(item.og_description || item.description);

  const titleStatus = getCharacterStatus(ogTitle.length, 50, 60);
  const descStatus = getCharacterStatus(ogDescription.length, 150, 160);

  return (
    <div className="metadata-editor">
      <Label>
        OG Title
        <CharacterCounter current={ogTitle.length} max={60} status={titleStatus} />
      </Label>
      <Input
        value={ogTitle}
        onChange={e => setOgTitle(e.target.value)}
        maxLength={60}
        className={titleStatus === 'error' ? 'border-red-500' : ''}
      />

      <Label>
        OG Description
        <CharacterCounter current={ogDescription.length} max={160} status={descStatus} />
      </Label>
      <Textarea
        value={ogDescription}
        onChange={e => setOgDescription(e.target.value)}
        maxLength={160}
        rows={3}
        className={descStatus === 'error' ? 'border-red-500' : ''}
      />

      <SocialPreview
        title={ogTitle}
        description={ogDescription}
        image={item.og_image}
      />
    </div>
  );
}

function getCharacterStatus(length: number, optimal: number, max: number) {
  if (length === 0) return 'empty';
  if (length < optimal) return 'warning'; // Too short, may be truncated
  if (length > max) return 'error';
  return 'success';
}
```

### 2.3 Character Limits & Validation

**Google Search Results Display Limits (2025):**

| Field | Desktop | Mobile | Recommendation |
|-------|---------|--------|----------------|
| Title | ~60 chars | ~50 chars | 50-60 chars (prioritize first 50) |
| Description | ~160 chars | ~120 chars | 150-160 chars |
| URL | ~70 chars | ~50 chars | Keep short, use hyphens |

**Open Graph Optimal Dimensions:**

| Platform | Image Size | Aspect Ratio | Format |
|----------|-----------|--------------|--------|
| Facebook | 1200x630 | 1.91:1 | JPG, PNG |
| Twitter | 1200x675 | 16:9 | JPG, PNG, WEBP |
| LinkedIn | 1200x627 | 1.91:1 | JPG, PNG |
| WhatsApp | 300x300 (min) | 1:1 preferred | JPG |

**Validation Rules:**

```typescript
const SEO_VALIDATION_RULES = {
  title: {
    minLength: 30,
    maxLength: 60,
    optimalLength: 50,
    rules: [
      'Include primary keyword near the beginning',
      'Make it unique per page',
      'Front-load important words',
      'Avoid keyword stuffing',
    ]
  },
  description: {
    minLength: 120,
    maxLength: 160,
    optimalLength: 155,
    rules: [
      'Include a call-to-action',
      'Match search intent',
      'Include target keyword naturally',
      'Be descriptive, not promotional',
    ]
  },
  ogImage: {
    minWidth: 1200,
    minHeight: 630,
    maxFileSize: 8 * 1024 * 1024, // 8MB
    formats: ['image/jpeg', 'image/png', 'image/webp'],
    rules: [
      'Use high contrast text',
      'Include brand logo',
      'Avoid text smaller than 40px',
      'Test on dark mode backgrounds',
    ]
  }
};

function validateMetadata(metadata: Metadata): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Title validation
  if (metadata.title.length < SEO_VALIDATION_RULES.title.minLength) {
    warnings.push('Title is too short, may appear incomplete in search results');
  }
  if (metadata.title.length > SEO_VALIDATION_RULES.title.maxLength) {
    errors.push('Title exceeds 60 characters and will be truncated');
  }

  // Description validation
  if (metadata.description.length < SEO_VALIDATION_RULES.description.minLength) {
    warnings.push('Description is too short, Google may generate its own');
  }
  if (metadata.description.length > SEO_VALIDATION_RULES.description.maxLength) {
    errors.push('Description exceeds 160 characters and will be truncated');
  }

  // Duplicate check (across all pages)
  const duplicates = await checkDuplicateMetadata(metadata.title);
  if (duplicates.length > 0) {
    warnings.push(`Title is used on ${duplicates.length} other pages`);
  }

  return { valid: errors.length === 0, errors, warnings };
}
```

### 2.4 Structured Data & Schema.org Integration

**BreadcrumbList Schema (Auto-generated from Menu Hierarchy):**

```typescript
export function generateBreadcrumbSchema(menuPath: MenuItem[]): WithContext<BreadcrumbList> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: menuPath.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: `${process.env.NEXT_PUBLIC_SITE_URL}${item.href}`
    }))
  };
}

// Usage in page component
export default function Page({ params }: { params: { slug: string } }) {
  const breadcrumbs = getBreadcrumbPath(params.slug);
  const schema = generateBreadcrumbSchema(breadcrumbs);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {/* Page content */}
    </>
  );
}
```

**SiteNavigationElement Schema:**

```typescript
export function generateNavigationSchema(menuItems: MenuItem[]): WithContext<ItemList> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: menuItems.map((item, index) => ({
      '@type': 'SiteNavigationElement',
      position: index + 1,
      name: item.label,
      description: item.description,
      url: `${process.env.NEXT_PUBLIC_SITE_URL}${item.href}`
    }))
  };
}
```

**Benefits:**
- Rich snippets in Google Search (breadcrumbs, sitelinks)
- Improved crawlability (explicit site structure)
- Better understanding of page hierarchy
- Voice search optimization

### 2.5 Social Media Preview Tools

**Live Preview Component:**

```tsx
function SocialPreview({ title, description, image, url }: MetadataPreviewProps) {
  return (
    <div className="preview-grid">
      {/* Facebook Preview */}
      <div className="facebook-preview">
        <div className="preview-image">
          {image ? <img src={image} alt="" /> : <div className="placeholder" />}
        </div>
        <div className="preview-content">
          <div className="preview-url">{url}</div>
          <div className="preview-title">{truncate(title, 100)}</div>
          <div className="preview-description">{truncate(description, 300)}</div>
        </div>
      </div>

      {/* Twitter/X Preview */}
      <div className="twitter-preview">
        {image && <img src={image} alt="" className="preview-image-large" />}
        <div className="preview-content">
          <div className="preview-title">{truncate(title, 70)}</div>
          <div className="preview-description">{truncate(description, 200)}</div>
          <div className="preview-url">{url}</div>
        </div>
      </div>

      {/* LinkedIn Preview */}
      <div className="linkedin-preview">
        {image && <img src={image} alt="" className="preview-image" />}
        <div className="preview-content">
          <div className="preview-title">{title}</div>
          <div className="preview-description">{truncate(description, 150)}</div>
        </div>
      </div>
    </div>
  );
}
```

**Testing Tools Integration:**

```typescript
// Generate test URLs for external tools
export function generatePreviewTestUrls(url: string) {
  return {
    facebookDebugger: `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(url)}`,
    twitterValidator: `https://cards-dev.twitter.com/validator?url=${encodeURIComponent(url)}`,
    linkedInInspector: `https://www.linkedin.com/post-inspector/inspect/${encodeURIComponent(url)}`,
  };
}
```

---

## 3. Performance & Caching

### 3.1 Menu Caching Strategies

**Multi-Layer Caching Approach:**

```
┌─────────────────┐
│   Edge (CDN)    │ ← Cache static menu JSON (60s TTL)
├─────────────────┤
│  Service Worker │ ← Cache for offline (7 days)
├─────────────────┤
│   IndexedDB     │ ← Client-side cache (instant load)
├─────────────────┤
│  React Query    │ ← In-memory cache (5 min TTL)
├─────────────────┤
│   Supabase DB   │ ← Source of truth
└─────────────────┘
```

**Implementation:**

```typescript
// lib/menu/cache.ts
import { cache } from 'react';
import { unstable_cache } from 'next/cache';

// Server-side cache (Next.js Data Cache)
export const getCachedMenu = unstable_cache(
  async (menuId: string) => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .eq('menu_id', menuId)
      .order('sort_order');

    return data;
  },
  ['menu-items'], // Cache key
  {
    revalidate: 60, // 60 seconds
    tags: [`menu-${menuId}`] // Tag for targeted invalidation
  }
);

// Client-side cache with SWR
export function useMenuData(menuId: string) {
  return useSWR(
    `/api/menus/${menuId}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 5 * 60 * 1000, // 5 minutes
      fallbackData: getMenuFromIndexedDB(menuId), // Instant load
      onSuccess: (data) => saveMenuToIndexedDB(menuId, data), // Update cache
    }
  );
}

// IndexedDB persistence
async function saveMenuToIndexedDB(menuId: string, data: MenuItem[]) {
  const db = await openDB('menu-cache', 1, {
    upgrade(db) {
      db.createObjectStore('menus');
    }
  });

  await db.put('menus', { data, timestamp: Date.now() }, menuId);
}

async function getMenuFromIndexedDB(menuId: string) {
  const db = await openDB('menu-cache', 1);
  const cached = await db.get('menus', menuId);

  // Return if cached within 7 days
  if (cached && Date.now() - cached.timestamp < 7 * 24 * 60 * 60 * 1000) {
    return cached.data;
  }

  return null;
}
```

### 3.2 Cache Invalidation Patterns

**On-Demand Revalidation (Next.js 14+):**

```typescript
// app/api/menus/revalidate/route.ts
import { revalidateTag } from 'next/cache';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const { menuId } = await request.json();

  // Invalidate specific menu cache
  revalidateTag(`menu-${menuId}`);

  // Also invalidate all pages that use this menu
  revalidateTag('navigation');

  return Response.json({ revalidated: true, now: Date.now() });
}

// Trigger revalidation after menu update
async function updateMenuItem(menuId: string, item: MenuItem) {
  const supabase = createAdminClient();
  await supabase.from('menu_items').update(item).eq('id', item.id);

  // Trigger cache invalidation
  await fetch('/api/menus/revalidate', {
    method: 'POST',
    body: JSON.stringify({ menuId })
  });
}
```

**Event-Driven Invalidation:**

```typescript
// Database trigger → Webhook → Cache invalidation
CREATE OR REPLACE FUNCTION notify_menu_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'menu_updated',
    json_build_object(
      'menu_id', NEW.menu_id,
      'operation', TG_OP,
      'timestamp', NOW()
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER menu_items_change
  AFTER INSERT OR UPDATE OR DELETE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION notify_menu_change();

// Listen for changes in app
supabase
  .channel('menu-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, (payload) => {
    const menuId = payload.new.menu_id || payload.old.menu_id;
    queryClient.invalidateQueries(['menu', menuId]);
  })
  .subscribe();
```

### 3.3 Stale-While-Revalidate (SWR) Approach

**Pattern: Serve stale content instantly, fetch fresh data in background**

```typescript
// Middleware for SWR headers
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Public menu data - aggressive SWR
  if (request.nextUrl.pathname.startsWith('/api/menus')) {
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300'
    );
    // Cache for 60s, serve stale for 5 minutes while revalidating
  }

  return response;
}

export const config = {
  matcher: '/api/menus/:path*',
};
```

**Benefits:**
- Users always see instant response (stale cache)
- Next request gets fresh data (revalidated in background)
- No loading spinners or delays
- Reduced server load (fewer simultaneous requests)

### 3.4 ISR (Incremental Static Regeneration) for Next.js

**For Static Menu Pages:**

```typescript
// app/[slug]/page.tsx
export const revalidate = 300; // 5 minutes

export async function generateStaticParams() {
  const supabase = createAdminClient();
  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('href')
    .not('href', 'is', null);

  return menuItems.map(item => ({
    slug: item.href.replace('/', '')
  }));
}

export default async function Page({ params }: { params: { slug: string } }) {
  const metadata = await getPageMetadata(params.slug);

  return (
    <div>
      <h1>{metadata.title}</h1>
      <p>{metadata.description}</p>
    </div>
  );
}
```

**Benefits:**
- Static HTML for instant page loads
- Automatic regeneration every 5 minutes
- On-demand revalidation when content changes
- No server rendering overhead for most requests

---

## 4. Advanced Features

### 4.1 Menu Versioning & Rollback

**Database Schema for Versioning:**

```sql
-- Menu version history
CREATE TABLE menu_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id TEXT NOT NULL REFERENCES menu_definitions(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  snapshot JSONB NOT NULL, -- Full menu structure
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  comment TEXT,

  UNIQUE(menu_id, version_number)
);

-- Auto-increment version number
CREATE OR REPLACE FUNCTION create_menu_version()
RETURNS TRIGGER AS $$
DECLARE
  current_menu JSONB;
  next_version INTEGER;
BEGIN
  -- Get current menu structure
  SELECT jsonb_agg(row_to_json(mi.*))
  INTO current_menu
  FROM menu_items mi
  WHERE mi.menu_id = NEW.menu_id;

  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_version
  FROM menu_versions
  WHERE menu_id = NEW.menu_id;

  -- Create version snapshot
  INSERT INTO menu_versions (menu_id, version_number, snapshot)
  VALUES (NEW.menu_id, next_version, current_menu);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on menu definition update (major changes)
CREATE TRIGGER create_menu_version_trigger
  AFTER UPDATE ON menu_definitions
  FOR EACH ROW
  WHEN (OLD.updated_at IS DISTINCT FROM NEW.updated_at)
  EXECUTE FUNCTION create_menu_version();
```

**Rollback Implementation:**

```typescript
async function rollbackMenu(menuId: string, versionNumber: number) {
  const supabase = createAdminClient();

  // Get version snapshot
  const { data: version } = await supabase
    .from('menu_versions')
    .select('snapshot')
    .eq('menu_id', menuId)
    .eq('version_number', versionNumber)
    .single();

  if (!version) throw new Error('Version not found');

  // Start transaction
  const { error } = await supabase.rpc('rollback_menu', {
    p_menu_id: menuId,
    p_snapshot: version.snapshot
  });

  if (error) throw error;

  // Invalidate cache
  revalidateTag(`menu-${menuId}`);

  return { success: true, version: versionNumber };
}

// PostgreSQL function for atomic rollback
CREATE OR REPLACE FUNCTION rollback_menu(
  p_menu_id TEXT,
  p_snapshot JSONB
)
RETURNS VOID AS $$
BEGIN
  -- Delete current items
  DELETE FROM menu_items WHERE menu_id = p_menu_id;

  -- Restore from snapshot
  INSERT INTO menu_items
  SELECT * FROM jsonb_populate_recordset(null::menu_items, p_snapshot);
END;
$$ LANGUAGE plpgsql;
```

**Admin UI:**

```tsx
function VersionHistory({ menuId }: { menuId: string }) {
  const { data: versions } = useQuery(['menu-versions', menuId], () =>
    fetch(`/api/menus/${menuId}/versions`).then(r => r.json())
  );

  return (
    <div className="version-history">
      <h3>Version History</h3>
      {versions?.map(version => (
        <div key={version.id} className="version-item">
          <div className="version-header">
            <span>v{version.version_number}</span>
            <time>{formatDate(version.created_at)}</time>
          </div>
          <p>{version.comment}</p>
          <div className="version-actions">
            <Button onClick={() => previewVersion(version.id)}>Preview</Button>
            <Button onClick={() => rollbackMenu(menuId, version.version_number)}>
              Rollback to this version
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 4.2 A/B Testing for Navigation

**Pattern: Variant-based Menu Testing**

```sql
-- Menu variants for A/B testing
CREATE TABLE menu_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id TEXT NOT NULL REFERENCES menu_definitions(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL, -- 'control', 'variant_a', 'variant_b'
  traffic_percentage INTEGER DEFAULT 0, -- 0-100
  active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track which users see which variant
CREATE TABLE menu_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  session_id TEXT NOT NULL,
  menu_id TEXT NOT NULL,
  variant_id UUID NOT NULL REFERENCES menu_variants(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track clicks per variant
CREATE TABLE menu_variant_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  impression_id UUID REFERENCES menu_impressions(id),
  menu_item_id UUID REFERENCES menu_items(id),
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Client-Side Variant Selection:**

```typescript
export function useMenuVariant(menuId: string) {
  const [variant, setVariant] = useState<string>('control');
  const sessionId = useSessionId();

  useEffect(() => {
    // Get user's assigned variant (sticky per session)
    const storedVariant = sessionStorage.getItem(`menu-variant-${menuId}`);

    if (storedVariant) {
      setVariant(storedVariant);
      return;
    }

    // Assign variant based on traffic split
    fetch(`/api/menus/${menuId}/assign-variant`, {
      method: 'POST',
      body: JSON.stringify({ sessionId })
    })
      .then(r => r.json())
      .then(data => {
        setVariant(data.variant);
        sessionStorage.setItem(`menu-variant-${menuId}`, data.variant);

        // Track impression
        analytics.trackComponentView('MenuVariant', 'navigation', {
          menu_id: menuId,
          variant: data.variant
        });
      });
  }, [menuId, sessionId]);

  return variant;
}
```

**Analytics Integration:**

```typescript
function MenuItemLink({ item, variant }: { item: MenuItem, variant: string }) {
  const handleClick = () => {
    // Track click with variant
    analytics.trackInteraction('MenuItem', 'click', item.id, {
      menu_id: item.menu_id,
      variant,
      position: item.sort_order,
      has_children: !!item.children?.length
    });
  };

  return (
    <Link href={item.href} onClick={handleClick}>
      {item.label}
    </Link>
  );
}
```

**Statistical Analysis Query:**

```sql
-- A/B test results
SELECT
  mv.variant_name,
  COUNT(DISTINCT mi.session_id) AS impressions,
  COUNT(mvc.id) AS clicks,
  ROUND(COUNT(mvc.id)::NUMERIC / COUNT(DISTINCT mi.session_id) * 100, 2) AS ctr_percentage
FROM menu_variants mv
LEFT JOIN menu_impressions mi ON mv.id = mi.variant_id
LEFT JOIN menu_variant_clicks mvc ON mi.id = mvc.impression_id
WHERE mv.menu_id = 'main'
  AND mi.created_at > NOW() - INTERVAL '7 days'
GROUP BY mv.variant_name
ORDER BY ctr_percentage DESC;
```

### 4.3 Analytics Integration for Menu Clicks

**Comprehensive Tracking Pattern:**

```typescript
// lib/analytics/menu.ts
export const menuAnalytics = {
  menuViewed(menuId: string, location: string, itemCount: number) {
    analytics.track({
      event: 'menu_viewed',
      category: 'navigation',
      properties: {
        menu_id: menuId,
        location,
        item_count: itemCount,
        timestamp: Date.now()
      }
    });
  },

  menuItemClicked(item: MenuItem, context: MenuContext) {
    analytics.track({
      event: 'menu_item_clicked',
      category: 'navigation',
      properties: {
        menu_id: item.menu_id,
        item_id: item.id,
        item_label: item.label,
        item_href: item.href,
        has_children: !!item.children?.length,
        depth_level: context.depthLevel,
        position: item.sort_order,
        location: context.location, // 'header', 'footer', 'mobile_menu'
        viewport: context.viewport, // 'mobile', 'tablet', 'desktop'
      }
    });
  },

  submenuOpened(menuId: string, itemId: string, method: 'click' | 'hover') {
    analytics.track({
      event: 'submenu_opened',
      category: 'navigation',
      properties: { menu_id: menuId, item_id: itemId, method }
    });
  },

  menuSearchUsed(query: string, resultsCount: number) {
    analytics.track({
      event: 'menu_search',
      category: 'navigation',
      properties: { query, results_count: resultsCount }
    });
  }
};
```

**Heatmap Integration:**

```typescript
// Add data attributes for heatmap tools (Hotjar, Clarity)
function MenuItemButton({ item }: { item: MenuItem }) {
  return (
    <button
      data-menu-item-id={item.id}
      data-menu-label={item.label}
      data-menu-position={item.sort_order}
      onClick={() => handleMenuClick(item)}
    >
      {item.icon} {item.label}
    </button>
  );
}
```

### 4.4 Scheduled Menu Changes

**Database Schema:**

```sql
-- Scheduled menu changes (e.g., holiday menu, seasonal items)
CREATE TABLE menu_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id TEXT NOT NULL REFERENCES menu_definitions(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES menu_variants(id), -- Which menu version to activate
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  timezone TEXT DEFAULT 'UTC',
  active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient scheduling queries
CREATE INDEX idx_menu_schedules_active ON menu_schedules(start_time, end_time)
WHERE active = true;
```

**Cron Job for Schedule Activation:**

```typescript
// app/api/cron/menu-schedules/route.ts
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // Find schedules that should be activated
  const { data: toActivate } = await supabase
    .from('menu_schedules')
    .select('*')
    .lte('start_time', now)
    .or(`end_time.is.null,end_time.gte.${now}`)
    .eq('active', false);

  // Find schedules that should be deactivated
  const { data: toDeactivate } = await supabase
    .from('menu_schedules')
    .select('*')
    .lt('end_time', now)
    .eq('active', true);

  // Activate scheduled menus
  for (const schedule of toActivate || []) {
    await activateMenuVariant(schedule.menu_id, schedule.variant_id);
    await supabase
      .from('menu_schedules')
      .update({ active: true })
      .eq('id', schedule.id);
  }

  // Deactivate expired schedules
  for (const schedule of toDeactivate || []) {
    await deactivateMenuVariant(schedule.menu_id, schedule.variant_id);
    await supabase
      .from('menu_schedules')
      .update({ active: false })
      .eq('id', schedule.id);
  }

  return Response.json({
    activated: toActivate?.length || 0,
    deactivated: toDeactivate?.length || 0,
  });
}

// Vercel cron config (vercel.json)
{
  "crons": [
    {
      "path": "/api/cron/menu-schedules",
      "schedule": "*/5 * * * *"  // Every 5 minutes
    }
  ]
}
```

**Admin UI:**

```tsx
function ScheduleMenuForm({ menuId }: { menuId: string }) {
  const [schedule, setSchedule] = useState({
    variant_id: '',
    start_time: '',
    end_time: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  return (
    <form onSubmit={handleSchedule}>
      <Label>Menu Variant</Label>
      <Select value={schedule.variant_id} onChange={e => setSchedule({...schedule, variant_id: e.target.value})}>
        <option value="">Select variant...</option>
        <option value="holiday-2025">Holiday Menu 2025</option>
        <option value="summer-promo">Summer Promo Menu</option>
      </Select>

      <Label>Start Time</Label>
      <Input
        type="datetime-local"
        value={schedule.start_time}
        onChange={e => setSchedule({...schedule, start_time: e.target.value})}
      />

      <Label>End Time (optional)</Label>
      <Input
        type="datetime-local"
        value={schedule.end_time}
        onChange={e => setSchedule({...schedule, end_time: e.target.value})}
      />

      <Label>Timezone</Label>
      <Select value={schedule.timezone} onChange={e => setSchedule({...schedule, timezone: e.target.value})}>
        {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
      </Select>

      <Button type="submit">Schedule Menu Change</Button>
    </form>
  );
}
```

### 4.5 Multi-language/i18n Support

**Database Schema:**

```sql
-- Menu translations
CREATE TABLE menu_item_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  locale TEXT NOT NULL, -- 'en', 'es', 'fr', etc.
  label TEXT NOT NULL,
  description TEXT,
  og_title TEXT,
  og_description TEXT,

  UNIQUE(menu_item_id, locale)
);

-- Index for efficient locale lookups
CREATE INDEX idx_menu_translations_locale ON menu_item_translations(menu_item_id, locale);
```

**Implementation with next-intl:**

```typescript
// lib/menu/i18n.ts
import { createTranslator } from 'next-intl';

export async function getLocalizedMenu(menuId: string, locale: string) {
  const supabase = createAdminClient();

  // Fetch menu items with translations
  const { data: items } = await supabase
    .from('menu_items')
    .select(`
      *,
      translations:menu_item_translations!inner(
        label,
        description,
        og_title,
        og_description
      )
    `)
    .eq('menu_id', menuId)
    .eq('translations.locale', locale);

  // Merge translations with base items
  return items?.map(item => ({
    ...item,
    label: item.translations[0]?.label || item.label,
    description: item.translations[0]?.description || item.description,
    og_title: item.translations[0]?.og_title || item.og_title,
    og_description: item.translations[0]?.og_description || item.og_description,
  }));
}

// Usage in component
export default async function Navigation({ params }: { params: { locale: string } }) {
  const menuItems = await getLocalizedMenu('main', params.locale);

  return <MenuRenderer items={menuItems} />;
}
```

**Translation Management UI:**

```tsx
function TranslationEditor({ item }: { item: MenuItem }) {
  const [locale, setLocale] = useState('en');
  const [translations, setTranslations] = useState<Record<string, Translation>>({});

  return (
    <div className="translation-editor">
      <LocaleSelector value={locale} onChange={setLocale} />

      <div className="translation-fields">
        <Label>Label ({locale})</Label>
        <Input
          value={translations[locale]?.label || item.label}
          onChange={e => updateTranslation(locale, 'label', e.target.value)}
        />

        <Label>Description ({locale})</Label>
        <Textarea
          value={translations[locale]?.description || item.description}
          onChange={e => updateTranslation(locale, 'description', e.target.value)}
        />
      </div>

      <Button onClick={() => saveTranslations(item.id, translations)}>
        Save Translations
      </Button>
    </div>
  );
}
```

---

## 5. Implementation Recommendations for StepLeague

### Phase 1: Enhanced Menu Editor (Immediate)

**Priority: High | Effort: Medium**

1. **Visual Menu Editor at `/admin/menus`**
   - Drag-and-drop reordering with @dnd-kit
   - Inline editing of label, href, icon
   - Nested item management with visual indentation
   - Real-time preview panel

2. **SEO Metadata Fields**
   - Add `og_title`, `og_description`, `og_image` columns to `menu_items`
   - Character counter with validation (50-60 for title, 150-160 for description)
   - Social preview component (Facebook, Twitter, LinkedIn)

3. **Database Constraints**
   ```sql
   ALTER TABLE menu_items ADD COLUMN og_title TEXT;
   ALTER TABLE menu_items ADD COLUMN og_description TEXT;
   ALTER TABLE menu_items ADD COLUMN og_image TEXT;
   ALTER TABLE menu_items ADD CONSTRAINT og_title_length CHECK (length(og_title) <= 60);
   ALTER TABLE menu_items ADD CONSTRAINT og_description_length CHECK (length(og_description) <= 160);
   ```

### Phase 2: Performance Optimization (Week 2)

**Priority: High | Effort: Low**

1. **Multi-Layer Caching**
   - Implement `unstable_cache` for server-side menu data
   - Add IndexedDB persistence for offline support
   - Configure SWR with 5-minute revalidation

2. **Cache Invalidation**
   - On-demand revalidation after menu edits
   - Webhook from Supabase triggers cache purge
   - Client-side real-time updates via Supabase Realtime

3. **CDN Configuration**
   ```typescript
   // middleware.ts
   export function middleware(request: NextRequest) {
     const response = NextResponse.next();
     if (request.nextUrl.pathname.startsWith('/api/menus')) {
       response.headers.set(
         'Cache-Control',
         'public, s-maxage=60, stale-while-revalidate=300'
       );
     }
     return response;
   }
   ```

### Phase 3: Advanced Features (Month 2)

**Priority: Medium | Effort: High**

1. **Menu Versioning**
   - Create `menu_versions` table
   - Auto-snapshot on major changes
   - Rollback UI with version history
   - Diff viewer to compare versions

2. **A/B Testing**
   - Create `menu_variants` and `menu_impressions` tables
   - Variant assignment logic (traffic split)
   - Analytics integration for CTR tracking
   - Statistical significance calculator

3. **Scheduled Changes**
   - Create `menu_schedules` table
   - Vercel cron job for activation/deactivation
   - Admin UI for scheduling menu swaps
   - Preview scheduled changes

### Phase 4: Internationalization (Future)

**Priority: Low | Effort: Medium**

1. **Multi-language Support**
   - Create `menu_item_translations` table
   - Integration with next-intl
   - Translation management UI
   - Locale-specific OG images

2. **Locale-Specific Menus**
   - Different menu structures per locale
   - Region-specific items (e.g., EU-only pages)
   - Automatic language detection

---

## 6. Code Examples

### 6.1 Complete Menu Editor Component

```tsx
'use client';

import { useState } from 'react';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, GripVertical, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

interface MenuEditorProps {
  menuId: string;
  initialItems: MenuItem[];
}

export function MenuEditor({ menuId, initialItems }: MenuEditorProps) {
  const [items, setItems] = useState(initialItems);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const reordered = reorderMenuItems(items, active.id as string, over.id as string);
    setItems(reordered);
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      await fetch(`/api/admin/menus/${menuId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });

      toast({ title: 'Menu saved successfully' });
      setIsDirty(false);
    } catch (error) {
      toast({ title: 'Failed to save menu', variant: 'destructive' });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Menu Structure */}
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Menu Structure</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setItems(initialItems)} disabled={!isDirty}>
              Reset
            </Button>
            <Button onClick={handleSave} disabled={!isDirty}>
              Save Changes
            </Button>
          </div>
        </div>

        <DndContext
          sensors={useSensors(useSensor(PointerSensor))}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            {items.map(item => (
              <SortableMenuItem
                key={item.id}
                item={item}
                selected={selectedItem?.id === item.id}
                onClick={() => setSelectedItem(item)}
              />
            ))}
          </SortableContext>
        </DndContext>

        <Button variant="outline" className="w-full mt-4" onClick={() => addMenuItem()}>
          <Plus className="mr-2 h-4 w-4" /> Add Menu Item
        </Button>
      </div>

      {/* Right: Item Editor */}
      <div className="lg:col-span-1">
        {selectedItem ? (
          <MenuItemEditor
            item={selectedItem}
            onChange={(updated) => {
              setItems(items.map(i => i.id === updated.id ? updated : i));
              setSelectedItem(updated);
              setIsDirty(true);
            }}
          />
        ) : (
          <div className="text-center text-muted-foreground py-12">
            Select a menu item to edit
          </div>
        )}
      </div>
    </div>
  );
}

function SortableMenuItem({ item, selected, onClick }: SortableMenuItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-3 border rounded-lg mb-2 bg-white',
        selected && 'ring-2 ring-primary'
      )}
      onClick={onClick}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      <span className="text-xl">{item.icon}</span>
      <span className="flex-1 font-medium">{item.label}</span>

      {item.children && <span className="text-xs text-muted-foreground">{item.children.length} items</span>}

      {!item.visible && <EyeOff className="h-4 w-4 text-muted-foreground" />}
    </div>
  );
}

function MenuItemEditor({ item, onChange }: MenuItemEditorProps) {
  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="font-semibold">Edit Menu Item</h3>

      <div>
        <Label>Label</Label>
        <Input
          value={item.label}
          onChange={e => onChange({ ...item, label: e.target.value })}
        />
      </div>

      <div>
        <Label>URL</Label>
        <Input
          value={item.href || ''}
          onChange={e => onChange({ ...item, href: e.target.value })}
          placeholder="/path/to/page"
        />
      </div>

      <div>
        <Label>Icon (emoji)</Label>
        <Input
          value={item.icon || ''}
          onChange={e => onChange({ ...item, icon: e.target.value })}
          placeholder="📊"
        />
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          value={item.description || ''}
          onChange={e => onChange({ ...item, description: e.target.value })}
          rows={2}
        />
      </div>

      <MetadataEditor item={item} onChange={onChange} />
    </div>
  );
}

function MetadataEditor({ item, onChange }: { item: MenuItem, onChange: (item: MenuItem) => void }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!showAdvanced) {
    return (
      <Button variant="ghost" onClick={() => setShowAdvanced(true)}>
        Show SEO Settings
      </Button>
    );
  }

  return (
    <div className="space-y-4 pt-4 border-t">
      <h4 className="font-semibold text-sm">SEO & Social</h4>

      <div>
        <div className="flex items-center justify-between">
          <Label>OG Title</Label>
          <CharacterCounter
            current={item.og_title?.length || 0}
            max={60}
            optimal={50}
          />
        </div>
        <Input
          value={item.og_title || ''}
          onChange={e => onChange({ ...item, og_title: e.target.value })}
          maxLength={60}
          placeholder={item.label}
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label>OG Description</Label>
          <CharacterCounter
            current={item.og_description?.length || 0}
            max={160}
            optimal={155}
          />
        </div>
        <Textarea
          value={item.og_description || ''}
          onChange={e => onChange({ ...item, og_description: e.target.value })}
          maxLength={160}
          rows={3}
          placeholder={item.description}
        />
      </div>

      <SocialPreview
        title={item.og_title || item.label}
        description={item.og_description || item.description || ''}
        url={`https://stepleague.com${item.href}`}
      />
    </div>
  );
}

function CharacterCounter({ current, max, optimal }: CharacterCounterProps) {
  const status = current === 0 ? 'empty'
    : current < optimal ? 'warning'
    : current > max ? 'error'
    : 'success';

  return (
    <span className={cn('text-xs', {
      'text-muted-foreground': status === 'empty',
      'text-amber-600': status === 'warning',
      'text-red-600': status === 'error',
      'text-green-600': status === 'success',
    })}>
      {current} / {max}
    </span>
  );
}
```

### 6.2 API Routes for Menu Management

```typescript
// app/api/admin/menus/[menuId]/route.ts
import { NextRequest } from 'next/server';
import { withApiHandler } from '@/lib/api/handler';
import { z } from 'zod';
import { revalidateTag } from 'next/cache';

const menuItemSchema = z.object({
  id: z.string().uuid(),
  menu_id: z.string(),
  parent_id: z.string().uuid().nullable(),
  item_key: z.string(),
  label: z.string().min(1),
  href: z.string().nullable(),
  icon: z.string().nullable(),
  description: z.string().nullable(),
  og_title: z.string().max(60).nullable(),
  og_description: z.string().max(160).nullable(),
  og_image: z.string().url().nullable(),
  visible_to: z.array(z.string()).default([]),
  requires_league: z.boolean().default(false),
  sort_order: z.number().int(),
});

const updateMenuSchema = z.object({
  items: z.array(menuItemSchema),
});

// GET /api/admin/menus/[menuId]
export const GET = withApiHandler({
  auth: 'none', // Public endpoint (RLS handles visibility)
}, async ({ adminClient, params }) => {
  const menuId = params.menuId;

  const { data: items, error } = await adminClient
    .from('menu_items')
    .select('*')
    .eq('menu_id', menuId)
    .order('sort_order');

  if (error) throw error;

  return { items };
});

// PUT /api/admin/menus/[menuId]
export const PUT = withApiHandler({
  auth: 'superadmin',
  schema: updateMenuSchema,
}, async ({ adminClient, body, params }) => {
  const menuId = params.menuId;

  // Start transaction: delete all items, then bulk insert
  const { error: deleteError } = await adminClient
    .from('menu_items')
    .delete()
    .eq('menu_id', menuId);

  if (deleteError) throw deleteError;

  const { error: insertError } = await adminClient
    .from('menu_items')
    .insert(body.items);

  if (insertError) throw insertError;

  // Invalidate cache
  revalidateTag(`menu-${menuId}`);
  revalidateTag('navigation');

  return { success: true, updated: body.items.length };
});

// POST /api/admin/menus/[menuId]/items
export const POST = withApiHandler({
  auth: 'superadmin',
  schema: menuItemSchema,
}, async ({ adminClient, body, params }) => {
  const menuId = params.menuId;

  const { data, error } = await adminClient
    .from('menu_items')
    .insert({ ...body, menu_id: menuId })
    .select()
    .single();

  if (error) throw error;

  revalidateTag(`menu-${menuId}`);

  return { item: data };
});

// DELETE /api/admin/menus/[menuId]/items/[itemId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { menuId: string, itemId: string } }
) {
  return withApiHandler({
    auth: 'superadmin',
  }, async ({ adminClient }) => {
    const { error } = await adminClient
      .from('menu_items')
      .delete()
      .eq('id', params.itemId);

    if (error) throw error;

    revalidateTag(`menu-${params.menuId}`);

    return { success: true };
  })(request);
}
```

### 6.3 Hook for Menu Data with Caching

```typescript
// hooks/useMenuConfig.ts
import useSWR from 'swr';
import { openDB } from 'idb';
import { MENUS } from '@/lib/menuConfig';

const DB_NAME = 'menu-cache';
const STORE_NAME = 'menus';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

async function openMenuDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    }
  });
}

async function getCachedMenu(menuId: string) {
  try {
    const db = await openMenuDB();
    const cached = await db.get(STORE_NAME, menuId);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
  } catch (err) {
    console.warn('IndexedDB read failed:', err);
  }

  return null;
}

async function setCachedMenu(menuId: string, data: MenuItem[]) {
  try {
    const db = await openMenuDB();
    await db.put(STORE_NAME, { data, timestamp: Date.now() }, menuId);
  } catch (err) {
    console.warn('IndexedDB write failed:', err);
  }
}

export function useMenuConfig(menuId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/menus/${menuId}`,
    async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch menu');
      const json = await response.json();

      // Update IndexedDB cache
      await setCachedMenu(menuId, json.items);

      return json.items as MenuItem[];
    },
    {
      fallbackData: async () => {
        // Try IndexedDB first
        const cached = await getCachedMenu(menuId);
        if (cached) return cached;

        // Fallback to static config
        return MENUS[menuId as keyof typeof MENUS]?.items || [];
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 5 * 60 * 1000, // 5 minutes
    }
  );

  return {
    items: data || [],
    loading: isLoading,
    error,
    refresh: mutate,
  };
}
```

---

## 7. Testing Checklist

### Functional Tests

- [ ] Menu items can be created, updated, deleted
- [ ] Drag-and-drop reordering persists correctly
- [ ] Nested items maintain hierarchy (unlimited depth)
- [ ] Role-based visibility filters items correctly
- [ ] Dynamic [id] placeholders resolve with league context
- [ ] External links open in new tab
- [ ] onClick actions trigger correct handlers
- [ ] Dividers render in correct positions

### SEO Tests

- [ ] OG metadata appears in `<head>` tags
- [ ] Titles truncate correctly at 60 characters
- [ ] Descriptions truncate correctly at 160 characters
- [ ] Social preview images load (1200x630)
- [ ] Breadcrumb schema is valid JSON-LD
- [ ] Navigation schema is valid JSON-LD
- [ ] Canonical URLs are absolute
- [ ] robots meta tags are correct

### Performance Tests

- [ ] Menu loads in <100ms from cache
- [ ] IndexedDB persists menu across page reloads
- [ ] Cache invalidates after menu update
- [ ] SWR serves stale content instantly
- [ ] No visible flash during revalidation
- [ ] Drag operations are smooth (60fps)
- [ ] Menu renders correctly with 100+ items

### Accessibility Tests

- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Screen reader announces menu structure
- [ ] Focus indicators are visible
- [ ] Drag operations work with keyboard
- [ ] ARIA labels are present and accurate
- [ ] Color contrast meets WCAG 2.1 AA

### Mobile Tests

- [ ] Menu collapses into hamburger on mobile
- [ ] Touch drag-and-drop works smoothly
- [ ] Submenu accordion expands/collapses
- [ ] Preview switches to mobile viewport
- [ ] Icons scale appropriately
- [ ] No horizontal scrolling

---

## 8. Performance Benchmarks

**Target Metrics:**

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Menu Load Time (cached) | <100ms | TBD | ⏳ |
| Menu Load Time (uncached) | <500ms | TBD | ⏳ |
| First Contentful Paint | <1.8s | TBD | ⏳ |
| Largest Contentful Paint | <2.5s | TBD | ⏳ |
| Cumulative Layout Shift | <0.1 | TBD | ⏳ |
| Time to Interactive | <3.8s | TBD | ⏳ |

**Lighthouse Score Targets:**

- Performance: >90
- Accessibility: >95
- Best Practices: >95
- SEO: 100

---

## 9. Security Considerations

### Input Validation

- **XSS Prevention**: Sanitize all user input (labels, descriptions)
- **SQL Injection**: Use parameterized queries (Supabase handles this)
- **Path Traversal**: Validate hrefs don't contain `../` or absolute paths to other domains
- **Icon Validation**: Limit icons to emojis or predefined icon set (no `<svg>` or `<img>` injection)

### Authorization

- **SuperAdmin Only**: Menu editing restricted to `is_superadmin = true`
- **RLS Policies**: Enforce read access for all, write access for superadmins
- **API Route Guards**: Use `withApiHandler({ auth: 'superadmin' })`

### Rate Limiting

```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
});

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/admin/menus')) {
    const identifier = request.ip ?? 'anonymous';
    const { success } = await ratelimit.limit(identifier);

    if (!success) {
      return new Response('Too many requests', { status: 429 });
    }
  }

  return NextResponse.next();
}
```

---

## 10. Migration Path

### Step 1: Database Migration

```sql
-- Run in Supabase SQL Editor
-- Add SEO columns to existing menu_items table
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS og_title TEXT,
  ADD COLUMN IF NOT EXISTS og_description TEXT,
  ADD COLUMN IF NOT EXISTS og_image TEXT,
  ADD COLUMN IF NOT EXISTS meta_keywords TEXT[],
  ADD COLUMN IF NOT EXISTS canonical_url TEXT,
  ADD COLUMN IF NOT EXISTS robots TEXT DEFAULT 'index,follow';

-- Add constraints
ALTER TABLE menu_items
  ADD CONSTRAINT og_title_length CHECK (length(og_title) <= 60),
  ADD CONSTRAINT og_description_length CHECK (length(og_description) <= 160);

-- Auto-populate og_title from label for existing items
UPDATE menu_items SET og_title = label WHERE og_title IS NULL;
UPDATE menu_items SET og_description = description WHERE og_description IS NULL AND description IS NOT NULL;
```

### Step 2: Update menuConfig.ts Interface

```typescript
// lib/menuConfig.ts
export interface MenuItem {
  id: string;
  label: string;
  href?: string;
  icon?: string;
  description?: string;
  children?: MenuItem[];
  visibleTo?: UserRole[];
  hiddenFrom?: UserRole[];
  requiresLeague?: boolean;
  onClick?: string;
  external?: boolean;
  dividerBefore?: boolean;

  // NEW: SEO fields
  og_title?: string;
  og_description?: string;
  og_image?: string;
  meta_keywords?: string[];
  canonical_url?: string;
  robots?: string;
}
```

### Step 3: Create Admin UI

1. Create `/admin/menus` page
2. Add menu editor component with drag-and-drop
3. Add metadata editor with character counters
4. Add social preview component

### Step 4: Update API Routes

1. Add SEO fields to GET response
2. Update PUT/POST to accept new fields
3. Add validation for character limits

### Step 5: Update Frontend Usage

```typescript
// Before
import { MENUS } from '@/lib/menuConfig';
const items = MENUS.main.items;

// After
import { useMenuConfig } from '@/hooks/useMenuConfig';
const { items, loading } = useMenuConfig('main');
```

### Step 6: Add generateMetadata to Pages

```typescript
// app/[slug]/page.tsx
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const meta = await getPageMetadata(params.slug);

  return {
    title: meta?.og_title || meta?.label,
    description: meta?.og_description || meta?.description,
    openGraph: {
      title: meta?.og_title,
      description: meta?.og_description,
      images: meta?.og_image ? [{ url: meta.og_image }] : [],
    },
  };
}
```

---

## 11. Resources & References

### Documentation

- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)
- [dnd-kit Documentation](https://docs.dndkit.com/)
- [Open Graph Protocol](https://ogp.me/)
- [Schema.org SiteNavigationElement](https://schema.org/SiteNavigationElement)
- [Google Search Central - Titles](https://developers.google.com/search/docs/appearance/title-link)

### Tools

- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

### Libraries

- `@dnd-kit/core` - Drag-and-drop
- `next-intl` - Internationalization
- `swr` or `@tanstack/react-query` - Data fetching
- `idb` - IndexedDB wrapper
- `zod` - Schema validation
- `next-themes` - Theme management

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-07 | All sections | Initial research document created |
| 2026-01-07 | Next.js Metadata | Added findings from Next.js documentation |
| 2026-01-07 | Implementation | Added StepLeague-specific recommendations |
