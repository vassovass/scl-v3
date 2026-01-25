"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useMemo } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { ShadcnMenuRenderer } from "./ShadcnMenuRenderer";
import { MobileMenu } from "./MobileMenu";
import { ModeToggle } from "@/components/mode-toggle";
import { buttonVariants } from "@/components/ui/button";
import { MenuItem, UserRole, MenuLocation, detectMenuLocation } from "@/lib/menuConfig";
import { useMenuConfig } from "@/hooks/useMenuConfig";
import { APP_CONFIG } from "@/lib/config";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { Logo } from "@/components/ui/Logo";
import { ProfileSwitcher } from "@/components/auth/ProfileSwitcher";

interface NavHeaderProps {
    /** Override auto-detected menu location */
    location?: MenuLocation;
    /** Visual variant - 'transparent' for hero overlays (homepage) */
    variant?: 'default' | 'transparent';
}

export function NavHeader({ location: locationOverride, variant = 'default' }: NavHeaderProps = {}) {
    const { user, session, signOut, userProfile, loading } = useAuth();

    // Debug logging for auth state
    useEffect(() => {
        console.log('[NavHeader] Auth state:', {
            hasSession: !!session,
            hasUser: !!user,
            userId: user?.id ?? 'none',
            sessionExpiry: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'none'
        });
    }, [session, user]);

    const isTransparent = variant === 'transparent';
    const pathname = usePathname();
    const router = useRouter();
    // Use robust is_superadmin from AuthProvider context instead of risky client-side fetch
    const isSuperadmin = userProfile?.is_superadmin ?? false;
    const [signingOut, setSigningOut] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navRef = useRef<HTMLDivElement>(null);

    // Get menu configuration (database-backed with static fallback)
    const { menus, locations } = useMenuConfig();

    // Extract league ID from path if on a league page
    const leagueMatch = pathname.match(/\/league\/([^/]+)/);
    const currentLeagueId = leagueMatch?.[1];

    // Determine user role for menu filtering
    const userRole: UserRole = !session ? 'guest' : isSuperadmin ? 'superadmin' : 'member';

    // Detect menu location based on pathname or use override
    const menuLocation = useMemo(() =>
        locationOverride ?? detectMenuLocation(pathname),
        [locationOverride, pathname]
    );
    const locationConfig = locations[menuLocation];
    const isPublicLocation = menuLocation === 'public_header';

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
        setOpenDropdown(null);
    }, [pathname]);

    const handleSignOut = async () => {
        console.log('[NavHeader] handleSignOut called');
        setSigningOut(true);
        setOpenDropdown(null);
        setMobileMenuOpen(false);
        console.log('[NavHeader] Calling signOut from AuthProvider...');
        await signOut();
        console.log('[NavHeader] signOut completed');
    };

    const toggleDropdown = (name: string) => {
        setOpenDropdown(openDropdown === name ? null : name);
    };

    const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";

    // Handle menu actions (tours, sign out, etc.)
    const handleMenuAction = async (actionName: string, item: MenuItem) => {
        console.log('[NavHeader] handleMenuAction called:', { actionName, itemId: item.id, itemLabel: item.label });
        if (actionName === 'signOut') {
            console.log('[NavHeader] Sign out action detected, calling handleSignOut...');
            handleSignOut();
            return;
        }

        if (actionName === 'startTour' && item.href?.startsWith('#tour-')) {
            const tourId = item.href.replace('#tour-', '');
            console.log('[NavHeader] Tour launch:', {
                itemId: item.id,
                itemHref: item.href,
                extractedTourId: tourId
            });
            setOpenDropdown(null);

            // Legacy tour ID mapping (for database menu items with old IDs)
            const legacyTourIdMap: Record<string, string> = {
                "navigation": "dashboard-v1",
                "new-user": "dashboard-v1",
                "dashboard": "dashboard-v1",
                "member": "submit-steps-v1",
                "league": "league-v1",
                "leaderboard": "leaderboard-v1",
                "analytics": "analytics-v1",
                "settings": "settings-v1",
                "admin": "admin-v1",
            };

            const normalizedTourId = legacyTourIdMap[tourId] || tourId;

            const tourPaths: Record<string, string> = {
                "dashboard-v1": "/dashboard",
                "league-v1": "/league/create",
                "submit-steps-v1": "/submit-steps",
                "leaderboard-v1": currentLeagueId ? `/league/${currentLeagueId}/leaderboard` : "",
                "analytics-v1": currentLeagueId ? `/league/${currentLeagueId}/analytics` : "",
                "settings-v1": "/settings/profile",
                "admin-v1": "/admin/analytics/tours",
            };

            const targetPath = tourPaths[normalizedTourId];
            const hash = `#tour-${normalizedTourId}`;

            console.log('[NavHeader] Tour path resolution:', {
                originalTourId: tourId,
                normalizedTourId,
                targetPath,
                currentPath: pathname,
                willNavigate: targetPath && (pathname !== targetPath && !pathname.startsWith(targetPath + '/'))
            });

            // Validate target path - prevent navigation to malformed URLs
            if (!targetPath || targetPath.includes('undefined') || targetPath === '') {
                if (normalizedTourId === 'leaderboard-v1' || normalizedTourId === 'analytics-v1') {
                    const { toast } = await import("@/hooks/use-toast");
                    toast({
                        title: "Navigate to a league first",
                        description: "This tour requires being on a league page.",
                        variant: "destructive",
                    });
                    return;
                }
            }

            if (targetPath) {
                const isOnTargetPage = pathname === targetPath || pathname.startsWith(targetPath + '/');

                if (!isOnTargetPage) {
                    router.push(`${targetPath}${hash}`);
                } else {
                    window.location.hash = hash;
                }
            } else {
                window.location.hash = hash;
            }
        }
    };

    // Dynamic header classes based on variant
    const headerClasses = isTransparent
        ? "absolute top-0 left-0 right-0 z-40 bg-transparent transition-all duration-300"
        : "sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md transition-all duration-300";

    return (
        <header className={headerClasses}>
            <nav ref={navRef} className="mx-auto flex max-w-6xl items-center justify-between px-4 h-14">
                {/* Logo - uses modular Logo component with database support */}
                <Logo size="md" />

                {/* Mobile hamburger button - shown for authenticated users OR public pages */}
                {(session || isPublicLocation) && (
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
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
                        <InstallPrompt />
                        <OfflineIndicator />
                        {/* Dashboard Link */}
                        <Link
                            href="/dashboard"
                            data-tour="nav-dashboard"
                            className={`px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${pathname === "/dashboard"
                                ? "bg-primary/20 text-primary font-medium"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                }`}
                        >
                            Dashboard
                        </Link>

                        {/* Roadmap Link - visible to all users */}
                        <Link
                            href="/roadmap"
                            className={`px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${pathname === "/roadmap"
                                ? "bg-primary/20 text-primary font-medium"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                }`}
                        >
                            🗺️ Roadmap
                        </Link>

                        {/* League Menu */}
                        {currentLeagueId && (
                            <div data-tour="nav-league-menu">
                                <ShadcnMenuRenderer
                                    menuId="main"
                                    items={menus.main?.items.find(i => i.id === 'league')?.children}
                                    menus={menus}
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
                            <ShadcnMenuRenderer
                                items={menus.main?.items.find(i => i.id === 'actions')?.children}
                                menus={menus}
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
                        <div data-tour="help-menu">
                            <ShadcnMenuRenderer
                                menuId="help"
                                menus={menus}
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
                        </div>

                        {/* SuperAdmin Menu */}
                        {isSuperadmin && (
                            <ShadcnMenuRenderer
                                menuId="admin"
                                menus={menus}
                                variant="dropdown"
                                userRole={userRole}
                                trigger={
                                    <button className={buttonVariants({ variant: "ghost", size: "sm", className: "text-[hsl(var(--warning))] hover:text-[hsl(var(--warning)/0.9)]" })}>
                                        ⚡ Admin <span className="text-[10px]">▼</span>
                                    </button>
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

                        {/* PRD 41: Profile Switcher (Act As) */}
                        <ProfileSwitcher />

                        {/* User Menu */}
                        <div className="ml-2" data-tour="nav-user-menu">
                            <ShadcnMenuRenderer
                                menuId="user"
                                menus={menus}
                                variant="dropdown"
                                userRole={userRole}
                                trigger={
                                    <button className={buttonVariants({ variant: "ghost", size: "sm", className: "gap-2 px-2" })}>
                                        <span className="w-8 h-8 rounded-full bg-gradient-brand-primary flex items-center justify-center text-primary-foreground text-sm font-medium shadow-md ring-2 ring-background hover:ring-accent transition-all">
                                            {displayName[0]?.toUpperCase()}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">▼</span>
                                    </button>
                                }
                                isOpen={openDropdown === 'user'}
                                onToggle={() => toggleDropdown('user')}
                                onClose={() => setOpenDropdown(null)}
                                onAction={handleMenuAction}
                                currentPath={pathname}
                                align="right"
                            />
                        </div>

                        {/* Theme Toggle */}
                        <ModeToggle />
                    </div>
                )}

                {/* Public menu for non-authenticated users on public pages - sleek text links */}
                {!session && isPublicLocation && (
                    <div className="hidden md:flex items-center gap-6">
                        {menus.public?.items.map((item) => (
                            <Link
                                key={item.id}
                                href={item.href || '#'}
                                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary hover:after:w-full after:transition-all after:duration-300"
                            >
                                {item.label}
                            </Link>
                        ))}
                        {/* Theme Toggle - visible to everyone */}
                        <ModeToggle />
                    </div>
                )}

                {/* Loading skeleton during auth initialization */}
                {loading && locationConfig.showSignIn && (
                    <div className="h-10 w-20 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg" />
                )}

                {/* Sign in button - only show after loading completes */}
                {!loading && !session && locationConfig.showSignIn && (
                    <Link
                        href="/sign-in"
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 shadow-lg shadow-primary/20"
                    >
                        Sign in
                    </Link>
                )}
            </nav>

            {/* Mobile Menu Drawer - for authenticated users */}
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

            {/* Mobile Menu Drawer - for public pages (non-authenticated) */}
            {!loading && !session && isPublicLocation && mobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-md border-b border-border animate-fade-in">
                    <nav className="px-4 py-4 space-y-1">
                        {menus.public?.items.map((item) => (
                            <Link
                                key={item.id}
                                href={item.href || '#'}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block px-4 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-colors"
                            >
                                {item.label}
                            </Link>
                        ))}
                        {/* Theme Toggle in mobile menu */}
                        <div className="flex items-center justify-between px-4 py-3">
                            <span className="text-base font-medium text-muted-foreground">Theme</span>
                            <ModeToggle />
                        </div>

                        {/* Loading skeleton during auth initialization */}
                        {loading && (
                            <div className="mt-4 h-12 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg mx-4" />
                        )}

                        {/* Sign in button - only show after loading completes */}
                        {!loading && (
                            <Link
                                href="/sign-in"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block mt-4 px-4 py-3 text-center text-base font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors"
                            >
                                Sign in
                            </Link>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
}
