"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type FeedbackType = "bug" | "feature" | "general";

const TYPE_CONFIG: Record<FeedbackType, { label: string; activeClass: string }> = {
    general: { label: "General", activeClass: "bg-primary/20 text-primary" },
    bug: { label: "Bug", activeClass: "bg-destructive/20 text-destructive" },
    feature: { label: "Feature", activeClass: "bg-[hsl(var(--warning)/0.2)] text-[hsl(var(--warning))]" },
};

const PLACEHOLDER_MAP: Record<FeedbackType, string> = {
    bug: "Describe what happened...",
    feature: "What would you like to see?",
    general: "Tell us what you think...",
};

export function FeedbackWidget() {
    const pathname = usePathname();
    const { session } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [type, setType] = useState<FeedbackType>("general");
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [screenshot, setScreenshot] = useState<Blob | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);

    // Reset form when closed after success
    useEffect(() => {
        if (!isOpen && status === "success") {
            setStatus("idle");
            setSubject("");
            setDescription("");
            setType("general");
            setScreenshot(null);
        }
    }, [isOpen, status]);

    const getThemeBackgroundForScreenshot = (): string => {
        try {
            const raw = getComputedStyle(document.documentElement)
                .getPropertyValue("--background")
                .trim();
            if (raw) return `hsl(${raw})`;
        } catch {
            // ignore
        }
        return "#020617";
    };

    const handleCapture = async () => {
        setIsCapturing(true);
        try {
            const html2canvas = (await import("html2canvas")).default;
            const canvas = await html2canvas(document.body, {
                backgroundColor: getThemeBackgroundForScreenshot(),
                ignoreElements: (element) => element.id === "feedback-widget",
                useCORS: true,
                logging: false,
                scale: 1,
            });
            const blob = await new Promise<Blob | null>((resolve) =>
                canvas.toBlob(resolve, "image/png")
            );
            if (blob) setScreenshot(blob);
        } catch (err) {
            console.error("Screenshot failed:", err);
        } finally {
            setIsCapturing(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("submitting");

        try {
            let screenshotDataUrl: string | null = null;
            if (screenshot) {
                screenshotDataUrl = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(screenshot);
                });
            }

            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type,
                    subject: subject || "Quick Feedback",
                    description,
                    page_url: pathname,
                    screenshot: screenshotDataUrl,
                }),
            });

            if (!res.ok) throw new Error("Failed to submit");

            setStatus("success");
            setTimeout(() => setIsOpen(false), 2000);
        } catch (err) {
            setStatus("error");
            console.error(err);
        }
    };

    if (!session) return null;

    return (
        <div id="feedback-widget" className="fixed bottom-6 right-6 z-50">
            {/* Trigger Button */}
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    size="icon"
                    className="h-12 w-12 rounded-full shadow-lg shadow-primary/20 transition hover:scale-105 active:scale-95"
                    title="Send Feedback"
                >
                    <span className="text-xl">💬</span>
                </Button>
            )}

            {/* Form Panel */}
            {isOpen && (
                <div className="w-80 rounded-2xl border border-border bg-popover/95 p-4 shadow-2xl backdrop-blur-md sm:w-96">
                    {/* Header */}
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">Send Feedback</h3>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full"
                            onClick={() => setIsOpen(false)}
                        >
                            ✕
                        </Button>
                    </div>

                    {status === "success" ? (
                        <div className="py-8 text-center">
                            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--success)/0.2)] text-2xl text-[hsl(var(--success))]">
                                ✓
                            </div>
                            <p className="text-[hsl(var(--success))]">Feedback sent!</p>
                            <p className="text-xs text-muted-foreground">Thank you for helping us improve.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-3">
                            {/* Type Selection */}
                            <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
                                {(Object.entries(TYPE_CONFIG) as [FeedbackType, (typeof TYPE_CONFIG)[FeedbackType]][]).map(
                                    ([key, config]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setType(key)}
                                            className={cn(
                                                "flex-1 rounded-md py-1.5 text-xs font-medium transition",
                                                type === key
                                                    ? config.activeClass
                                                    : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            {config.label}
                                        </button>
                                    )
                                )}
                            </div>

                            {/* Subject */}
                            <Input
                                placeholder="Subject (optional)"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                            />

                            {/* Description */}
                            <Textarea
                                required
                                placeholder={PLACEHOLDER_MAP[type]}
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="resize-none"
                            />

                            {/* Screenshot */}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={screenshot ? undefined : handleCapture}
                                disabled={isCapturing}
                                className={cn(
                                    "w-full border-dashed",
                                    screenshot && "border-[hsl(var(--success)/0.5)] bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]"
                                )}
                            >
                                {screenshot ? (
                                    <span className="flex w-full items-center justify-center gap-2">
                                        📷 Attached
                                        <span
                                            role="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setScreenshot(null);
                                            }}
                                            className="ml-auto hover:text-foreground"
                                        >
                                            ✕
                                        </span>
                                    </span>
                                ) : isCapturing ? (
                                    <span className="flex items-center gap-2">
                                        <span className="animate-spin">⏳</span>
                                        Capturing...
                                    </span>
                                ) : (
                                    "📷 Attach Screenshot"
                                )}
                            </Button>

                            {/* Submit */}
                            <Button
                                type="submit"
                                disabled={status === "submitting" || !description}
                                className="w-full"
                            >
                                {status === "submitting" ? "Sending..." : "Send Feedback"}
                            </Button>

                            {status === "error" && (
                                <p className="text-center text-xs text-destructive">
                                    Failed to send. Please try again.
                                </p>
                            )}
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}
