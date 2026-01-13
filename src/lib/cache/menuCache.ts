/**
 * Multi-Layer Menu Caching System
 *
 * Implements stale-while-revalidate pattern with 3 cache layers:
 * 1. Memory (singleton) - Fastest, cleared on page refresh
 * 2. SessionStorage - Persists across navigations within session
 * 3. IndexedDB - Persists across sessions for offline PWA support
 *
 * Benefits:
 * - Instant renders (no loading states)
 * - Offline-first PWA support
 * - Cross-tab sync via BroadcastChannel
 * - Background revalidation
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface MenuCacheData {
  menus: Record<string, any>;
  locations: Record<string, any>;
  cacheVersion: string; // Server-side version for staleness detection
  timestamp: number;
  version: string;
  ownerId?: string; // ID of the user who owns this cache (or 'guest')
}

interface MenuCacheDB extends DBSchema {
  menuCache: {
    key: string;
    value: MenuCacheData;
  };
}

const CACHE_VERSION = '1.0.0';
const CACHE_KEY = 'stepleague_menu_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const STALE_DURATION = 60 * 1000; // 1 minute - show stale indicator

class MenuCacheManager {
  private memoryCache: MenuCacheData | null = null;
  private db: IDBPDatabase<MenuCacheDB> | null = null;
  private bc: BroadcastChannel | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    if (typeof window === 'undefined') {
      this.initPromise = Promise.resolve();
      return;
    }

    this.initPromise = this.init();
  }

  private async init() {
    if (typeof window === 'undefined') return;

    // Initialize IndexedDB
    try {
      this.db = await openDB<MenuCacheDB>('menu-cache-db', 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('menuCache')) {
            db.createObjectStore('menuCache');
          }
        },
      });
    } catch (error) {
      console.warn('IndexedDB not available, falling back to sessionStorage', error);
    }

    // Initialize BroadcastChannel for cross-tab sync
    if (typeof BroadcastChannel !== 'undefined') {
      this.bc = new BroadcastChannel('menu-cache-sync');
      this.bc.onmessage = (event) => {
        if (event.data.type === 'cache-invalidated') {
          this.invalidate();
        } else if (event.data.type === 'cache-updated') {
          this.memoryCache = event.data.data;
        }
      };
    }
  }

  async get(): Promise<MenuCacheData | null> {
    if (typeof window === 'undefined') {
      return null;
    }

    await this.initPromise;

    // Layer 1: Check memory cache
    if (this.memoryCache) {
      return this.memoryCache;
    }

    // Layer 2: Check sessionStorage
    try {
      const sessionData = sessionStorage.getItem(CACHE_KEY);
      if (sessionData) {
        const parsed = JSON.parse(sessionData) as MenuCacheData;
        this.memoryCache = parsed;
        return parsed;
      }
    } catch (error) {
      console.warn('SessionStorage read failed', error);
    }

    // Layer 3: Check IndexedDB
    if (this.db) {
      try {
        const dbData = await this.db.get('menuCache', CACHE_KEY);
        if (dbData) {
          this.memoryCache = dbData;
          // Also update sessionStorage for faster subsequent reads
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(dbData));
          } catch (e) {
            // Ignore quota errors
          }
          return dbData;
        }
      } catch (error) {
        console.warn('IndexedDB read failed', error);
      }
    }

    return null;
  }

  async set(data: { menus: Record<string, any>; locations: Record<string, any>; cacheVersion: string; ownerId?: string }): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    await this.initPromise;

    const cacheData: MenuCacheData = {
      ...data,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };

    // Update all layers
    this.memoryCache = cacheData;

    // SessionStorage
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('SessionStorage write failed', error);
    }

    // IndexedDB
    if (this.db) {
      try {
        await this.db.put('menuCache', cacheData, CACHE_KEY);
      } catch (error) {
        console.warn('IndexedDB write failed', error);
      }
    }

    // Notify other tabs
    if (this.bc) {
      this.bc.postMessage({ type: 'cache-updated', data: cacheData });
    }
  }

  /**
   * Version Handshake
   * Compares the server-provided hash with the client cache.
   * If mismatch, silent invalidation triggers a re-fetch.
   */
  async checkVersion(serverVersion: string): Promise<boolean> {
    const current = await this.get();
    if (!current) return false;

    // If stored version doesn't match server version, it's stale
    // Note: serverVersion (hash) is different from the schema version (CACHE_VERSION)
    if (current.cacheVersion !== serverVersion) {
      console.log('[Cache] Version mismatch (Server vs Client)', serverVersion, current.cacheVersion);
      // We can chose to invalidate immediately OR just return false
      // Returning false tells the consumer "fetch fresh data"
      // We then update the cache with the new data + new version
      return false;
    }
    return true;
  }

  async invalidate(): Promise<void> {
    await this.initPromise;

    // Clear all layers
    this.memoryCache = null;

    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.warn('SessionStorage clear failed', error);
    }

    if (this.db) {
      try {
        await this.db.delete('menuCache', CACHE_KEY);
      } catch (error) {
        console.warn('IndexedDB clear failed', error);
      }
    }

    // Notify other tabs
    if (this.bc) {
      this.bc.postMessage({ type: 'cache-invalidated' });
    }
  }

  isStale(data: MenuCacheData | null): boolean {
    if (!data) return true;
    return Date.now() - data.timestamp > STALE_DURATION;
  }

  isExpired(data: MenuCacheData | null): boolean {
    if (!data) return true;
    return Date.now() - data.timestamp > CACHE_DURATION;
  }
}

// Singleton instance
export const menuCache = new MenuCacheManager();

// Utility to get cache age for UI display
export function getCacheAge(timestamp: number): string {
  const ageMs = Date.now() - timestamp;
  const ageSeconds = Math.floor(ageMs / 1000);

  if (ageSeconds < 60) return `${ageSeconds}s ago`;
  const ageMinutes = Math.floor(ageSeconds / 60);
  if (ageMinutes < 60) return `${ageMinutes}m ago`;
  const ageHours = Math.floor(ageMinutes / 60);
  return `${ageHours}h ago`;
}
