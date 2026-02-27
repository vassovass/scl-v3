import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GlobalError from '../global-error';

describe('GlobalError', () => {
    const mockReset = vi.fn();
    const mockSendBeacon = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock navigator.sendBeacon
        Object.defineProperty(navigator, 'sendBeacon', {
            value: mockSendBeacon,
            writable: true,
            configurable: true,
        });
    });

    it('renders "Something went wrong" heading', () => {
        const error = Object.assign(new Error('Test crash'), { digest: undefined });
        render(<GlobalError error={error} reset={mockReset} />);

        expect(screen.getByText('Something went wrong')).toBeTruthy();
    });

    it('shows error message', () => {
        const error = Object.assign(new Error('Provider init failed'), { digest: undefined });
        render(<GlobalError error={error} reset={mockReset} />);

        expect(screen.getByText('Provider init failed')).toBeTruthy();
    });

    it('shows digest when provided', () => {
        const error = Object.assign(new Error('Crash'), { digest: 'abc123' });
        render(<GlobalError error={error} reset={mockReset} />);

        expect(screen.getByText(/abc123/)).toBeTruthy();
    });

    it('"Try Again" button calls reset()', () => {
        const error = Object.assign(new Error('Crash'), { digest: undefined });
        render(<GlobalError error={error} reset={mockReset} />);

        fireEvent.click(screen.getByText('Try Again'));
        expect(mockReset).toHaveBeenCalledTimes(1);
    });

    it('calls sendBeacon with error payload', () => {
        const error = Object.assign(new Error('Root crash'), { digest: 'digest123' });
        render(<GlobalError error={error} reset={mockReset} />);

        expect(mockSendBeacon).toHaveBeenCalledWith(
            '/api/feedback',
            expect.any(Blob),
        );
    });

    it('logs error to console in useEffect', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const error = Object.assign(new Error('Console test'), { digest: undefined });
        render(<GlobalError error={error} reset={mockReset} />);

        expect(consoleSpy).toHaveBeenCalledWith(
            '[GlobalError] Root layout crash:',
            expect.objectContaining({ message: 'Console test' }),
        );
        consoleSpy.mockRestore();
    });

    it('renders Go Home and Clear Cache links', () => {
        const error = Object.assign(new Error('Crash'), { digest: undefined });
        render(<GlobalError error={error} reset={mockReset} />);

        expect(screen.getByText('Go Home')).toBeTruthy();
        expect(screen.getByText('Clear Cache')).toBeTruthy();
    });
});
