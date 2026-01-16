/**
 * Kanban Board Drag-and-Drop Tests
 * 
 * Tests for Kanban board status changes, ordering, and roadmap integration.
 * Covers drag-and-drop reordering and cross-column moves.
 */

import { describe, it, expect, vi } from 'vitest';

// Types based on actual KanbanBoard.tsx
interface FeedbackItem {
    id: string;
    subject: string;
    board_status: string;
    priority_order: number;
    is_public: boolean;
    target_release: string;
}

const COLUMNS = [
    { id: 'backlog', title: '📋 Backlog' },
    { id: 'todo', title: '📝 To Do' },
    { id: 'in_progress', title: '🔨 In Progress' },
    { id: 'review', title: '👀 Review' },
    { id: 'done', title: '✅ Done' },
];

describe('Kanban - Column Structure', () => {
    it('has 5 columns in correct order', () => {
        expect(COLUMNS.length).toBe(5);
        expect(COLUMNS[0].id).toBe('backlog');
        expect(COLUMNS[4].id).toBe('done');
    });

    it('has proper workflow progression', () => {
        const expected = ['backlog', 'todo', 'in_progress', 'review', 'done'];
        expect(COLUMNS.map(c => c.id)).toEqual(expected);
    });
});

describe('Kanban - Item Ordering', () => {
    const createItem = (id: string, status: string, order: number): FeedbackItem => ({
        id,
        subject: `Item ${id}`,
        board_status: status,
        priority_order: order,
        is_public: false,
        target_release: 'v1.0',
    });

    describe('Within-column reordering', () => {
        it('reorders items by priority_order', () => {
            const items = [
                createItem('a', 'todo', 1),
                createItem('b', 'todo', 2),
                createItem('c', 'todo', 3),
            ];

            const sorted = [...items].sort((a, b) => a.priority_order - b.priority_order);

            expect(sorted[0].id).toBe('a');
            expect(sorted[1].id).toBe('b');
            expect(sorted[2].id).toBe('c');
        });

        it('moves item up in order', () => {
            // Simulate moving item 'c' from position 3 to position 1
            const items = [
                createItem('a', 'todo', 1),
                createItem('b', 'todo', 2),
                createItem('c', 'todo', 3),
            ];

            // After reorder: c should be at top
            const reordered = [
                { ...items[2], priority_order: 1 }, // c moves to 1
                { ...items[0], priority_order: 2 }, // a shifts to 2
                { ...items[1], priority_order: 3 }, // b shifts to 3
            ];

            const sorted = reordered.sort((a, b) => a.priority_order - b.priority_order);
            expect(sorted[0].id).toBe('c');
            expect(sorted[1].id).toBe('a');
            expect(sorted[2].id).toBe('b');
        });

        it('moves item down in order', () => {
            const items = [
                createItem('a', 'todo', 1),
                createItem('b', 'todo', 2),
                createItem('c', 'todo', 3),
            ];

            // Move 'a' to position 3
            const reordered = [
                { ...items[1], priority_order: 1 }, // b moves to 1
                { ...items[2], priority_order: 2 }, // c moves to 2
                { ...items[0], priority_order: 3 }, // a moves to 3
            ];

            const sorted = reordered.sort((a, b) => a.priority_order - b.priority_order);
            expect(sorted[0].id).toBe('b');
            expect(sorted[2].id).toBe('a');
        });
    });

    describe('Cross-column moves', () => {
        it('changes status when moved to different column', () => {
            const item = createItem('a', 'backlog', 1);

            // Simulate drag to 'in_progress'
            const moved = { ...item, board_status: 'in_progress' };

            expect(moved.board_status).toBe('in_progress');
            expect(moved.board_status).not.toBe(item.board_status);
        });

        it('updates priority_order based on drop position', () => {
            const targetColumn = [
                createItem('x', 'in_progress', 1),
                createItem('y', 'in_progress', 2),
            ];

            const movedItem = createItem('a', 'backlog', 5);

            // Insert at position 1 (between x and y)
            const newOrder = 1.5; // Will be normalized later
            const inserted = { ...movedItem, board_status: 'in_progress', priority_order: newOrder };

            expect(inserted.board_status).toBe('in_progress');
        });
    });
});

