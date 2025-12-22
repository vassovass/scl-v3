"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import {
    LEAGUE_MENU_ITEMS,
    ACTIONS_MENU_ITEMS,
    SUPERADMIN_PAGES,
    USER_MENU_SECTIONS,
    NavItem
} from "@/lib/navigation";
import { NavDropdown } from "./NavDropdown";
import { MobileMenu } from "./MobileMenu";
import { NavItem as NavItemType } from "@/lib/navigation";
import { APP_CONFIG } from "@/lib/config";

export function NavHeader() {
    const { user, session, signOut } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
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

    // --- Dynamic Menu Preparation ---

    // Inject dynamic League ID into hrefs
    const preparedLeagueItems = LEAGUE_MENU_ITEMS.map(item => ({
        ...item,
        href: currentLeagueId ? item.href.replace("[id]", currentLeagueId) : item.href
    }));

    // Flatten User Menu Sections for the dropdown (since NavDropdown expects a flat list)
    // We'll treat the sections as just a flat list for now, or we could enhance NavDropdown later.
    // For now, flattening preserves the order.
    const preparedUserItems = USER_MENU_SECTIONS.flatMap(section => section.items);

    // Handle special item clicks (Tours, etc)
    const handleItemClick = (item: NavItemType) => {
        if (item.href.startsWith("#tour-")) {
            const tourId = item.href.replace("#tour-", "");

            // Logic to handle specific tours that need navigation first
            setOpenDropdown(null);

            // Map tour IDs to required paths
            const tourPaths: Record<string, string> = {
                "new-user": "/dashboard",
                "member": `/league/${currentLeagueId || ""}`,
                "leaderboard": `/league/${currentLeagueId || ""}/leaderboard`,
                "admin": `/league/${currentLeagueId || ""}`
            };

            const targetPath = tourPaths[tourId];

            const startTour = () => {
                window.dispatchEvent(new CustomEvent('start-onboarding-tour', { detail: { tour: tourId } }));
            };

            // If we need to navigate and we aren't there (or roughly there)
            if (targetPath) {
                // Check if we are already roughly on the page (simple check)
                // For league pages, ensure we have a league ID
                if ((tourId === 'member' || tourId === 'leaderboard' || tourId === 'admin') && !currentLeagueId) {
                    alert("Please navigate to a league first to see this tour.");
                    return;
                }

                if (pathname !== targetPath && !pathname.includes(targetPath)) {
                    // Navigate with start_tour param to ensure tour starts after load
                    const separator = targetPath.includes("?") ? "&" : "?";
                    router.push(`${targetPath}${separator}start_tour=${tourId}`);
                } else {
                    startTour();
                }
            } else {
                startTour();
            }
        }
    };

    return (
        <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md transition-all duration-300">
            <nav ref={navRef} className="mx-auto flex max-w-6xl items-center justify-between px-4 h-14">
                {/* Logo */}
                <Link href="/dashboard" className="group flex items-center gap-2">
                    <span className="text-xl">👟</span>
                    <span className="text-lg font-bold">
                        <span className="text-slate-50 transition-colors group-hover:text-sky-400">Step</span>
                        <span className="text-sky-500 transition-colors group-hover:text-slate-50">League</span>
                    </span>
                </Link>

                {/* Mobile hamburger button */}
                {session && (
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-800 transition-colors"
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
                            data-tour="nav-dashboard"
                            className={`px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${isActive("/dashboard")
                                ? "bg-sky-600/20 text-sky-400 font-medium"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                                }`}
                        >
                            Dashboard
                        </Link>

                        {/* League Dropdown */}
                        {currentLeagueId && (
                            <div data-tour="nav-league-menu">
                                <NavDropdown
                                    label="League"
                                    name="league"
                                    isOpen={openDropdown === "league"}
                                    onToggle={toggleDropdown}
                                    onClose={() => setOpenDropdown(null)}
                                    items={preparedLeagueItems}
                                    isActive={isActive}
                                    onItemClick={handleItemClick}
                                />
                            </div>
                        )}

                        {/* Actions Dropdown */}
                        <div data-tour="nav-actions-menu">
                            <NavDropdown
                                label="Actions"
                                name="actions"
                                isOpen={openDropdown === "actions"}
                                onToggle={toggleDropdown}
                                onClose={() => setOpenDropdown(null)}
                                items={ACTIONS_MENU_ITEMS}
                                isActive={isActive}
                                onItemClick={handleItemClick}
                            />
                        </div>

                        {/* SuperAdmin Menu */}
                        {isSuperadmin && (
                            <NavDropdown
                                label="Admin"
                                labelContent={<span className="text-amber-500 hover:text-amber-400 flex items-center gap-1">⚡ Admin <span className="text-[10px]">▼</span></span>}
                                name="superadmin"
                                isOpen={openDropdown === "superadmin"}
                                onToggle={toggleDropdown}
                                onClose={() => setOpenDropdown(null)}
                                items={SUPERADMIN_PAGES}
                                isActive={isActive}
                                className="ml-2"
                                align="right"
                            />
                        )}

                        {/* User Menu */}
                        <div className="ml-2" data-tour="nav-user-menu">
                            <NavDropdown
                                label="User"
                                labelContent={
                                    <div className="flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-white text-sm font-medium shadow-md ring-2 ring-slate-950 group-hover:ring-slate-800 transition-all">
                                            {displayName[0]?.toUpperCase()}
                                        </span>
                                        <span className="text-[10px] text-slate-500">▼</span>
                                    </div>
                                }
                                name="user"
                                isOpen={openDropdown === "user"}
                                onToggle={toggleDropdown}
                                onClose={() => setOpenDropdown(null)}
                                items={preparedUserItems}
                                isActive={isActive}
                                align="right"
                                onItemClick={handleItemClick}
                            />
                        </div>
                    </div>
                )}

                {!session && (
                    <Link
                        href="/sign-in"
                        className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 shadow-lg shadow-sky-500/20"
                    >
                        Sign in
                    </Link>
                )}
            </nav>

            {/* Mobile Menu Drawer */}
            {session && mobileMenuOpen && (
                <MobileMenu
                    isOpen={mobileMenuOpen}
                    onClose={() => setMobileMenuOpen(false)}
                    user={user}
                    isSuperadmin={isSuperadmin}
                    currentLeagueId={currentLeagueId}
                    isActive={isActive}
                    onSignOut={handleSignOut}
                    isSigningOut={signingOut}
                    onItemClick={handleItemClick}
                />
            )}
        </header>
    );
}
