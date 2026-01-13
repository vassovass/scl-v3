"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useFeedback } from "./FeedbackContext";

type FeedbackType = "bug" | "feature" | "general" | "positive" | "negative";

export function FeedbackWidget() {
    const pathname = usePathname();
    const { session } = useAuth();
    const { isOpen, closeFeedback, openFeedback, data, reset } = useFeedback();

    const [type, setType] = useState<FeedbackType>("general");
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [screenshot, setScreenshot] = useState<string | null>(null);

    // Sync context data to local state when opening
    useEffect(() => {
        if (isOpen) {
            if (data.type) setType(data.type);
            if (data.subject) setSubject(data.subject);
            if (data.description) setDescription(data.description);
            if (data.screenshot) setScreenshot(data.screenshot);
        } else {
            // Reset local state on close (after animation delay if we had one)
            if (status === "success" || status === "idle") {
                // Don't reset immediately if we want to preserve state? 
                // Actually standard behavior is fresh form.
                // We rely on context.reset() if needed, but here we just reset local.
                setStatus("idle");
                setSubject("");
                setDescription("");
                setType("general");
                setScreenshot(null);
                reset(); // Reset context data
            }
        }
    }, [isOpen, data, status, reset]);

    const [isCapturing, setIsCapturing] = useState(false);

    const handleCapture = async () => {
        setIsCapturing(true);
        try {
            const html2canvas = (await import("html2canvas")).default;
            const canvas = await html2canvas(document.body, {
                backgroundColor: "#020617", // slate-950
                ignoreElements: (element) => element.id === "feedback-widget",
                useCORS: true, // Crucial for external images (Supabase, etc)
                logging: false, // Reduce console noise
                scale: 1, // Default scale to prevent massive images
            });
            setScreenshot(canvas.toDataURL("image/png"));
        } catch (err) {
            console.error("Screenshot failed:", err);
            // Optional: Show a toast or error state here
        } finally {
            setIsCapturing(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("submitting");

        try {
            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type,
                    subject: subject || "Quick Feedback",
                    description: description + (data.metadata ? `\n\nMetadata:\n${JSON.stringify(data.metadata, null, 2)}` : ""),
                    page_url: window.location.href, // full URL
                    screenshot,
                }),
            });

            if (!res.ok) throw new Error("Failed to submit");

            setStatus("success");
            setTimeout(() => {
                closeFeedback();
            }, 2000);
        } catch (err) {
            setStatus("error");
            console.error(err);
        }
    };

    // If needed: only show for admins or specific users?
    // For now, showing for all authenticated users could be good for beta.
    if (!session) return null;

    if (!isOpen) {
        return (
            <div id="feedback-widget" className="fixed bottom-6 right-6 z-50">
                <button
                    onClick={() => openFeedback()}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-600 text-white shadow-lg shadow-sky-900/20 transition hover:bg-sky-500 hover:scale-105 active:scale-95"
                    title="Send Feedback"
                >
                    <span className="text-xl">💬</span>
                </button>
            </div>
        );
    }

    return (
        <div id="feedback-widget" className="fixed bottom-6 right-6 z-50">
            {/* Form */}
            <div className="w-80 rounded-2xl border border-border bg-popover/95 p-4 shadow-2xl backdrop-blur-md sm:w-96">
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Send Feedback</h3>
                    <button
                        onClick={closeFeedback}
                        className="rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                        ✕
                    </button>
                </div>

                {status === "success" ? (
                    <div className="py-8 text-center">
                        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-2xl text-emerald-400">
                            ✓
                        </div>
                        <p className="text-emerald-400">Feedback sent!</p>
                        <p className="text-xs text-muted-foreground">Thank you for helping us improve.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-3">
                        {/* Type Selection */}
                        <div className="flex gap-2 rounded-lg bg-muted/50 p-1">
                            {(["general", "bug", "feature"] as const).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setType(t)}
                                    className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${type === t
                                        ? t === "bug"
                                            ? "bg-rose-500/20 text-rose-400"
                                            : t === "feature"
                                                ? "bg-amber-500/20 text-[hsl(var(--warning))]"
                                                : "bg-primary/20 text-primary"
                                        : "text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Inputs */}
                        <div>
                            <input
                                type="text"
                                placeholder="Subject (optional)"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <textarea
                                required
                                placeholder={
                                    type === "bug"
                                        ? "Describe what happened..."
                                        : type === "feature"
                                            ? "What would you like to see?"
                                            : "Tell us what you think..."
                                }
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                            />
                        </div>

                        {/* Screenshot Info */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleCapture}
                                disabled={isCapturing}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs transition ${screenshot
                                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                                    : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                                    }`}
                            >
                                {screenshot ? (
                                    <>
                                        <span>📷 Attached</span>
                                        <span
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setScreenshot(null);
                                            }}
                                            className="ml-auto hover:text-emerald-300"
                                        >
                                            ✕
                                        </span>
                                    </>
                                ) : isCapturing ? (
                                    <>
                                        <span className="animate-spin">⏳</span>
                                        <span>Capturing...</span>
                                    </>
                                ) : (
                                    <>📷 Attach Screenshot</>
                                )}
                            </button>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={status === "submitting" || !description}
                            className="w-full rounded-lg bg-sky-600 py-2.5 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
                        >
                            {status === "submitting" ? "Sending..." : "Send Feedback"}
                        </button>

                        {status === "error" && (
                            <p className="text-center text-xs text-rose-400">Failed to send. Please try again.</p>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
}
