"use client";

import { useState } from "react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { toast } from "@/hooks/use-toast";

interface StageOption {
  value: string;
  label: string;
  color?: string;
}

export default function AdminSettingsPage() {
  const { settings, getSetting, updateSetting, isLoading } = useAppSettings();
  const [isSaving, setIsSaving] = useState(false);

  const developmentStageSetting = settings['development_stage'];
  const currentStage = getSetting('development_stage', { stage: 'pre-alpha', badge_visible: true });
  const stageOptions: StageOption[] = developmentStageSetting?.value_options || [];

  const handleStageChange = async (newStage: string) => {
    setIsSaving(true);
    try {
      await updateSetting('development_stage', {
        stage: newStage,
        badge_visible: currentStage.badge_visible,
      });
      toast({
        title: "Stage Updated",
        description: `Development stage set to ${newStage}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update stage",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBadgeVisibilityToggle = async () => {
    setIsSaving(true);
    try {
      await updateSetting('development_stage', {
        stage: currentStage.stage,
        badge_visible: !currentStage.badge_visible,
      });
      toast({
        title: "Badge Visibility Updated",
        description: currentStage.badge_visible ? "Badge hidden" : "Badge visible",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update badge visibility",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; border: string; text: string }> = {
      purple: { bg: 'bg-purple-900/20', border: 'border-purple-600/30', text: 'text-purple-400' },
      blue: { bg: 'bg-blue-900/20', border: 'border-blue-600/30', text: 'text-blue-400' },
      amber: { bg: 'bg-amber-900/20', border: 'border-amber-600/30', text: 'text-amber-400' },
      orange: { bg: 'bg-orange-900/20', border: 'border-orange-600/30', text: 'text-orange-400' },
      green: { bg: 'bg-emerald-900/20', border: 'border-emerald-600/30', text: 'text-emerald-400' },
    };
    return colorMap[color] || colorMap.blue;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-4xl">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-muted rounded mb-2"></div>
            <div className="h-4 w-96 bg-muted rounded mb-8"></div>
            <div className="h-64 bg-card rounded-lg border border-border"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">App Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure application-wide settings and feature flags
          </p>
        </div>

        {/* Development Stage Section */}
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              Development Stage
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Current stage of development shown across the app
            </p>
          </div>

          {/* Current Stage Display */}
          <div className="mb-6">
            <label className="text-sm font-medium text-foreground mb-3 block">
              Current Stage
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stageOptions.map((option) => {
                const isActive = currentStage.stage === option.value;
                const colors = getColorClasses(option.color || 'blue');

                return (
                  <button
                    key={option.value}
                    onClick={() => handleStageChange(option.value)}
                    disabled={isSaving || isActive}
                    className={`
                      relative p-4 rounded-lg border-2 transition-all text-left
                      ${isActive
                        ? `${colors.bg} ${colors.border}`
                        : 'bg-muted/30 border-border hover:border-muted-foreground/30'
                      }
                      ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-semibold ${isActive ? colors.text : 'text-foreground'}`}>
                        {option.label}
                      </span>
                      {isActive && (
                        <span className="text-xs font-medium px-2 py-1 rounded bg-primary/20 text-primary">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {option.value}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Badge Visibility Toggle */}
          <div className="pt-6 border-t border-border">
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
                  ${currentStage.badge_visible ? 'bg-primary' : 'bg-muted'}
                  ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-background transition-transform
                    ${currentStage.badge_visible ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
          </div>

          {/* Info Link */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Users can learn more about the current stage at{" "}
              <a href="/beta" target="_blank" className="text-primary hover:underline">
                /beta
              </a>
            </p>
          </div>
        </div>

        {/* Future Settings Placeholder */}
        <div className="mt-6 bg-card/50 rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Additional settings categories (Limits, Features, Defaults) will appear here as they are added.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            See PRD 26 for the full settings system roadmap.
          </p>
        </div>
      </div>
    </div>
  );
}
