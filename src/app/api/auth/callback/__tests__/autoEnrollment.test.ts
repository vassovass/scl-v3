
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { enrollInWorldLeague } from '@/lib/league/worldLeague';

vi.mock('@/lib/league/worldLeague', () => ({
    enrollInWorldLeague: vi.fn().mockResolvedValue({ success: true })
}));

vi.mock('@/lib/supabase/server', () => {
    const mockAuth = {
        exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123', email: 'test@example.com', user_metadata: { full_name: 'Test User' } } } })
    };

    // Admin client mock for user upsert
    const mockFrom = vi.fn(() => ({
        upsert: vi.fn().mockResolvedValue({ error: null })
    }));

    return {
        createServerSupabaseClient: vi.fn().mockResolvedValue({
            auth: mockAuth
        }),
        createAdminClient: vi.fn(() => ({
            from: mockFrom
        }))
    };
});

describe('Auth Callback Auto-Enrollment Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should enroll new user in World League on successful login', async () => {
        const req = new Request('http://localhost/api/auth/callback?code=valid-code');

        await GET(req);

        expect(enrollInWorldLeague).toHaveBeenCalledWith(expect.anything(), 'user-123', { method: 'auto' });
    });
});
