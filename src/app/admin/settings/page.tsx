"use client";

import { useState, useCallback } from "react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { toast } from "@/hooks/use-toast";
import { APP_SETTING_SECTIONS } from "@/lib/settings/appSettings";
import { AppSettingCategory } from "@/lib/settings/appSettingsTypes";
import { SettingRenderer, CategoryNav, VisibilityControls, SettingsAuditLog, PresetsManager } from "@/components/admin/settings";
import { SettingsSection } from "@/components/settings";

interface StageOption {
  value: string;
  label: string;
  color?: string;
}

/**
 * SuperAdmin Settings Page
 * PRD-26: SuperAdmin Settings & Feature Flags
 */
export default function AdminSettingsPage() {
  const { settings, getSetting, updateSetting, updateVisibility, isLoading, refresh } = useAppSettings();
  const [activeCategory, setActiveCategory] = useState<AppSettingCategory>("limits");
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());

  // Get the active section from registry
  const activeSection = APP_SETTING_SECTIONS.find((s) => s.id === activeCategory);

  // Handle setting value change
  const handleSettingChange = useCallback(
    async (key: string, value: unknown) => {
      setSavingKeys((prev) => new Set(prev).add(key));
      try {
        await updateSetting(key, value);
        toast({
          title: "Setting Updated",
          description: `${key} has been updated successfully`,
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to update setting",
          variant: "destructive",
        });
      } finally {
        setSavingKeys((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [updateSetting]
  );

  // Handle visibility change
  const handleVisibilityChange = useCallback(
    async (
      key: string,
      updates: {
        visible_to?: string[];
        editable_by?: string[];
        show_in_league_settings?: boolean;
      }
    ) => {
      setSavingKeys((prev) => new Set(prev).add(key));
      try {
        await updateVisibility(key, updates);
        toast({
          title: "Visibility Updated",
          description: `Visibility settings for ${key} have been updated`,
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to update visibility",
          variant: "destructive",
        });
      } finally {
        setSavingKeys((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [updateVisibility]
  );

  // Special handler for development stage (complex value)
  const handleStageChange = async (newStage: string) => {
    const currentStage = getSetting("development_stage", { stage: "pre-alpha", badge_visible: true });
    await handleSettingChange("development_stage", {
      stage: newStage,
      badge_visible: currentStage.badge_visible,
    });
  };

  const handleBadgeVisibilityToggle = async () => {
    const currentStage = getSetting("development_stage", { stage: "pre-alpha", badge_visible: true });
    await handleSettingChange("development_stage", {
      stage: currentStage.stage,
      badge_visible: !currentStage.badge_visible,
    });
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; border: string; text: string }> = {
      purple: { bg: "bg-purple-900/20", border: "border-purple-600/30", text: "text-purple-400" },
      blue: { bg: "bg-[hsl(var(--info)/0.2)]", border: "border-[hsl(var(--info)/0.3)]", text: "text-[hsl(var(--info))]" },
      amber: { bg: "bg-amber-900/20", border: "border-amber-600/30", text: "text-[hsl(var(--warning))]" },
      orange: { bg: "bg-orange-900/20", border: "border-orange-600/30", text: "text-orange-400" },
      green: { bg: "bg-emerald-900/20", border: "border-emerald-600/30", text: "text-emerald-400" },
    };
    return colorMap[color] || colorMap.blue;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="mx-auto max-w-5xl">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-muted rounded mb-2"></div>
            <div className="h-4 w-96 bg-muted rounded mb-8"></div>
            <div className="flex gap-6">
              <div className="hidden md:block w-48">
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-10 bg-muted rounded"></div>
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <div className="h-64 bg-card rounded-lg border border-border"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render the general section with development stage UI
  const renderGeneralSection = () => {
    const developmentStageSetting = settings["development_stage"];
    const currentStage = getSetting("development_stage", { stage: "pre-alpha", badge_visible: true });
    const stageOptions: StageOption[] = developmentStageSetting?.value_options || [];
    const isSaving = savingKeys.has("development_stage");

    return (
      <div className="space-y-6">
        {/* Development Stage Section */}
        <SettingsSection
          title="Development Stage"
          description="Current stage of development shown across the app"
        >
          {/* Stage Selector */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground block">Current Stage</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stageOptions.map((option) => {
                const isActive = currentStage.stage === option.value;
                const colors = getColorClasses(option.color || "blue");

                return (
                  <button
                    key={option.value}
                    onClick={() => handleStageChange(option.value)}
                    disabled={isSaving || isActive}
                    className={`
                      relative p-4 rounded-lg border-2 transition-all text-left
                      ${
                        isActive
                          ? `${colors.bg} ${colors.border}`
                          : "bg-muted/30 border-border hover:border-muted-foreground/30"
                      }
                      ${isSaving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                    `}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-semibold ${isActive ? colors.text : "text-foreground"}`}>
                        {option.label}
                      </span>
                      {isActive && (
                        <span className="text-xs font-medium px-2 py-1 rounded bg-primary/20 text-primary">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{option.value}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Badge Visibility Toggle */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-start justify-between gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  Show Stage Badge
                </label>
                <p className="text-xs text-muted-foreground">
                  Display the development stage badge in the footer and across the app
                </p>
              </div>
              <button
                onClick={handleBadgeVisibilityToggle}
                disabled={isSaving}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${currentStage.badge_visible ? "bg-primary" : "bg-muted"}
                  ${isSaving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-background transition-transform
                    ${currentStage.badge_visible ? "translate-x-6" : "translate-x-1"}
                  `}
                />
              </button>
            </div>
          </div>

          {/* Info Link */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Users can learn more about the current stage at{" "}
              <a href="/stage-info" target="_blank" className="text-primary hover:underline">
                /stage-info
              </a>
            </p>
          </div>
        </SettingsSection>
      </div>
    );
  };

  // Render regular settings sections
  const renderSettingsSection = () => {
    if (!activeSection) return null;

    // Special handling for general section
    if (activeCategory === "general") {
      return renderGeneralSection();
    }

    return (
      <SettingsSection title={activeSection.title} description={activeSection.description || ""}>
        <div className="space-y-6">
          {activeSection.settings.map((definition) => {
            const dbSetting = settings[definition.key];
            const value = dbSetting?.value ?? definition.default;
            const isSaving = savingKeys.has(definition.key);

            return (
              <div key={definition.key} className="pb-4 border-b border-border/50 last:border-0 last:pb-0">
                <SettingRenderer
                  settingKey={definition.key}
                  label={definition.label}
                  description={definition.description}
                  type={definition.type}
                  value={value}
                  onChange={(newValue) => handleSettingChange(definition.key, newValue)}
                  disabled={isSaving}
                  options={definition.options}
                  constraints={definition.constraints}
                />

                {/* Visibility Controls */}
                <VisibilityControls
                  settingKey={definition.key}
                  visibleTo={dbSetting?.visible_to || definition.visibleTo || ["superadmin"]}
                  editableBy={dbSetting?.editable_by || definition.editableBy || ["superadmin"]}
                  showInLeagueSettings={dbSetting?.show_in_league_settings ?? definition.showInLeagueSettings ?? false}
                  onUpdate={(updates) => handleVisibilityChange(definition.key, updates)}
                  disabled={isSaving}
                />
              </div>
            );
          })}
        </div>
      </SettingsSection>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">App Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure application-wide settings, feature flags, and limits
          </p>
        </div>

        {/* Presets Manager */}
        <PresetsManager onApplied={refresh} />

        {/* Main Content */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Category Navigation */}
          <CategoryNav
            categories={APP_SETTING_SECTIONS.map((s) => ({
              id: s.id,
              title: s.title,
              icon: s.icon,
            }))}
            activeCategory={activeCategory}
            onChange={setActiveCategory}
          />

          {/* Settings Panel */}
          <div className="flex-1 min-w-0">
            {renderSettingsSection()}

            {/* Audit Log */}
            <SettingsAuditLog />
          </div>
        </div>
      </div>
    </div>
  );
}
