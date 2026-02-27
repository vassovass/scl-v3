import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DashboardError from '../error';

// Mock CopyableError to avoid its complex dependencies (posthog, fetch, useToast)
vi.mock('@/components/ui/CopyableError', () => ({
    CopyableError: ({ title, message, children }: {
        title: string;
        message: string;
        children?: React.ReactNode;
    }) => (
        <div data-testid="copyable-error">
            <h1>{title}</h1>
            <p>{message}</p>
            {children}
        </div>
    ),
}));

// Mock errors module
vi.mock('@/lib/errors', () => ({
    generateErrorId: vi.fn(() => 'SCL-TEST-abc12'),
    ErrorCode: { UNEXPECTED_ERROR: 'UNEXPECTED_ERROR' },
}));

describe('DashboardError', () => {
    const mockReset = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders CopyableError with correct title and message', () => {
        const error = Object.assign(new Error('Dashboard broke'), { digest: undefined });
        render(<DashboardError error={error} reset={mockReset} />);

        expect(screen.getByText('Dashboard Error')).toBeTruthy();
        expect(screen.getByText('Dashboard broke')).toBeTruthy();
    });

    it('"Try Again" button calls reset()', () => {
        const error = Object.assign(new Error('Crash'), { digest: undefined });
        render(<DashboardError error={error} reset={mockReset} />);

        fireEvent.click(screen.getByText('Try Again'));
        expect(mockReset).toHaveBeenCalledTimes(1);
    });

    it('logs error to console in useEffect', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const error = Object.assign(new Error('Console test'), { digest: undefined });
        render(<DashboardError error={error} reset={mockReset} />);

        expect(consoleSpy).toHaveBeenCalledWith(
            '[Dashboard Error Boundary]',
            expect.objectContaining({ message: 'Console test' }),
        );
        consoleSpy.mockRestore();
    });

    it('renders Reload Dashboard and Clear Cache links', () => {
        const error = Object.assign(new Error('Crash'), { digest: undefined });
        render(<DashboardError error={error} reset={mockReset} />);

        expect(screen.getByText('Reload Dashboard')).toBeTruthy();
        expect(screen.getByText('Clear Cache & Retry')).toBeTruthy();
    });
});
