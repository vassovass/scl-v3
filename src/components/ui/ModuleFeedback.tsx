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
 * Renders a minimal feedback icon that appears on hover.
 */
export function ModuleFeedback({
    moduleId,
    moduleName,
    children,
    className = "",
}: ModuleFeedbackProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [feedbackType, setFeedbackType] = useState<FeedbackType>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [screenshotData, setScreenshotData] = useState<string | null>(null);

    const captureScreenshot = useCallback(async () => {
        if (!containerRef.current) return;

        try {
            const html2canvas = (await import("html2canvas")).default;
            const canvas = await html2canvas(containerRef.current, {
                backgroundColor: "#0f172a",
                scale: 1,
                logging: false,
                useCORS: true,
            });
            setScreenshotData(canvas.toDataURL("image/png"));
        } catch (err) {
            console.error("Screenshot capture failed:", err);
        }
    }, []);

    const handleOpenFeedback = () => {
        setIsExpanded(true);
    };

    const handleSubmit = async () => {
        if (!feedbackType) return;
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/feedback/module", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    module_id: moduleId,
                    module_name: moduleName || moduleId,
                    feedback_type: feedbackType,
                    comment: comment || null,
                    screenshot: screenshotData,
                    page_url: typeof window !== "undefined" ? window.location.href : null,
                }),
            });

            if (res.ok) {
                setSubmitted(true);
                setTimeout(() => {
                    setIsExpanded(false);
                    setSubmitted(false);
                    setFeedbackType(null);
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
        <div
            ref={containerRef}
            className={className}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => !isExpanded && setIsHovered(false)}
        >
            {children}

            {/* Minimal feedback trigger - appears on hover as floating icon */}
            {(isHovered || isExpanded) && (
                <div className="fixed bottom-4 right-4 z-50">
                    {!isExpanded ? (
                        <button
                            onClick={handleOpenFeedback}
                            className="w-10 h-10 rounded-full bg-slate-800/90 backdrop-blur-sm border border-slate-600 shadow-lg flex items-center justify-center text-slate-400 hover:text-sky-400 hover:border-sky-500 transition-all hover:scale-110"
                            title="Send feedback about this section"
                        >
                            💬
                        </button>
                    ) : (
                        <div className="w-80 rounded-xl bg-slate-900/95 backdrop-blur-sm border border-slate-700 shadow-2xl p-4 space-y-3">
                            {submitted ? (
                                <div className="text-center py-6">
                                    <span className="text-3xl">✓</span>
                                    <p className="mt-2 text-sm text-emerald-400">Thanks for your feedback!</p>
                                </div>
                            ) : (
                                <>
                                    {/* Header */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-200">Quick Feedback</span>
                                        <button
                                            onClick={handleClose}
                                            className="w-6 h-6 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-300"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    {/* Feedback Type Selection */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setFeedbackType("positive")}
                                            className={`flex-1 py-2 rounded-lg text-sm transition ${feedbackType === "positive"
                                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500"
                                                    : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600"
                                                }`}
                                        >
                                            👍 Good
                                        </button>
                                        <button
                                            onClick={() => setFeedbackType("negative")}
                                            className={`flex-1 py-2 rounded-lg text-sm transition ${feedbackType === "negative"
                                                    ? "bg-rose-500/20 text-rose-400 border border-rose-500"
                                                    : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600"
                                                }`}
                                        >
                                            👎 Needs work
                                        </button>
                                    </div>

                                    {/* Comment Field */}
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Tell us more (optional)..."
                                        rows={2}
                                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none resize-none"
                                    />

                                    {/* Screenshot */}
                                    <button
                                        onClick={captureScreenshot}
                                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition flex items-center justify-center gap-2"
                                    >
                                        📷 {screenshotData ? "Screenshot captured ✓" : "Capture screenshot"}
                                    </button>

                                    {/* Submit */}
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!feedbackType || isSubmitting}
                                        className="w-full rounded-lg bg-sky-600 py-2.5 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50 transition"
                                    >
                                        {isSubmitting ? "Sending..." : "Submit Feedback"}
                                    </button>

                                    <p className="text-[10px] text-slate-500 text-center">
                                        About: {moduleName || moduleId}
                                    </p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
