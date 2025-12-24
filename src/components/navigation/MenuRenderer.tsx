"use client";

/**
 * MenuRenderer - Modular menu component
 * 
 * Renders menus from menuConfig.ts with:
 * - Role-based filtering (automatic)
 * - Unlimited nested submenus
 * - Multiple variants (dropdown, accordion, vertical, horizontal)
 * - Feedback system integration (data-module-id)
 * 
 * Usage:
 *   <MenuRenderer
 *     menuId="main"
 *     variant="dropdown"
 *     userRole="member"
 *     leagueId="abc123"
 *     onAction={handleAction}
 *   />
 */

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
    MenuItem,
    MenuDefinition,
    UserRole,
    prepareMenuItems,
    MENUS,
} from "@/lib/menuConfig";

// ----------------------------
// Types
// ----------------------------

export type MenuVariant = "dropdown" | "accordion" | "vertical" | "horizontal";

interface MenuRendererProps {
    /** Menu ID from MENUS object, or provide items directly */
    menuId?: keyof typeof MENUS;
    /** Direct items (overrides menuId) */
    items?: MenuItem[];
    /** Rendering variant */
    variant?: MenuVariant;
    /** Current user role for filtering */
    userRole: UserRole;
    /** League ID for dynamic hrefs */
    leagueId?: string;
    /** Whether this is the top-level (affects styling) */
    isTopLevel?: boolean;
    /** Custom trigger content (for dropdown variant) */
    trigger?: React.ReactNode;
    /** Is dropdown open? (controlled mode) */
    isOpen?: boolean;
    /** Toggle dropdown (controlled mode) */
    onToggle?: () => void;
    /** Close dropdown */
    onClose?: () => void;
    /** Handle named actions (e.g., startTour, signOut) */
    onAction?: (actionName: string, item: MenuItem) => void;
    /** Current path for active state */
    currentPath?: string;
    /** Custom className */
    className?: string;
    /** Align dropdown */
    align?: "left" | "right";
    /** Menu label (for dropdown trigger) */
    label?: string;
}

// ----------------------------
// Component
// ----------------------------