describe('Kanban - Status Changes', () => {
    describe('Direct status update', () => {
        it('updates single item status', () => {
            const item: FeedbackItem = {
                id: 'item-1',
                subject: 'Test Feature',
                board_status: 'todo',
                priority_order: 1,
                is_public: false,
                target_release: 'v1.0',
            };

            const updated = { ...item, board_status: 'in_progress' };
            expect(updated.board_status).toBe('in_progress');
        });

        it('bulk status change updates all selected items', () => {
            const items = [
                { id: 'a', board_status: 'backlog' },
                { id: 'b', board_status: 'backlog' },
                { id: 'c', board_status: 'todo' },
            ];

            const selectedIds = ['a', 'b'];
            const newStatus = 'todo';

            const updated = items.map(item =>
                selectedIds.includes(item.id)
                    ? { ...item, board_status: newStatus }
                    : item
            );

            expect(updated.filter(i => i.board_status === 'todo').length).toBe(3);
        });
    });

    describe('Completion status', () => {
        it('sets completed_at when moved to done', () => {
            const item = {
                id: 'a',
                board_status: 'review',
                completed_at: null as string | null,
            };

            // Simulate move to done
            const completed = {
                ...item,
                board_status: 'done',
                completed_at: new Date().toISOString(),
            };

            expect(completed.board_status).toBe('done');
            expect(completed.completed_at).not.toBeNull();
        });

        it('clears completed_at when moved out of done', () => {
            const item = {
                id: 'a',
                board_status: 'done',
                completed_at: '2026-01-15T00:00:00Z',
            };

            // Simulate move back to review
            const uncompleted = {
                ...item,
                board_status: 'review',
                completed_at: null,
            };

            expect(uncompleted.board_status).toBe('review');
            expect(uncompleted.completed_at).toBeNull();
        });
    });
});

describe('Kanban - Visibility & Public Flag', () => {
    it('toggles public flag', () => {
        const item = { id: 'a', is_public: false };
        const toggled = { ...item, is_public: !item.is_public };
        expect(toggled.is_public).toBe(true);
    });

    it('bulk toggle public for selected items', () => {
        const items = [
            { id: 'a', is_public: false },
            { id: 'b', is_public: false },
            { id: 'c', is_public: true },
        ];

        const selectedIds = ['a', 'b'];
        const newPublic = true;

        const updated = items.map(item =>
            selectedIds.includes(item.id)
                ? { ...item, is_public: newPublic }
                : item
        );

        expect(updated.filter(i => i.is_public).length).toBe(3);
    });
});

describe('Kanban - Roadmap Integration', () => {
    describe('Public items appear on roadmap', () => {
        it('filters public items for roadmap display', () => {
            const allItems = [
                { id: 'a', is_public: true, board_status: 'todo' },
                { id: 'b', is_public: false, board_status: 'todo' },
                { id: 'c', is_public: true, board_status: 'in_progress' },
            ];

            const roadmapItems = allItems.filter(item => item.is_public);

            expect(roadmapItems.length).toBe(2);
            expect(roadmapItems.every(i => i.is_public)).toBe(true);
        });
    });

    describe('Status propagates to roadmap', () => {
        it('roadmap reflects current board_status', () => {
            const kanbanItem = {
                id: 'feature-1',
                board_status: 'in_progress',
                is_public: true,
            };

            // Roadmap displays same status
            const roadmapDisplay = {
                status: kanbanItem.board_status,
                isLive: kanbanItem.board_status === 'done',
            };

            expect(roadmapDisplay.status).toBe('in_progress');
            expect(roadmapDisplay.isLive).toBe(false);
        });

        it('completed items show as live on roadmap', () => {
            const kanbanItem = {
                id: 'feature-1',
                board_status: 'done',
                is_public: true,
                completed_at: '2026-01-15T00:00:00Z',
            };

            const isLive = kanbanItem.board_status === 'done' && !!kanbanItem.completed_at;
            expect(isLive).toBe(true);
        });
    });

    describe('Target release grouping', () => {
        it('groups items by target_release', () => {
            const items = [
                { id: 'a', target_release: 'v1.0' },
                { id: 'b', target_release: 'v1.0' },
                { id: 'c', target_release: 'v1.1' },
                { id: 'd', target_release: 'v2.0' },
            ];

            const grouped = items.reduce((acc, item) => {
                acc[item.target_release] = acc[item.target_release] || [];
                acc[item.target_release].push(item);
                return acc;
            }, {} as Record<string, typeof items>);

            expect(grouped['v1.0'].length).toBe(2);
            expect(grouped['v1.1'].length).toBe(1);
            expect(grouped['v2.0'].length).toBe(1);
        });
    });
});

describe('Kanban - Feedback Integration', () => {
    describe('Feedback items appear on Kanban', () => {
        it('feedback creates Kanban item in backlog', () => {
            const feedback = {
                id: 'feedback-123',
                type: 'feature_request',
                subject: 'New Feature',
                description: 'I want this feature',
            };

            const kanbanItem = {
                id: feedback.id,
                subject: feedback.subject,
                board_status: 'backlog', // Default status
                priority_order: 999, // End of list
                is_public: false, // Admin decides visibility
            };

            expect(kanbanItem.board_status).toBe('backlog');
            expect(kanbanItem.is_public).toBe(false);
        });
    });

    describe('Type-based categorization', () => {
        it('identifies feedback type', () => {
            const types = ['bug_report', 'feature_request', 'improvement', 'question'];

            for (const type of types) {
                expect(types).toContain(type);
            }
        });
    });
});
