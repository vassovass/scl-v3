/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ResetPage from '../page';

// Track the order of cleanup operations
const cleanupOrder: string[] = [];

describe('Reset Page - Cleanup Order', () => {
  beforeEach(() => {
    cleanupOrder.length = 0;

    // Mock localStorage
    const localStorageMock = {
      _data: {} as Record<string, string>,
      get length() {
        return Object.keys(this._data).length;
      },
      getItem(key: string) {
        return this._data[key] || null;
      },
      setItem(key: string, value: string) {
        this._data[key] = value;
      },
      removeItem(key: string) {
        delete this._data[key];
      },
      clear() {
        cleanupOrder.push('localStorage.clear');
        this._data = {};
      },
      key(index: number) {
        return Object.keys(this._data)[index] || null;
      },
    };

    // Mock sessionStorage
    const sessionStorageMock = {
      _data: {} as Record<string, string>,
      get length() {
        return Object.keys(this._data).length;
      },
      getItem(key: string) {
        return this._data[key] || null;
      },
      setItem(key: string, value: string) {
        this._data[key] = value;
      },
      removeItem(key: string) {
        delete this._data[key];
      },
      clear() {
        cleanupOrder.push('sessionStorage.clear');
        this._data = {};
      },
      key(index: number) {
        return Object.keys(this._data)[index] || null;
      },
    };

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true,
    });

    // Mock indexedDB
    const mockIndexedDB = {
      databases: vi.fn().mockResolvedValue([
        { name: 'test-db-1' },
        { name: 'test-db-2' },
      ]),
      deleteDatabase: vi.fn((name) => {
        cleanupOrder.push(`indexedDB.deleteDatabase(${name})`);

        return {
          onsuccess: null,
          onerror: null,
          onblocked: null,
        };
      }),
    };

    Object.defineProperty(window, 'indexedDB', {
      value: mockIndexedDB,
      writable: true,
    });

    // Mock document.cookie
    let mockCookies = 'sb-test-auth-token=test-value; other-cookie=value';
    Object.defineProperty(document, 'cookie', {
      get: () => mockCookies,
      set: (value: string) => {
        if (value.includes('expires=Thu, 01 Jan 1970')) {
          cleanupOrder.push(`document.cookie.delete(${value.split('=')[0]})`);
          // Remove the cookie
          const name = value.split('=')[0];
          mockCookies = mockCookies
            .split('; ')
            .filter((c) => !c.startsWith(name))
            .join('; ');
        } else {
          mockCookies += `; ${value}`;
        }
      },
      configurable: true,
    });

    // Mock caches API
    const mockCaches = {
      keys: vi.fn().mockResolvedValue(['cache-1', 'cache-2']),
      delete: vi.fn((name) => {
        cleanupOrder.push(`caches.delete(${name})`);
        return Promise.resolve(true);
      }),
    };

    Object.defineProperty(window, 'caches', {
      value: mockCaches,
      writable: true,
    });

    // Mock service worker
    const mockServiceWorker = {
      ready: Promise.resolve({
        active: null,
      }),
      getRegistrations: vi.fn().mockResolvedValue([
        {
          unregister: vi.fn(() => {
            cleanupOrder.push('serviceWorker.unregister');
            return Promise.resolve(true);
          }),
        },
      ]),
    };

    Object.defineProperty(navigator, 'serviceWorker', {
      value: mockServiceWorker,
      writable: true,
      configurable: true,
    });

    // Mock window.location
    delete (window as any).location;
    window.location = { href: '' } as any;

    // Set up some initial data to be cleared
    localStorage.setItem('sb-test-auth-token', 'test-session');
    sessionStorage.setItem('temp-data', 'test');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should clear localStorage and sessionStorage BEFORE cookies', async () => {
    render(<ResetPage />);

    // Wait for reset to complete
    await waitFor(
      () => {
        expect(screen.getByText(/Reset complete! Redirecting.../i)).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // ✅ CRITICAL: Verify cleanup order
    console.log('[Test] Cleanup order:', cleanupOrder);

    // Find indices of key operations
    const localStorageIndex = cleanupOrder.findIndex((op) => op === 'localStorage.clear');
    const sessionStorageIndex = cleanupOrder.findIndex((op) => op === 'sessionStorage.clear');
    const firstCookieDeleteIndex = cleanupOrder.findIndex((op) => op.startsWith('document.cookie.delete'));
    const firstCacheDeleteIndex = cleanupOrder.findIndex((op) => op.startsWith('caches.delete'));
    const firstServiceWorkerIndex = cleanupOrder.findIndex((op) => op === 'serviceWorker.unregister');

    // ✅ EXPECTED ORDER: localStorage → sessionStorage → cookies → caches → service workers

    // localStorage and sessionStorage should be cleared BEFORE cookies
    expect(localStorageIndex).toBeGreaterThanOrEqual(0);
    expect(sessionStorageIndex).toBeGreaterThanOrEqual(0);

    if (firstCookieDeleteIndex >= 0) {
      expect(localStorageIndex).toBeLessThan(firstCookieDeleteIndex);
      expect(sessionStorageIndex).toBeLessThan(firstCookieDeleteIndex);
      console.log('[Test] ✅ Storage cleared BEFORE cookies');
    }

    // Cookies should be cleared BEFORE caches
    if (firstCookieDeleteIndex >= 0 && firstCacheDeleteIndex >= 0) {
      expect(firstCookieDeleteIndex).toBeLessThan(firstCacheDeleteIndex);
      console.log('[Test] ✅ Cookies cleared BEFORE caches');
    }

    // Caches should be cleared BEFORE service workers
    if (firstCacheDeleteIndex >= 0 && firstServiceWorkerIndex >= 0) {
      expect(firstCacheDeleteIndex).toBeLessThan(firstServiceWorkerIndex);
      console.log('[Test] ✅ Caches cleared BEFORE service workers');
    }
  });

  it('should clear all localStorage items', async () => {
    // Set up test data
    localStorage.setItem('sb-test-auth-token', 'session-data');
    localStorage.setItem('stepleague-settings', 'settings-data');

    expect(localStorage.length).toBeGreaterThan(0);

    render(<ResetPage />);

    await waitFor(
      () => {
        expect(screen.getByText(/Reset complete! Redirecting.../i)).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // ✅ EXPECTED: localStorage should be empty
    expect(localStorage.length).toBe(0);
  });

  it('should clear all sessionStorage items', async () => {
    sessionStorage.setItem('temp-data', 'test');

    expect(sessionStorage.length).toBeGreaterThan(0);

    render(<ResetPage />);

    await waitFor(
      () => {
        expect(screen.getByText(/Reset complete! Redirecting.../i)).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // ✅ EXPECTED: sessionStorage should be empty
    expect(sessionStorage.length).toBe(0);
  });

  it('should redirect to /sign-in?reset=true after cleanup', async () => {
    render(<ResetPage />);

    await waitFor(
      () => {
        expect(screen.getByText(/Reset complete! Redirecting.../i)).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Wait for redirect
    await waitFor(
      () => {
        expect(window.location.href).toBe('/sign-in?reset=true');
      },
      { timeout: 2000 }
    );
  });

  it('should handle IndexedDB cleanup errors gracefully', async () => {
    // Make IndexedDB.deleteDatabase throw an error
    (window.indexedDB.deleteDatabase as any).mockImplementation(() => {
      throw new Error('IndexedDB error');
    });

    // Should not throw - errors should be caught and logged
    expect(() => {
      render(<ResetPage />);
    }).not.toThrow();

    await waitFor(
      () => {
        expect(screen.getByText(/Reset complete! Redirecting.../i)).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });
});

describe('Reset Page - Cookie Sync-Back Prevention', () => {
  it('should prevent Supabase from syncing cookies back from localStorage', async () => {
    // Set up a mock Supabase session in localStorage
    const mockSession = {
      access_token: 'test-token',
      refresh_token: 'refresh-token',
      user: { id: 'user-123' },
    };

    localStorage.setItem('sb-test-auth-token', JSON.stringify(mockSession));

    // Mock document.cookie to detect if cookies are being set
    const cookieWrites: string[] = [];
    let mockCookies = '';

    Object.defineProperty(document, 'cookie', {
      get: () => mockCookies,
      set: (value: string) => {
        cookieWrites.push(value);

        if (!value.includes('expires=Thu, 01 Jan 1970')) {
          // This is a SET operation (not delete)
          const [name, val] = value.split('=');
          if (name.includes('sb-')) {
            console.error('[Test] ⚠️ Cookie sync-back detected:', name);
          }
          mockCookies += `; ${value}`;
        } else {
          // This is a DELETE operation
          const name = value.split('=')[0];
          mockCookies = mockCookies
            .split('; ')
            .filter((c) => !c.startsWith(name))
            .join('; ');
        }
      },
      configurable: true,
    });

    render(<ResetPage />);

    await waitFor(
      () => {
        expect(screen.getByText(/Reset complete! Redirecting.../i)).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // ✅ EXPECTED: No Supabase cookies should be SET (only deleted)
    const cookieSets = cookieWrites.filter(
      (w) => w.includes('sb-') && !w.includes('expires=Thu, 01 Jan 1970')
    );

    expect(cookieSets.length).toBe(0);
    console.log('[Test] ✅ No cookie sync-back detected');
  });
});