export function MenuRenderer({
    menuId,
    items: directItems,
    variant = "dropdown",
    userRole,
    leagueId,
    isTopLevel = true,
    trigger,
    isOpen: controlledIsOpen,
    onToggle,
    onClose,
    onAction,
    currentPath = "",
    className = "",
    align = "left",
    label,
}: MenuRendererProps) {
    // Internal open state (for uncontrolled mode)
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const [openSubmenuId, setOpenSubmenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
    const setIsOpen = onToggle || (() => setInternalIsOpen(!internalIsOpen));

    // Get items from menuId or direct items
    const menuDef: MenuDefinition | undefined = menuId ? MENUS[menuId] : undefined;
    const rawItems = directItems || menuDef?.items || [];

    // Apply role-based filtering and resolve hrefs
    const items = prepareMenuItems(rawItems, userRole, leagueId);

    // Close menu when clicking outside
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose?.();
                setInternalIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose]);

    // Check if path is active
    const isActive = (path?: string): boolean => !!path && currentPath === path;
    const isActivePrefix = (path?: string): boolean => !!path && currentPath.startsWith(path);

    // Handle item click
    const handleItemClick = (item: MenuItem) => {
        if (item.onClick && onAction) {
            onAction(item.onClick, item);
        }
        if (!item.children) {
            onClose?.();
            setInternalIsOpen(false);
        }
    };

    // Render based on variant
    if (variant === "horizontal") {
        return (
            <nav className={`flex items-center gap-1 ${className}`}>
                {items.map(item => (
                    <MenuItemRenderer
                        key={item.id}
                        item={item}
                        variant="horizontal"
                        isActive={isActive}
                        isActivePrefix={isActivePrefix}
                        onItemClick={handleItemClick}
                        userRole={userRole}
                        leagueId={leagueId}
                        onAction={onAction}
                        currentPath={currentPath}
                    />
                ))}
            </nav>
        );
    }

    if (variant === "vertical") {
        return (
            <nav className={`space-y-1 ${className}`}>
                {items.map(item => (
                    <MenuItemRenderer
                        key={item.id}
                        item={item}
                        variant="vertical"
                        isActive={isActive}
                        isActivePrefix={isActivePrefix}
                        onItemClick={handleItemClick}
                        userRole={userRole}
                        leagueId={leagueId}
                        onAction={onAction}
                        currentPath={currentPath}
                    />
                ))}
            </nav>
        );
    }

    if (variant === "accordion") {
        return (
            <div className={`space-y-1 ${className}`}>
                {items.map(item => (
                    <AccordionItem
                        key={item.id}
                        item={item}
                        isExpanded={openSubmenuId === item.id}
                        onToggle={() => setOpenSubmenuId(openSubmenuId === item.id ? null : item.id)}
                        isActive={isActive}
                        isActivePrefix={isActivePrefix}
                        onItemClick={handleItemClick}
                        userRole={userRole}
                        leagueId={leagueId}
                        onAction={onAction}
                        currentPath={currentPath}
                    />
                ))}
            </div>
        );
    }

    // Default: dropdown
    return (
        <div ref={menuRef} className={`relative ${className}`}>
            {/* Trigger */}
            <button
                onClick={() => setIsOpen()}
                className={`flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${isOpen
                    ? "bg-slate-800 text-sky-400"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    }`}
                data-module-id={`menu-trigger-${menuId || 'custom'}`}
                data-module-name={label || menuDef?.label || 'Menu'}
            >
                {trigger || (
                    <>
                        <span>{label || menuDef?.label || "Menu"}</span>
                        <span className="text-[10px] opacity-60">▼</span>
                    </>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && items.length > 0 && (
                <div
                    className={`absolute top-full mt-2 min-w-[200px] py-2 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 ${align === "right" ? "right-0" : "left-0"
                        }`}
                >
                    {items.map(item => (
                        <DropdownItem
                            key={item.id}
                            item={item}
                            isActive={isActive}
                            isActivePrefix={isActivePrefix}
                            onItemClick={handleItemClick}
                            userRole={userRole}
                            leagueId={leagueId}
                            onAction={onAction}
                            currentPath={currentPath}
                            onClose={onClose}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ----------------------------
// Sub-components
// ----------------------------

interface MenuItemRendererProps {
    item: MenuItem;
    variant: MenuVariant;
    isActive: (path?: string) => boolean;
    isActivePrefix: (path?: string) => boolean;
    onItemClick: (item: MenuItem) => void;
    userRole: UserRole;
    leagueId?: string;
    onAction?: (actionName: string, item: MenuItem) => void;
    currentPath?: string;
}

function MenuItemRenderer({
    item,
    variant,
    isActive,
    isActivePrefix,
    onItemClick,
    userRole,
    leagueId,
    onAction,
    currentPath,
}: MenuItemRendererProps) {
    const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);

    // If has children, render as nested dropdown
    if (item.children && item.children.length > 0) {
        return (
            <MenuRenderer
                items={item.children}
                variant="dropdown"
                userRole={userRole}
                leagueId={leagueId}
                label={item.label}
                trigger={
                    <span className="flex items-center gap-1">
                        {item.icon && <span>{item.icon}</span>}
                        <span>{item.label}</span>
                        <span className="text-[10px] opacity-60">▼</span>
                    </span>
                }
                isOpen={isSubmenuOpen}
                onToggle={() => setIsSubmenuOpen(!isSubmenuOpen)}
                onClose={() => setIsSubmenuOpen(false)}
                onAction={onAction}
                currentPath={currentPath}
                isTopLevel={false}
            />
        );
    }

    // Leaf item
    const active = isActive(item.href);
    const baseClass = variant === "horizontal"
        ? `px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${active
            ? "bg-sky-600/20 text-sky-400 font-medium"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        }`
        : `block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors`;

    if (item.href && !item.onClick) {
        return (
            <Link
                href={item.href}
                className={baseClass}
                data-module-id={`menu-${item.id}`}
                data-module-name={item.label}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
            >
                {item.icon && <span className="mr-2">{item.icon}</span>}
                {item.label}
            </Link>
        );
    }

    return (
        <button
            onClick={() => onItemClick(item)}
            className={baseClass}
            data-module-id={`menu-${item.id}`}
            data-module-name={item.label}
        >
            {item.icon && <span className="mr-2">{item.icon}</span>}
            {item.label}
        </button>
    );
}

interface DropdownItemProps {
    item: MenuItem;
    isActive: (path?: string) => boolean;
    isActivePrefix: (path?: string) => boolean;
    onItemClick: (item: MenuItem) => void;
    userRole: UserRole;
    leagueId?: string;
    onAction?: (actionName: string, item: MenuItem) => void;
    currentPath?: string;
    onClose?: () => void;
    depth?: number;
}

function DropdownItem({
    item,
    isActive,
    isActivePrefix,
    onItemClick,
    userRole,
    leagueId,
    onAction,
    currentPath,
    onClose,
    depth = 0,
}: DropdownItemProps) {
    const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);

    const active = isActive(item.href);

    // Divider
    if (item.dividerBefore) {
        return (
            <>
                <div className="my-2 border-t border-slate-700" />
                <DropdownItemContent
                    item={item}
                    isActive={isActive}
                    isActivePrefix={isActivePrefix}
                    onItemClick={onItemClick}
                    isSubmenuOpen={isSubmenuOpen}
                    setIsSubmenuOpen={setIsSubmenuOpen}
                    userRole={userRole}
                    leagueId={leagueId}
                    onAction={onAction}
                    currentPath={currentPath}
                    onClose={onClose}
                    depth={depth}
                    active={active}
                />
            </>
        );
    }

    return (
        <DropdownItemContent
            item={item}
            isActive={isActive}
            isActivePrefix={isActivePrefix}
            onItemClick={onItemClick}
            isSubmenuOpen={isSubmenuOpen}
            setIsSubmenuOpen={setIsSubmenuOpen}
            userRole={userRole}
            leagueId={leagueId}
            onAction={onAction}
            currentPath={currentPath}
            onClose={onClose}
            depth={depth}
            active={active}
        />
    );
}

function DropdownItemContent({
    item,
    isActive,
    isActivePrefix,
    onItemClick,
    isSubmenuOpen,
    setIsSubmenuOpen,
    userRole,
    leagueId,
    onAction,
    currentPath,
    onClose,
    depth,
    active,
}: DropdownItemProps & { active: boolean; isSubmenuOpen: boolean; setIsSubmenuOpen: (v: boolean) => void }) {
    // Has children - render as nested submenu
    if (item.children && item.children.length > 0) {
        return (
            <div
                className="relative group"
                onMouseEnter={() => setIsSubmenuOpen(true)}
                onMouseLeave={() => setIsSubmenuOpen(false)}
            >
                <button
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${isSubmenuOpen ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        }`}
                    data-module-id={`menu-${item.id}`}
                    data-module-name={item.label}
                >
                    <span className="flex items-center gap-2">
                        {item.icon && <span>{item.icon}</span>}
                        <span>{item.label}</span>
                    </span>
                    <span className="text-xs opacity-60">▶</span>
                </button>

                {/* Submenu */}
                {isSubmenuOpen && (
                    <div className="absolute left-full top-0 ml-1 min-w-[180px] py-2 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-left-2 duration-150">
                        {item.children.map(child => (
                            <DropdownItem
                                key={child.id}
                                item={child}
                                isActive={isActive}
                                isActivePrefix={isActivePrefix}
                                onItemClick={onItemClick}
                                userRole={userRole}
                                leagueId={leagueId}
                                onAction={onAction}
                                currentPath={currentPath}
                                onClose={onClose}
                                depth={(depth || 0) + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Leaf item
    const baseClass = `w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${active ? "bg-sky-600/20 text-sky-400" : "text-slate-300 hover:bg-slate-800 hover:text-white"
        }`;

    if (item.href && !item.onClick) {
        return (
            <Link
                href={item.href}
                className={baseClass}
                onClick={() => onClose?.()}
                data-module-id={`menu-${item.id}`}
                data-module-name={item.label}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
            >
                {item.icon && <span>{item.icon}</span>}
                <span className="flex-1">{item.label}</span>
                {item.description && (
                    <span className="text-xs text-slate-500">{item.description}</span>
                )}
            </Link>
        );
    }

    return (
        <button
            onClick={() => {
                onItemClick(item);
                if (!item.children) onClose?.();
            }}
            className={baseClass}
            data-module-id={`menu-${item.id}`}
            data-module-name={item.label}
        >
            {item.icon && <span>{item.icon}</span>}
            <span className="flex-1">{item.label}</span>
            {item.description && (
                <span className="text-xs text-slate-500">{item.description}</span>
            )}
        </button>
    );
}

interface AccordionItemProps {
    item: MenuItem;
    isExpanded: boolean;
    onToggle: () => void;
    isActive: (path?: string) => boolean;
    isActivePrefix: (path?: string) => boolean;
    onItemClick: (item: MenuItem) => void;
    userRole: UserRole;
    leagueId?: string;
    onAction?: (actionName: string, item: MenuItem) => void;
    currentPath?: string;
}

function AccordionItem({
    item,
    isExpanded,
    onToggle,
    isActive,
    isActivePrefix,
    onItemClick,
    userRole,
    leagueId,
    onAction,
    currentPath,
}: AccordionItemProps) {
    const active = isActive(item.href);

    // Divider
    const divider = item.dividerBefore ? (
        <div className="my-2 border-t border-slate-800" />
    ) : null;

    // Has children - render as accordion
    if (item.children && item.children.length > 0) {
        return (
            <>
                {divider}
                <div>
                    <button
                        onClick={onToggle}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-colors ${isExpanded ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800"
                            }`}
                        data-module-id={`menu-${item.id}`}
                        data-module-name={item.label}
                    >
                        <span className="flex items-center gap-2">
                            {item.icon && <span>{item.icon}</span>}
                            <span>{item.label}</span>
                        </span>
                        <span className={`text-xs transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                            ▼
                        </span>
                    </button>

                    {isExpanded && (
                        <div className="pl-4 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-150">
                            {item.children.map(child => (
                                <AccordionItem
                                    key={child.id}
                                    item={child}
                                    isExpanded={false}
                                    onToggle={() => { }}
                                    isActive={isActive}
                                    isActivePrefix={isActivePrefix}
                                    onItemClick={onItemClick}
                                    userRole={userRole}
                                    leagueId={leagueId}
                                    onAction={onAction}
                                    currentPath={currentPath}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </>
        );
    }

    // Leaf item
    const baseClass = `block px-4 py-3 rounded-lg text-sm transition-colors ${active ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" : "text-slate-300 hover:bg-slate-800"
        }`;

    if (item.href && !item.onClick) {
        return (
            <>
                {divider}
                <Link
                    href={item.href}
                    className={baseClass}
                    data-module-id={`menu-${item.id}`}
                    data-module-name={item.label}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                >
                    {item.icon && <span className="mr-2">{item.icon}</span>}
                    {item.label}
                    {item.description && (
                        <span className="ml-2 text-xs text-slate-500">{item.description}</span>
                    )}
                </Link>
            </>
        );
    }

    return (
        <>
            {divider}
            <button
                onClick={() => onItemClick(item)}
                className={`${baseClass} w-full text-left`}
                data-module-id={`menu-${item.id}`}
                data-module-name={item.label}
            >
                {item.icon && <span className="mr-2">{item.icon}</span>}
                {item.label}
                {item.description && (
                    <span className="ml-2 text-xs text-slate-500">{item.description}</span>
                )}
            </button>
        </>
    );
}

export default MenuRenderer;
