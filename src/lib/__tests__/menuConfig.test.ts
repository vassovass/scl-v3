/**
 * Menu Configuration System Tests
 * 
 * Tests for WordPress-inspired menu management system.
 * Covers role-based visibility, ordering, league context, and propagation.
 */

import { describe, it, expect } from 'vitest';
import {
    USER_ROLES,
    hasMinimumRole,
    isVisibleToRole,
    filterMenuByRole,
    resolveMenuHrefs,
    filterByLeagueContext,
    prepareMenuItems,
    detectMenuLocation,
    type MenuItem,
    type UserRole,
} from '../menuConfig';

describe('Menu Config - Role System', () => {
    describe('USER_ROLES ordering', () => {
        it('guest is lowest privilege', () => {
            expect(USER_ROLES[0]).toBe('guest');
        });

        it('superadmin is highest privilege', () => {
            expect(USER_ROLES[USER_ROLES.length - 1]).toBe('superadmin');
        });

        it('correct privilege order', () => {
            expect(USER_ROLES).toEqual(['guest', 'member', 'admin', 'owner', 'superadmin']);
        });
    });

    describe('hasMinimumRole', () => {
        it('member has minimum member role', () => {
            expect(hasMinimumRole('member', 'member')).toBe(true);
        });

        it('admin has minimum member role', () => {
            expect(hasMinimumRole('admin', 'member')).toBe(true);
        });

        it('member does NOT have minimum admin role', () => {
            expect(hasMinimumRole('member', 'admin')).toBe(false);
        });

        it('guest does NOT have minimum member role', () => {
            expect(hasMinimumRole('guest', 'member')).toBe(false);
        });

        it('superadmin has all minimum roles', () => {
            for (const role of USER_ROLES) {
                expect(hasMinimumRole('superadmin', role)).toBe(true);
            }
        });
    });
});

describe('Menu Config - Visibility', () => {
    const createItem = (overrides: Partial<MenuItem>): MenuItem => ({
        id: 'test-item',
        label: 'Test Item',
        ...overrides,
    });

    describe('isVisibleToRole', () => {
        it('hides from guest by default', () => {
            const item = createItem({});
            expect(isVisibleToRole(item, 'guest')).toBe(false);
        });

        it('shows to member by default', () => {
            const item = createItem({});
            expect(isVisibleToRole(item, 'member')).toBe(true);
        });

        it('respects visibleTo whitelist', () => {
            const item = createItem({ visibleTo: ['admin', 'owner'] });
            expect(isVisibleToRole(item, 'member')).toBe(false);
            expect(isVisibleToRole(item, 'admin')).toBe(true);
            expect(isVisibleToRole(item, 'owner')).toBe(true);
        });

        it('respects hiddenFrom blacklist', () => {
            const item = createItem({ hiddenFrom: ['guest', 'member'] });
            expect(isVisibleToRole(item, 'member')).toBe(false);
            expect(isVisibleToRole(item, 'admin')).toBe(true);
        });

        it('hiddenFrom takes precedence over visibleTo', () => {
            const item = createItem({
                visibleTo: ['member', 'admin'],
                hiddenFrom: ['member'],
            });
            expect(isVisibleToRole(item, 'member')).toBe(false);
            expect(isVisibleToRole(item, 'admin')).toBe(true);
        });

        it('shows to guest when explicitly in visibleTo', () => {
            const item = createItem({ visibleTo: ['guest', 'member'] });
            expect(isVisibleToRole(item, 'guest')).toBe(true);
        });
    });

    describe('filterMenuByRole', () => {
        it('filters out items not visible to role', () => {
            const items: MenuItem[] = [
                createItem({ id: 'public', visibleTo: ['guest', 'member'] }),
                createItem({ id: 'admin-only', visibleTo: ['admin', 'owner'] }),
            ];

            const filtered = filterMenuByRole(items, 'member');
            expect(filtered.length).toBe(1);
            expect(filtered[0].id).toBe('public');
        });

        it('preserves children with proper filtering', () => {
            const items: MenuItem[] = [
                createItem({
                    id: 'parent',
                    children: [
                        createItem({ id: 'child-public' }),
                        createItem({ id: 'child-admin', visibleTo: ['admin'] }),
                    ],
                }),
            ];

            const filtered = filterMenuByRole(items, 'member');
            expect(filtered[0].children?.length).toBe(1);
            expect(filtered[0].children?.[0].id).toBe('child-public');
        });

        it('filters recursively to any depth', () => {
            const items: MenuItem[] = [
                createItem({
                    id: 'level1',
                    children: [
                        createItem({
                            id: 'level2',
                            children: [
                                createItem({ id: 'level3-visible' }),
                                createItem({ id: 'level3-hidden', visibleTo: ['superadmin'] }),
                            ],
                        }),
                    ],
                }),
            ];

            const filtered = filterMenuByRole(items, 'member');
            expect(filtered[0].children?.[0].children?.length).toBe(1);
            expect(filtered[0].children?.[0].children?.[0].id).toBe('level3-visible');
        });
    });
});

