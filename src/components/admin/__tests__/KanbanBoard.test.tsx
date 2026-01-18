/**
 * KanbanBoard Component Tests
 *
 * Ensures core column layout and item rendering.
 * Based on testing-patterns skill and PRD 42.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import KanbanBoard from '../KanbanBoard';

vi.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Droppable: ({ children }: { children: (provided: any, snapshot: any) => React.ReactNode }) => (
    <div>
      {children(
        {
          innerRef: vi.fn(),
          droppableProps: {},
          placeholder: null,
        },
        { isDraggingOver: false }
      )}
    </div>
  ),
  Draggable: ({ children }: { children: (provided: any) => React.ReactNode }) => (
    <div>
      {children({
        innerRef: vi.fn(),
        draggableProps: {},
        dragHandleProps: {},
      })}
    </div>
  ),
}));

vi.mock('@/components/shared/UniversalFilters', () => ({
  __esModule: true,
  default: () => <div data-testid="filters">Filters</div>,
  FILTER_PRESETS: {
    adminKanban: [],
  },
}));

vi.mock('@/components/admin/BulkActionsBar', () => ({
  __esModule: true,
  default: () => <div data-testid="bulk-actions" />,
}));

vi.mock('@/components/admin/MergeModal', () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock('@/components/admin/ImportModal', () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock('@/components/admin/ExpandableCardModal', () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock('@/components/admin/KanbanCard', () => ({
  __esModule: true,
  default: ({ item }: { item: { subject: string } }) => <div>{item.subject}</div>,
}));

vi.mock('@/hooks/useExport', () => ({
  useExport: () => ({
    exportCSV: vi.fn(),
    isExporting: false,
  }),
}));

describe('KanbanBoard', () => {
  it('renders columns and items from initial data', async () => {
    const items = [
      {
        id: 'item-1',
        type: 'feature_request',
        subject: 'Add leaderboard filters',
        description: 'More filters',
        board_status: 'backlog',
        is_public: false,
        priority_order: 1,
        created_at: '2026-01-18T00:00:00Z',
        completed_at: null,
        target_release: 'v1.0',
        user_id: null,
        screenshot_url: null,
      },
      {
        id: 'item-2',
        type: 'bug_report',
        subject: 'Fix leaderboard sorting',
        description: 'Sorting issue',
        board_status: 'todo',
        is_public: false,
        priority_order: 1,
        created_at: '2026-01-18T00:00:00Z',
        completed_at: null,
        target_release: 'v1.0',
        user_id: null,
        screenshot_url: null,
      },
    ];

    render(<KanbanBoard initialItems={items} />);

    await waitFor(() => {
      expect(screen.getByText('📋 Backlog')).toBeInTheDocument();
      expect(screen.getByText('📝 To Do')).toBeInTheDocument();
    });

    expect(screen.getByText('Add leaderboard filters')).toBeInTheDocument();
    expect(screen.getByText('Fix leaderboard sorting')).toBeInTheDocument();
  });
});
