"use client";

import { useMemo, useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    type ShareContentBlock,
    type ShareMessageData,
    type ShareContentCategory,
    SHARE_CONTENT_BLOCKS,
    SHARE_CONTENT_CATEGORIES,
    getBlocksGroupedByCategory,
    isBlockAvailable,
    getContentBlockConfig,
} from "@/lib/sharing/shareContentConfig";

// ============================================================================
// Types
// ============================================================================

export interface ShareContentPickerProps {
    /** Currently selected content blocks */
    selectedBlocks: ShareContentBlock[];
    /** Callback when selection changes */
    onChange: (blocks: ShareContentBlock[]) => void;
    /** Data available for sharing (determines which blocks are enabled) */
    availableData: ShareMessageData;
    /** Compact mode for inline use */
    compact?: boolean;
    /** Hide categories with no available blocks */
    hideEmptyCategories?: boolean;
    /** Custom class name */
    className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * ShareContentPicker
 *
 * Allows users to select which content blocks to include in their share message.
 * Blocks are grouped by category (Basic, Detailed, Comparison).
 * Unavailable blocks (missing data) are shown but disabled.
 *
 * Uses shadcn/ui Checkbox and Label components for consistent styling.
 *
 * @example
 * ```tsx
 * <ShareContentPicker
 *   selectedBlocks={['total_steps', 'day_count', 'average']}
 *   onChange={setSelectedBlocks}
 *   availableData={{ totalSteps: 10000, dayCount: 5, averageSteps: 2000 }}
 * />
 * ```
 */
export function ShareContentPicker({
    selectedBlocks,
    onChange,
    availableData,
    compact = false,
    hideEmptyCategories = false,
    className,
}: ShareContentPickerProps) {
    const componentId = useId();

    // Get blocks grouped by category
    const groupedBlocks = useMemo(() => getBlocksGroupedByCategory(), []);

    // Calculate available blocks
    const availableBlocksList = useMemo(() => {
        return Object.keys(SHARE_CONTENT_BLOCKS).filter((block) =>
            isBlockAvailable(block as ShareContentBlock, availableData)
        ) as ShareContentBlock[];
    }, [availableData]);

    // Handle individual block toggle
    const handleBlockChange = (block: ShareContentBlock, checked: boolean) => {
        if (checked) {
            const config = getContentBlockConfig(block);
            const newBlocks = [...selectedBlocks, block];

            // Auto-add required dependencies
            if (config.requires) {
                for (const required of config.requires) {
                    if (!newBlocks.includes(required)) {
                        newBlocks.push(required);
                    }
                }
            }

            onChange(newBlocks);
        } else {
            // Remove block and any blocks that depend on it
            const newBlocks = selectedBlocks.filter((b) => {
                if (b === block) return false;
                const config = getContentBlockConfig(b);
                if (config.requires?.includes(block)) return false;
                return true;
            });
            onChange(newBlocks);
        }
    };

    // Get categories to display
    const categoriesToShow = (
        Object.keys(SHARE_CONTENT_CATEGORIES) as ShareContentCategory[]
    ).filter((category) => {
        if (!hideEmptyCategories) return true;
        const categoryBlocks = groupedBlocks[category].map((b) => b.id);
        return categoryBlocks.some((block) =>
            isBlockAvailable(block, availableData)
        );
    });

    return (
        <div className={cn("space-y-4", className)}>
            {/* Quick Actions */}
            <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                    {selectedBlocks.length} of {availableBlocksList.length} selected
                </span>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => onChange(availableBlocksList)}
                    >
                        Select all
                    </Button>
                    <span className="text-muted-foreground">·</span>
                    <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => onChange([])}
                    >
                        Clear
                    </Button>
                </div>
            </div>

            {/* Category Sections */}
            {categoriesToShow.map((category) => {
                const categoryConfig = SHARE_CONTENT_CATEGORIES[category];
                const blocks = groupedBlocks[category];
                const availableInCategory = blocks.filter((b) =>
                    isBlockAvailable(b.id, availableData)
                );
                const selectedInCategory = blocks.filter((b) =>
                    selectedBlocks.includes(b.id)
                );

                return (
                    <div key={category} className="space-y-3">
                        {/* Category Header */}
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-foreground">
                                {categoryConfig.label}
                            </h4>
                            <span className="text-xs text-muted-foreground">
                                {selectedInCategory.length}/{availableInCategory.length}
                            </span>
                        </div>

                        {/* Block Items */}
                        <div
                            className={cn(
                                "grid gap-2",
                                compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
                            )}
                        >
                            {blocks.map((blockConfig) => {
                                const block = blockConfig.id;
                                const isAvailable = isBlockAvailable(block, availableData);
                                const isSelected = selectedBlocks.includes(block);
                                const checkboxId = `${componentId}-${block}`;

                                return (
                                    <div
                                        key={block}
                                        className={cn(
                                            "flex items-start gap-3 rounded-lg border p-3",
                                            isAvailable
                                                ? isSelected
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border hover:border-primary/50"
                                                : "border-muted bg-muted/30 opacity-60"
                                        )}
                                    >
                                        <Checkbox
                                            id={checkboxId}
                                            checked={isSelected}
                                            onCheckedChange={(checked) =>
                                                handleBlockChange(block, checked === true)
                                            }
                                            disabled={!isAvailable}
                                            className="mt-0.5"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <Label
                                                htmlFor={checkboxId}
                                                className={cn(
                                                    "flex items-center gap-2 cursor-pointer",
                                                    !isAvailable && "cursor-not-allowed"
                                                )}
                                            >
                                                <span>{blockConfig.emoji}</span>
                                                <span>{blockConfig.label}</span>
                                            </Label>
                                            {!compact && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {blockConfig.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ============================================================================
// Inline Variant (Pill Toggles)
// ============================================================================

export interface ShareContentPickerInlineProps {
    selectedBlocks: ShareContentBlock[];
    onChange: (blocks: ShareContentBlock[]) => void;
    availableData: ShareMessageData;
    /** Only show these blocks (for quick selection) */
    showOnly?: ShareContentBlock[];
    className?: string;
}

/**
 * Inline version of ShareContentPicker for quick toggles.
 * Shows blocks as pill-style toggle buttons.
 */
export function ShareContentPickerInline({
    selectedBlocks,
    onChange,
    availableData,
    showOnly,
    className,
}: ShareContentPickerInlineProps) {
    const blocksToShow =
        showOnly ?? (Object.keys(SHARE_CONTENT_BLOCKS) as ShareContentBlock[]);

    const handleToggle = (block: ShareContentBlock) => {
        if (selectedBlocks.includes(block)) {
            onChange(selectedBlocks.filter((b) => b !== block));
        } else {
            onChange([...selectedBlocks, block]);
        }
    };

    return (
        <div className={cn("flex flex-wrap gap-2", className)}>
            {blocksToShow.map((block) => {
                const config = getContentBlockConfig(block);
                const isAvailable = isBlockAvailable(block, availableData);
                const isSelected = selectedBlocks.includes(block);

                return (
                    <Button
                        key={block}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => isAvailable && handleToggle(block)}
                        disabled={!isAvailable}
                        className={cn(
                            "gap-1.5",
                            isSelected && "bg-primary/90"
                        )}
                    >
                        <span>{config.emoji}</span>
                        <span className="hidden sm:inline">{config.label}</span>
                    </Button>
                );
            })}
        </div>
    );
}

// ============================================================================
// Exports
// ============================================================================

export default ShareContentPicker;
