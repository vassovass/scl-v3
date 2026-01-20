"use client";

import { useAppSettings } from "@/hooks/useAppSettings";
import { SettingsSection } from "@/components/settings";
import { Badge } from "@/components/ui/Badge";
import { Lock } from "lucide-react";

/**
 * Displays inherited app-level settings in league settings page
 * These are read-only and set by SuperAdmin
 * PRD-26: SuperAdmin Settings & Feature Flags
 */
export function InheritedAppSettings() {
  const { getLeagueInheritedSettings, isLoading } = useAppSettings();
  const inheritedSettings = getLeagueInheritedSettings();

  // Don't render if no inherited settings or still loading
  if (isLoading || inheritedSettings.length === 0) {
    return null;
  }

  // Format value for display
  const formatValue = (value: unknown): string => {
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "number") return value.toLocaleString();
    if (typeof value === "string") return value;
    if (typeof value === "object" && value !== null) {
      // Handle JSON values - show first property or stringify
      const obj = value as Record<string, unknown>;
      if ("value" in obj) return String(obj.value);
      if ("enabled" in obj) return obj.enabled ? "Enabled" : "Disabled";
      return JSON.stringify(value);
    }
    return String(value);
  };

  // Get category-friendly name
  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      limits: "System Limits",
      features: "Features",
      defaults: "Defaults",
      display: "Display",
      general: "General",
    };
    return labels[category] || category;
  };

  // Group settings by category
  const groupedSettings = inheritedSettings.reduce((acc, setting) => {
    const category = setting.category || "general";
    if (!acc[category]) acc[category] = [];
    acc[category].push(setting);
    return acc;
  }, {} as Record<string, typeof inheritedSettings>);

  return (
    <SettingsSection
      title="App-Level Settings"
      description="These settings are configured at the application level by administrators and apply to all leagues."
    >
      <div className="space-y-4">
        {Object.entries(groupedSettings).map(([category, settings]) => (
          <div key={category}>
            {/* Category header if multiple categories */}
            {Object.keys(groupedSettings).length > 1 && (
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {getCategoryLabel(category)}
              </h4>
            )}

            <div className="space-y-2">
              {settings.map((setting) => (
                <div
                  key={setting.key}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 border border-border/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-medium text-foreground truncate">
                        {setting.label}
                      </span>
                    </div>
                    {setting.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 ml-5 truncate">
                        {setting.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <span className="text-sm font-mono text-foreground">
                      {formatValue(setting.value)}
                    </span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      App Setting
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border/50">
          Contact your administrator to modify these settings.
        </p>
      </div>
    </SettingsSection>
  );
}

