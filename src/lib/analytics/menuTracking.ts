/**
 * Menu Analytics Tracking
 *
 * Tracks menu interactions for analytics and optimization:
 * - Click events on menu items
 * - Menu visibility and engagement
 * - Popular navigation paths
 * - A/B testing support
 *
 * Integrates with existing analytics providers (GA4, Mixpanel, etc.)
 */

interface MenuClickEvent {
  menuId: string;
  itemKey: string;
  label: string;
  href?: string;
  userRole: string;
  leagueContext?: string;
  timestamp: number;
}

interface MenuViewEvent {
  menuId: string;
  location: string;
  itemCount: number;
  timestamp: number;
}

/**
 * Track menu item click
 */
export function trackMenuClick(event: Omit<MenuClickEvent, 'timestamp'>) {
  const data: MenuClickEvent = {
    ...event,
    timestamp: Date.now(),
  };

  // Send to analytics provider
  if (typeof window !== 'undefined') {
    // Google Analytics 4
    if ((window as any).gtag) {
      (window as any).gtag('event', 'menu_click', {
        menu_id: data.menuId,
        item_key: data.itemKey,
        label: data.label,
        href: data.href,
        user_role: data.userRole,
        league_context: data.leagueContext,
      });
    }

    // Custom analytics endpoint (optional)
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true') {
      fetch('/api/analytics/menu-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(err => console.warn('Menu analytics failed:', err));
    }

    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Menu Analytics] Click:', data);
    }
  }
}

/**
 * Track menu view/impression
 */
export function trackMenuView(event: Omit<MenuViewEvent, 'timestamp'>) {
  const data: MenuViewEvent = {
    ...event,
    timestamp: Date.now(),
  };

  if (typeof window !== 'undefined') {
    // Google Analytics 4
    if ((window as any).gtag) {
      (window as any).gtag('event', 'menu_view', {
        menu_id: data.menuId,
        location: data.location,
        item_count: data.itemCount,
      });
    }

    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Menu Analytics] View:', data);
    }
  }
}

/**
 * Track menu search/filter
 */
export function trackMenuSearch(menuId: string, query: string) {
  if (typeof window !== 'undefined') {
    if ((window as any).gtag) {
      (window as any).gtag('event', 'menu_search', {
        menu_id: menuId,
        search_query: query,
      });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[Menu Analytics] Search:', { menuId, query });
    }
  }
}

/**
 * Track menu A/B test variant view
 */
export function trackMenuVariant(menuId: string, variantId: string) {
  if (typeof window !== 'undefined') {
    if ((window as any).gtag) {
      (window as any).gtag('event', 'menu_variant_view', {
        menu_id: menuId,
        variant_id: variantId,
      });
    }
  }
}

