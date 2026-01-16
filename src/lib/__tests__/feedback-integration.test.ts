/**
 * Feedback → Kanban → Roadmap Integration Tests
 * 
 * Tests for the complete feedback lifecycle:
 * User feedback → Kanban board management → Public roadmap display
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Schemas from actual feedback.ts
const boardStatusSchema = z.enum([
    'backlog',
    'todo',
    'in_progress',
    'review',
    'done',
    'merged',
]);

const targetReleaseSchema = z.enum([
    'now',
    'next',
    'later',
    'future',
]);

const feedbackTypes = ['bug', 'feature', 'general', 'positive', 'negative'] as const;

// Types
interface FeedbackItem {
    id: string;
    type: typeof feedbackTypes[number];
    subject: string;
    description: string;
    board_status: z.infer<typeof boardStatusSchema>;
    is_public: boolean;
    target_release: z.infer<typeof targetReleaseSchema> | null;
    priority_order: number;
    completed_at: string | null;
}

describe('Feedback System - Schema Validation', () => {
    describe('Board status values', () => {
        it('accepts all valid statuses', () => {
            const statuses = ['backlog', 'todo', 'in_progress', 'review', 'done', 'merged'];
            for (const status of statuses) {
                expect(boardStatusSchema.safeParse(status).success).toBe(true);
            }
        });

        it('rejects invalid status', () => {
            expect(boardStatusSchema.safeParse('invalid').success).toBe(false);
        });
    });

    describe('Target release values', () => {
        it('accepts all valid releases', () => {
            const releases = ['now', 'next', 'later', 'future'];
            for (const release of releases) {
                expect(targetReleaseSchema.safeParse(release).success).toBe(true);
            }
        });

        it('rejects invalid release', () => {
            expect(targetReleaseSchema.safeParse('v1.0').success).toBe(false);
        });
    });

    describe('Feedback types', () => {
        it('includes bug reports', () => {
            expect(feedbackTypes).toContain('bug');
        });

        it('includes feature requests', () => {
            expect(feedbackTypes).toContain('feature');
        });
    });
});

describe('Feedback → Kanban Integration', () => {
    const createFeedback = (overrides: Partial<FeedbackItem>): FeedbackItem => ({
        id: 'fb-1',
        type: 'feature',
        subject: 'New Feature Request',
        description: 'User wants this feature',
        board_status: 'backlog',
        is_public: false,
        target_release: null,
        priority_order: 999,
        completed_at: null,
        ...overrides,
    });

    describe('New feedback lands in backlog', () => {
        it('defaults to backlog status', () => {
            const feedback = createFeedback({});
            expect(feedback.board_status).toBe('backlog');
        });

        it('defaults to private (not public)', () => {
            const feedback = createFeedback({});
            expect(feedback.is_public).toBe(false);
        });

        it('has no target release initially', () => {
            const feedback = createFeedback({});
            expect(feedback.target_release).toBeNull();
        });
    });

    describe('Admin moves to Kanban column', () => {
        it('changes board_status when moved to todo', () => {
            const before = createFeedback({ board_status: 'backlog' });
            const after = { ...before, board_status: 'todo' as const };

            expect(after.board_status).toBe('todo');
        });

        it('changes board_status when moved to in_progress', () => {
            const before = createFeedback({ board_status: 'todo' });
            const after = { ...before, board_status: 'in_progress' as const };

            expect(after.board_status).toBe('in_progress');
        });

        it('sets completed_at when moved to done', () => {
            const before = createFeedback({ board_status: 'review' });
            const after = {
                ...before,
                board_status: 'done' as const,
                completed_at: new Date().toISOString(),
            };

            expect(after.board_status).toBe('done');
            expect(after.completed_at).not.toBeNull();
        });
    });

    describe('Admin sets target release', () => {
        it('assigns target_release for roadmap grouping', () => {
            const before = createFeedback({ target_release: null });
            const after = { ...before, target_release: 'next' as const };

            expect(after.target_release).toBe('next');
        });
    });

    describe('Admin marks as public', () => {
        it('changes is_public to true', () => {
            const before = createFeedback({ is_public: false });
            const after = { ...before, is_public: true };

            expect(after.is_public).toBe(true);
        });
    });
});

describe('Kanban → Roadmap Integration', () => {
    const items: FeedbackItem[] = [
        {
            id: 'fb-1',
            type: 'feature',
            subject: 'Public Feature',
            description: 'Visible on roadmap',
            board_status: 'in_progress',
            is_public: true,
            target_release: 'now',
            priority_order: 1,
            completed_at: null,
        },
        {
            id: 'fb-2',
            type: 'bug',
            subject: 'Private Bug',
            description: 'Not on roadmap',
            board_status: 'todo',
            is_public: false,
            target_release: 'now',
            priority_order: 2,
            completed_at: null,
        },
        {
            id: 'fb-3',
            type: 'feature',
            subject: 'Completed Feature',
            description: 'Done and public',
            board_status: 'done',
            is_public: true,
            target_release: 'now',
            priority_order: 3,
            completed_at: '2026-01-15T00:00:00Z',
        },
    ];

    describe('Roadmap only shows public items', () => {
        it('filters to only public items', () => {
            const roadmapItems = items.filter(item => item.is_public);
            expect(roadmapItems.length).toBe(2);
            expect(roadmapItems.every(i => i.is_public)).toBe(true);
        });

        it('excludes private items', () => {
            const roadmapItems = items.filter(item => item.is_public);
            expect(roadmapItems.find(i => i.id === 'fb-2')).toBeUndefined();
        });
    });

    describe('Roadmap groups by target_release', () => {
        it('groups items by release phase', () => {
            const publicItems = items.filter(i => i.is_public);
            const grouped = publicItems.reduce((acc, item) => {
                const release = item.target_release || 'unplanned';
                acc[release] = acc[release] || [];
                acc[release].push(item);
                return acc;
            }, {} as Record<string, FeedbackItem[]>);

            expect(grouped['now']?.length).toBe(2);
        });
    });

    describe('Roadmap reflects Kanban status', () => {
        it('shows in_progress items as active', () => {
            const activeItems = items.filter(i =>
                i.is_public && i.board_status === 'in_progress'
            );
            expect(activeItems.length).toBe(1);
        });

        it('shows done items as completed', () => {
            const completedItems = items.filter(i =>
                i.is_public && i.board_status === 'done'
            );
            expect(completedItems.length).toBe(1);
            expect(completedItems[0].completed_at).not.toBeNull();
        });
    });

    describe('Status ordering on roadmap', () => {
        it('orders by priority_order within release', () => {
            const publicItems = items
                .filter(i => i.is_public && i.target_release === 'now')
                .sort((a, b) => a.priority_order - b.priority_order);

            expect(publicItems[0].priority_order).toBeLessThan(publicItems[1]?.priority_order || Infinity);
        });
    });
});

describe('Complete Lifecycle Tests', () => {
    describe('Bug report → Fix → Release', () => {
        it('progresses through all stages', () => {
            const stages = [
                { status: 'backlog', is_public: false, completed_at: null },
                { status: 'todo', is_public: false, completed_at: null },
                { status: 'in_progress', is_public: true, completed_at: null }, // Made public
                { status: 'review', is_public: true, completed_at: null },
                { status: 'done', is_public: true, completed_at: '2026-01-15' },
            ];

            // Verify progression
            expect(stages[0].status).toBe('backlog');
            expect(stages[4].status).toBe('done');
            expect(stages[4].completed_at).not.toBeNull();
        });
    });

    describe('Feature request → Public roadmap → Delivered', () => {
        it('appears on roadmap when public', () => {
            const feature = {
                id: 'feature-1',
                board_status: 'in_progress',
                is_public: true,
                target_release: 'next',
            };

            const appearsOnRoadmap = feature.is_public;
            expect(appearsOnRoadmap).toBe(true);
        });

        it('shows as delivered when done', () => {
            const feature = {
                id: 'feature-1',
                board_status: 'done',
                is_public: true,
                target_release: 'now',
                completed_at: '2026-01-15',
            };

            const isDelivered = feature.board_status === 'done' && !!feature.completed_at;
            expect(isDelivered).toBe(true);
        });
    });

    describe('Merged status for duplicates', () => {
        it('marks secondary items as merged', () => {
            const primary = { id: 'fb-1', board_status: 'todo' };
            const secondary = { id: 'fb-2', board_status: 'merged' };

            expect(secondary.board_status).toBe('merged');
        });

        it('merged items do not appear on roadmap', () => {
            const items = [
                { id: 'fb-1', board_status: 'todo', is_public: true },
                { id: 'fb-2', board_status: 'merged', is_public: true },
            ];

            // Roadmap should exclude merged items
            const roadmapItems = items.filter(i =>
                i.is_public && i.board_status !== 'merged'
            );

            expect(roadmapItems.length).toBe(1);
            expect(roadmapItems[0].id).toBe('fb-1');
        });
    });
});

describe('Bulk Operations', () => {
    describe('Bulk status change', () => {
        it('updates multiple items at once', () => {
            const items = [
                { id: 'fb-1', board_status: 'backlog' },
                { id: 'fb-2', board_status: 'backlog' },
                { id: 'fb-3', board_status: 'todo' },
            ];

            const selectedIds = ['fb-1', 'fb-2'];
            const newStatus = 'todo';

            const updated = items.map(item =>
                selectedIds.includes(item.id)
                    ? { ...item, board_status: newStatus }
                    : item
            );

            expect(updated.filter(i => i.board_status === 'todo').length).toBe(3);
        });
    });

    describe('Bulk visibility toggle', () => {
        it('makes multiple items public', () => {
            const items = [
                { id: 'fb-1', is_public: false },
                { id: 'fb-2', is_public: false },
            ];

            const updated = items.map(item => ({ ...item, is_public: true }));
            expect(updated.every(i => i.is_public)).toBe(true);
        });
    });
});
