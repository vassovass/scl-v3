"use client";

import { SettingsLayout, SettingsSection, SettingsSelect, SettingsRadioGroup } from "@/components/settings";
import { usePreferences } from "@/hooks/usePreferences";
import { useAuth } from "@/components/providers/AuthProvider";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
    { label: "Profile", href: "/settings/profile" },
    { label: "Preferences", href: "/settings/preferences" },
    { label: "Proxies", href: "/settings/proxies" },
];

export default function PreferencesPage() {
    const { user } = useAuth();
    const { preferences, isLoading, updatePreference } = usePreferences();
    const [userLeagues, setUserLeagues] = useState<Array<{ value: string; label: string }>>([]);

    // Fetch user's leagues for primary league selector
    useEffect(() => {
        if (!user) return;

        const fetchLeagues = async () => {
            try {
                const res = await fetch("/api/leagues");
                if (res.ok) {
                    const { leagues } = await res.json();
                    setUserLeagues([
                        { value: "none", label: "None" },
                        ...leagues.map((l: any) => ({
                            value: l.id,
                            label: l.name,
                        })),
                    ]);
                }
            } catch (err) {
                console.error("Failed to fetch leagues:", err);
            }
        };

        fetchLeagues();
    }, [user]);

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Please log in to access settings.</p>
            </div>
        );
    }

    if (isLoading || !preferences) {
        return (
            <SettingsLayout
                title="Preferences"
                description="Customize your StepLeague experience"
                navItems={NAV_ITEMS}
            >
                <div className="text-center py-12 text-muted-foreground">
                    Loading preferences...
                </div>
            </SettingsLayout>
        );
    }

    return (
        <SettingsLayout
            title="Preferences"
            description="Customize your StepLeague experience"
            navItems={NAV_ITEMS}
        >
            {/* Navigation Preferences */}
            <SettingsSection
                title="Navigation"
                description="Control your app flow and default actions"
            >
                <SettingsSelect
                    label="Default Landing Page"
                    description="Where to navigate after login"
                    value={preferences.default_landing}
                    onChange={(value) => updatePreference("default_landing", value as any)}
                    options={[
                        { value: "dashboard", label: "My Leagues" },
                        { value: "submit", label: "Submit Steps" },
                        { value: "progress", label: "My Progress" },
                        { value: "rankings", label: "League Rankings" },
                    ]}
                />

                {userLeagues.length > 1 && (
                    <SettingsSelect
                        label="Primary League"
                        description="Used for quick links and default actions"
                        value={preferences.primary_league_id || "none"}
                        onChange={(value) => updatePreference("primary_league_id", value === "none" ? null : value)}
                        options={userLeagues}
                    />
                )}
            </SettingsSection>

            {/* Reminder Preferences */}
            <SettingsSection
                title="Step Reminders"
                description="Customize how you're reminded to submit steps"
            >
                <SettingsRadioGroup
                    label="Reminder Display"
                    description="Choose how step submission reminders appear"
                    value={preferences.reminder_style}
                    onChange={(value) => updatePreference("reminder_style", value as any)}
                    options={[
                        {
                            value: "floating",
                            label: "Floating button",
                            description: "Always visible in corner of screen",
                        },
                        {
                            value: "badge",
                            label: "Badge only",
                            description: "Subtle notification dot on league cards",
                        },
                        {
                            value: "card",
                            label: "Card in league hub",
                            description: "Shows on league page only",
                        },
                    ]}
                />
            </SettingsSection>

            {/* Appearance - Commented out until light mode is fully implemented
            <SettingsSection
                title="Appearance"
                description="Customize the look and feel"
            >
                <SettingsRadioGroup
                    label="Theme"
                    description="Choose your preferred color scheme"
                    value={preferences.theme}
                    onChange={(value) => updatePreference("theme", value as any)}
                    options={[
                        { value: "dark", label: "Dark", description: "Dark theme" },
                        { value: "light", label: "Light", description: "Light theme" },
                        { value: "system", label: "System", description: "Follow system preference" },
                    ]}
                />
            </SettingsSection>
            */}
        </SettingsLayout>
    );
}

