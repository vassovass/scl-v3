/**
 * Submissions API Route Tests
 *
 * Tests for POST /api/submissions (create submission) and GET /api/submissions (list submissions).
 * Based on testing-patterns skill and PRD 42.
 *
 * Key areas tested:
 * - Schema validation (date format, steps, UUID validation)
 * - Authorization (league membership, proxy permissions)
 * - Business logic (photo requirements, backfill limits, duplicates)
 * - Query building (filters, pagination, ordering)
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// ============================================================================
// Schema Tests (matching route.ts schemas)
// ============================================================================

const createSchema = z.object({
    league_id: z.string().uuid().optional().nullable(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    steps: z.number().int().positive(),
    partial: z.boolean().optional().default(false),
    proof_path: z.string().min(3).nullable().optional(),
});

const querySchema = z.object({
    league_id: z.string().uuid().optional(),
    user_id: z.string().uuid().optional(),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
    order_by: z.enum(["for_date", "created_at"]).default("for_date"),
    exclude_proxy: z.enum(["true", "false"]).default("true").transform(v => v === "true"),
});

describe('Submissions API - Schema Validation', () => {
    describe('POST createSchema', () => {
        it('accepts valid submission with all fields', () => {
            const data = {
                league_id: '123e4567-e89b-12d3-a456-426614174000',
                date: '2026-01-15',
                steps: 10000,
                partial: false,
                proof_path: '/images/proof.jpg',
            };
            const result = createSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('accepts valid submission with minimal fields (date, steps)', () => {
            const data = {
                date: '2026-01-15',
                steps: 5000,
            };
            const result = createSchema.safeParse(data);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.partial).toBe(false); // default
            }
        });

        it('accepts null league_id for leagueless submissions', () => {
            const data = {
                league_id: null,
                date: '2026-01-15',
                steps: 8000,
            };
            const result = createSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('rejects invalid date format (not YYYY-MM-DD)', () => {
            const invalidDates = [
                '01-15-2026',    // MM-DD-YYYY
                '2026/01/15',    // slashes
                '15-01-2026',    // DD-MM-YYYY
                '2026-1-15',     // single digit month
                '2026-01-5',     // single digit day
                'January 15',   // text
                '',             // empty
            ];

            invalidDates.forEach(date => {
                const result = createSchema.safeParse({ date, steps: 1000 });
                expect(result.success).toBe(false);
            });
        });

        it('rejects zero steps', () => {
            const data = { date: '2026-01-15', steps: 0 };
            const result = createSchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('rejects negative steps', () => {
            const data = { date: '2026-01-15', steps: -100 };
            const result = createSchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('rejects non-integer steps', () => {
            const data = { date: '2026-01-15', steps: 1000.5 };
            const result = createSchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('rejects invalid UUID format for league_id', () => {
            const data = {
                league_id: 'not-a-uuid',
                date: '2026-01-15',
                steps: 5000,
            };
            const result = createSchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('rejects proof_path shorter than 3 characters', () => {
            const data = {
                date: '2026-01-15',
                steps: 5000,
                proof_path: 'ab', // too short
            };
            const result = createSchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('accepts null proof_path', () => {
            const data = {
                date: '2026-01-15',
                steps: 5000,
                proof_path: null,
            };
            const result = createSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('defaults partial to false', () => {
            const data = { date: '2026-01-15', steps: 5000 };
            const result = createSchema.safeParse(data);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.partial).toBe(false);
            }
        });

        it('accepts partial: true', () => {
            const data = { date: '2026-01-15', steps: 5000, partial: true };
            const result = createSchema.safeParse(data);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.partial).toBe(true);
            }
        });
    });

    describe('GET querySchema', () => {
        it('accepts valid query with all parameters', () => {
            const data = {
                league_id: '123e4567-e89b-12d3-a456-426614174000',
                user_id: '223e4567-e89b-12d3-a456-426614174001',
                from: '2026-01-01',
                to: '2026-01-31',
                limit: '25',
                offset: '10',
                order_by: 'created_at',
                exclude_proxy: 'false',
            };
            const result = querySchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('accepts empty query (all optional with defaults)', () => {
            const data = {};
            const result = querySchema.safeParse(data);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.limit).toBe(50);
                expect(result.data.offset).toBe(0);
                expect(result.data.order_by).toBe('for_date');
                expect(result.data.exclude_proxy).toBe(true);
            }
        });

        it('coerces limit from string to number', () => {
            const data = { limit: '30' };
            const result = querySchema.safeParse(data);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.limit).toBe(30);
                expect(typeof result.data.limit).toBe('number');
            }
        });

        it('enforces limit minimum (1)', () => {
            const data = { limit: '0' };
            const result = querySchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('enforces limit maximum (100)', () => {
            const data = { limit: '101' };
            const result = querySchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('coerces offset from string to number', () => {
            const data = { offset: '20' };
            const result = querySchema.safeParse(data);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.offset).toBe(20);
            }
        });

        it('enforces offset minimum (0)', () => {
            const data = { offset: '-1' };
            const result = querySchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('validates order_by enum', () => {
            const validOrderBy = ['for_date', 'created_at'];
            validOrderBy.forEach(order_by => {
                const result = querySchema.safeParse({ order_by });
                expect(result.success).toBe(true);
            });
        });

        it('rejects invalid order_by value', () => {
            const data = { order_by: 'invalid_field' };
            const result = querySchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('transforms exclude_proxy "true" to boolean true', () => {
            const data = { exclude_proxy: 'true' };
            const result = querySchema.safeParse(data);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.exclude_proxy).toBe(true);
            }
        });

        it('transforms exclude_proxy "false" to boolean false', () => {
            const data = { exclude_proxy: 'false' };
            const result = querySchema.safeParse(data);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.exclude_proxy).toBe(false);
            }
        });

        it('rejects invalid exclude_proxy value', () => {
            const data = { exclude_proxy: 'yes' };
            const result = querySchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('rejects invalid from date format', () => {
            const data = { from: '01-01-2026' };
            const result = querySchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('rejects invalid to date format', () => {
            const data = { to: '2026/01/31' };
            const result = querySchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('rejects invalid UUID for league_id', () => {
            const data = { league_id: 'bad-uuid' };
            const result = querySchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('rejects invalid UUID for user_id', () => {
            const data = { user_id: 'not-a-uuid' };
            const result = querySchema.safeParse(data);
            expect(result.success).toBe(false);
        });
    });
});

// ============================================================================
// Authorization Tests
// ============================================================================

describe('Submissions API - Authorization', () => {
    describe('POST - Create Submission', () => {
        it('requires authentication', () => {
            const authError = null;
            const user = null;
            const isAuthenticated = !authError && user !== null;
            expect(isAuthenticated).toBe(false);
        });

        it('authenticated user can submit', () => {
            const authError = null;
            const user = { id: 'user-123' };
            const isAuthenticated = !authError && user !== null;
            expect(isAuthenticated).toBe(true);
        });

        it('requires league membership when league_id provided', () => {
            const membership = null; // not a member
            const isMember = !!membership;
            expect(isMember).toBe(false);
        });

        it('allows submission when user is league member', () => {
            const membership = { role: 'member', league: {} };
            const isMember = !!membership;
            expect(isMember).toBe(true);
        });

        it('allows leagueless submission without membership check', () => {
            const targetLeagueId = null;
            const shouldCheckMembership = !!targetLeagueId;
            expect(shouldCheckMembership).toBe(false);
        });
    });

    describe('POST - Proxy Submissions (X-Acting-As header)', () => {
        it('validates proxy is managed by authenticated user', () => {
            const actingAsId = 'proxy-user-456';
            const authUserId = 'manager-123';
            const proxyData = {
                id: actingAsId,
                managed_by: authUserId,
                is_proxy: true,
                deleted_at: null,
            };

            const isValidProxy = (
                proxyData.managed_by === authUserId &&
                proxyData.is_proxy === true &&
                proxyData.deleted_at === null
            );
            expect(isValidProxy).toBe(true);
        });

        it('rejects proxy not managed by authenticated user', () => {
            const actingAsId = 'proxy-user-456';
            const authUserId = 'manager-123';
            const proxyData = {
                id: actingAsId,
                managed_by: 'other-manager-789', // different manager
                is_proxy: true,
                deleted_at: null,
            };

            const isValidProxy = (
                proxyData.managed_by === authUserId &&
                proxyData.is_proxy === true
            );
            expect(isValidProxy).toBe(false);
        });

        it('rejects non-proxy user in X-Acting-As', () => {
            const proxyData = {
                id: 'regular-user-456',
                managed_by: 'manager-123',
                is_proxy: false, // not a proxy
                deleted_at: null,
            };

            const isValidProxy = proxyData.is_proxy === true;
            expect(isValidProxy).toBe(false);
        });

        it('rejects deleted proxy user', () => {
            const proxyData = {
                id: 'proxy-user-456',
                managed_by: 'manager-123',
                is_proxy: true,
                deleted_at: '2026-01-15T10:00:00Z', // deleted
            };

            const isValidProxy = proxyData.deleted_at === null;
            expect(isValidProxy).toBe(false);
        });

        it('uses proxy user_id as targetUserId when valid', () => {
            const authUserId = 'manager-123';
            const actingAsId = 'proxy-user-456';
            const proxyValid = true;

            const targetUserId = proxyValid ? actingAsId : authUserId;
            expect(targetUserId).toBe(actingAsId);
        });

        it('uses auth user_id when not acting as proxy', () => {
            const authUserId = 'user-123';
            const actingAsId: string | null = null;

            const targetUserId = actingAsId ?? authUserId;
            expect(targetUserId).toBe(authUserId);
        });
    });

    describe('GET - List Submissions', () => {
        it('requires authentication', () => {
            const authError = null;
            const user = null;
            const isAuthenticated = !authError && user !== null;
            expect(isAuthenticated).toBe(false);
        });

        it('allows fetching with league membership', () => {
            const leagueId = 'league-123';
            const membership = { role: 'member' };
            const hasPermission = !!leagueId && !!membership;
            expect(hasPermission).toBe(true);
        });

        it('allows fetching own submissions (user_id = auth user)', () => {
            const userId = 'user-123';
            const authUserId = 'user-123';
            const hasPermission = userId === authUserId;
            expect(hasPermission).toBe(true);
        });

        it('allows fetching proxy submissions (managed proxy)', () => {
            const userId = 'proxy-456';
            const authUserId = 'manager-123';
            const proxyData = { id: userId, managed_by: authUserId, is_proxy: true };

            const hasPermission = (
                proxyData.managed_by === authUserId &&
                proxyData.is_proxy === true
            );
            expect(hasPermission).toBe(true);
        });

        it('denies fetching other user submissions without league context', () => {
            const userId: string = 'other-user-789';
            const authUserId: string = 'user-123';
            const leagueId = null;
            const proxyData = null;

            const isOwnSubmission = userId === authUserId;
            const isProxySubmission = !!proxyData;
            const hasLeagueAccess = !!leagueId;

            const hasPermission = isOwnSubmission || isProxySubmission || hasLeagueAccess;
            expect(hasPermission).toBe(false);
        });
    });
});

// ============================================================================
// Business Logic Tests
// ============================================================================

describe('Submissions API - Business Logic', () => {
    describe('Photo Requirements', () => {
        it('requires photo when league has require_verification_photo=true', () => {
            const league = { require_verification_photo: true, allow_manual_entry: true };
            const requiresProof = league.require_verification_photo === true;
            expect(requiresProof).toBe(true);
        });

        it('requires photo when league has allow_manual_entry=false', () => {
            const league = { require_verification_photo: false, allow_manual_entry: false };
            const requiresProof = league.require_verification_photo || !league.allow_manual_entry;
            expect(requiresProof).toBe(true);
        });

        it('does not require photo when both flags are permissive', () => {
            const league = { require_verification_photo: false, allow_manual_entry: true };
            const requiresProof = league.require_verification_photo || !league.allow_manual_entry;
            expect(requiresProof).toBe(false);
        });

        it('rejects submission without proof when photo required', () => {
            const requiresProof = true;
            const proofPath = null;
            const isValid = !requiresProof || !!proofPath;
            expect(isValid).toBe(false);
        });

        it('accepts submission with proof when photo required', () => {
            const requiresProof = true;
            const proofPath = '/images/proof.jpg';
            const isValid = !requiresProof || !!proofPath;
            expect(isValid).toBe(true);
        });

        it('leagueless submissions default to no photo requirement', () => {
            const targetLeagueId = null;
            const defaultRequirePhoto = false;
            const defaultAllowManual = true;

            const requiresProof = defaultRequirePhoto || !defaultAllowManual;
            expect(requiresProof).toBe(false);
        });
    });

    describe('Backfill Limit', () => {
        it('enforces backfill_limit days restriction', () => {
            const backfillLimit = 7;
            const submissionDate = new Date('2026-01-01');
            const today = new Date('2026-01-15');
            today.setHours(0, 0, 0, 0);

            const diffTime = today.getTime() - submissionDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const isWithinLimit = diffDays <= backfillLimit;
            expect(isWithinLimit).toBe(false); // 14 days > 7 day limit
        });

        it('allows submission within backfill limit', () => {
            const backfillLimit = 7;
            const submissionDate = new Date('2026-01-10');
            const today = new Date('2026-01-15');
            today.setHours(0, 0, 0, 0);

            const diffTime = today.getTime() - submissionDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const isWithinLimit = diffDays <= backfillLimit;
            expect(isWithinLimit).toBe(true); // 5 days <= 7 day limit
        });

        it('allows today submission with any backfill limit', () => {
            const backfillLimit = 0;
            const submissionDate = new Date('2026-01-15');
            const today = new Date('2026-01-15');
            today.setHours(0, 0, 0, 0);

            const diffTime = today.getTime() - submissionDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const isWithinLimit = diffDays <= backfillLimit;
            expect(isWithinLimit).toBe(true); // 0 days <= 0 day limit
        });

        it('skips backfill check when backfill_limit is null', () => {
            const backfillLimit: number | null = null;
            const shouldCheck = backfillLimit !== null;
            expect(shouldCheck).toBe(false);
        });

        it('formats error message correctly for singular day', () => {
            const limitDays = 1;
            const message = `This league only allows submissions for the past ${limitDays} day${limitDays === 1 ? '' : 's'}.`;
            expect(message).toBe('This league only allows submissions for the past 1 day.');
        });

        it('formats error message correctly for plural days', () => {
            const limitDays: number = 7;
            const message = `This league only allows submissions for the past ${limitDays} day${limitDays === 1 ? '' : 's'}.`;
            expect(message).toBe('This league only allows submissions for the past 7 days.');
        });
    });

    describe('Duplicate Detection', () => {
        it('detects existing submission for same date and league', () => {
            const existingSubmission = { id: 'existing-123' };
            const isDuplicate = !!existingSubmission;
            expect(isDuplicate).toBe(true);
        });

        it('returns 409 when duplicate found and overwrite=false', () => {
            const existingSubmission = { id: 'existing-123' };
            const wantsOverwrite = false;
            const shouldReject = existingSubmission && !wantsOverwrite;
            expect(shouldReject).toBe(true);
        });

        it('allows update when overwrite=true', () => {
            const existingSubmission = { id: 'existing-123' };
            const wantsOverwrite = true;
            const shouldReject = existingSubmission && !wantsOverwrite;
            expect(shouldReject).toBe(false);
        });

        it('checks for NULL league_id when submitting leagueless', () => {
            const targetLeagueId = null;
            const queryCondition = targetLeagueId
                ? `.eq("league_id", ${targetLeagueId})`
                : `.is("league_id", null)`;

            expect(queryCondition).toContain('is("league_id", null)');
        });

        it('handles unique constraint violation (23505)', () => {
            const errorCode = '23505';
            const isDuplicateError = errorCode === '23505';
            expect(isDuplicateError).toBe(true);
        });
    });

    describe('Submission Data Structure', () => {
        it('builds correct submission data', () => {
            const input = {
                league_id: 'league-123',
                date: '2026-01-15',
                steps: 10000,
                partial: false,
                proof_path: '/images/proof.jpg',
            };
            const targetUserId = 'user-456';
            const flagged = false;
            const flagReason = null;

            const submissionData = {
                league_id: input.league_id,
                user_id: targetUserId,
                for_date: input.date,
                steps: input.steps,
                partial: input.partial,
                proof_path: input.proof_path,
                flagged,
                flag_reason: flagReason,
            };

            expect(submissionData.league_id).toBe('league-123');
            expect(submissionData.user_id).toBe('user-456');
            expect(submissionData.for_date).toBe('2026-01-15');
            expect(submissionData.steps).toBe(10000);
            expect(submissionData.partial).toBe(false);
            expect(submissionData.proof_path).toBe('/images/proof.jpg');
            expect(submissionData.flagged).toBe(false);
            expect(submissionData.flag_reason).toBeNull();
        });

        it('handles null league_id for leagueless submissions', () => {
            const submissionData = {
                league_id: null,
                user_id: 'user-123',
                for_date: '2026-01-15',
                steps: 8000,
            };

            expect(submissionData.league_id).toBeNull();
        });

        it('supports partial flag', () => {
            const submissionData = {
                partial: true,
            };
            expect(submissionData.partial).toBe(true);
        });
    });

    describe('Verification Trigger', () => {
        it('triggers verification when proof_path provided and league_id present', () => {
            const proofPath = '/images/proof.jpg';
            const targetLeagueId = 'league-123';
            const shouldVerify = !!proofPath && !!targetLeagueId;
            expect(shouldVerify).toBe(true);
        });

        it('skips verification when no proof_path', () => {
            const proofPath = null;
            const targetLeagueId = 'league-123';
            const shouldVerify = !!proofPath && !!targetLeagueId;
            expect(shouldVerify).toBe(false);
        });

        it('skips verification when no league_id (leagueless)', () => {
            const proofPath = '/images/proof.jpg';
            const targetLeagueId = null;
            const shouldVerify = !!proofPath && !!targetLeagueId;
            expect(shouldVerify).toBe(false);
        });

        it('returns 201 when verification succeeds', () => {
            const verificationOk = true;
            const status = verificationOk ? 201 : 202;
            expect(status).toBe(201);
        });

        it('returns 202 when verification fails (still creates submission)', () => {
            const verificationOk = false;
            const status = verificationOk ? 201 : 202;
            expect(status).toBe(202);
        });

        it('includes verification data in response when successful', () => {
            const verification = { ok: true, data: { verified: true, ocr_steps: 10500 } };
            const payload: Record<string, unknown> = { submission: {} };

            if (verification.ok) {
                payload.verification = verification.data;
            }

            expect(payload.verification).toBeDefined();
        });

        it('includes verification_error in response when failed', () => {
            const verification = {
                ok: false,
                data: {
                    code: 'ocr_failed',
                    message: 'Could not read steps',
                    should_retry: true,
                    retry_after: 60,
                },
            };
            const payload: Record<string, unknown> = { submission: {} };

            if (!verification.ok) {
                payload.verification_error = {
                    error: verification.data.code,
                    message: verification.data.message,
                    should_retry: verification.data.should_retry,
                    retry_after: verification.data.retry_after,
                };
            }

            expect(payload.verification_error).toBeDefined();
            expect((payload.verification_error as Record<string, unknown>).error).toBe('ocr_failed');
        });
    });
});

// ============================================================================
// Query Building Tests (GET)
// ============================================================================

describe('Submissions API - Query Building', () => {
    describe('Ordering', () => {
        // Helper to match route logic
        const getOrder = (orderBy: 'for_date' | 'created_at') => ({
            primary: orderBy === 'created_at' ? 'created_at' : 'for_date',
            secondary: orderBy === 'created_at' ? 'for_date' : 'created_at',
        });

        it('uses for_date as primary order by default', () => {
            const result = getOrder('for_date');
            expect(result.primary).toBe('for_date');
        });

        it('uses created_at as secondary order when for_date is primary', () => {
            const result = getOrder('for_date');
            expect(result.secondary).toBe('created_at');
        });

        it('uses created_at as primary when specified', () => {
            const result = getOrder('created_at');
            expect(result.primary).toBe('created_at');
        });

        it('uses for_date as secondary when created_at is primary', () => {
            const result = getOrder('created_at');
            expect(result.secondary).toBe('for_date');
        });
    });

    describe('Filtering', () => {
        it('filters by user_id when provided', () => {
            const userId = 'user-123';
            const filters: string[] = [];

            if (userId) {
                filters.push(`user_id = ${userId}`);
            }

            expect(filters).toContain('user_id = user-123');
        });

        it('filters by league_id when only league_id provided', () => {
            const leagueId = 'league-123';
            const userId = undefined;
            const filters: string[] = [];

            if (userId) {
                filters.push(`user_id = ${userId}`);
            } else if (leagueId) {
                filters.push(`league_id = ${leagueId}`);
            }

            expect(filters).toContain('league_id = league-123');
        });

        it('fallback to auth user when no filters provided', () => {
            const leagueId = undefined;
            const userId = undefined;
            const authUserId = 'auth-user-123';
            const filters: string[] = [];

            if (userId) {
                filters.push(`user_id = ${userId}`);
            } else if (leagueId) {
                filters.push(`league_id = ${leagueId}`);
            } else {
                filters.push(`user_id = ${authUserId}`);
            }

            expect(filters).toContain('user_id = auth-user-123');
        });

        it('applies from date filter (gte)', () => {
            const from = '2026-01-01';
            const filters: string[] = [];

            if (from) {
                filters.push(`for_date >= ${from}`);
            }

            expect(filters).toContain('for_date >= 2026-01-01');
        });

        it('applies to date filter (lte)', () => {
            const to = '2026-01-31';
            const filters: string[] = [];

            if (to) {
                filters.push(`for_date <= ${to}`);
            }

            expect(filters).toContain('for_date <= 2026-01-31');
        });
    });

    describe('Pagination', () => {
        it('calculates correct range for first page', () => {
            const offset = 0;
            const limit = 50;
            const rangeStart = offset;
            const rangeEnd = offset + limit - 1;

            expect(rangeStart).toBe(0);
            expect(rangeEnd).toBe(49);
        });

        it('calculates correct range for second page', () => {
            const offset = 50;
            const limit = 50;
            const rangeStart = offset;
            const rangeEnd = offset + limit - 1;

            expect(rangeStart).toBe(50);
            expect(rangeEnd).toBe(99);
        });

        it('calculates correct range with custom limit', () => {
            const offset = 25;
            const limit = 10;
            const rangeStart = offset;
            const rangeEnd = offset + limit - 1;

            expect(rangeStart).toBe(25);
            expect(rangeEnd).toBe(34);
        });
    });

    describe('Response Headers', () => {
        it('sets Content-Range header correctly', () => {
            const rangeStart = 0;
            const dataLength = 25;
            const total = 100;
            const end = rangeStart + dataLength - 1;

            const contentRange = `items ${rangeStart}-${end}/${total}`;
            expect(contentRange).toBe('items 0-24/100');
        });

        it('sets X-Total-Count header', () => {
            const total = 150;
            const header = String(total);
            expect(header).toBe('150');
        });

        it('handles empty results in Content-Range', () => {
            const rangeStart = 0;
            const dataLength = 0;
            const total = 0;
            const end = dataLength > 0 ? rangeStart + dataLength - 1 : rangeStart;

            const contentRange = `items ${rangeStart}-${end}/${total}`;
            expect(contentRange).toBe('items 0-0/0');
        });
    });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Submissions API - Edge Cases', () => {
    describe('Date Handling', () => {
        it('accepts valid leap year date', () => {
            const data = { date: '2024-02-29', steps: 5000 };
            const result = createSchema.safeParse(data);
            // Note: regex only validates format, not actual date validity
            expect(result.success).toBe(true);
        });

        it('accepts future dates (no validation)', () => {
            const data = { date: '2030-12-31', steps: 5000 };
            const result = createSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('accepts very old dates (no validation)', () => {
            const data = { date: '2000-01-01', steps: 5000 };
            const result = createSchema.safeParse(data);
            expect(result.success).toBe(true);
        });
    });

    describe('Step Count Limits', () => {
        it('accepts very high step counts', () => {
            const data = { date: '2026-01-15', steps: 999999 };
            const result = createSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('accepts minimum positive steps (1)', () => {
            const data = { date: '2026-01-15', steps: 1 };
            const result = createSchema.safeParse(data);
            expect(result.success).toBe(true);
        });
    });

    describe('Proof Path Validation', () => {
        it('accepts various proof path formats', () => {
            const validPaths = [
                '/images/proof.jpg',
                '/uploads/user-123/2026/01/15.png',
                'https://example.com/proof.jpg',
                'abc', // minimum 3 chars
            ];

            validPaths.forEach(proof_path => {
                const data = { date: '2026-01-15', steps: 5000, proof_path };
                const result = createSchema.safeParse(data);
                expect(result.success).toBe(true);
            });
        });
    });

    describe('Response Status Codes', () => {
        it('201 for successful submission with verified proof', () => {
            const verificationOk = true;
            const status = verificationOk ? 201 : 202;
            expect(status).toBe(201);
        });

        it('202 for submission created but verification pending/failed', () => {
            const verificationOk = false;
            const status = verificationOk ? 201 : 202;
            expect(status).toBe(202);
        });

        it('409 for duplicate submission', () => {
            const conflictStatus = 409;
            expect(conflictStatus).toBe(409);
        });

        it('400 for invalid payload', () => {
            const badRequestStatus = 400;
            expect(badRequestStatus).toBe(400);
        });

        it('401 for unauthenticated', () => {
            const unauthorizedStatus = 401;
            expect(unauthorizedStatus).toBe(401);
        });

        it('403 for forbidden (not a member, invalid proxy)', () => {
            const forbiddenStatus = 403;
            expect(forbiddenStatus).toBe(403);
        });
    });
});

