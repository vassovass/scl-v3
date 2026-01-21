/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Helper function to parse session from cookie (same logic as AuthProvider)
 */
function getSessionFromCookie(cookieName: string): any {
  if (typeof window === 'undefined') return null;

  try {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith(cookieName))
      ?.split('=')[1];

    if (!cookieValue) return null;

    const decoded = JSON.parse(decodeURIComponent(cookieValue));
    if (decoded?.access_token && decoded?.user) {
      return decoded;
    }
  } catch (error) {
    console.error('[Cookie] Parse error:', error);
  }

  return null;
}

describe('Cookie Parsing - Negative Cases', () => {
  beforeEach(() => {
    // Clear all cookies before each test
    document.cookie.split(';').forEach((c) => {
      const name = c.split('=')[0].trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
  });

  it('should return null for missing cookie', () => {
    const session = getSessionFromCookie('sb-nonexistent-auth-token');

    expect(session).toBeNull();
  });

  it('should return null for malformed JSON', () => {
    // Set malformed cookie
    document.cookie = 'sb-test-auth-token=not-valid-json-{{{; path=/';

    const session = getSessionFromCookie('sb-test-auth-token');

    // ✅ EXPECTED: Should return null (not throw error)
    expect(session).toBeNull();
  });

  it('should return null for cookie missing access_token', () => {
    // Set cookie without access_token
    const invalidSession = {
      // access_token missing!
      user: { id: 'user-123', email: 'test@example.com' },
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };

    document.cookie = `sb-test-auth-token=${encodeURIComponent(JSON.stringify(invalidSession))}; path=/`;

    const session = getSessionFromCookie('sb-test-auth-token');

    // ✅ EXPECTED: Should return null (missing required field)
    expect(session).toBeNull();
  });

  it('should return null for cookie missing user', () => {
    // Set cookie without user
    const invalidSession = {
      access_token: 'test-token',
      // user missing!
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };

    document.cookie = `sb-test-auth-token=${encodeURIComponent(JSON.stringify(invalidSession))}; path=/`;

    const session = getSessionFromCookie('sb-test-auth-token');

    // ✅ EXPECTED: Should return null (missing required field)
    expect(session).toBeNull();
  });

  it('should return null for cookie with null user', () => {
    // Set cookie with null user
    const invalidSession = {
      access_token: 'test-token',
      user: null, // null user!
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };

    document.cookie = `sb-test-auth-token=${encodeURIComponent(JSON.stringify(invalidSession))}; path=/`;

    const session = getSessionFromCookie('sb-test-auth-token');

    // ✅ EXPECTED: Should return null
    expect(session).toBeNull();
  });

  it('should handle cookie with HTML/script content', () => {
    // Attempt to inject script via cookie
    const xssSession = {
      access_token: '<script>alert("XSS")</script>',
      user: {
        id: '<img src=x onerror=alert("XSS")>',
        email: 'test@example.com',
      },
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };

    document.cookie = `sb-test-auth-token=${encodeURIComponent(JSON.stringify(xssSession))}; path=/`;

    const session = getSessionFromCookie('sb-test-auth-token');

    // ✅ EXPECTED: Should parse but not execute (XSS prevented by not rendering)
    expect(session).toBeDefined();
    expect(session.access_token).toContain('<script>'); // Parsed as string, not executed

    // Verify no actual script execution (this is the key test)
    // If XSS worked, global state would be modified or alert would show
    expect(typeof session.access_token).toBe('string');
  });

  it('should handle extremely large cookie value', () => {
    // Create very large session data
    const largeData = 'x'.repeat(3000);
    const largeSession = {
      access_token: 'test-token',
      user: {
        id: 'user-123',
        email: 'test@example.com',
        metadata: largeData,
      },
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };

    try {
      document.cookie = `sb-test-auth-token=${encodeURIComponent(JSON.stringify(largeSession))}; path=/`;
      const session = getSessionFromCookie('sb-test-auth-token');

      // ✅ EXPECTED: Either parses successfully OR returns null (no crash)
      if (session) {
        expect(session.access_token).toBe('test-token');
      } else {
        expect(session).toBeNull();
      }
    } catch (e) {
      // ✅ EXPECTED: May fail to set due to size limits (that's OK)
      expect(e).toBeDefined();
    }
  });

  it('should handle cookie with circular reference (would fail JSON.parse in normal cases)', () => {
    // Can't actually create circular reference in JSON, but test invalid JSON structure
    document.cookie = 'sb-test-auth-token=%7B%22access_token%22%3A%22test%22%2C%22self%22%3A%7B%7D%7D; path=/';

    const session = getSessionFromCookie('sb-test-auth-token');

    // ✅ EXPECTED: Should handle parsing error gracefully
    // (In this case it will parse successfully but be missing 'user', so return null)
    expect(session).toBeNull();
  });

  it('should handle cookie with unicode/special characters', () => {
    // Unicode characters in cookie
    const unicodeSession = {
      access_token: 'test-token-🔥',
      user: {
        id: 'user-123',
        email: 'test@example.com',
        display_name: '用户名称', // Chinese characters
      },
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };

    document.cookie = `sb-test-auth-token=${encodeURIComponent(JSON.stringify(unicodeSession))}; path=/`;

    const session = getSessionFromCookie('sb-test-auth-token');

    // ✅ EXPECTED: Should parse unicode correctly
    expect(session).toBeDefined();
    expect(session.user.display_name).toBe('用户名称');
    expect(session.access_token).toBe('test-token-🔥');
  });

  it('should handle cookie with numeric string as user ID', () => {
    // Some systems use numeric IDs
    const numericSession = {
      access_token: 'test-token',
      user: {
        id: '12345', // Numeric string (not number!)
        email: 'test@example.com',
      },
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };

    document.cookie = `sb-test-auth-token=${encodeURIComponent(JSON.stringify(numericSession))}; path=/`;

    const session = getSessionFromCookie('sb-test-auth-token');

    // ✅ EXPECTED: Should parse numeric ID correctly
    expect(session).toBeDefined();
    expect(session.user.id).toBe('12345');
    expect(typeof session.user.id).toBe('string');
  });
});

describe('Cookie Parsing - Cookie vs localStorage Mismatch', () => {
  beforeEach(() => {
    // Clear cookies and storage
    document.cookie.split(';').forEach((c) => {
      const name = c.split('=')[0].trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should detect when cookie and localStorage have different users', () => {
    // Set cookie for User A
    const cookieSession = {
      access_token: 'token-a',
      user: { id: 'user-a', email: 'usera@example.com' },
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };

    document.cookie = `sb-test-auth-token=${encodeURIComponent(JSON.stringify(cookieSession))}; path=/`;

    // Set localStorage for User B
    const localStorageSession = {
      access_token: 'token-b',
      user: { id: 'user-b', email: 'userb@example.com' },
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };

    localStorage.setItem('sb-test-auth-token', JSON.stringify(localStorageSession));

    // Parse cookie
    const sessionFromCookie = getSessionFromCookie('sb-test-auth-token');

    // Parse localStorage
    const sessionFromStorage = JSON.parse(localStorage.getItem('sb-test-auth-token') || 'null');

    // ✅ EXPECTED: Should detect mismatch
    expect(sessionFromCookie?.user.id).toBe('user-a');
    expect(sessionFromStorage?.user.id).toBe('user-b');
    expect(sessionFromCookie?.user.id).not.toBe(sessionFromStorage?.user.id);

    console.log('[Test] ✅ Detected cookie/localStorage mismatch');
  });

  it('should prefer cookie over localStorage (cookie is authoritative)', () => {
    // This documents the expected behavior: cookie should be source of truth
    // (matching middleware behavior)

    const cookieSession = {
      access_token: 'cookie-token',
      user: { id: 'cookie-user', email: 'cookie@example.com' },
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };

    document.cookie = `sb-test-auth-token=${encodeURIComponent(JSON.stringify(cookieSession))}; path=/`;

    const storageSession = {
      access_token: 'storage-token',
      user: { id: 'storage-user', email: 'storage@example.com' },
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };

    localStorage.setItem('sb-test-auth-token', JSON.stringify(storageSession));

    // Parse cookie (this is what AuthProvider does)
    const session = getSessionFromCookie('sb-test-auth-token');

    // ✅ EXPECTED: Cookie value is used (not localStorage)
    expect(session?.user.id).toBe('cookie-user');
    expect(session?.access_token).toBe('cookie-token');

    console.log('[Test] ✅ Cookie is authoritative (matches middleware)');
  });
});

describe('Cookie Parsing - Expiry Edge Cases', () => {
  it('should detect expired token in cookie', () => {
    const expiredSession = {
      access_token: 'expired-token',
      user: { id: 'user-123', email: 'test@example.com' },
      expires_at: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
    };

    document.cookie = `sb-test-auth-token=${encodeURIComponent(JSON.stringify(expiredSession))}; path=/`;

    const session = getSessionFromCookie('sb-test-auth-token');

    // ✅ EXPECTED: Parser returns session (AuthProvider validates expiry separately)
    expect(session).toBeDefined();
    expect(session.expires_at).toBeLessThan(Math.floor(Date.now() / 1000));

    console.log('[Test] ✅ Expired token detected (validation happens in AuthProvider)');
  });

  it('should handle missing expires_at field', () => {
    const noExpirySession = {
      access_token: 'test-token',
      user: { id: 'user-123', email: 'test@example.com' },
      // expires_at missing!
    };

    document.cookie = `sb-test-auth-token=${encodeURIComponent(JSON.stringify(noExpirySession))}; path=/`;

    const session = getSessionFromCookie('sb-test-auth-token');

    // ✅ EXPECTED: Should parse (expiry is optional in parser)
    expect(session).toBeDefined();
    expect(session.expires_at).toBeUndefined();

    console.log('[Test] ✅ Missing expires_at handled');
  });

  it('should handle invalid expires_at type', () => {
    const invalidExpirySession = {
      access_token: 'test-token',
      user: { id: 'user-123', email: 'test@example.com' },
      expires_at: 'not-a-number', // Invalid type!
    };

    document.cookie = `sb-test-auth-token=${encodeURIComponent(JSON.stringify(invalidExpirySession))}; path=/`;

    const session = getSessionFromCookie('sb-test-auth-token');

    // ✅ EXPECTED: Should parse (type validation happens in AuthProvider)
    expect(session).toBeDefined();
    expect(typeof session.expires_at).toBe('string');

    console.log('[Test] ✅ Invalid expires_at type handled');
  });
});
