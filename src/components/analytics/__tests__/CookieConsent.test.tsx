/**
 * CookieConsentBanner Component Tests
 *
 * Verifies consent handlers wire into Google Consent Mode updates.
 * Based on testing-patterns skill and PRD 42.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { CookieConsentBanner } from '../CookieConsent';
import * as CookieConsent from 'vanilla-cookieconsent';

vi.mock('vanilla-cookieconsent', () => ({
  run: vi.fn(),
}));

describe('CookieConsentBanner', () => {
  beforeEach(() => {
    (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag = vi.fn();
  });

  it('registers consent handlers and updates gtag', () => {
    render(<CookieConsentBanner />);

    const runMock = vi.mocked(CookieConsent.run);
    expect(runMock).toHaveBeenCalledTimes(1);

    const config = runMock.mock.calls[0][0];
    if (config?.onConsent) {
      config.onConsent({
        cookie: {
          categories: ['analytics', 'marketing'],
          revision: 0,
          data: null,
          consentId: '',
          consentTimestamp: '',
          lastConsentTimestamp: '',
          services: {},
          expirationTime: 0
        }
      });
    }

    expect((window as unknown as { gtag: (...args: unknown[]) => void }).gtag).toHaveBeenCalledWith(
      'consent',
      'update',
      {
        analytics_storage: 'granted',
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
      }
    );
  });
});
