# Drag-and-Drop Library

Centralized drag-and-drop utilities for consistent behavior across the application.

## Overview

This library provides shared types, hooks, components, and utilities for implementing drag-and-drop functionality using `@hello-pangea/dnd`. It supports three common patterns:

1. **Flat Lists** - Simple reordering (e.g., todo lists, settings)
2. **Column-Based** - Kanban-style boards with multiple droppable zones
3. **Nested Hierarchies** - Trees and menus with parent-child relationships

## Features

- ✅ **Type-safe** - Full TypeScript support with generic types
- ✅ **Reusable hooks** - Pre-built logic for common patterns
- ✅ **Shared components** - Consistent visual feedback across features
- ✅ **API integration** - Built-in persistence with error handling
- ✅ **Optimistic updates** - Instant UI feedback with revert on error
- ✅ **Accessibility** - Keyboard navigation and screen reader support via @hello-pangea/dnd

## Installation

The library is already included in the project. Import from `@/lib/dnd`:

```tsx
import { useFlatDragDrop, DragHandle, DroppableContainer } from '@/lib/dnd';
```

## Usage Examples

### 1. Flat List (Simple Reordering)

Perfect for todo lists, simple menus, or any flat array of items.

```tsx
'use client';

import { DragDropContext } from '@hello-pangea/dnd';
import {
  useFlatDragDrop,
  DroppableContainer,
  DraggableWrapper,
  DragHandle,
  DragFeedback,
} from '@/lib/dnd';

interface Task {
  id: string;
  title: string;
  sort_order: number;
}

export function TaskList({ initialTasks }: { initialTasks: Task[] }) {
  const { items, handleDragEnd, isUpdating } = useFlatDragDrop(initialTasks, {
    apiEndpoint: '/api/tasks',
    onSuccess: () => console.log('Tasks reordered'),
    onError: (error) => console.error('Failed to reorder:', error),
  });

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <DroppableContainer droppableId="tasks">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            {items.map((task, index) => (
              <DraggableWrapper key={task.id} draggableId={task.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className="mb-2"
                  >
                    <DragFeedback isDragging={snapshot.isDragging}>
                      <div className="flex items-center gap-2 p-3">
                        <DragHandle provided={provided} variant="dots" />
                        <span>{task.title}</span>
                      </div>
                    </DragFeedback>
                  </div>
                )}
              </DraggableWrapper>
            ))}
            {provided.placeholder}
          </div>
        )}
      </DroppableContainer>
    </DragDropContext>
  );
}
```

### 2. Column-Based (Kanban Board)

Perfect for project boards, workflow management, or any multi-column layout.

```tsx
'use client';

import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useColumnDragDrop } from '@/lib/dnd';

interface Column {
  id: string;
  title: string;
  items: FeedbackItem[];
}

export function KanbanBoard({ initialColumns }: { initialColumns: Column[] }) {
  const { columns, handleDragEnd, isUpdating } = useColumnDragDrop(
    initialColumns,
    {
      allowColumnReorder: true,
      columnOrderStorageKey: 'kanban-column-order',
      onDragEnd: async (result, allItems) => {
        // Custom logic (e.g., set completed_at when moved to "done")
        if (result.destination?.droppableId === 'done') {
          // ... update item
        }
      },
    }
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="board" direction="horizontal" type="COLUMN">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="flex gap-4">
            {columns.map((column, colIndex) => (
              <Draggable key={column.id} draggableId={column.id} index={colIndex}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className="w-72 bg-card rounded-lg"
                  >
                    <div {...provided.dragHandleProps} className="p-3 border-b">
                      <h3>{column.title}</h3>
                    </div>

                    <Droppable droppableId={column.id} type="ITEM">
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps}>
                          {column.items.map((item, index) => (
                            <Draggable key={item.id} draggableId={item.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  {/* Item content */}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
```

### 3. Nested Hierarchy (Menu Editor)

Perfect for menus, file trees, or any nested structure.

