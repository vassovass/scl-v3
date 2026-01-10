"use client";

import Link from "next/link";
import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { MenuItem, UserRole, prepareMenuItems } from "@/lib/menuConfig";
import { useMenuConfig } from "@/hooks/useMenuConfig";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    isSuperadmin: boolean;
    currentLeagueId?: string;
    isActive: (path: string) => boolean;
    onSignOut: () => void;
    isSigningOut: boolean;
    onMenuAction?: (actionName: string, item: MenuItem) => void;
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
    onMenuAction,
}: MobileMenuProps) {
    const [expandedSection, setExpandedSection] = useState<string | null>(null);

    if (!isOpen) return null;

    const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";
    const userRole: UserRole = isSuperadmin ? 'superadmin' : 'member';

    // Get menu configuration from database (with static fallback)
    const { menus } = useMenuConfig();

    // Handle menu action - close menu after action
    const handleAction = (actionName: string, item: MenuItem) => {
        if (actionName === 'signOut') {
            onSignOut();
            return;
        }
        onMenuAction?.(actionName, item);
        onClose();
    };

    // Get prepared menu items from database
    const leagueItems = currentLeagueId && menus.main
        ? prepareMenuItems(menus.main.items.find((i: MenuItem) => i.id === 'league')?.children || [], userRole, currentLeagueId)
        : [];
    const actionsItems = menus.main
        ? prepareMenuItems(menus.main.items.find((i: MenuItem) => i.id === 'actions')?.children || [], userRole, currentLeagueId)
        : [];
    const helpItems = menus.help ? prepareMenuItems(menus.help.items, userRole, currentLeagueId) : [];
    const adminItems = isSuperadmin && menus.admin ? prepareMenuItems(menus.admin.items, userRole, currentLeagueId) : [];
    const userItems = menus.user ? prepareMenuItems(menus.user.items.filter((i: MenuItem) => i.id !== 'sign-out'), userRole, currentLeagueId) : [];
    const footerItems = menus.footerLegal
        ? [
            ...menus.footerLegal.items.slice(0, 2), // Terms, Privacy
            { id: 'roadmap', label: 'Roadmap', href: '/roadmap' },
            { id: 'beta', label: 'Beta Info', href: '/beta' },
          ]
        : [
            { id: 'roadmap', label: 'Roadmap', href: '/roadmap' },
            { id: 'beta', label: 'Beta Info', href: '/beta' },
          ];

    return (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
            {/* Dashboard Link */}
            <Link
                href="/dashboard"
                onClick={onClose}
                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive("/dashboard")
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-accent"
                    }`}
            >
                📊 Dashboard
            </Link>

            {/* League Section */}
            {currentLeagueId && leagueItems.length > 0 && (
                <MobileSection
                    title="Current League"
                    items={leagueItems}
                    isExpanded={expandedSection === 'league'}
                    onToggle={() => setExpandedSection(expandedSection === 'league' ? null : 'league')}
                    onClose={onClose}
                    onAction={handleAction}
                    isActive={isActive}
                />
            )}

            {/* Actions Section */}
            {actionsItems.length > 0 && (
                <MobileSection
                    title="Actions"
                    items={actionsItems}
                    isExpanded={expandedSection === 'actions'}
                    onToggle={() => setExpandedSection(expandedSection === 'actions' ? null : 'actions')}
                    onClose={onClose}
                    onAction={handleAction}
                    isActive={isActive}
                />
            )}

            {/* Help Section */}
            {helpItems.length > 0 && (
                <MobileSection
                    title="Help & Guides"
                    items={helpItems}
                    isExpanded={expandedSection === 'help'}
                    onToggle={() => setExpandedSection(expandedSection === 'help' ? null : 'help')}
                    onClose={onClose}
                    onAction={handleAction}
                    isActive={isActive}
                />
            )}

            {/* SuperAdmin Section */}
            {adminItems.length > 0 && (
                <MobileSection
                    title="⚡ SuperAdmin"
                    titleClassName="text-[hsl(var(--warning))]"
                    items={adminItems}
                    isExpanded={expandedSection === 'admin'}
                    onToggle={() => setExpandedSection(expandedSection === 'admin' ? null : 'admin')}
                    onClose={onClose}
                    onAction={handleAction}
                    isActive={isActive}
                    itemClassName="text-[hsl(var(--warning)/0.8)] hover:bg-amber-900/10 hover:text-[hsl(var(--warning))]"
                />
            )}

            {/* User Account Section */}
            <div className="pt-4 border-t border-border space-y-1">
                <div className="px-4 py-2 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-white font-medium shadow-lg">
                        {displayName[0]?.toUpperCase()}
                    </div>
                    <div>
                        <div className="text-sm font-medium text-foreground">{displayName}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{user?.email}</div>
                    </div>
                </div>

                {/* User Menu Items */}
                {userItems.map((item) => (
                    <MobileLink
                        key={item.id}
                        item={item}
                        onClose={onClose}
                        onAction={handleAction}
                        isActive={isActive}
                    />
                ))}

                {/* Footer Links */}
                <div className="grid grid-cols-2 gap-2 px-2 mt-2">
                    {footerItems.map(link => (
                        <Link
                            key={link.id}
                            href={link.href || '#'}
                            onClick={onClose}
                            className="text-center py-2 text-xs text-muted-foreground hover:bg-accent rounded-md transition-colors"
                            data-module-id={`menu-${link.id}`}
                            data-module-name={link.label}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Install App Button */}
                <div className="pt-2">
                    <InstallPrompt className="w-full justify-start px-4 py-3 h-auto font-medium" />
                </div>

                {/* Sign Out */}
                <div className="pt-2">
                    <button
                        onClick={onSignOut}
                        disabled={isSigningOut}
                        className="w-full px-4 py-3 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-950/20 text-left disabled:opacity-50 transition-colors flex items-center gap-2"
                        data-module-id="menu-sign-out"
                        data-module-name="Sign Out"
                    >
                        <span>🚪</span>
                        <span>{isSigningOut ? "Signing out..." : "Sign Out"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

// ----------------------------
// Sub-components
// ----------------------------

interface MobileSectionProps {
    title: string;
    titleClassName?: string;
    items: MenuItem[];
    isExpanded: boolean;
    onToggle: () => void;
    onClose: () => void;
    onAction: (actionName: string, item: MenuItem) => void;
    isActive: (path: string) => boolean;
    itemClassName?: string;
}

function MobileSection({
    title,
    titleClassName = "text-muted-foreground",
    items,
    isExpanded,
    onToggle,
    onClose,
    onAction,
    isActive,
    itemClassName,
}: MobileSectionProps) {
    return (
        <div className="space-y-1">
            <button
                onClick={onToggle}
                className={`w-full px-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest ${titleClassName}`}
            >
                <span>{title}</span>
                <span className={`text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {isExpanded && (
                <div className="space-y-1 animate-in slide-in-from-top-2 duration-150">
                    {items.map((item) => (
                        <MobileMenuItem
                            key={item.id}
                            item={item}
                            onClose={onClose}
                            onAction={onAction}
                            isActive={isActive}
                            className={itemClassName}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

interface MobileMenuItemProps {
    item: MenuItem;
    onClose: () => void;
    onAction: (actionName: string, item: MenuItem) => void;
    isActive: (path: string) => boolean;
    className?: string;
    depth?: number;
}

function MobileMenuItem({
    item,
    onClose,
    onAction,
    isActive,
    className,
    depth = 0,
}: MobileMenuItemProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const baseClass = `block px-4 py-3 rounded-lg text-sm transition-colors ${className || "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`;
    const paddingLeft = depth > 0 ? `pl-${4 + depth * 4}` : '';

    // Has children - render as sub-accordion
    if (item.children && item.children.length > 0) {
        return (
            <div className={paddingLeft}>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`w-full flex items-center justify-between ${baseClass}`}
                    data-module-id={`menu-${item.id}`}
                    data-module-name={item.label}
                >
                    <span className="flex items-center gap-2">
                        {item.icon && <span>{item.icon}</span>}
                        <span>{item.label}</span>
                    </span>
                    <span className={`text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1 border-l border-border pl-2">
                        {item.children.map(child => (
                            <MobileMenuItem
                                key={child.id}
                                item={child}
                                onClose={onClose}
                                onAction={onAction}
                                isActive={isActive}
                                className={className}
                                depth={depth + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Leaf item with action
    if (item.onClick) {
        return (
            <button
                onClick={() => {
                    onAction(item.onClick!, item);
                }}
                className={`w-full text-left ${baseClass} ${paddingLeft}`}
                data-module-id={`menu-${item.id}`}
                data-module-name={item.label}
            >
                {item.icon && <span className="mr-2">{item.icon}</span>}
                <span>{item.label}</span>
                {item.description && (
                    <span className="ml-2 text-xs text-muted-foreground">{item.description}</span>
                )}
            </button>
        );
    }

    // Leaf item with href
    return (
        <Link
            href={item.href || '#'}
            onClick={onClose}
            className={`${baseClass} ${paddingLeft}`}
            data-module-id={`menu-${item.id}`}
            data-module-name={item.label}
        >
            {item.icon && <span className="mr-2">{item.icon}</span>}
            <span>{item.label}</span>
            {item.description && (
                <span className="ml-2 text-xs text-muted-foreground">{item.description}</span>
            )}
        </Link>
    );
}

function MobileLink({
    item,
    onClose,
    onAction,
    isActive,
}: {
    item: MenuItem;
    onClose: () => void;
    onAction: (actionName: string, item: MenuItem) => void;
    isActive: (path: string) => boolean;
}) {
    if (item.onClick) {
        return (
            <button
                onClick={() => onAction(item.onClick!, item)}
                className="block w-full text-left px-4 py-3 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                data-module-id={`menu-${item.id}`}
                data-module-name={item.label}
            >
                {item.icon && <span className="mr-2">{item.icon}</span>}
                <span>{item.label}</span>
            </button>
        );
    }

    return (
        <Link
            href={item.href || '#'}
            onClick={onClose}
            className="block px-4 py-3 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            data-module-id={`menu-${item.id}`}
            data-module-name={item.label}
        >
            {item.icon && <span className="mr-2">{item.icon}</span>}
            <span>{item.label}</span>
        </Link>
    );
}
