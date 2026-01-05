"use client";

import Link from "next/link";
import { APP_CONFIG } from "@/lib/config";
import { MENUS } from "@/lib/menuConfig";

export function GlobalFooter() {
    const currentYear = new Date().getFullYear();

    // Get menu items from centralized config
    const navigationItems = MENUS.footerNavigation.items;
    const accountItems = MENUS.footerAccount.items;
    const legalItems = MENUS.footerLegal.items;

    return (
        <footer className="border-t border-border bg-background mt-auto">
            <div className="mx-auto max-w-6xl px-4 py-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/dashboard" className="group flex items-center gap-2">
                            <span className="text-xl">👟</span>
                            <span className="font-bold">
                                <span className="text-foreground transition-colors group-hover:text-primary">Step</span>
                                <span className="text-sky-500 transition-colors group-hover:text-foreground">League</span>
                            </span>
                        </Link>
                        <p className="mt-2 text-xs text-muted-foreground">
                            {APP_CONFIG.tagline}
                        </p>
                    </div>

                    {/* Navigation Column */}
                    <div>
                        <h4 className="text-sm font-medium text-foreground mb-3">
                            {MENUS.footerNavigation.label}
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
                            {MENUS.footerAccount.label}
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
                            {MENUS.footerLegal.label}
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
                <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-muted-foreground">
                        © {currentYear} {APP_CONFIG.name}. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Beta
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