```tsx
'use client';

import { DragDropContext } from '@hello-pangea/dnd';
import {
  useNestedDragDrop,
  DroppableContainer,
  DraggableWrapper,
  DragHandle,
  DepthIndicator,
  LevelBadge,
  flattenTree,
} from '@/lib/dnd';

interface MenuItem {
  id: string;
  label: string;
  parent_id: string | null;
  sort_order: number;
  children?: MenuItem[];
}

export function MenuEditor({ initialItems }: { initialItems: MenuItem[] }) {
  const { items, handleDragEnd, isUpdating } = useNestedDragDrop(initialItems, {
    maxDepth: 3,
    allowReparenting: false, // Keep parent-child relationships
    flattenItems: flattenTree,
    apiEndpoint: '/api/menus/items',
  });

  const renderItem = (item: MenuItem, index: number, depth: number = 0) => (
    <DraggableWrapper key={item.id} draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={depth > 0 ? 'ml-8' : ''}
        >
          <div className="flex items-center gap-2 p-2 border rounded mb-2">
            <DragHandle provided={provided} variant="dots" />
            <DepthIndicator depth={depth} />
            <LevelBadge level={depth} />
            <span>{item.label}</span>
          </div>

          {item.children?.length > 0 && (
            <div>
              {item.children.map((child, childIndex) =>
                renderItem(child, index + childIndex + 1, depth + 1)
              )}
            </div>
          )}
        </div>
      )}
    </DraggableWrapper>
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <DroppableContainer droppableId="menu-items">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            {items.map((item, index) => renderItem(item, index, 0))}
            {provided.placeholder}
          </div>
        )}
      </DroppableContainer>
    </DragDropContext>
  );
}
```

## API Reference

### Hooks

#### `useFlatDragDrop<T>(initialItems, config)`

Hook for flat list drag-and-drop.

**Returns:**
- `items: T[]` - Current items array
- `setItems: (items: T[]) => void` - Update items
- `handleDragEnd: (result: DropResult) => void` - Drag end handler
- `isUpdating: boolean` - Loading state during API call

#### `useColumnDragDrop<T, C>(initialColumns, config)`

Hook for column-based drag-and-drop (Kanban).

**Returns:**
- `columns: C[]` - Current columns array
- `setColumns: (columns: C[]) => void` - Update columns
- `handleDragEnd: (result: DropResult) => void` - Drag end handler
- `isUpdating: boolean` - Loading state

#### `useNestedDragDrop<T>(initialItems, config)`

Hook for nested/hierarchical drag-and-drop.

**Returns:**
- `items: T[]` - Current nested items
- `setItems: (items: T[]) => void` - Update items
- `handleDragEnd: (result: DropResult) => void` - Drag end handler
- `isUpdating: boolean` - Loading state

### Components

#### `<DroppableContainer>`

Reusable droppable zone with consistent styling.

**Props:**
- `droppableId: string` - Unique ID for droppable
- `type?: string` - Type for nested droppables (default: "DEFAULT")
- `direction?: "vertical" | "horizontal"` - Layout direction
- `children: (provided, snapshot) => ReactNode` - Render function
- `className?: string` - Base CSS classes
- `dragOverClassName?: string` - Classes when dragging over

#### `<DraggableWrapper>`

Reusable draggable item wrapper.

**Props:**
- `draggableId: string` - Unique ID for draggable
- `index: number` - Position in list
- `children: (provided, snapshot) => ReactNode` - Render function
- `isDragDisabled?: boolean` - Disable dragging

#### `<DragHandle>`

Visual drag handle with different variants.

**Props:**
- `provided: DraggableProvided` - From Draggable render prop
- `className?: string` - CSS classes
- `variant?: "dots" | "bars" | "grip"` - Icon style (default: "dots")

#### `<DragFeedback>`

Wrapper for visual drag feedback.

**Props:**
- `isDragging: boolean` - From snapshot.isDragging
- `isSelected?: boolean` - Show selected state
- `children: ReactNode` - Content to wrap
- `draggingClassName?: string` - Classes when dragging
- `selectedClassName?: string` - Classes when selected
- `defaultClassName?: string` - Default classes

#### `<DepthIndicator>`

Visual indicator for nested item depth (└ symbols).

**Props:**
- `depth: number` - Nesting level (0 = root)
- `className?: string` - CSS classes

#### `<LevelBadge>`

