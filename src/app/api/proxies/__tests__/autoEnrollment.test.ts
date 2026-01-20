
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { enrollInWorldLeague } from '@/lib/league/worldLeague';

// Mock dependencies
vi.mock('nanoid', () => ({
    nanoid: () => 'test-invite-code'
}));

Object.defineProperty(global, 'crypto', {
    value: {
        randomUUID: () => 'proxy-uuid-123'
    }
});

vi.mock('@/lib/supabase/server', () => ({
    createServerSupabaseClient: vi.fn(() => ({
        auth: {
            getUser: vi.fn().mockResolvedValue({
                data: {
                    user: { id: 'manager-id' }
                }
            })
        }
    })),
    createAdminClient: vi.fn(() => ({
        from: vi.fn(() => ({
            insert: vi.fn(() => ({
                select: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({
                        data: { id: 'proxy-id', managed_by: 'manager-id' },
                        error: null
                    })
                }))
            })),
            select: vi.fn(() => {
                const chain = {
                    eq: vi.fn().mockReturnThis(),
                    is: vi.fn().mockReturnThis(),
                    gte: vi.fn().mockReturnThis(),
                    lte: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: null, error: null }),
                    then: (resolve: any) => resolve({ count: 0, data: [], error: null }) // mock await result
                };
                return chain;
            })
        }))
    }))
}));

vi.mock('@/lib/league/worldLeague', () => ({
    enrollInWorldLeague: vi.fn().mockResolvedValue({ success: true })
}));

vi.mock('@/lib/auth/session', () => ({
    getSessionUser: vi.fn().mockResolvedValue({ id: 'manager-id', email: 'test@example.com' })
}));

describe('Proxy Auto-Enrollment Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should enroll new proxy in World League', async () => {
        const req = new Request('http://localhost/api/proxies', {
            method: 'POST',
            body: JSON.stringify({ display_name: 'My Proxy' })
        });

        const response = await POST(req);

        if (response.status !== 200) {
            console.log('Test Failed Response:', response.status, await response.text());
        }

        // Verify enrollment was called
        expect(enrollInWorldLeague).toHaveBeenCalled();
        // Check arguments: calls (adminClient, verify user id match logic)
        expect(enrollInWorldLeague).toHaveBeenCalledWith(expect.anything(), 'proxy-id', { method: 'proxy' });
    });
});
