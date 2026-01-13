"use client";

import Link from "next/link";
import { useState } from "react";
import {
    MenuItem,
    MenuDefinition,
    UserRole,
    prepareMenuItems,
    MENUS,
} from "@/lib/menuConfig";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ----------------------------
// Types
// ----------------------------

export type MenuVariant = "dropdown" | "horizontal"; // Vertical/Accordion omitted as this is for Desktop Dropdowns

interface ShadcnMenuRendererProps {
    /** Menu ID from MENUS object, or provide items directly */
    menuId?: keyof typeof MENUS;
    /** Direct items (overrides menuId) */
    items?: MenuItem[];
    /** Menus object from useMenuConfig (database-backed with fallback) */
    menus?: Record<string, MenuDefinition>;
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
    /** Is dropdown open? (controlled mode for top-level) */
    isOpen?: boolean;
    /** Toggle dropdown (controlled mode for top-level) */
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

export function ShadcnMenuRenderer({
    menuId,
    items: directItems,
    menus: customMenus,
    variant = "dropdown",
    userRole,
    leagueId,
    trigger,
    isOpen,
    onToggle,
    onClose,
    onAction,
    currentPath = "",
    className = "",
    align = "left",
    label,
}: ShadcnMenuRendererProps) {
    // Get items from menuId or direct items
    // Use provided menus (database-backed) or fall back to static MENUS
    const menusSource = customMenus || MENUS;
    const menuDef: MenuDefinition | undefined = menuId ? menusSource[menuId] : undefined;
    const rawItems = directItems || menuDef?.items || [];

    // Apply role-based filtering and resolve hrefs
    // Note: We memoize this ideally, but for now simple calculation is fine
    const items = prepareMenuItems(rawItems, userRole, leagueId);

    // Helper to check active state
    const isActive = (path?: string): boolean => !!path && currentPath === path;

    // Handle item click (actions)
    const handleItemClick = (item: MenuItem) => {
        if (item.onClick && onAction) {
            onAction(item.onClick, item);
        }
        // For Links, we don't need to do anything, Next.js handles it.
        // We might want to close the menu?
        // DropdownMenu automatically closes on item click! 
        // But if controlled (isOpen passed), we might need to sync.
        // However, typically onOpenChange handles the closing.
    };

    if (variant === "horizontal") {
        return (
            <nav className={cn("flex items-center gap-1", className)}>
                {items.map(item => (
                    <SimpleMenuItem
                        key={item.id}
                        item={item}
                        isActive={isActive(item.href)}
                        onItemClick={handleItemClick}
                    />
                ))}
            </nav>
        );
    }

    // Default: dropdown
    // We use the `open` and `onOpenChange` props to control state if creating a top-level menu controlled key NavHeader
    return (
        <DropdownMenu open={isOpen} onOpenChange={(open) => {
            if (open) {
                onToggle?.();
            } else {
                onClose?.(); // or onToggle? NavHeader logic expects explicit close
            }
        }}>
            <DropdownMenuTrigger asChild>
                <button
                    className={cn(
                        "flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors duration-200 outline-none",
                        isOpen
                            ? "bg-accent text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent",
                        className
                    )}
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
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align={align === "right" ? "end" : "start"}
                className="bg-popover border-border min-w-[200px]"
                sideOffset={8}
            >
                <RenderMenuItems
                    items={items}
                    onAction={handleItemClick} // Pass our wrapper
                    isActive={isActive}
                    currentPath={currentPath}
                />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// ----------------------------
// Render Helpers
// ----------------------------

function RenderMenuItems({
    items,
    onAction,
    isActive,
    currentPath
}: {
    items: MenuItem[];
    onAction: (item: MenuItem) => void;
    isActive: (path?: string) => boolean;
    currentPath: string;
}) {
    return (
        <>
            {items.map((item, index) => {
                // Separator
                const separator = item.dividerBefore ? <DropdownMenuSeparator className="bg-border" /> : null;

                // Submenu
                if (item.children && item.children.length > 0) {
                    return (
                        <div key={item.id}>
                            {separator}
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger
                                    className="text-foreground focus:text-foreground focus:bg-accent data-[state=open]:bg-accent data-[state=open]:text-foreground cursor-pointer"
                                >
                                    {item.icon && <span className="mr-2">{item.icon}</span>}
                                    <span>{item.label}</span>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className="bg-popover border-border">
                                    <RenderMenuItems
                                        items={item.children}
                                        onAction={onAction}
                                        isActive={isActive}
                                        currentPath={currentPath}
                                    />
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                        </div>
                    );
                }

                // Leaf Item
                return (
                    <div key={item.id}>
                        {separator}
                        <DropdownItem item={item} onAction={onAction} isActive={isActive} />
                    </div>
                );
            })}
        </>
    );
}

function DropdownItem({
    item,
    onAction,
    isActive
}: {
    item: MenuItem;
    onAction: (item: MenuItem) => void;
    isActive: (path?: string) => boolean;
}) {
    const active = isActive(item.href);

    // Base styles
    const className = cn(
        "cursor-pointer focus:bg-accent focus:text-foreground",
        active ? "bg-primary/20 text-primary focus:bg-primary/30 focus:text-primary" : "text-foreground"
    );

    // Items with href but NO onClick - render as Link
    if (item.href && !item.onClick) {
        return (
            <DropdownMenuItem className={cn("p-0", className)}>
                <Link
                    href={item.href}
                    className="w-full flex items-center px-2 py-1.5 gap-2"
                    data-module-id={`menu-${item.id}`}
                    data-module-name={item.label}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                >
                    {item.icon && <span className="mr-2">{item.icon}</span>}
                    <span className="flex-1">{item.label}</span>
                    {item.description && (
                        <span className="ml-2 text-xs text-muted-foreground">{item.description}</span>
                    )}
                </Link>
            </DropdownMenuItem>
        );
    }

    // Items with onClick handler (including tours)
    // Use onPointerDown to fire before shadcn's dropdown event handling
    return (
        <DropdownMenuItem
            className={className}
            data-module-id={`menu-${item.id}`}
            data-module-name={item.label}
            onPointerDown={(e) => {
                // Fire immediately on pointer down, before shadcn closes the menu
                e.preventDefault();
                onAction(item);
            }}
            onSelect={(e) => {
                // Prevent default select behavior
                e.preventDefault();
            }}
        >
            {item.icon && <span className="mr-2">{item.icon}</span>}
            <span className="flex-1">{item.label}</span>
            {item.description && (
                <span className="ml-2 text-xs text-muted-foreground">{item.description}</span>
            )}
        </DropdownMenuItem>
    );
}

function SimpleMenuItem({
    item,
    isActive,
    onItemClick
}: {
    item: MenuItem;
    isActive: boolean;
    onItemClick: (item: MenuItem) => void;
}) {
    const baseClass = cn(
        "px-3 py-2 text-sm rounded-lg transition-colors duration-200",
        isActive
            ? "bg-primary/20 text-primary font-medium"
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
    );

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
