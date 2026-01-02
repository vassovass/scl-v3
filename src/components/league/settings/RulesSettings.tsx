"use client";

import { League } from "@/types/database";
import { SettingsSection } from "./SettingsSection";

interface RulesSettingsProps {
    league: League;
    onChange: (updates: Partial<League>) => void;
    disabled?: boolean;
}

export function RulesSettings({ league, onChange, disabled }: RulesSettingsProps) {

    const Toggle = ({
        label,
        description,
        checked,
        onToggle
    }: {
        label: string,
        description: string,
        checked: boolean,
        onToggle: (val: boolean) => void
    }) => (
        <div className="flex items-start justify-between gap-4 py-3">
            <div>
                <p className="font-medium text-slate-300">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => !disabled && onToggle(!checked)}
                disabled={disabled}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${checked ? "bg-sky-500" : "bg-slate-700"
                    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
                <span className="sr-only">Use setting</span>
                <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? "translate-x-5" : "translate-x-0"
                        }`}
                />
            </button>
        </div>
    );

    return (
        <SettingsSection
            title="League Rules & Visibility"
            description="Set permissions for submissions and privacy."
        >
            <div className="divide-y divide-slate-800/50">
                <Toggle
                    label="Allow Manual Entry"
                    description="If disabled, members cannot manually type their step counts and must use verified upload methods (if available)."
                    checked={league.allow_manual_entry ?? true}
                    onToggle={(val) => onChange({ allow_manual_entry: val })}
                />

                <Toggle
                    label="Require Verification Photos"
                    description="If enabled, all step submissions must include a screenshot proof."
                    checked={league.require_verification_photo ?? false}
                    onToggle={(val) => onChange({ require_verification_photo: val })}
                />

                <Toggle
                    label="Public League"
                    description="If enabled, your league will appear in the public league directory for anyone to find and join."
                    checked={league.is_public ?? false}
                    onToggle={(val) => onChange({ is_public: val })}
                />
            </div>
        </SettingsSection>
    );
}
