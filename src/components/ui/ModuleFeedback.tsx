"use client";

import React, { useState, useRef, useCallback } from "react";

interface ModuleFeedbackProps {
    moduleId: string;
    moduleName?: string;
    children: React.ReactNode;
    className?: string;
}

type FeedbackType = "positive" | "negative" | null;

/**
 * Wrap any module/section with this component to add inline feedback UI.
 * Renders a compact thumbs up/down pill in the top-right corner.
 */
export function ModuleFeedback({
    moduleId,
    moduleName,
    children,
    className = "",
}: ModuleFeedbackProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [feedbackType, setFeedbackType] = useState<FeedbackType>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [screenshotData, setScreenshotData] = useState<string | null>(null);

    const captureScreenshot = useCallback(async () => {
        if (!containerRef.current) return;

        try {
            // Dynamically import html2canvas to avoid SSR issues
            const html2canvas = (await import("html2canvas")).default;

            const canvas = await html2canvas(containerRef.current, {
                backgroundColor: "#0f172a", // slate-950
                scale: 1,
                logging: false,
                useCORS: true,
            });

            const dataUrl = canvas.toDataURL("image/png");
            setScreenshotData(dataUrl);
        } catch (err) {
            console.error("Screenshot capture failed:", err);
        }
    }, []);

    const handleQuickFeedback = async (type: FeedbackType) => {
        setFeedbackType(type);
        setIsExpanded(true);
    };

    const handleSubmit = async () => {
        if (!feedbackType) return;

        setIsSubmitting(true);

        try {
            const payload = {
                module_id: moduleId,
                module_name: moduleName || moduleId,
                feedback_type: feedbackType,
                comment: comment || null,
                screenshot: screenshotData,
                page_url: typeof window !== "undefined" ? window.location.href : null,
            };

            const res = await fetch("/api/feedback/module", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setSubmitted(true);
                setTimeout(() => {
                    setIsExpanded(false);
                    setSubmitted(false);
                    setComment("");
                    setScreenshotData(null);
                }, 2000);
            }
        } catch (err) {
            console.error("Feedback submission failed:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setIsExpanded(false);
        setFeedbackType(null);
        setComment("");
        setScreenshotData(null);
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {children}

            {/* Feedback Pill - Top Right */}
            <div className="absolute top-2 right-2 z-30">
                {!isExpanded ? (
                    <div className="flex items-center gap-1 rounded-full bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 px-1.5 py-0.5 opacity-40 hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => handleQuickFeedback("positive")}
                            className={`p-1 rounded-full text-xs transition ${feedbackType === "positive"
                                    ? "text-emerald-400 bg-emerald-500/20"
                                    : "text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                                }`}
                            title="This is helpful"
                        >
                            👍
                        </button>
                        <button
                            onClick={() => handleQuickFeedback("negative")}
                            className={`p-1 rounded-full text-xs transition ${feedbackType === "negative"
                                    ? "text-rose-400 bg-rose-500/20"
                                    : "text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                                }`}
                            title="Needs improvement"
                        >
                            👎
                        </button>
                    </div>
                ) : (
                    // Expanded Panel
                    <div className="w-72 rounded-lg bg-slate-900 border border-slate-700 shadow-xl p-3 space-y-3">
                        {submitted ? (
                            <div className="text-center py-4">
                                <span className="text-2xl">✓</span>
                                <p className="mt-1 text-sm text-emerald-400">Thanks for your feedback!</p>
                            </div>
                        ) : (
                            <>
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setFeedbackType("positive")}
                                            className={`px-2 py-1 rounded text-xs transition ${feedbackType === "positive"
                                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500"
                                                    : "bg-slate-800 text-slate-400 border border-slate-700"
                                                }`}
                                        >
                                            👍 Good
                                        </button>
                                        <button
                                            onClick={() => setFeedbackType("negative")}
                                            className={`px-2 py-1 rounded text-xs transition ${feedbackType === "negative"
                                                    ? "bg-rose-500/20 text-rose-400 border border-rose-500"
                                                    : "bg-slate-800 text-slate-400 border border-slate-700"
                                                }`}
                                        >
                                            👎 Needs work
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleClose}
                                        className="text-slate-500 hover:text-slate-300 text-sm"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* Comment Field */}
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Tell us more (optional)..."
                                    rows={2}
                                    className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none resize-none"
                                />

                                {/* Screenshot */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={captureScreenshot}
                                        className="flex-1 rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition"
                                    >
                                        📷 {screenshotData ? "Retake Screenshot" : "Capture Screenshot"}
                                    </button>
                                    {screenshotData && (
                                        <span className="text-xs text-emerald-400">✓ Captured</span>
                                    )}
                                </div>

                                {/* Submit */}
                                <button
                                    onClick={handleSubmit}
                                    disabled={!feedbackType || isSubmitting}
                                    className="w-full rounded bg-sky-600 py-1.5 text-xs font-medium text-white hover:bg-sky-500 disabled:opacity-50 transition"
                                >
                                    {isSubmitting ? "Sending..." : "Submit Feedback"}
                                </button>

                                <p className="text-[10px] text-slate-500 text-center">
                                    {moduleName || moduleId}
                                </p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
