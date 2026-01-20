"use client";

import { ReactNode } from "react";

interface ModuleFeedbackProps {
    children: ReactNode;
    moduleId: string;
    moduleName: string;
    className?: string;
}

/**
 * Wrapper component for inline module feedback.
 * Wraps UI sections and allows users to provide feedback on specific modules.
 * 
 * For MVP: This is a passthrough component that just renders children.
 * Future: Will add thumbs up/down feedback buttons.
 */
export function ModuleFeedback({
    children,
    moduleId,
    moduleName,
    className = "",
}: ModuleFeedbackProps) {
    // For now, just render children as-is
    // TODO: Add inline feedback UI (thumbs up/down) in a future iteration
    return (
        <div className={className} data-module-id={moduleId} data-module-name={moduleName}>
            {children}
        </div>
    );
}

export default ModuleFeedback;

