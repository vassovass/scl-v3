/**
 * Shared utility functions for drag-and-drop operations
 */

import { DropResult } from "@hello-pangea/dnd";
import { DraggableItem, ReorderResult } from "./types";

/**
 * Reorder items in a flat array after a drag operation
 * @param items - Array of items to reorder
 * @param sourceIndex - Starting position
 * @param destinationIndex - Ending position
 * @returns Reordered array with updated sort_order
 */
export function reorderArray<T extends DraggableItem>(
  items: T[],
  sourceIndex: number,
  destinationIndex: number
): ReorderResult<T> {
  const result = Array.from(items);
  const [movedItem] = result.splice(sourceIndex, 1);
  result.splice(destinationIndex, 0, movedItem);

  // Update sort_order for all items
  const reorderedItems = result.map((item, index) => ({
    ...item,
    sort_order: index,
    priority_order: index, // Support both naming conventions
  }));

  return {
    reorderedItems,
    movedItem,
    sourceIndex,
    destinationIndex,
  };
}

/**
 * Move item between two arrays (for column-based layouts like Kanban)
 * @param source - Source array
 * @param destination - Destination array
 * @param sourceIndex - Starting position in source
 * @param destinationIndex - Ending position in destination
 * @returns Updated source and destination arrays
 */
export function moveItemBetweenArrays<T extends DraggableItem>(
  source: T[],
  destination: T[],
  sourceIndex: number,
  destinationIndex: number
): { source: T[]; destination: T[] } {
  const sourceClone = Array.from(source);
  const destClone = Array.from(destination);
  const [movedItem] = sourceClone.splice(sourceIndex, 1);

  destClone.splice(destinationIndex, 0, movedItem);

  // Update sort_order/priority_order for both arrays
  const updatedSource = sourceClone.map((item, index) => ({
    ...item,
    sort_order: index,
    priority_order: index,
  }));

  const updatedDestination = destClone.map((item, index) => ({
    ...item,
    sort_order: index,
    priority_order: index,
  }));

  return {
    source: updatedSource,
    destination: updatedDestination,
  };
}

/**
 * Flatten a nested tree structure into a flat array (for hierarchical menus)
 * Preserves parent-child relationships via parent_id
 * @param items - Root items with optional children arrays
 * @param parentId - Parent ID for recursion
 * @returns Flat array with parent_id references
 */
export function flattenTree<T extends DraggableItem & { children?: T[] }>(
  items: T[],
  parentId: string | null = null
): Array<T & { parent_id: string | null }> {
  let flat: Array<T & { parent_id: string | null }> = [];

  items.forEach((item) => {
    const { children, ...itemWithoutChildren } = item;
    flat.push({ ...itemWithoutChildren, parent_id: parentId } as T & {
      parent_id: string | null;
    });

    if (children && children.length > 0) {
      flat = flat.concat(flattenTree(children, item.id));
    }
  });

  return flat;
}

/**
 * Build a nested tree from a flat array using parent_id references
 * @param items - Flat array with parent_id references
 * @returns Nested tree structure
 */
export function buildTree<T extends DraggableItem>(items: T[]): T[] {
  const itemsMap = new Map<string, T & { children: T[] }>();

  // Create map with children arrays
  items.forEach((item) => {
    itemsMap.set(item.id, { ...item, children: [] });
  });

  const rootItems: T[] = [];

  // Build parent-child relationships
  itemsMap.forEach((item) => {
    if (item.parent_id !== null && item.parent_id !== undefined) {
      const parent = itemsMap.get(item.parent_id);
      if (parent) {
        parent.children.push(item);
      }
    } else {
      rootItems.push(item);
    }
  });

  return rootItems;
}

/**
 * Check if drag operation should be ignored
 * @param result - DropResult from @hello-pangea/dnd
 * @returns true if should be ignored
 */
export function shouldIgnoreDrag(result: DropResult): boolean {
  const { source, destination } = result;

  // No destination
  if (!destination) return true;

  // Same position
  if (
    source.droppableId === destination.droppableId &&
    source.index === destination.index
  ) {
    return true;
  }

  return false;
}

/**
 * Get visual class names based on drag state
 * @param isDragging - Whether item is being dragged
 * @param isDragOver - Whether drop zone has item hovering
 * @param baseClasses - Base CSS classes
 * @param draggingClasses - Classes to add when dragging
 * @param dragOverClasses - Classes to add when drag over
 * @returns Combined class string
 */
export function getDragClassName(
  isDragging: boolean,
  isDragOver: boolean,
  baseClasses: string,
  draggingClasses: string,
  dragOverClasses: string
): string {
  const classes = [baseClasses];
  if (isDragging) classes.push(draggingClasses);
  if (isDragOver) classes.push(dragOverClasses);
  return classes.join(" ");
}

/**
 * Persist reordered items to API endpoint
 * @param endpoint - API endpoint URL
 * @param items - Reordered items with updated sort_order
 * @param method - HTTP method (default: PUT)
 * @returns API response
 */
export async function persistReorder<T extends DraggableItem>(
  endpoint: string,
  items: T[],
  method: "PUT" | "PATCH" = "PUT"
): Promise<Response> {
  const response = await fetch(endpoint, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });

  if (!response.ok) {
    throw new Error(`Failed to persist reorder: ${response.statusText}`);
  }

  return response;
}

/**
 * Calculate depth/level of an item in a tree structure
 * @param itemId - Item ID to find
 * @param items - Tree items
 * @param currentDepth - Current recursion depth
 * @returns Depth level (0 = root)
 */
export function getItemDepth<T extends DraggableItem & { children?: T[] }>(
  itemId: string,
  items: T[],
  currentDepth: number = 0
): number {
  for (const item of items) {
    if (item.id === itemId) return currentDepth;
    if (item.children) {
      const depth = getItemDepth(itemId, item.children, currentDepth + 1);
      if (depth !== -1) return depth;
    }
  }
  return -1;
}
