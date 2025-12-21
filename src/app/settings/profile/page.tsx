"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";

interface ProfileData {
    display_name: string;
    nickname: string;
    email: string;
}

export default function ProfileSettingsPage() {
    const { user, session } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const [profile, setProfile] = useState<ProfileData>({
        display_name: "",
        nickname: "",
        email: "",
    });

    useEffect(() => {
        if (!session || !user) return;

        const fetchProfile = async () => {
            try {
                const res = await fetch("/api/profile");
                if (res.ok) {
                    const data = await res.json();
                    setProfile({
                        display_name: data.display_name || "",
                        nickname: data.nickname || "",
                        email: user.email || "",
                    });
                }
            } catch (err) {
                console.error("Failed to fetch profile:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [session, user]);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    display_name: profile.display_name,
                    nickname: profile.nickname,
                }),
            });

            if (res.ok) {
                setMessage({ type: "success", text: "Profile updated successfully!" });
            } else {
                const data = await res.json();
                setMessage({ type: "error", text: data.error || "Failed to save" });
            }
        } catch (err) {
            setMessage({ type: "error", text: "Failed to save profile" });
        } finally {
            setSaving(false);
        }
    };

    if (!user) {
        return (
            <main className="min-h-screen bg-slate-950 flex items-center justify-center">
                <p className="text-slate-400">Please log in to access settings.</p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-950">
            <div className="mx-auto max-w-2xl px-6 py-12">
                <Link href="/dashboard" className="text-sm text-sky-400 hover:text-sky-300">
                    ← Back to Dashboard
                </Link>

                <h1 className="mt-8 text-3xl font-bold text-slate-100">Profile Settings</h1>
                <p className="mt-2 text-slate-400">Customize how you appear in leagues</p>

                {loading ? (
                    <div className="mt-12 text-center text-slate-400">Loading...</div>
                ) : (
                    <div className="mt-8 space-y-6">
                        {/* Email (read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                            <input
                                type="email"
                                value={profile.email}
                                disabled
                                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-slate-400 cursor-not-allowed"
                            />
                            <p className="mt-1 text-xs text-slate-500">Email cannot be changed</p>
                        </div>

                        {/* Display Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Display Name</label>
                            <input
                                type="text"
                                value={profile.display_name}
                                onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 focus:border-sky-500 focus:outline-none"
                                placeholder="Your full name"
                            />
                            <p className="mt-1 text-xs text-slate-500">Used as fallback if no nickname is set</p>
                        </div>

                        {/* Nickname */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Nickname <span className="text-slate-500">(shown in leagues)</span>
                            </label>
                            <input
                                type="text"
                                value={profile.nickname}
                                onChange={(e) => setProfile({ ...profile, nickname: e.target.value })}
                                maxLength={50}
                                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 focus:border-sky-500 focus:outline-none"
                                placeholder="e.g., StepMaster, WalkingChamp"
                            />
                            <p className="mt-1 text-xs text-slate-500">
                                {profile.nickname.length}/50 characters • This is what other league members will see
                            </p>
                        </div>

                        {/* Message */}
                        {message && (
                            <div className={`rounded-lg p-4 ${message.type === "success"
                                    ? "bg-emerald-900/20 border border-emerald-700 text-emerald-400"
                                    : "bg-rose-900/20 border border-rose-700 text-rose-400"
                                }`}>
                                {message.text}
                            </div>
                        )}

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full rounded-lg bg-sky-600 py-3 font-medium text-white hover:bg-sky-500 disabled:opacity-50 transition"
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}