Badge showing nesting level ("Level 1", "Level 2", etc.).

**Props:**
- `level: number` - Nesting level (0 = root, no badge)
- `className?: string` - CSS classes

### Utilities

#### `reorderArray<T>(items, sourceIndex, destinationIndex)`

Reorder items in a flat array and update sort_order.

#### `moveItemBetweenArrays<T>(source, destination, sourceIndex, destinationIndex)`

Move item between two arrays (for Kanban columns).

#### `flattenTree<T>(items, parentId?)`

Flatten nested tree structure to flat array with parent_id references.

#### `buildTree<T>(items)`

Build nested tree from flat array using parent_id.

#### `shouldIgnoreDrag(result)`

Check if drag should be ignored (no destination or same position).

#### `persistReorder<T>(endpoint, items, method?)`

Persist reordered items to API endpoint.

## Configuration

### `DragDropConfig<T>`

```typescript
interface DragDropConfig<T extends DraggableItem> {
  onDragEnd?: (result: DropResult, items: T[]) => Promise<void> | void;
  transformItems?: (items: T[]) => T[];
  canDrag?: (item: T) => boolean;
  canDrop?: (sourceItem: T, destinationIndex: number) => boolean;
  apiEndpoint?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}
```

### `ColumnDragConfig<T>` (extends `DragDropConfig<T>`)

```typescript
interface ColumnDragConfig<T extends DraggableItem> {
  allowColumnReorder?: boolean;
  onColumnReorder?: (columnIds: string[]) => void;
  columnOrderStorageKey?: string;
}
```

### `NestedDragConfig<T>` (extends `DragDropConfig<T>`)

```typescript
interface NestedDragConfig<T extends DraggableItem> {
  maxDepth?: number;
  allowReparenting?: boolean;
  getChildren?: (item: T) => T[];
  flattenItems?: (items: T[]) => T[];
}
```

## Current Implementations

This library consolidates logic from:

1. **Kanban Board** (`src/components/admin/KanbanBoard.tsx`)
   - Column reordering with localStorage persistence
   - Item movement between columns
   - Status updates (board_status field)
   - Bulk operations support

2. **Menu Editor** (`src/app/admin/menus/page.tsx`)
   - Nested item reordering
   - Automatic cache invalidation
   - Depth indicators and level badges
   - Visual drag feedback

## Migration Guide

### Refactoring Kanban Board

**Before:**
```tsx
const handleDragEnd = async (result: DropResult) => {
  // 50+ lines of custom logic
};
```

**After:**
```tsx
const { columns, handleDragEnd } = useColumnDragDrop(initialColumns, {
  allowColumnReorder: true,
  columnOrderStorageKey: 'kanban-order',
  onDragEnd: async (result, items) => {
    // Only custom business logic (completed_at, etc.)
  },
});
```

### Refactoring Menu Editor

**Before:**
```tsx
const flattenItems = (items, parentId) => { /* ... */ };
const handleDragEnd = async (result: DropResult) => { /* ... */ };
```

**After:**
```tsx
const { items, handleDragEnd } = useNestedDragDrop(menuItems, {
  flattenItems: flattenTree,
  apiEndpoint: '/api/menus/items',
});
```

## Best Practices

1. **Use appropriate hook** - Choose `useFlatDragDrop`, `useColumnDragDrop`, or `useNestedDragDrop` based on your layout
2. **Provide apiEndpoint** - Enable automatic persistence with error handling
3. **Add loading states** - Use `isUpdating` to show feedback during save
4. **Handle errors gracefully** - Implement `onError` callback for user feedback
5. **Use shared components** - Leverage `DragHandle`, `DragFeedback`, etc. for consistency
6. **Test with keyboard** - @hello-pangea/dnd includes keyboard navigation

## Future Enhancements

- [ ] Undo/redo support
- [ ] Drag animations customization
- [ ] Virtual scrolling for large lists
- [ ] Multi-select drag
- [ ] Drag between different component instances
- [ ] Copy vs move operations

## Resources

- [@hello-pangea/dnd Documentation](https://github.com/hello-pangea/dnd)
- [Accessibility Best Practices](https://github.com/hello-pangea/dnd/blob/main/docs/about/accessibility.md)
