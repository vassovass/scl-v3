
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enrollInWorldLeague } from '../worldLeague';
import { SupabaseClient } from '@supabase/supabase-js';

// Mock WORLD_LEAGUE constant since it's imported in the implementation
vi.mock('@/lib/constants/league', () => ({
    WORLD_LEAGUE: {
        ID: 'world-league-id',
        NAME: 'World League'
    }
}));

describe('enrollInWorldLeague', () => {
    let mockSupabase: any;
    let mockFrom: any;
    let mockSelect: any;
    let mockEq: any;
    let mockSingle: any;
    let mockInsert: any;

    beforeEach(() => {
        // Reset all mocks
        vi.clearAllMocks();

        // Setup chained mocks
        mockSingle = vi.fn();
        mockEq = vi.fn().mockReturnValue({ single: mockSingle });
        mockSelect = vi.fn().mockReturnValue({ eq: mockEq, single: mockSingle });
        mockInsert = vi.fn().mockReturnValue({ select: mockSelect }); // Insert can also chain into select

        // Handling the branch logic for from()
        // It's called for 'app_settings' (select path) and 'memberships' (insert path)
        mockFrom = vi.fn().mockImplementation((table) => {
            if (table === 'app_settings') {
                return { select: mockSelect };
            }
            if (table === 'memberships') {
                return { insert: mockInsert };
            }
            return {};
        });

        // The mock client object
        mockSupabase = {
            from: mockFrom
        } as unknown as SupabaseClient;
    });

    it('should enroll user successfully when feature flag is enabled (default)', async () => {
        // Mock feature flag check to return nothing (enabled by default)
        mockSingle.mockResolvedValueOnce({ data: null, error: null });

        // Mock insertion success
        mockSingle.mockResolvedValueOnce({ data: { id: 'membership-1' }, error: null });

        const result = await enrollInWorldLeague(mockSupabase, 'user-123');

        expect(result.success).toBe(true);
        expect(result.alreadyEnrolled).toBe(false);
        expect(mockFrom).toHaveBeenCalledWith('memberships');
        expect(mockInsert).toHaveBeenCalledWith({
            league_id: 'world-league-id',
            user_id: 'user-123',
            role: 'member',
        });
    });

    it('should enroll user successfully when feature flag is explicitly true', async () => {
        // Mock feature flag check -> "true"
        mockSingle.mockResolvedValueOnce({ data: { value: 'true' }, error: null });

        // Mock insertion success
        mockSingle.mockResolvedValueOnce({ data: { id: 'membership-1' }, error: null });

        const result = await enrollInWorldLeague(mockSupabase, 'user-123');

        expect(result.success).toBe(true);
    });

    it('should skip enrollment when feature flag is explicitly false', async () => {
        // Mock feature flag check -> "false"
        mockSingle.mockResolvedValueOnce({ data: { value: 'false' }, error: null });

        const result = await enrollInWorldLeague(mockSupabase, 'user-123');

        expect(result.success).toBe(true);
        expect(result.skipped).toBe(true);
        expect(mockFrom).not.toHaveBeenCalledWith('memberships'); // Should not attempt insert
    });

    it('should handle already enrolled users (error code 23505)', async () => {
        // Mock feature flag check
        mockSingle.mockResolvedValueOnce({ data: null, error: null });

        // Mock insertion conflict error
        mockSingle.mockResolvedValueOnce({
            data: null,
            error: { code: '23505', message: 'Unique violation' }
        });

        const result = await enrollInWorldLeague(mockSupabase, 'user-123');

        expect(result.success).toBe(true);
        expect(result.alreadyEnrolled).toBe(true);
    });

    it('should return error details on insertion failure', async () => {
        // Mock feature flag check
        mockSingle.mockResolvedValueOnce({ data: null, error: null });

        // Mock unknown DB error
        mockSingle.mockResolvedValueOnce({
            data: null,
            error: { message: 'Database explosion', code: '500' }
        });

        const result = await enrollInWorldLeague(mockSupabase, 'user-123');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Database explosion');
    });

    it('should skip feature flag check if checkSetting option is false', async () => {
        // Mock insertion success directly
        mockSingle.mockResolvedValueOnce({ data: { id: '1' }, error: null });

        await enrollInWorldLeague(mockSupabase, 'user-123', { checkSetting: false });

        // from('app_settings') should NOT be called
        expect(mockFrom).not.toHaveBeenCalledWith('app_settings');
        // from('memberships') SHOULD be called
        expect(mockFrom).toHaveBeenCalledWith('memberships');
    });

    it('should handle logic errors safely (catch block)', async () => {
        // Force mock to throw
        mockFrom.mockImplementation(() => { throw new Error('Unexpected crash'); });

        const result = await enrollInWorldLeague(mockSupabase, 'user-123');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Unexpected crash');
    });
});
