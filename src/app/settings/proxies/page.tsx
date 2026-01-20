"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { SettingsLayout } from "@/components/settings";
import { ProxyMemberManagement } from "@/components/league/ProxyMemberManagement";

const NAV_ITEMS = [
    { label: "Profile", href: "/settings/profile" },
    { label: "Preferences", href: "/settings/preferences" },
    { label: "Proxies", href: "/settings/proxies" },
];

export default function ProxySettingsPage() {
    const { user } = useAuth();

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Please log in to access settings.</p>
            </div>
        );
    }

    return (
        <SettingsLayout
            title="Proxy Management"
            description="Create and manage proxy profiles for people who haven't signed up yet"
            navItems={NAV_ITEMS}
        >
            <div className="space-y-6">
                <div className="rounded-lg border border-border bg-card/50 p-4">
                    <h3 className="text-sm font-medium text-foreground mb-2">What are proxies?</h3>
                    <p className="text-sm text-muted-foreground">
                        Proxies are placeholder profiles you can create to track steps for friends
                        or family members who haven't joined yet. Once they're ready to take over
                        their account, share the <strong>Claim Link</strong> with them.
                    </p>
                </div>

                <ProxyMemberManagement />
            </div>
        </SettingsLayout>
    );
}

