"use client";

/**
 * ChallengeModal Component (PRD-54)
 *
 * Modal for creating a new challenge.
 * Includes friend selection, period selection, and optional message.
 *
 * Design System:
 * - Uses Dialog component from shadcn/ui
 * - Mobile-first layout
 * - Supports challenge templates (P-1)
 */

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FriendSelector } from "./FriendSelector";
import { ShareDateRangePicker } from "@/components/sharing/ShareDateRangePicker";
import {
    CHALLENGE_TEMPLATES,
    applyTemplate,
    formatTemplateDuration,
} from "@/lib/challenges";
import { formatCustomPeriodLabel, calculateDaysBetween } from "@/lib/utils/periods";
import { METRIC_CONFIGS } from "@/lib/sharing/metricConfig";
import type { MetricType } from "@/lib/sharing/metricConfig";
import { analytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface Member {
    id: string;
    display_name: string;
    avatar_url?: string | null;
    league_id?: string;
    league_name?: string;
}

interface ChallengeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
        target_id: string;
        metric_type: MetricType;
        period_start: string;
        period_end: string;
        message?: string;
        template_id?: string;
    }) => Promise<void>;
    members: Member[];
    currentUserId: string;
    excludeUserIds?: string[];
    defaultTargetId?: string;
}

export function ChallengeModal({
    isOpen,
    onClose,
    onSubmit,
    members,
    currentUserId,
    excludeUserIds = [],
    defaultTargetId,
}: ChallengeModalProps) {
    // Form state
    const [targetId, setTargetId] = useState<string | null>(defaultTargetId || null);
    const [metricType, setMetricType] = useState<MetricType>("steps");
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>("week_sprint");
    const [customRange, setCustomRange] = useState<{ start: string; end: string } | null>(null);
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [periodMode, setPeriodMode] = useState<"template" | "custom">("template");

    // Calculate dates based on selection - normalizes to {period_start, period_end}
    const getPeriodDates = (): { period_start: string; period_end: string } | null => {
        if (periodMode === "custom" && customRange) {
            return { period_start: customRange.start, period_end: customRange.end };
        }
        if (selectedTemplate) {
            return applyTemplate(selectedTemplate);
        }
        return null;
    };

    const periodDates = getPeriodDates();
    const periodLabel = periodDates
        ? formatCustomPeriodLabel(
            new Date(periodDates.period_start + "T00:00:00"),
            new Date(periodDates.period_end + "T00:00:00")
        )
        : null;
    const durationDays = periodDates
        ? calculateDaysBetween(periodDates.period_start, periodDates.period_end)
        : 0;

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setTargetId(defaultTargetId || null);
            setMetricType("steps");
            setSelectedTemplate("week_sprint");
            setCustomRange(null);
            setMessage("");
            setPeriodMode("template");
        }
    }, [isOpen, defaultTargetId]);

    // Handle template selection
    const handleTemplateSelect = (templateId: string) => {
        setSelectedTemplate(templateId);
        const template = CHALLENGE_TEMPLATES.find((t) => t.id === templateId);
        if (template) {
            analytics.challenges.templateSelected(templateId, template.name);
        }
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (!targetId || !periodDates) return;

        setIsSubmitting(true);
        try {
            await onSubmit({
                target_id: targetId,
                metric_type: metricType,
                period_start: periodDates.period_start,
                period_end: periodDates.period_end,
                message: message.trim() || undefined,
                template_id: periodMode === "template" ? selectedTemplate || undefined : undefined,
            });

            analytics.challenges.created(
                targetId,
                metricType,
                durationDays,
                periodMode === "template" ? selectedTemplate || undefined : undefined
            );

            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedMember = members.find((m) => m.id === targetId);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Challenge</DialogTitle>
                    <DialogDescription>
                        Challenge a friend to a step competition. They'll need to accept before it starts.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Opponent Selection */}
                    <div className="space-y-2">
                        <Label>Challenge</Label>
                        <FriendSelector
                            members={members}
                            selectedId={targetId}
                            onSelect={(m) => setTargetId(m?.id || null)}
                            currentUserId={currentUserId}
                            excludeIds={excludeUserIds}
                            placeholder="Select opponent..."
                        />
                    </div>

                    {/* Metric Type Selection */}
                    <div className="space-y-2">
                        <Label>Metric</Label>
                        <div className="flex flex-wrap gap-2">
                            {(["steps", "calories", "distance"] as MetricType[]).map((type) => {
                                const config = METRIC_CONFIGS[type];
                                return (
                                    <Button
                                        key={type}
                                        type="button"
                                        variant={metricType === type ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setMetricType(type)}
                                    >
                                        {config.emoji} {config.displayName}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Period Selection */}
                    <div className="space-y-2">
                        <Label>Duration</Label>
                        <Tabs value={periodMode} onValueChange={(v) => setPeriodMode(v as "template" | "custom")}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="template">Quick Select</TabsTrigger>
                                <TabsTrigger value="custom">Custom Dates</TabsTrigger>
                            </TabsList>

                            <TabsContent value="template" className="mt-2">
                                <div className="grid grid-cols-2 gap-2">
                                    {CHALLENGE_TEMPLATES.map((template) => (
                                        <Button
                                            key={template.id}
                                            type="button"
                                            variant={selectedTemplate === template.id ? "default" : "outline"}
                                            size="sm"
                                            className={cn(
                                                "h-auto py-2 px-3 justify-start",
                                                selectedTemplate === template.id && "ring-2 ring-primary"
                                            )}
                                            onClick={() => handleTemplateSelect(template.id)}
                                        >
                                            <div className="text-left">
                                                <div className="flex items-center gap-1">
                                                    <span>{template.emoji}</span>
                                                    <span className="font-medium text-sm">{template.name}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {formatTemplateDuration(template.duration_days)}
                                                </p>
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="custom" className="mt-2">
                                <ShareDateRangePicker
                                    value={customRange}
                                    onChange={(range) => setCustomRange(range)}
                                    showShortcuts={false}
                                    compact
                                />
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Preview period */}
                    {periodLabel && (
                        <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded-lg">
                            <strong>Challenge period:</strong> {periodLabel}
                            <br />
                            <span className="text-xs">
                                ({durationDays} {durationDays === 1 ? "day" : "days"})
                            </span>
                        </div>
                    )}

                    {/* Optional Message */}
                    <div className="space-y-2">
                        <Label htmlFor="message">Message (optional)</Label>
                        <Textarea
                            id="message"
                            placeholder="Add a message for your opponent..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            maxLength={500}
                            rows={2}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {message.length}/500
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!targetId || !periodDates || isSubmitting}
                    >
                        {isSubmitting ? "Sending..." : `Challenge ${selectedMember?.display_name || "Opponent"}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
