import Link from "next/link";
import {
    LEAGUE_MENU_ITEMS,
    ACTIONS_MENU_ITEMS,
    SUPERADMIN_PAGES,
    USER_MENU_SECTIONS,
    FOOTER_LINKS,
    NavItem
} from "@/lib/navigation";
import { User } from "@supabase/supabase-js";

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    isSuperadmin: boolean;
    currentLeagueId?: string;
    isActive: (path: string) => boolean;
    onSignOut: () => void;
    isSigningOut: boolean;
    onItemClick?: (item: NavItem) => void;
}

export function MobileMenu({
    isOpen,
    onClose,
    user,
    isSuperadmin,
    currentLeagueId,
    isActive,
    onSignOut,
    isSigningOut,
    onItemClick
}: MobileMenuProps) {
    if (!isOpen) return null;

    const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";

    // Helper to replace dynamic params like [id]
    const resolveHref = (href: string) => {
        if (currentLeagueId) {
            return href.replace("[id]", currentLeagueId);
        }
        return href;
    };

    const handleItemClick = (item: NavItem) => {
        onClose();
        if (onItemClick) onItemClick(item);
    };

    return (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 py-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
            {/* Dashboard Link */}
            <Link
                href="/dashboard"
                onClick={onClose}
                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive("/dashboard")
                        ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}
            >
                📊 Dashboard
            </Link>

            {/* League Section */}
            {currentLeagueId && (
                <div className="space-y-1">
                    <div className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Current League</div>
                    {LEAGUE_MENU_ITEMS.map((item) => (
                        <Link
                            key={item.href}
                            href={resolveHref(item.href)}
                            onClick={() => handleItemClick(item)}
                            className={`block px-4 py-3 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors`}
                        >
                            {item.icon} <span className="ml-2">{item.label}</span>
                        </Link>
                    ))}
                </div>
            )}

            {/* Actions Section */}
            <div className="space-y-1">
                <div className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actions</div>
                {ACTIONS_MENU_ITEMS.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => handleItemClick(item)}
                        className="block px-4 py-3 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                        {item.icon} <span className="ml-2">{item.label}</span>
                    </Link>
                ))}
            </div>

            {/* SuperAdmin Section */}
            {isSuperadmin && (
                <div className="space-y-1">
                    <div className="px-4 text-[10px] font-bold text-amber-500 uppercase tracking-widest">⚡ SuperAdmin</div>
                    {SUPERADMIN_PAGES.map((page) => (
                        <Link
                            key={page.href}
                            href={page.href}
                            onClick={onClose}
                            className="block px-4 py-3 rounded-lg text-sm text-amber-500/80 hover:bg-amber-900/10 hover:text-amber-400 transition-colors"
                        >
                            <span className="mr-2">{page.label.split(" ")[0]}</span>
                            <span>{page.label.split(" ").slice(1).join(" ")}</span>
                        </Link>
                    ))}
                </div>
            )}

            {/* User Account Section */}
            <div className="pt-4 border-t border-slate-800 space-y-1">
                <div className="px-4 py-2 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-white font-medium shadow-lg">
                        {displayName[0]?.toUpperCase()}
                    </div>
                    <div>
                        <div className="text-sm font-medium text-slate-200">{displayName}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[200px]">{user?.email}</div>
                    </div>
                </div>

                {/* Flattened User Menu Sections */}
                {USER_MENU_SECTIONS.map((section, idx) => (
                    <div key={idx} className="space-y-1">
                        {section.items.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                onClick={() => handleItemClick(item)}
                                className="block px-4 py-3 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                            >
                                {item.icon} <span className="ml-2">{item.label}</span>
                            </Link>
                        ))}
                    </div>
                ))}

                {/* Footer Links */}
                <div className="grid grid-cols-2 gap-2 px-2 mt-2">
                    {FOOTER_LINKS.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={onClose}
                            className="text-center py-2 text-xs text-slate-500 hover:bg-slate-800 rounded-md transition-colors"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                <div className="pt-2">
                    <button
                        onClick={onSignOut}
                        disabled={isSigningOut}
                        className="w-full px-4 py-3 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-950/20 text-left disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                        <span>🚪</span>
                        <span>{isSigningOut ? "Signing out..." : "Sign Out"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
