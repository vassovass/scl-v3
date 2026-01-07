/**
 * Shared types for drag-and-drop functionality across the application
 * Uses @hello-pangea/dnd library
 */

import { DropResult } from "@hello-pangea/dnd";

/**
 * Base item that can be dragged and dropped
 */
export interface DraggableItem {
  id: string;
  sort_order?: number;
  priority_order?: number;
  parent_id?: string | null;
}

/**
 * Configuration for drag-and-drop behavior
 */
export interface DragDropConfig<T extends DraggableItem> {
  /**
   * Callback when drag ends - should handle state updates and API calls
   */
  onDragEnd: (result: DropResult, items: T[]) => Promise<void> | void;

  /**
   * Optional: Transform items before/after drag operation
   */
  transformItems?: (items: T[]) => T[];

  /**
   * Optional: Validate if a drag operation is allowed
   */
  canDrag?: (item: T) => boolean;

  /**
   * Optional: Validate if a drop is allowed at destination
   */
  canDrop?: (sourceItem: T, destinationIndex: number) => boolean;

  /**
   * Optional: API endpoint for persisting reorder
   */
  apiEndpoint?: string;

  /**
   * Optional: Callback after successful API update
   */
  onSuccess?: () => void;

  /**
   * Optional: Callback on error
   */
  onError?: (error: Error) => void;
}

/**
 * Result of a reorder operation
 */
export interface ReorderResult<T extends DraggableItem> {
  reorderedItems: T[];
  movedItem: T;
  sourceIndex: number;
  destinationIndex: number;
}

/**
 * Visual feedback configuration for drag states
 */
export interface DragVisualConfig {
  draggingClassName?: string;
  dragOverClassName?: string;
  defaultClassName?: string;
  handleClassName?: string;
}

/**
 * Column-based drag-and-drop configuration (for Kanban-style boards)
 */
export interface ColumnDragConfig<T extends DraggableItem> extends DragDropConfig<T> {
  /**
   * Whether columns themselves can be reordered
   */
  allowColumnReorder?: boolean;

  /**
   * Callback when column order changes
   */
  onColumnReorder?: (columnIds: string[]) => void;

  /**
   * Storage key for persisting column order
   */
  columnOrderStorageKey?: string;
}

/**
 * Nested/hierarchical drag-and-drop configuration (for menus, trees)
 */
export interface NestedDragConfig<T extends DraggableItem> extends DragDropConfig<T> {
  /**
   * Maximum nesting depth allowed (0 = flat list)
   */
  maxDepth?: number;

  /**
   * Whether items can change parent during drag
   */
  allowReparenting?: boolean;

  /**
   * Callback to get children of an item
   */
  getChildren?: (item: T) => T[];

  /**
   * Callback to flatten nested structure for reordering
   */
  flattenItems?: (items: T[]) => T[];
}
