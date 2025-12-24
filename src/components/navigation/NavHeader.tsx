"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { MenuRenderer } from "./MenuRenderer";
import { MobileMenu } from "./MobileMenu";
import { MenuItem, UserRole, MENUS } from "@/lib/menuConfig";
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

    // Determine user role for menu filtering
    const userRole: UserRole = !session ? 'guest' : isSuperadmin ? 'superadmin' : 'member';

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

    const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";

    // Handle menu actions (tours, sign out, etc.)
    const handleMenuAction = (actionName: string, item: MenuItem) => {
        if (actionName === 'signOut') {
            handleSignOut();
            return;
        }

        if (actionName === 'startTour' && item.href?.startsWith('#tour-')) {
            const tourId = item.href.replace('#tour-', '');
            setOpenDropdown(null);

            // Map tour IDs to required paths
            const tourPaths: Record<string, string> = {
                "navigation": pathname, // Can run from anywhere
                "new-user": "/dashboard",
                "member": `/league/${currentLeagueId || ""}`,
                "leaderboard": `/league/${currentLeagueId || ""}/leaderboard`,
                "admin": `/league/${currentLeagueId || ""}`
            };

            const targetPath = tourPaths[tourId];

            const startTour = () => {
                window.dispatchEvent(new CustomEvent('start-onboarding-tour', { detail: { tour: tourId } }));
            };

            if (targetPath) {
                // For league pages, ensure we have a league ID
                if ((tourId === 'member' || tourId === 'leaderboard' || tourId === 'admin') && !currentLeagueId) {
                    alert("Please navigate to a league first to see this tour.");
                    return;
                }

                if (pathname !== targetPath && !pathname.includes(targetPath)) {
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
                        {/* Dashboard Link */}
                        <Link
                            href="/dashboard"
                            data-tour="nav-dashboard"
                            className={`px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${pathname === "/dashboard"
                                ? "bg-sky-600/20 text-sky-400 font-medium"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                                }`}
                        >
                            Dashboard
                        </Link>

                        {/* League Menu */}
                        {currentLeagueId && (
                            <div data-tour="nav-league-menu">
                                <MenuRenderer
                                    menuId="main"
                                    items={MENUS.main.items.find(i => i.id === 'league')?.children}
                                    variant="dropdown"
                                    userRole={userRole}
                                    leagueId={currentLeagueId}
                                    label="League"
                                    isOpen={openDropdown === 'league'}
                                    onToggle={() => toggleDropdown('league')}
                                    onClose={() => setOpenDropdown(null)}
                                    onAction={handleMenuAction}
                                    currentPath={pathname}
                                />
                            </div>
                        )}

                        {/* Actions Menu */}
                        <div data-tour="nav-actions-menu">
                            <MenuRenderer
                                items={MENUS.main.items.find(i => i.id === 'actions')?.children}
                                variant="dropdown"
                                userRole={userRole}
                                leagueId={currentLeagueId}
                                label="Actions"
                                isOpen={openDropdown === 'actions'}
                                onToggle={() => toggleDropdown('actions')}
                                onClose={() => setOpenDropdown(null)}
                                onAction={handleMenuAction}
                                currentPath={pathname}
                            />
                        </div>

                        {/* Help Menu (with onboarding tours) */}
                        <MenuRenderer
                            menuId="help"
                            variant="dropdown"
                            userRole={userRole}
                            leagueId={currentLeagueId}
                            label="Help"
                            isOpen={openDropdown === 'help'}
                            onToggle={() => toggleDropdown('help')}
                            onClose={() => setOpenDropdown(null)}
                            onAction={handleMenuAction}
                            currentPath={pathname}
                        />

                        {/* SuperAdmin Menu */}
                        {isSuperadmin && (
                            <MenuRenderer
                                menuId="admin"
                                variant="dropdown"
                                userRole={userRole}
                                trigger={
                                    <span className="text-amber-500 hover:text-amber-400 flex items-center gap-1">
                                        ⚡ Admin <span className="text-[10px]">▼</span>
                                    </span>
                                }
                                isOpen={openDropdown === 'admin'}
                                onToggle={() => toggleDropdown('admin')}
                                onClose={() => setOpenDropdown(null)}
                                onAction={handleMenuAction}
                                currentPath={pathname}
                                align="right"
                                className="ml-2"
                            />
                        )}

                        {/* User Menu */}
                        <div className="ml-2" data-tour="nav-user-menu">
                            <MenuRenderer
                                menuId="user"
                                variant="dropdown"
                                userRole={userRole}
                                trigger={
                                    <div className="flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-white text-sm font-medium shadow-md ring-2 ring-slate-950 group-hover:ring-slate-800 transition-all">
                                            {displayName[0]?.toUpperCase()}
                                        </span>
                                        <span className="text-[10px] text-slate-500">▼</span>
                                    </div>
                                }
                                isOpen={openDropdown === 'user'}
                                onToggle={() => toggleDropdown('user')}
                                onClose={() => setOpenDropdown(null)}
                                onAction={handleMenuAction}
                                currentPath={pathname}
                                align="right"
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
                    isActive={(path) => pathname === path}
                    onSignOut={handleSignOut}
                    isSigningOut={signingOut}
                    onMenuAction={handleMenuAction}
                />
            )}
        </header>
    );
}
