/**
 * SubmissionForm Component Tests
 *
 * Ensures offline/online submit states render correctly.
 * Based on testing-patterns skill and PRD 42.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SubmissionForm } from '../SubmissionForm';

vi.mock('browser-image-compression', () => ({
  default: vi.fn((file: File) => Promise.resolve(file)),
}));

vi.mock('@/components/ui/DatePicker', () => ({
  DatePicker: ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
    <label>
      {label}
      <input
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  ),
}));

vi.mock('@/components/forms/ConflictResolutionDialog', () => ({
  ConflictResolutionDialog: ({ open }: { open: boolean }) => (open ? <div>Conflict</div> : null),
}));

vi.mock('@/hooks/useOfflineQueue', () => ({
  useOfflineQueue: () => ({ addToQueue: vi.fn() }),
}));

vi.mock('@/components/providers/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'user-123' } }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/lib/api/client', () => ({
  apiRequest: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    payload?: unknown;

    constructor(message: string, status = 500, payload?: unknown) {
      super(message);
      this.status = status;
      this.payload = payload;
    }
  },
}));

vi.mock('@/lib/analytics', () => ({
  analytics: {
    stepsSubmitted: vi.fn(),
  },
}));

const setNavigatorOnline = (value: boolean) => {
  Object.defineProperty(navigator, 'onLine', {
    value,
    configurable: true,
  });
};

describe('SubmissionForm', () => {
  beforeEach(() => {
    setNavigatorOnline(true);
  });

  it('shows the standard submit label when online', () => {
    render(<SubmissionForm />);

    expect(screen.getByRole('button', { name: /submit steps/i })).toBeInTheDocument();
  });

  it('shows the offline label when browser is offline', async () => {
    setNavigatorOnline(false);

    render(<SubmissionForm />);

    await waitFor(() => {
      expect(screen.getByText('Save Offline')).toBeInTheDocument();
    });
  });
});

