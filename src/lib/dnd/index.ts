/**
 * Centralized drag-and-drop utilities for the application
 *
 * This module provides shared types, hooks, components, and utilities for implementing
 * drag-and-drop functionality using @hello-pangea/dnd across different features:
 *
 * - Flat lists (simple reordering)
 * - Column-based layouts (Kanban boards)
 * - Nested hierarchies (menus, trees)
 *
 * @example Flat list drag-and-drop
 * ```tsx
 * import { useFlatDragDrop, DroppableContainer, DraggableWrapper, DragHandle } from '@/lib/dnd';
 *
 * function MyList() {
 *   const { items, handleDragEnd, isUpdating } = useFlatDragDrop(initialItems, {
 *     apiEndpoint: '/api/items',
 *     onSuccess: () => console.log('Saved!'),
 *   });
 *
 *   return (
 *     <DragDropContext onDragEnd={handleDragEnd}>
 *       <DroppableContainer droppableId="list">
 *         {(provided) => (
 *           <div ref={provided.innerRef} {...provided.droppableProps}>
 *             {items.map((item, index) => (
 *               <DraggableWrapper key={item.id} draggableId={item.id} index={index}>
 *                 {(provided, snapshot) => (
 *                   <div ref={provided.innerRef} {...provided.draggableProps}>
 *                     <DragHandle provided={provided} variant="dots" />
 *                     {item.label}
 *                   </div>
 *                 )}
 *               </DraggableWrapper>
 *             ))}
 *             {provided.placeholder}
 *           </div>
 *         )}
 *       </DroppableContainer>
 *     </DragDropContext>
 *   );
 * }
 * ```
 *
 * @example Column-based drag-and-drop (Kanban)
 * ```tsx
 * import { useColumnDragDrop } from '@/lib/dnd';
 *
 * function KanbanBoard() {
 *   const { columns, handleDragEnd } = useColumnDragDrop(initialColumns, {
 *     allowColumnReorder: true,
 *     columnOrderStorageKey: 'kanban-order',
 *     apiEndpoint: '/api/kanban',
 *   });
 *
 *   // ... render columns with Droppable and Draggable
 * }
 * ```
 *
 * @example Nested drag-and-drop (Menus)
 * ```tsx
 * import { useNestedDragDrop, flattenTree } from '@/lib/dnd';
 *
 * function MenuEditor() {
 *   const { items, handleDragEnd } = useNestedDragDrop(menuItems, {
 *     maxDepth: 3,
 *     allowReparenting: false,
 *     flattenItems: flattenTree,
 *     apiEndpoint: '/api/menus/items',
 *   });
 *
 *   // ... render nested items
 * }
 * ```
 */

// Types
export type {
  DraggableItem,
  DragDropConfig,
  ReorderResult,
  DragVisualConfig,
  ColumnDragConfig,
  NestedDragConfig,
} from "./types";

// Utility functions
export {
  reorderArray,
  moveItemBetweenArrays,
  flattenTree,
  buildTree,
  shouldIgnoreDrag,
  getDragClassName,
  persistReorder,
  getItemDepth,
} from "./utils";

// Hooks
export { useFlatDragDrop, useColumnDragDrop, useNestedDragDrop } from "./hooks";

// Components
export {
  DroppableContainer,
  DraggableWrapper,
  DragHandle,
  DragFeedback,
  DepthIndicator,
  LevelBadge,
  EmptyDropZone,
} from "./components";
