/**
 * Safe Storage Utilities
 *
 * Wrappers around localStorage/sessionStorage that never throw.
 * Browsers throw SecurityError ("The operation is insecure") when storage
 * is blocked by privacy settings, incognito mode, in-app browsers
 * (WhatsApp, Instagram, etc.), or Enhanced Tracking Protection.
 *
 * These utilities gracefully degrade so the app keeps working
 * without persistent storage.
 */

// ============================================================================
// Storage availability detection
// ============================================================================

let _storageAvailable: boolean | null = null;

/**
 * Check if localStorage is available (cached after first call).
 * Returns false in private browsing, restricted WebViews, etc.
 */
export function isStorageAvailable(): boolean {
  if (_storageAvailable !== null) return _storageAvailable;

  try {
    const test = '__storage_test__';
    localStorage.setItem(test, '1');
    localStorage.removeItem(test);
    _storageAvailable = true;
  } catch {
    _storageAvailable = false;
  }

  return _storageAvailable;
}

// ============================================================================
// localStorage wrappers
// ============================================================================

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage blocked - item doesn't exist or can't be removed
  }
}

// ============================================================================
// sessionStorage wrappers
// ============================================================================

export function safeSessionGetItem(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSessionSetItem(key: string, value: string): boolean {
  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
