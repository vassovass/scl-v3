"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trackEvent } from "@/lib/analytics";

type ProgressView = "personal" | "league";

interface ProgressToggleProps {
    value: ProgressView;
    onChange: (view: ProgressView) => void;
}

/**
 * Segmented control for switching between Personal and League progress views.
 * PRD 29: Uses shadcn Tabs for accessible, keyboard-navigable toggle.
 */
export function ProgressToggle({ value, onChange }: ProgressToggleProps) {
    return (
        <Tabs
            value={value}
            onValueChange={(v) => {
                const view = v as ProgressView;
                trackEvent("progress_tab_switched", {
                    category: "progress",
                    action: "switch",
                    from: value,
                    to: view,
                });
                onChange(view);
            }}
        >
            <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="personal" className="flex-1 sm:flex-initial">
                    My Progress
                </TabsTrigger>
                <TabsTrigger value="league" className="flex-1 sm:flex-initial">
                    League Progress
                </TabsTrigger>
            </TabsList>
        </Tabs>
    );
}
