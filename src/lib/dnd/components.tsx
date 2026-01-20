/**
 * Shared React components for drag-and-drop functionality
 */

import { ReactNode } from "react";
import {
  Draggable,
  Droppable,
  DraggableProvided,
  DraggableStateSnapshot,
  DroppableProvided,
  DroppableStateSnapshot,
} from "@hello-pangea/dnd";
import { getDragClassName } from "./utils";

interface DroppableContainerProps {
  droppableId: string;
  type?: string;
  direction?: "vertical" | "horizontal";
  children: (
    provided: DroppableProvided,
    snapshot: DroppableStateSnapshot
  ) => ReactNode;
  className?: string;
  dragOverClassName?: string;
}

/**
 * Reusable droppable container with consistent styling
 */
export function DroppableContainer({
  droppableId,
  type = "DEFAULT",
  direction = "vertical",
  children,
  className = "",
  dragOverClassName = "bg-primary/10 border-primary",
}: DroppableContainerProps) {
  return (
    <Droppable droppableId={droppableId} type={type} direction={direction}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={getDragClassName(
            false,
            snapshot.isDraggingOver,
            className,
            "",
            dragOverClassName
          )}
        >
          {children(provided, snapshot)}
        </div>
      )}
    </Droppable>
  );
}

interface DraggableWrapperProps {
  draggableId: string;
  index: number;
  children: (
    provided: DraggableProvided,
    snapshot: DraggableStateSnapshot
  ) => ReactNode;
  isDragDisabled?: boolean;
}

/**
 * Reusable draggable wrapper
 */
export function DraggableWrapper({
  draggableId,
  index,
  children,
  isDragDisabled = false,
}: DraggableWrapperProps) {
  return (
    <Draggable
      draggableId={draggableId}
      index={index}
      isDragDisabled={isDragDisabled}
    >
      {(provided, snapshot) => children(provided, snapshot)}
    </Draggable>
  );
}

interface DragHandleProps {
  provided: DraggableProvided;
  className?: string;
  variant?: "dots" | "bars" | "grip";
}

/**
 * Reusable drag handle with different visual variants
 */
export function DragHandle({
  provided,
  className = "cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground",
  variant = "dots",
}: DragHandleProps) {
  const renderIcon = () => {
    switch (variant) {
      case "dots":
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="4" cy="4" r="1.5" />
            <circle cx="4" cy="8" r="1.5" />
            <circle cx="4" cy="12" r="1.5" />
            <circle cx="12" cy="4" r="1.5" />
            <circle cx="12" cy="8" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
          </svg>
        );
      case "bars":
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="3" y="3" width="10" height="2" rx="1" />
            <rect x="3" y="7" width="10" height="2" rx="1" />
            <rect x="3" y="11" width="10" height="2" rx="1" />
          </svg>
        );
      case "grip":
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="6" cy="4" r="1" />
            <circle cx="10" cy="4" r="1" />
            <circle cx="6" cy="8" r="1" />
            <circle cx="10" cy="8" r="1" />
            <circle cx="6" cy="12" r="1" />
            <circle cx="10" cy="12" r="1" />
          </svg>
        );
    }
  };

  return (
    <div {...provided.dragHandleProps} className={className}>
      {renderIcon()}
    </div>
  );
}

interface DragFeedbackProps {
  isDragging: boolean;
  isSelected?: boolean;
  children: ReactNode;
  draggingClassName?: string;
  selectedClassName?: string;
  defaultClassName?: string;
}

/**
 * Wrapper for visual drag feedback
 */
export function DragFeedback({
  isDragging,
  isSelected = false,
  children,
  draggingClassName = "border-primary bg-primary/10 shadow-lg scale-105",
  selectedClassName = "border-primary ring-1 ring-primary/30",
  defaultClassName = "border-border bg-card",
}: DragFeedbackProps) {
  let className = defaultClassName;
  if (isDragging) className = draggingClassName;
  else if (isSelected) className = selectedClassName;

  return <div className={className}>{children}</div>;
}

interface DepthIndicatorProps {
  depth: number;
  className?: string;
}

/**
 * Visual indicator for nested item depth
 */
export function DepthIndicator({
  depth,
  className = "text-muted-foreground",
}: DepthIndicatorProps) {
  if (depth === 0) return null;

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: depth }).map((_, i) => (
        <span key={i}>└</span>
      ))}
    </div>
  );
}

interface LevelBadgeProps {
  level: number;
  className?: string;
}

/**
 * Badge showing nesting level
 */
export function LevelBadge({
  level,
  className = "px-1.5 py-0.5 bg-muted text-muted-foreground text-xs rounded",
}: LevelBadgeProps) {
  if (level === 0) return null;

  return <span className={className}>Level {level}</span>;
}

interface EmptyDropZoneProps {
  text?: string;
  className?: string;
}

/**
 * Empty state for droppable zones
 */
export function EmptyDropZone({
  text = "Drop items here",
  className = "text-center py-8 text-muted-foreground",
}: EmptyDropZoneProps) {
  return <div className={className}>{text}</div>;
}

