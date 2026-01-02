"use client";

import { ReactNode } from "react";

interface SettingsSectionProps {
    title: string;
    description: string;
    children: ReactNode;
    danger?: boolean;
}

export function SettingsSection({ title, description, children, danger = false }: SettingsSectionProps) {
    return (
        <div className={`rounded-xl border p-6 transition-all duration-300 ${danger
                ? "border-rose-900/50 bg-rose-950/10 shadow-[0_0_20px_rgba(225,29,72,0.1)] hover:border-rose-800/50"
                : "border-slate-800 bg-slate-900/40 shadow-sm hover:border-slate-700 hover:bg-slate-900/60"
            }`}>
            <div className="mb-6">
                <h3 className={`text-lg font-semibold ${danger ? "text-rose-400" : "text-slate-100"}`}>
                    {title}
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                    {description}
                </p>
            </div>
            <div className="space-y-6">
                {children}
            </div>
        </div>
    );
}
