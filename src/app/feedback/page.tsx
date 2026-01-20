"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";

interface FeedbackFormData {
    type: "bug" | "feature" | "general";
    subject: string;
    description: string;
    screenshot: File | null;
    email: string;
}

export default function FeedbackPage() {
    const { session } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState<FeedbackFormData>({
        type: "general",
        subject: "",
        description: "",
        screenshot: null,
        email: session?.user?.email || "",
    });
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setForm({ ...form, screenshot: file });
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("submitting");
        setErrorMsg("");

        try {
            // Convert file to base64 if exists
            let screenshotData: string | null = null;
            if (form.screenshot) {
                const reader = new FileReader();
                screenshotData = await new Promise((resolve) => {
                    reader.onload = (e) => resolve(e.target?.result as string);
                    reader.readAsDataURL(form.screenshot!);
                });
            }

            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: form.type,
                    subject: form.subject,
                    description: form.description,
                    email: form.email,
                    screenshot: screenshotData,
                    page_url: window.location.href,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to submit feedback");
            }

            setStatus("success");
            setForm({ type: "general", subject: "", description: "", screenshot: null, email: form.email });
            setPreviewUrl(null);
        } catch (err) {
            setStatus("error");
            setErrorMsg(err instanceof Error ? err.message : "Failed to submit");
        }
    };

    return (
        <main className="min-h-screen bg-slate-950 text-slate-300">
            <div className="mx-auto max-w-2xl px-6 py-12">
                <Link href="/" className="text-sm text-sky-400 hover:text-sky-300">← Back to Home</Link>

                <h1 className="mt-8 text-3xl font-bold text-slate-100">Send Feedback</h1>
                <p className="mt-2 text-slate-400">
                    Help us improve! Report bugs, suggest features, or share your thoughts.
                </p>

                {status === "success" ? (
                    <div className="mt-8 rounded-xl border border-emerald-600/30 bg-emerald-900/20 p-8 text-center">
                        <span className="text-4xl">✓</span>
                        <h2 className="mt-4 text-xl font-semibold text-emerald-400">Thank you!</h2>
                        <p className="mt-2 text-emerald-200/80">Your feedback has been submitted successfully.</p>
                        <button
                            onClick={() => setStatus("idle")}
                            className="mt-6 rounded-lg bg-slate-800 px-6 py-2 text-sm hover:bg-slate-700"
                        >
                            Submit another
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        {/* Feedback Type */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                            <div className="flex gap-3">
                                {(["bug", "feature", "general"] as const).map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setForm({ ...form, type: t })}
                                        className={`px-4 py-2 rounded-lg text-sm transition ${form.type === t
                                            ? t === "bug"
                                                ? "bg-rose-600/20 text-rose-400 border border-rose-600"
                                                : t === "feature"
                                                    ? "bg-sky-600/20 text-sky-400 border border-sky-600"
                                                    : "bg-slate-600/20 text-slate-300 border border-slate-600"
                                            : "bg-slate-800 text-slate-400 border border-slate-700"
                                            }`}
                                    >
                                        {t === "bug" ? "🐛 Bug" : t === "feature" ? "💡 Feature" : "💬 General"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Email <span className="text-slate-500">(for follow-up)</span>
                            </label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                                placeholder="your@email.com"
                            />
                        </div>

                        {/* Subject */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Subject *</label>
                            <input
                                type="text"
                                required
                                value={form.subject}
                                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                                placeholder="Brief summary of your feedback"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Description *</label>
                            <textarea
                                required
                                rows={5}
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-slate-100 focus:border-sky-500 focus:outline-none resize-none"
                                placeholder={
                                    form.type === "bug"
                                        ? "What happened? What did you expect? Steps to reproduce..."
                                        : form.type === "feature"
                                            ? "Describe the feature and why it would be helpful..."
                                            : "Share your thoughts..."
                                }
                            />
                        </div>

                        {/* Screenshot Upload */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Screenshot <span className="text-slate-500">(optional)</span>
                            </label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center cursor-pointer hover:border-slate-600 transition"
                            >
                                {previewUrl ? (
                                    <div className="relative">
                                        <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setForm({ ...form, screenshot: null });
                                                setPreviewUrl(null);
                                            }}
                                            className="absolute top-2 right-2 bg-slate-900/80 rounded-full p-1 hover:bg-slate-800"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="text-3xl">📷</span>
                                        <p className="mt-2 text-sm text-slate-400">Click to upload a screenshot</p>
                                        <p className="text-xs text-slate-500">PNG, JPG up to 5MB</p>
                                    </>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleScreenshotChange}
                                className="hidden"
                            />
                        </div>

                        {/* Error Message */}
                        {status === "error" && (
                            <div className="rounded-lg border border-rose-800 bg-rose-900/20 p-4 text-rose-400">
                                {errorMsg}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={status === "submitting"}
                            className="w-full rounded-lg bg-sky-600 py-3 font-medium text-white hover:bg-sky-500 disabled:opacity-50 transition"
                        >
                            {status === "submitting" ? "Submitting..." : "Submit Feedback"}
                        </button>
                    </form>
                )}
            </div>
        </main>
    );
}

