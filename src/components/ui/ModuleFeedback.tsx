"use client";

import { ReactNode, useState, useCallback } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

interface ModuleFeedbackProps {
    children: ReactNode;
    moduleId: string;
    moduleName: string;
    className?: string;
}

export function ModuleFeedback({
    children,
    moduleId,
    moduleName,
    className = "",
}: ModuleFeedbackProps) {
    const [submitted, setSubmitted] = useState<"positive" | "negative" | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFeedback = useCallback(async (type: "positive" | "negative") => {
        if (isSubmitting || submitted) return;
        setIsSubmitting(true);

        try {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );
            const { data: { user } } = await supabase.auth.getUser();

            await supabase.from("module_feedback").insert({
                module_id: moduleId,
                module_name: moduleName,
                feedback_type: type,
                page_url: window.location.pathname,
                user_id: user?.id ?? null,
                user_agent: navigator.userAgent,
            });

            setSubmitted(type);
        } catch {
            // Silently fail — feedback is non-critical
        } finally {
            setIsSubmitting(false);
        }
    }, [isSubmitting, submitted, moduleId, moduleName]);

    return (
        <div className={`group/feedback relative ${className}`} data-module-id={moduleId} data-module-name={moduleName}>
            {children}
            <div className="flex items-center gap-1 opacity-0 group-hover/feedback:opacity-100 transition-opacity duration-200 absolute -bottom-1 right-2 z-10">
                {submitted ? (
                    <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-card/80 backdrop-blur-sm">
                        Thanks!
                    </span>
                ) : (
                    <>
                        <button
                            onClick={() => handleFeedback("positive")}
                            disabled={isSubmitting}
                            className="p-1 rounded text-muted-foreground hover:text-emerald-500 hover:bg-card/80 backdrop-blur-sm transition-colors disabled:opacity-50"
                            aria-label={`Like ${moduleName}`}
                        >
                            <ThumbsUp className="h-3 w-3" />
                        </button>
                        <button
                            onClick={() => handleFeedback("negative")}
                            disabled={isSubmitting}
                            className="p-1 rounded text-muted-foreground hover:text-rose-500 hover:bg-card/80 backdrop-blur-sm transition-colors disabled:opacity-50"
                            aria-label={`Dislike ${moduleName}`}
                        >
                            <ThumbsDown className="h-3 w-3" />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default ModuleFeedback;
