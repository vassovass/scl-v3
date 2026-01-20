"use client";

import { cn } from "@/lib/utils";
import { Sliders, Flag, Settings2, Eye, Settings, Palette, Paintbrush } from "lucide-react";
import { AppSettingCategory } from "@/lib/settings/appSettingsTypes";

interface CategoryNavProps {
  categories: Array<{
    id: AppSettingCategory;
    title: string;
    icon?: string;
  }>;
  activeCategory: AppSettingCategory;
  onChange: (category: AppSettingCategory) => void;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Sliders,
  Flag,
  Settings2,
  Eye,
  Settings,
  Palette,
  Paintbrush,
};

/**
 * Category navigation for settings page
 * Mobile: Horizontal scrolling tabs
 * Desktop: Vertical sidebar
 * PRD-26: SuperAdmin Settings & Feature Flags
 */
export function CategoryNav({ categories, activeCategory, onChange }: CategoryNavProps) {
  return (
    <>
      {/* Mobile: Horizontal scrolling tabs */}
      <div className="md:hidden overflow-x-auto pb-2 -mx-4 px-4">
        <div className="flex gap-2 min-w-max">
          {categories.map((category) => {
            const IconComponent = category.icon ? CATEGORY_ICONS[category.icon] : Settings;
            const isActive = activeCategory === category.id;

            return (
              <button
                key={category.id}
                onClick={() => onChange(category.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {IconComponent && <IconComponent className="h-4 w-4" />}
                {category.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop: Vertical sidebar */}
      <div className="hidden md:block w-48 flex-shrink-0">
        <nav className="space-y-1 sticky top-24">
          {categories.map((category) => {
            const IconComponent = category.icon ? CATEGORY_ICONS[category.icon] : Settings;
            const isActive = activeCategory === category.id;

            return (
              <button
                key={category.id}
                onClick={() => onChange(category.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left",
                  isActive
                    ? "bg-primary/10 text-primary border-l-2 border-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {IconComponent && <IconComponent className="h-4 w-4" />}
                {category.title}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}

