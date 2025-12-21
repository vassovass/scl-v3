"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";

export function NavHeader() {
    const { user, session, signOut } = useAuth();
    const pathname = usePathname();
    const [isSuperadmin, setIsSuperadmin] = useState(false);
    const [signingOut, setSigningOut] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navRef = useRef<HTMLDivElement>(null);

    // Extract league ID from path if on a league page
    const leagueMatch = pathname.match(/\/league\/([^/]+)/);
    const currentLeagueId = leagueMatch?.[1];

    useEffect(() => {
        if (!user) {
            setIsSuperadmin(false);
            return;
        }

        const supabase = createClient();
        supabase
            .from("users")
            .select("is_superadmin")
            .eq("id", user.id)
            .single()
            .then(({ data }) => {
                setIsSuperadmin(data?.is_superadmin ?? false);
            });
    }, [user]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (navRef.current && !navRef.current.contains(e.target as Node)) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
        setOpenDropdown(null);
    }, [pathname]);

    const handleSignOut = async () => {
        setSigningOut(true);
        setOpenDropdown(null);
        setMobileMenuOpen(false);
        await signOut();
    };

    const toggleDropdown = (name: string) => {
        setOpenDropdown(openDropdown === name ? null : name);
    };

    const isActive = (path: string) => pathname === path;
    const isActivePrefix = (prefix: string) => pathname.startsWith(prefix);

    const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";

    return (
        <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur-sm">
            <nav ref={navRef} className="mx-auto flex max-w-6xl items-center justify-between px-4 h-14">
                {/* Logo */}
                <Link href="/dashboard" className="flex items-center gap-2">
                    <span className="text-xl">👟</span>
                    <span className="text-lg font-bold text-slate-50 transition hover:text-sky-400">
                        Step<span className="text-sky-500">League</span>
                    </span>
                </Link>

                {/* Mobile hamburger button */}
                {session && (
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-800"
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>
                )}

                {/* Desktop Navigation */}
                {session && (
                    <div className="hidden md:flex items-center gap-1">
                        {/* Dashboard */}
                        <Link
                            href="/dashboard"
                            className={`px-3 py-2 text-sm rounded-lg transition ${isActive("/dashboard")
                                ? "bg-sky-600/20 text-sky-400"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                                }`}
                        >
                            Dashboard
                        </Link>

                        {/* League Dropdown - only show when in a league */}
                        {currentLeagueId && (
                            <div className="relative">
                                <button
                                    onClick={() => toggleDropdown("league")}
                                    className={`px-3 py-2 text-sm rounded-lg transition flex items-center gap-1 ${isActivePrefix(`/league/${currentLeagueId}`)
                                        ? "bg-sky-600/20 text-sky-400"
                                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                                        }`}
                                >
                                    League <span className="text-[10px]">▼</span>
                                </button>

                                {openDropdown === "league" && (
                                    <div className="absolute left-0 mt-1 w-48 rounded-lg border border-slate-700 bg-slate-900 shadow-xl py-1 z-50">
                                        <Link
                                            href={`/league/${currentLeagueId}`}
                                            onClick={() => setOpenDropdown(null)}
                                            className={`block px-4 py-2.5 text-sm transition ${isActive(`/league/${currentLeagueId}`)
                                                ? "bg-sky-600/20 text-sky-400"
                                                : "text-slate-300 hover:bg-slate-800"
                                                }`}
                                        >
                                            📝 Submit Steps
                                        </Link>
                                        <Link
                                            href={`/league/${currentLeagueId}/leaderboard`}
                                            onClick={() => setOpenDropdown(null)}
                                            className={`block px-4 py-2.5 text-sm transition ${isActive(`/league/${currentLeagueId}/leaderboard`)
                                                ? "bg-sky-600/20 text-sky-400"
                                                : "text-slate-300 hover:bg-slate-800"
                                                }`}
                                        >
                                            🏆 Leaderboard
                                        </Link>
                                        <Link
                                            href={`/league/${currentLeagueId}/analytics`}
                                            onClick={() => setOpenDropdown(null)}
                                            className={`block px-4 py-2.5 text-sm transition ${isActive(`/league/${currentLeagueId}/analytics`)
                                                ? "bg-sky-600/20 text-sky-400"
                                                : "text-slate-300 hover:bg-slate-800"
                                                }`}
                                        >
                                            📊 Analytics
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Create/Join */}
                        <div className="relative">
                            <button
                                onClick={() => toggleDropdown("actions")}
                                className={`px-3 py-2 text-sm rounded-lg transition flex items-center gap-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800`}
                            >
                                Actions <span className="text-[10px]">▼</span>
                            </button>

                            {openDropdown === "actions" && (
                                <div className="absolute left-0 mt-1 w-44 rounded-lg border border-slate-700 bg-slate-900 shadow-xl py-1 z-50">
                                    <Link
                                        href="/league/create"
                                        onClick={() => setOpenDropdown(null)}
                                        className="block px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800"
                                    >
                                        ➕ Create League
                                    </Link>
                                    <Link
                                        href="/join"
                                        onClick={() => setOpenDropdown(null)}
                                        className="block px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800"
                                    >
                                        🔗 Join League
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Admin (SuperAdmin only) */}
                        {isSuperadmin && (
                            <Link
                                href="/admin"
                                className={`px-3 py-2 text-sm rounded-lg transition ${isActive("/admin")
                                    ? "bg-amber-600/20 text-amber-400"
                                    : "text-amber-500/70 hover:text-amber-400 hover:bg-amber-900/20"
                                    }`}
                            >
                                Admin
                            </Link>
                        )}

                        {/* User Menu */}
                        <div className="relative ml-2">
                            <button
                                onClick={() => toggleDropdown("user")}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800 transition"
                            >
                                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-white text-sm font-medium">
                                    {displayName[0].toUpperCase()}
                                </span>
                                <span className="text-[10px] text-slate-500">▼</span>
                            </button>

                            {openDropdown === "user" && (
                                <div className="absolute right-0 mt-1 w-52 rounded-lg border border-slate-700 bg-slate-900 shadow-xl py-1 z-50">
                                    <div className="px-4 py-3 border-b border-slate-800">
                                        <div className="text-sm font-medium text-slate-200">{displayName}</div>
                                        <div className="text-xs text-slate-500 truncate">{user?.email}</div>
                                    </div>

                                    <Link
                                        href="/settings/profile"
                                        onClick={() => setOpenDropdown(null)}
                                        className="block px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800"
                                    >
                                        ⚙️ Profile Settings
                                    </Link>
                                    <button
                                        onClick={() => {
                                            setOpenDropdown(null);
                                            // Dispatch custom event to trigger tour
                                            window.dispatchEvent(new CustomEvent('start-onboarding-tour'));
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800"
                                    >
                                        📖 Start Tour
                                    </button>
                                    <Link
                                        href="/feedback"
                                        onClick={() => setOpenDropdown(null)}
                                        className="block px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800"
                                    >
                                        💬 Send Feedback
                                    </Link>

                                    <div className="border-t border-slate-800 mt-1 pt-1">
                                        <Link
                                            href="/beta"
                                            onClick={() => setOpenDropdown(null)}
                                            className="block px-4 py-2 text-xs text-slate-500 hover:bg-slate-800"
                                        >
                                            📋 Beta Info
                                        </Link>
                                        <Link
                                            href="/privacy"
                                            onClick={() => setOpenDropdown(null)}
                                            className="block px-4 py-2 text-xs text-slate-500 hover:bg-slate-800"
                                        >
                                            🔒 Privacy Policy
                                        </Link>
                                    </div>

                                    <div className="border-t border-slate-800 mt-1 pt-1">
                                        <button
                                            onClick={handleSignOut}
                                            disabled={signingOut}
                                            className="w-full text-left px-4 py-2.5 text-sm text-rose-400 hover:bg-slate-800 disabled:opacity-50"
                                        >
                                            {signingOut ? "Signing out..." : "🚪 Sign Out"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {!session && (
                    <Link
                        href="/sign-in"
                        className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
                    >
                        Sign in
                    </Link>
                )}
            </nav>

            {/* Mobile Menu Drawer */}
            {session && mobileMenuOpen && (
                <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 py-4 space-y-2">
                    <Link
                        href="/dashboard"
                        className={`block px-4 py-3 rounded-lg text-sm ${isActive("/dashboard") ? "bg-sky-600/20 text-sky-400" : "text-slate-300 hover:bg-slate-800"
                            }`}
                    >
                        📊 Dashboard
                    </Link>

                    {currentLeagueId && (
                        <>
                            <div className="pt-2 pb-1 px-4 text-xs text-slate-500 uppercase">Current League</div>
                            <Link
                                href={`/league/${currentLeagueId}`}
                                className="block px-4 py-3 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
                            >
                                📝 Submit Steps
                            </Link>
                            <Link
                                href={`/league/${currentLeagueId}/leaderboard`}
                                className="block px-4 py-3 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
                            >
                                🏆 Leaderboard
                            </Link>
                            <Link
                                href={`/league/${currentLeagueId}/analytics`}
                                className="block px-4 py-3 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
                            >
                                📊 Analytics
                            </Link>
                        </>
                    )}

                    <div className="pt-2 pb-1 px-4 text-xs text-slate-500 uppercase">Actions</div>
                    <Link href="/league/create" className="block px-4 py-3 rounded-lg text-sm text-slate-300 hover:bg-slate-800">
                        ➕ Create League
                    </Link>
                    <Link href="/join" className="block px-4 py-3 rounded-lg text-sm text-slate-300 hover:bg-slate-800">
                        🔗 Join League
                    </Link>

                    <div className="pt-2 pb-1 px-4 text-xs text-slate-500 uppercase">Account</div>
                    <Link href="/settings/profile" className="block px-4 py-3 rounded-lg text-sm text-slate-300 hover:bg-slate-800">
                        ⚙️ Profile Settings
                    </Link>
                    <Link href="/feedback" className="block px-4 py-3 rounded-lg text-sm text-slate-300 hover:bg-slate-800">
                        💬 Send Feedback
                    </Link>

                    <div className="pt-4 border-t border-slate-800">
                        <button
                            onClick={handleSignOut}
                            disabled={signingOut}
                            className="w-full px-4 py-3 rounded-lg text-sm text-rose-400 hover:bg-slate-800 text-left disabled:opacity-50"
                        >
                            {signingOut ? "Signing out..." : "🚪 Sign Out"}
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
}
