"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, User as UserIcon, Check } from "lucide-react";
import { apiRequest } from "@/lib/api/client";

interface ProxyUser {
    id: string;
    display_name: string | null;
    nickname: string | null;
    created_at: string;
}

export function ProfileSwitcher() {
    const { user, realUser, switchProfile, isActingAsProxy } = useAuth();
    const [proxies, setProxies] = useState<ProxyUser[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (realUser) {
            loadProxies();
        }
    }, [realUser]);

    const loadProxies = async () => {
        try {
            setLoading(true);
            // Use the new API endpoint
            const response = await apiRequest<{ proxies: ProxyUser[] }>("proxies");
            setProxies(response.proxies);
        } catch (error) {
            console.error("Failed to load proxies:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSwitch = (proxy: ProxyUser | null) => {
        if (proxy) {
            // Create a User-like object for the proxy
            // We essentially mock a User object with the proxy's ID and details
            const proxyUser = {
                id: proxy.id,
                email: "", // Proxies don't have emails usually
                role: "authenticated",
                aud: "authenticated",
                created_at: proxy.created_at,
                app_metadata: {},
                user_metadata: {
                    display_name: proxy.display_name,
                    nickname: proxy.nickname,
                },
            } as User;

            switchProfile(proxyUser);
        } else {
            // Switch back to real user
            switchProfile(null);
        }
    };

    if (!realUser) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring">
                {isActingAsProxy ? (
                    <>
                        <Users className="h-4 w-4 text-[hsl(var(--warning))]" />
                        <span className="text-[hsl(var(--warning))] truncate max-w-[100px] sm:max-w-[150px]">
                            {user?.user_metadata?.display_name || "Proxy"}
                        </span>
                    </>
                ) : (
                    <>
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground truncate max-w-[100px] sm:max-w-[150px]">
                            {user?.user_metadata?.display_name || "You"}
                        </span>
                    </>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
                    Active Profile
                </DropdownMenuLabel>

                {/* Main User Option */}
                <DropdownMenuItem
                    onClick={() => handleSwitch(null)}
                    className="flex items-center justify-between cursor-pointer"
                >
                    <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        <div className="flex flex-col">
                            <span className="font-medium">You</span>
                            <span className="text-xs text-muted-foreground">{realUser.user_metadata?.display_name}</span>
                        </div>
                    </div>
                    {!isActingAsProxy && <Check className="h-4 w-4 text-primary" />}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider flex justify-between items-center">
                    <span>Managed Profiles</span>
                    <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-md text-[10px]">{proxies.length}</span>
                </DropdownMenuLabel>

                {loading ? (
                    <div className="p-2 text-xs text-muted-foreground text-center">Loading...</div>
                ) : proxies.length === 0 ? (
                    <div className="p-2 text-xs text-muted-foreground text-center">No managed profiles</div>
                ) : (
                    proxies.map(proxy => (
                        <DropdownMenuItem
                            key={proxy.id}
                            onClick={() => handleSwitch(proxy)}
                            className="flex items-center justify-between cursor-pointer"
                        >
                            <div className="flex items-center gap-2 truncate">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="truncate">{proxy.display_name}</span>
                            </div>
                            {isActingAsProxy && user?.id === proxy.id && <Check className="h-4 w-4 text-primary" />}
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
