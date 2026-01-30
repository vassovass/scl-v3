"use client";

import { useState, useMemo, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useShare, type SharePlatform } from "@/hooks/useShare";
import { ShareContentPickerInline } from "./ShareContentPicker";
import {
    type ShareContentBlock,
    type ShareMessageData,
    type ShareContext,
    getDefaultBlocks,
} from "@/lib/sharing/shareContentConfig";
import {
    buildShareMessage,
    isOptimalLength,
} from "@/lib/sharing/shareMessageBuilder";
import { APP_CONFIG } from "@/lib/config";
import { analytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface SharePromptDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback when dialog should close */
    onOpenChange: (open: boolean) => void;
    /** Data to share */
    data: ShareMessageData;
    /** Context for smart defaults */
    context?: ShareContext;
    /** Title shown in dialog */
    title?: string;
    /** Description shown below title */
    description?: string;
    /** Celebration emoji */
    emoji?: string;
    /** Callback after successful share */
    onShare?: (platform: string) => void;
    /** Callback when dismissed */
    onDismiss?: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * SharePromptDialog
 *
 * A reusable dialog for sharing achievements with customizable content.
 * Uses shadcn Dialog component and integrates with the share content system.
 *
 * Features:
 * - Customizable content blocks (total, average, date range, etc.)
 * - Live message preview with character count
 * - WhatsApp-first with fallback options
 * - Uses useShare hook for proper analytics tracking
 * - Toast notifications for feedback
 */
export function SharePromptDialog({
    open,
    onOpenChange,
    data,
    context = "batch_submission",
    title = "Submission Complete!",
    description,
    emoji = "🎉",
    onShare,
    onDismiss,
}: SharePromptDialogProps) {
    const { toast } = useToast();

    // Use the share hook with analytics
    const { share, isSharing, copied } = useShare({
        contentType: "submission",
        itemId: context,
        onShare: (platform) => {
            toast({
                title: "Shared!",
                description: platform === "copy" ? "Message copied to clipboard" : `Opening ${platform}...`,
            });
        },
        onError: () => {
            toast({
                title: "Share failed",
                description: "Please try again",
                variant: "destructive",
            });
        },
    });

    // Initialize with context-appropriate defaults
    const defaultBlocks = useMemo(() => getDefaultBlocks(context), [context]);
    const [selectedBlocks, setSelectedBlocks] =
        useState<ShareContentBlock[]>(defaultBlocks);
    const [showCustomize, setShowCustomize] = useState(false);

    // Build the share message
    const messageResult = useMemo(() => {
        return buildShareMessage(selectedBlocks, data);
    }, [selectedBlocks, data]);

    // Check message length status
    const lengthStatus = useMemo(() => {
        return isOptimalLength(messageResult.length, "whatsapp");
    }, [messageResult.length]);

    // Format stats for display
    const statsDisplay = useMemo(() => {
        const parts: string[] = [];

        if (data.totalSteps !== undefined) {
            parts.push(`${data.totalSteps.toLocaleString()} steps`);
        }

        if (data.dayCount !== undefined) {
            parts.push(
                `${data.dayCount} day${data.dayCount !== 1 ? "s" : ""}`
            );
        }

        return parts.join(" across ");
    }, [data]);

    // Format date range
    const dateRangeDisplay = useMemo(() => {
        if (!data.startDate || !data.endDate) return null;

        const formatDate = (dateStr: string, includeYear = false) => {
            const date = new Date(dateStr);
            const options: Intl.DateTimeFormatOptions = {
                day: "numeric",
                month: "short",
                ...(includeYear && { year: "numeric" }),
            };
            return date.toLocaleDateString("en-GB", options);
        };

        if (data.startDate === data.endDate) {
            return formatDate(data.endDate, true);
        }

        return `${formatDate(data.startDate)} - ${formatDate(data.endDate, true)}`;
    }, [data.startDate, data.endDate]);

    // Handle share action using the useShare hook
    const handleShare = useCallback(
        async (platform: SharePlatform) => {
            await share(
                {
                    title: `${APP_CONFIG.name} - ${title}`,
                    text: messageResult.message,
                    url: APP_CONFIG.url,
                },
                platform
            );

            // Track additional analytics for the share funnel
            analytics.shareFunnel.completed(
                platform,
                context,
                data.totalSteps ?? 0
            );

            onShare?.(platform);

            // Close dialog after share (with slight delay for feedback)
            setTimeout(() => onOpenChange(false), 300);
        },
        [share, messageResult.message, title, context, data.totalSteps, onShare, onOpenChange]
    );

    // Handle dismiss
    const handleDismiss = useCallback(() => {
        analytics.shareFunnel.promptDismissed(context);
        onDismiss?.();
        onOpenChange(false);
    }, [context, onDismiss, onOpenChange]);

    // Quick content blocks to show inline
    const quickBlocks: ShareContentBlock[] = [
        "total_steps",
        "day_count",
        "date_range",
        "average",
        "streak",
        "rank",
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                {/* Header with celebration */}
                <div className="text-center pb-2">
                    <span className="text-5xl">{emoji}</span>
                </div>

                <DialogHeader className="text-center">
                    <DialogTitle className="text-xl">{title}</DialogTitle>
                    <DialogDescription>
                        {description || (
                            <>
                                You logged {statsDisplay}!
                                {dateRangeDisplay && (
                                    <>
                                        <br />
                                        <span className="text-xs">
                                            {dateRangeDisplay}
                                            {data.averageSteps !== undefined && (
                                                <> · Avg: {data.averageSteps.toLocaleString()} steps/day</>
                                            )}
                                        </span>
                                    </>
                                )}
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {/* Content Customization (Expandable) */}
                <div className="space-y-3">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between text-muted-foreground"
                        onClick={() => setShowCustomize(!showCustomize)}
                    >
                        <span>Customize what to share</span>
                        <span>{showCustomize ? "▲" : "▼"}</span>
                    </Button>

                    {showCustomize && (
                        <div className="space-y-3 rounded-lg border border-border p-3">
                            <ShareContentPickerInline
                                selectedBlocks={selectedBlocks}
                                onChange={setSelectedBlocks}
                                availableData={data}
                                showOnly={quickBlocks}
                            />

                            {/* Message Preview */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Preview</span>
                                    <span
                                        className={cn(
                                            lengthStatus.status === "long" && "text-warning",
                                            lengthStatus.status === "short" && "text-muted-foreground"
                                        )}
                                    >
                                        {messageResult.length} chars
                                    </span>
                                </div>
                                <div className="rounded-md bg-muted p-3 text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                                    {messageResult.message}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 pt-2">
                    <Button
                        onClick={() => handleShare("whatsapp")}
                        disabled={isSharing}
                        className="w-full bg-[hsl(var(--success))] hover:bg-[hsl(var(--success)/0.9)] text-white"
                        size="lg"
                    >
                        <span className="mr-2">💬</span>
                        {isSharing ? "Sharing..." : "Share on WhatsApp"}
                    </Button>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleShare("copy")}
                            disabled={isSharing}
                        >
                            {copied ? "✓ Copied!" : "📋 Copy"}
                        </Button>
                        <Button
                            variant="ghost"
                            className="flex-1"
                            onClick={handleDismiss}
                        >
                            Maybe Later
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ============================================================================
// Exports
// ============================================================================

export default SharePromptDialog;
