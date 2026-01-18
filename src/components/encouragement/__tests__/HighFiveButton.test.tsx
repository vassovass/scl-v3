/**
 * HighFiveButton Component Tests
 *
 * Covers optimistic toggle, analytics tracking, and request wiring.
 * Based on testing-patterns skill and PRD 42.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HighFiveButton } from '../HighFiveButton';
import { analytics } from '@/lib/analytics';

vi.mock('@/lib/analytics', () => ({
  analytics: {
    highFiveSent: vi.fn(),
  },
}));

describe('HighFiveButton', () => {
  beforeEach(() => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock as typeof fetch;
  });

  it('toggles state optimistically and tracks analytics', async () => {
    render(
      <HighFiveButton
        recipientId="user-123"
        initialCount={1}
        initialHasHighFived={false}
      />
    );

    const button = screen.getByRole('button', { name: /send support/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/high-fives', expect.objectContaining({
        method: 'POST',
      }));
    });

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(vi.mocked(analytics).highFiveSent).toHaveBeenCalledWith('user-123', true);
  });
});
