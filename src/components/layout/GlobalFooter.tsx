"use client";

import Link from "next/link";
import { APP_CONFIG } from "@/lib/config";
import { useMenuConfig } from "@/hooks/useMenuConfig";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Logo } from "@/components/ui/Logo";

export function GlobalFooter() {
    const currentYear = new Date().getFullYear();

    // Get menu items from database (with static fallback)
    const { menus } = useMenuConfig();

    const navigationItems = menus.footerNavigation?.items || [];
    const accountItems = menus.footerAccount?.items || [];
    const legalItems = menus.footerLegal?.items || [];

    return (
        <footer className="border-t border-border bg-background mt-auto">
            <div className="mx-auto max-w-6xl px-4 py-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <Logo size="sm" />
                        <p className="mt-2 text-xs text-muted-foreground">
                            {APP_CONFIG.tagline}
                        </p>
                    </div>

                    {/* Navigation Column */}
                    <div>
                        <h4 className="text-sm font-medium text-foreground mb-3">
                            {menus.footerNavigation?.label || "Navigation"}
                        </h4>
                        <ul className="space-y-2">
                            {navigationItems.map(item => (
                                <li key={item.id}>
                                    <Link
                                        href={item.href || '#'}
                                        className="text-sm text-muted-foreground hover:text-primary transition"
                                        data-module-id={`footer-${item.id}`}
                                        data-module-name={item.label}
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Account Column */}
                    <div>
                        <h4 className="text-sm font-medium text-foreground mb-3">
                            {menus.footerAccount?.label || "Account"}
                        </h4>
                        <ul className="space-y-2">
                            {accountItems.map(item => (
                                <li key={item.id}>
                                    <Link
                                        href={item.href || '#'}
                                        className="text-sm text-muted-foreground hover:text-foreground transition"
                                        data-module-id={`footer-${item.id}`}
                                        data-module-name={item.label}
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal Column */}
                    <div>
                        <h4 className="text-sm font-medium text-foreground mb-3">
                            {menus.footerLegal?.label || "Legal"}
                        </h4>
                        <ul className="space-y-2">
                            {legalItems.map(item => (
                                <li key={item.id}>
                                    <Link
                                        href={item.href || '#'}
                                        className="text-sm text-muted-foreground hover:text-foreground transition"
                                        data-module-id={`footer-${item.id}`}
                                        data-module-name={item.label}
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <FooterBottomBar currentYear={currentYear} />
            </div>
        </footer>
    );
}

function FooterBottomBar({ currentYear }: { currentYear: number }) {
    const { getSetting, isLoading } = useAppSettings();

    // Get development stage from settings
    const stageData = getSetting('development_stage', { stage: 'pre-alpha', badge_visible: true });

    // Stage display configuration
    const stageConfig: Record<string, { label: string; color: string; glowColor: string }> = {
        'pre-alpha': { label: 'Pre-Alpha', color: 'text-purple-400', glowColor: 'bg-purple-500' },
        'alpha': { label: 'Alpha', color: 'text-[hsl(var(--info))]', glowColor: 'bg-[hsl(var(--info))]' },
        'beta': { label: 'Beta', color: 'text-[hsl(var(--warning))]', glowColor: 'bg-amber-500' },
        'product-hunt': { label: 'Product Hunt', color: 'text-orange-400', glowColor: 'bg-orange-500' },
        'production': { label: 'Production', color: 'text-emerald-400', glowColor: 'bg-emerald-500' },
    };

    const currentStage = stageConfig[stageData.stage] || stageConfig['beta'];

    return (
        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
                © {currentYear} {APP_CONFIG.name}. All rights reserved.
            </p>
            )}
            
            {/* Version Info */}
            <div className="flex items-center gap-4">
                {!isLoading && stageData.badge_visible && (
                    <Link
                        href="/stage-info"
                        className="flex items-center gap-4 text-xs text-muted-foreground hover:text-foreground transition group"
                    >
                        <span className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${currentStage.glowColor} animate-pulse`} />
                            <span className={`${currentStage.color} group-hover:underline`}>
                                {currentStage.label}
                            </span>
                        </span>
                    </Link>
                )}
                
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 font-mono">
                   <span>v{process.env.NEXT_PUBLIC_APP_VERSION}</span>
                   {process.env.NEXT_PUBLIC_COMMIT_SHA && (
                       <span>({process.env.NEXT_PUBLIC_COMMIT_SHA.substring(0, 7)})</span>
                   )}
                </div>
            </div>
        </div>
    );
}
