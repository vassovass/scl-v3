"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

type FeedbackType = "bug" | "feature" | "general" | "positive" | "negative";

export function FeedbackWidget() {
    const pathname = usePathname();
    const { session } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [type, setType] = useState<FeedbackType>("general");
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [screenshot, setScreenshot] = useState<string | null>(null);

    // Reset form when closed
    useEffect(() => {
        if (!isOpen) {
            // small delay to allow animation if we had one, but instant is fine for now
            if (status === "success") {
                setStatus("idle");
                setSubject("");
                setDescription("");
                setType("general");
                setScreenshot(null);
            }
        }
    }, [isOpen, status]);

    const handleCapture = async () => {
        try {
            const html2canvas = (await import("html2canvas")).default;
            const canvas = await html2canvas(document.body, {
                backgroundColor: "#020617", // slate-950
                ignoreElements: (element) => element.id === "feedback-widget",
            });
            setScreenshot(canvas.toDataURL("image/png"));
        } catch (err) {
            console.error("Screenshot failed:", err);
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
                    description,
                    page_url: window.location.href, // full URL
                    screenshot,
                }),
            });

            if (!res.ok) throw new Error("Failed to submit");

            setStatus("success");
            setTimeout(() => {
                setIsOpen(false);
            }, 2000);
        } catch (err) {
            setStatus("error");
            console.error(err);
        }
    };

    // If needed: only show for admins or specific users?
    // For now, showing for all authenticated users could be good for beta.
    if (!session) return null;

    return (
        <div id="feedback-widget" className="fixed bottom-6 right-6 z-50">
            {/* Trigger Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-600 text-white shadow-lg shadow-sky-900/20 transition hover:bg-sky-500 hover:scale-105 active:scale-95"
                    title="Send Feedback"
                >
                    <span className="text-xl">💬</span>
                </button>
            )}

            {/* Form */}
            {isOpen && (
                <div className="w-80 rounded-2xl border border-slate-700 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-md sm:w-96">
                    {/* Header */}
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-100">Send Feedback</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
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
                            <p className="text-xs text-slate-400">Thank you for helping us improve.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-3">
                            {/* Type Selection */}
                            <div className="flex gap-2 rounded-lg bg-slate-950/50 p-1">
                                {(["general", "bug", "feature"] as const).map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setType(t)}
                                        className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${type === t
                                                ? t === "bug"
                                                    ? "bg-rose-500/20 text-rose-400"
                                                    : t === "feature"
                                                        ? "bg-amber-500/20 text-amber-400"
                                                        : "bg-sky-500/20 text-sky-400"
                                                : "text-slate-400 hover:text-slate-200"
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
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
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
                                    className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
                                />
                            </div>

                            {/* Screenshot Info */}
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleCapture}
                                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs transition ${screenshot
                                            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                                            : "border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300"
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
            )}
        </div>
    );
}
