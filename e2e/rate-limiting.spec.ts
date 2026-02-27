import { test, expect } from '@playwright/test';

/**
 * Rate Limiting E2E Tests (PRD 58)
 *
 * Verifies that API endpoints enforce rate limits and return
 * proper 429 responses with Retry-After headers.
 *
 * Uses the feedback endpoint (3/min limit, anonymous allowed)
 * as the test target since it has the lowest threshold.
 */

test.describe('API Rate Limiting', () => {

  test('single request to feedback endpoint succeeds', async ({ request }) => {
    const response = await request.post('/api/feedback', {
      data: {
        type: 'general',
        description: 'Rate limit test - single request',
      },
    });

    // Should succeed (or fail for other reasons, but NOT 429)
    expect(response.status()).not.toBe(429);
  });

  test('rapid requests to feedback endpoint eventually return 429', async ({ request }) => {
    // Feedback endpoint allows 3 requests per minute
    // Send 5 rapid requests - at least the last two should be 429
    const responses = [];

    for (let i = 0; i < 5; i++) {
      const response = await request.post('/api/feedback', {
        data: {
          type: 'general',
          description: `Rate limit test - request ${i + 1}`,
        },
      });
      responses.push(response);
    }

    // At least one response should be 429
    const rateLimited = responses.filter(r => r.status() === 429);
    expect(rateLimited.length).toBeGreaterThan(0);

    // Check that 429 responses have proper headers
    const first429 = rateLimited[0];
    expect(first429.headers()['retry-after']).toBeDefined();
    expect(first429.headers()['x-ratelimit-limit']).toBeDefined();
    expect(first429.headers()['x-ratelimit-remaining']).toBe('0');

    // Check response body
    const body = await first429.json();
    expect(body.error).toContain('Too many requests');
  });
});
