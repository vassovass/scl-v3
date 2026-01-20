/**
 * Shared React hooks for drag-and-drop functionality
 */

import { useState, useCallback } from "react";
import { DropResult } from "@hello-pangea/dnd";
import {
  DraggableItem,
  DragDropConfig,
  ColumnDragConfig,
  NestedDragConfig,
} from "./types";
import {
  reorderArray,
  moveItemBetweenArrays,
  shouldIgnoreDrag,
  persistReorder,
  flattenTree,
  buildTree,
} from "./utils";

/**
 * Hook for flat list drag-and-drop (simple reordering)
 * @param initialItems - Initial array of items
 * @param config - Drag-and-drop configuration
 * @returns Items state, handlers, and loading state
 */
export function useFlatDragDrop<T extends DraggableItem>(
  initialItems: T[],
  config: DragDropConfig<T>
) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      if (shouldIgnoreDrag(result)) return;

      const { source, destination } = result;
      if (!destination) return;

      // Reorder items
      const { reorderedItems, movedItem } = reorderArray(
        items,
        source.index,
        destination.index
      );

      // Update local state optimistically
      setItems(reorderedItems);

      // Call custom onDragEnd if provided
      if (config.onDragEnd) {
        await config.onDragEnd(result, reorderedItems);
      }

      // Persist to API if endpoint provided
      if (config.apiEndpoint) {
        setIsUpdating(true);
        try {
          await persistReorder(config.apiEndpoint, reorderedItems);
          config.onSuccess?.();
        } catch (error) {
          console.error("Failed to persist reorder:", error);
          setItems(initialItems); // Revert on error
          config.onError?.(error as Error);
        } finally {
          setIsUpdating(false);
        }
      }
    },
    [items, initialItems, config]
  );

  return {
    items,
    setItems,
    handleDragEnd,
    isUpdating,
  };
}

/**
 * Hook for column-based drag-and-drop (Kanban-style)
 * @param initialColumns - Initial column structure
 * @param config - Column drag configuration
 * @returns Columns state, handlers, and loading state
 */
export function useColumnDragDrop<
  T extends DraggableItem,
  C extends { id: string; items: T[] }
>(initialColumns: C[], config: ColumnDragConfig<T>) {
  const [columns, setColumns] = useState<C[]>(initialColumns);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      if (shouldIgnoreDrag(result)) return;

      const { source, destination, type } = result;
      if (!destination) return;

      // Handle column reordering
      if (type === "COLUMN" && config.allowColumnReorder) {
        const newColumns = Array.from(columns);
        const [movedColumn] = newColumns.splice(source.index, 1);
        newColumns.splice(destination.index, 0, movedColumn);
        setColumns(newColumns);

        // Persist column order if storage key provided
        if (config.columnOrderStorageKey) {
          const orderIds = newColumns.map((c) => c.id);
          localStorage.setItem(
            config.columnOrderStorageKey,
            JSON.stringify(orderIds)
          );
        }

        config.onColumnReorder?.(newColumns.map((c) => c.id));
        return;
      }

      // Handle item reordering within/between columns
      const newColumns = Array.from(columns);
      const sourceCol = newColumns.find((c) => c.id === source.droppableId);
      const destCol = newColumns.find((c) => c.id === destination.droppableId);

      if (!sourceCol || !destCol) return;

      if (sourceCol.id === destCol.id) {
        // Reorder within same column
        const { reorderedItems } = reorderArray(
          sourceCol.items,
          source.index,
          destination.index
        );
        sourceCol.items = reorderedItems;
      } else {
        // Move between columns
        const { source: updatedSource, destination: updatedDest } =
          moveItemBetweenArrays(
            sourceCol.items,
            destCol.items,
            source.index,
            destination.index
          );
        sourceCol.items = updatedSource;
        destCol.items = updatedDest;
      }

      setColumns(newColumns);

      // Call custom onDragEnd
      if (config.onDragEnd) {
        const allItems = newColumns.flatMap((col) => col.items);
        await config.onDragEnd(result, allItems);
      }

      // Persist to API if endpoint provided
      if (config.apiEndpoint) {
        setIsUpdating(true);
        try {
          const allItems = newColumns.flatMap((col) => col.items);
          await persistReorder(config.apiEndpoint, allItems);
          config.onSuccess?.();
        } catch (error) {
          console.error("Failed to persist reorder:", error);
          setColumns(initialColumns); // Revert on error
          config.onError?.(error as Error);
        } finally {
          setIsUpdating(false);
        }
      }
    },
    [columns, initialColumns, config]
  );

  return {
    columns,
    setColumns,
    handleDragEnd,
    isUpdating,
  };
}

/**
 * Hook for nested/hierarchical drag-and-drop (menus, trees)
 * @param initialItems - Initial nested items
 * @param config - Nested drag configuration
 * @returns Items state, handlers, and loading state
 */
export function useNestedDragDrop<T extends DraggableItem & { children?: T[] }>(
  initialItems: T[],
  config: NestedDragConfig<T>
) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      if (shouldIgnoreDrag(result)) return;

      const { source, destination } = result;
      if (!destination) return;

      // Flatten tree for reordering
      const flatItems = config.flattenItems
        ? config.flattenItems(items)
        : flattenTree(items);

      // Reorder flat array
      const { reorderedItems } = reorderArray(
        flatItems,
        source.index,
        destination.index
      );

      // Rebuild tree if needed
      const newItems = config.allowReparenting
        ? buildTree(reorderedItems)
        : items; // If no reparenting, keep structure

      setItems(newItems);

      // Call custom onDragEnd
      if (config.onDragEnd) {
        await config.onDragEnd(result, reorderedItems);
      }

      // Persist to API if endpoint provided
      if (config.apiEndpoint) {
        setIsUpdating(true);
        try {
          await persistReorder(config.apiEndpoint, reorderedItems);
          config.onSuccess?.();
        } catch (error) {
          console.error("Failed to persist reorder:", error);
          setItems(initialItems); // Revert on error
          config.onError?.(error as Error);
        } finally {
          setIsUpdating(false);
        }
      }
    },
    [items, initialItems, config]
  );

  return {
    items,
    setItems,
    handleDragEnd,
    isUpdating,
  };
}

