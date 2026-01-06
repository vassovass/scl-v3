"use client";

import { cn } from "@/lib/utils";

interface MenuListProps {
  menus: Array<{ id: string; label?: string; description?: string }>;
  selectedMenuId: string;
  onSelectMenu: (menuId: string) => void;
}

/**
 * Left sidebar menu selector
 * Shows list of all menus with selection state
 */
export function MenuList({ menus, selectedMenuId, onSelectMenu }: MenuListProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Menus</h3>
      <div className="space-y-1">
        {menus.map((menu) => (
          <button
            key={menu.id}
            onClick={() => onSelectMenu(menu.id)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-lg transition-colors text-sm",
              selectedMenuId === menu.id
                ? "bg-primary text-primary-foreground font-medium"
                : "text-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <span className={cn(
                "w-1 h-1 rounded-full",
                selectedMenuId === menu.id ? "bg-primary-foreground" : "bg-muted-foreground"
              )} />
              <span>{menu.label || menu.id}</span>
            </div>
            {menu.description && (
              <div className="text-xs text-muted-foreground ml-3 mt-0.5">
                {menu.description}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