describe('Menu Config - League Context', () => {
    const createItem = (overrides: Partial<MenuItem>): MenuItem => ({
        id: 'test-item',
        label: 'Test Item',
        ...overrides,
    });

    describe('resolveMenuHrefs', () => {
        it('replaces [id] placeholder with league ID', () => {
            const items: MenuItem[] = [
                createItem({ id: 'league', href: '/league/[id]/leaderboard' }),
            ];

            const resolved = resolveMenuHrefs(items, 'abc123');
            expect(resolved[0].href).toBe('/league/abc123/leaderboard');
        });

        it('preserves href when no league ID', () => {
            const items: MenuItem[] = [
                createItem({ id: 'league', href: '/league/[id]/leaderboard' }),
            ];

            const resolved = resolveMenuHrefs(items, undefined);
            expect(resolved[0].href).toBe('/league/[id]/leaderboard');
        });

        it('resolves nested children hrefs', () => {
            const items: MenuItem[] = [
                createItem({
                    id: 'parent',
                    children: [
                        createItem({ id: 'child', href: '/league/[id]/settings' }),
                    ],
                }),
            ];

            const resolved = resolveMenuHrefs(items, 'xyz789');
            expect(resolved[0].children?.[0].href).toBe('/league/xyz789/settings');
        });
    });

    describe('filterByLeagueContext', () => {
        it('shows league-required items when in league', () => {
            const items: MenuItem[] = [
                createItem({ id: 'always', requiresLeague: false }),
                createItem({ id: 'league-only', requiresLeague: true }),
            ];

            const filtered = filterByLeagueContext(items, true);
            expect(filtered.length).toBe(2);
        });

        it('hides league-required items when not in league', () => {
            const items: MenuItem[] = [
                createItem({ id: 'always', requiresLeague: false }),
                createItem({ id: 'league-only', requiresLeague: true }),
            ];

            const filtered = filterByLeagueContext(items, false);
            expect(filtered.length).toBe(1);
            expect(filtered[0].id).toBe('always');
        });
    });
});

describe('Menu Config - Location Detection', () => {
    describe('detectMenuLocation', () => {
        it('detects admin pages', () => {
            expect(detectMenuLocation('/admin')).toBe('admin_header');
            expect(detectMenuLocation('/admin/settings')).toBe('admin_header');
            expect(detectMenuLocation('/admin/kanban')).toBe('admin_header');
        });

        it('detects app pages', () => {
            expect(detectMenuLocation('/dashboard')).toBe('app_header');
            expect(detectMenuLocation('/league/abc123')).toBe('app_header');
            expect(detectMenuLocation('/settings/profile')).toBe('app_header');
        });

        it('detects public pages', () => {
            expect(detectMenuLocation('/')).toBe('public_header');
            expect(detectMenuLocation('/pricing')).toBe('public_header');
            expect(detectMenuLocation('/privacy')).toBe('public_header');
            expect(detectMenuLocation('/roadmap')).toBe('public_header');
        });

        // PRD-55: Marketing pages must show public navigation
        it('detects marketing pages as public (PRD-55)', () => {
            expect(detectMenuLocation('/how-to-share')).toBe('public_header');
            expect(detectMenuLocation('/compare')).toBe('public_header');
            expect(detectMenuLocation('/how-it-works')).toBe('public_header');
            expect(detectMenuLocation('/why-upload')).toBe('public_header');
        });

        it('detects legal pages as public', () => {
            expect(detectMenuLocation('/terms')).toBe('public_header');
            expect(detectMenuLocation('/security')).toBe('public_header');
        });

        it('detects info pages as public', () => {
            expect(detectMenuLocation('/stage-info')).toBe('public_header');
            expect(detectMenuLocation('/beta')).toBe('public_header');
            expect(detectMenuLocation('/feedback')).toBe('public_header');
        });

        it('defaults unknown routes to app_header', () => {
            expect(detectMenuLocation('/unknown-route')).toBe('app_header');
            expect(detectMenuLocation('/some/nested/path')).toBe('app_header');
        });
    });
});

describe('Menu Config - Item Ordering', () => {
    it('preserves item order', () => {
        const items: MenuItem[] = [
            { id: 'first', label: 'First' },
            { id: 'second', label: 'Second' },
            { id: 'third', label: 'Third' },
        ];

        const filtered = filterMenuByRole(items, 'member');
        expect(filtered[0].id).toBe('first');
        expect(filtered[1].id).toBe('second');
        expect(filtered[2].id).toBe('third');
    });

    it('maintains order after filtering', () => {
        const items: MenuItem[] = [
            { id: 'first', label: 'First' },
            { id: 'hidden', label: 'Hidden', visibleTo: ['admin'] },
            { id: 'third', label: 'Third' },
        ];

        const filtered = filterMenuByRole(items, 'member');
        expect(filtered.length).toBe(2);
        expect(filtered[0].id).toBe('first');
        expect(filtered[1].id).toBe('third');
    });
});

describe('Menu Config - Combined Preparation', () => {
    it('prepareMenuItems applies all filters and resolves', () => {
        const items: MenuItem[] = [
            { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
            { id: 'league', label: 'League', href: '/league/[id]', requiresLeague: true },
            { id: 'admin', label: 'Admin', visibleTo: ['superadmin'] },
        ];

        const prepared = prepareMenuItems(items, 'member', 'abc123');

        expect(prepared.length).toBe(2); // admin filtered out
        expect(prepared[1].href).toBe('/league/abc123'); // resolved
    });
});

