"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SettingsNav } from "./SettingsNav";

interface SettingsLayoutProps {
    children: ReactNode;
    title: string;
    description?: string;
    backHref?: string;
    backLabel?: string;
    navItems?: Array<{ label: string; href: string }>;
}

/**
 * Reusable settings page layout
 * Provides consistent structure for all settings pages
 *
 * Usage:
 * - User settings: /settings/*
 * - League settings: /league/[id]/settings
 * - Admin settings: /admin/settings
 */
export function SettingsLayout({
    children,
    title,
    description,
    backHref = "/dashboard",
    backLabel = "Back to Dashboard",
    navItems,
}: SettingsLayoutProps) {
    return (
        <div className="container max-w-5xl px-4 py-8 md:px-6 md:py-12">
            {/* Back link */}
            <Link
                href={backHref}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
            </Link>

            {/* Page header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    {title}
                </h1>
                {description && (
                    <p className="mt-2 text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>

            {/* Navigation tabs */}
            {navItems && navItems.length > 0 && (
                <SettingsNav items={navItems} className="mb-8" />
            )}

            {/* Content */}
            <div className="space-y-6">
                {children}
            </div>
        </div>
    );
}
