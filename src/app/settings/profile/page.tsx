"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { SettingsLayout, SettingsSection, SettingsField } from "@/components/settings";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { IDENTITY_LABEL, IDENTITY_PLACEHOLDER, IDENTITY_DESCRIPTION } from "@/lib/identity";

const NAV_ITEMS = [
    { label: "Profile", href: "/settings/profile" },
    { label: "Preferences", href: "/settings/preferences" },
    { label: "Proxies", href: "/settings/proxies" },
];

interface ProfileData {
    display_name: string;
    email: string;
}

export default function ProfileSettingsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [profile, setProfile] = useState<ProfileData>({
        display_name: "",
        email: "",
    });

    useEffect(() => {
        if (!user) return;

        const fetchProfile = async () => {
            try {
                const res = await fetch("/api/profile");
                if (res.ok) {
                    const data = await res.json();
                    setProfile({
                        display_name: data.display_name || "",
                        email: user.email || "",
                    });
                }
            } catch (err) {
                console.error("Failed to fetch profile:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user]);

    const handleSave = async () => {
        setSaving(true);

        try {
            const res = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    display_name: profile.display_name,
                }),
            });

            if (res.ok) {
                toast({
                    title: "Saved",
                    description: "Profile updated successfully",
                });
            } else {
                const data = await res.json();
                toast({
                    title: "Error",
                    description: data.error || "Failed to save profile",
                    variant: "destructive",
                });
            }
        } catch (err) {
            toast({
                title: "Error",
                description: "Failed to save profile",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Please log in to access settings.</p>
            </div>
        );
    }

    return (
        <SettingsLayout
            title="Profile Settings"
            description="Customize how you appear in leagues"
            navItems={NAV_ITEMS}
        >
            {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : (
                <>
                    <SettingsSection
                        title="Personal Information"
                        description="Your basic profile information"
                    >
                        <SettingsField
                            label="Email"
                            type="email"
                            value={profile.email}
                            onChange={() => { }}
                            disabled={true}
                            description="Email cannot be changed"
                        />

                        <SettingsField
                            label={IDENTITY_LABEL}
                            value={profile.display_name}
                            onChange={(value) => setProfile({ ...profile, display_name: String(value) })}
                            placeholder={IDENTITY_PLACEHOLDER}
                            description={IDENTITY_DESCRIPTION}
                            maxLength={50}
                        />
                    </SettingsSection>

                    <div className="flex justify-end">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            size="lg"
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </>
            )}
        </SettingsLayout>
    );
}

