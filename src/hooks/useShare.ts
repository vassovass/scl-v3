"use client";

import { useState, useCallback } from "react";
import { APP_CONFIG } from "@/lib/config";
import { analytics } from "@/lib/analytics";

export type SharePlatform = "native" | "whatsapp" | "x" | "copy";


interface UseShareOptions {
    onShare?: (platform: SharePlatform) => void;
    onError?: (error: unknown) => void;
    /** Content type for analytics (e.g., 'achievement', 'invite', 'league') */
    contentType?: string;
    /** ID of the item being shared */
    itemId?: string;
}

interface ShareData {
    title?: string;
    text: string;
    url?: string;
}

export function useShare(options: UseShareOptions = {}) {
    const [isSharing, setIsSharing] = useState(false);
    const [copied, setCopied] = useState(false);

    const share = useCallback(async (data: ShareData, platform: SharePlatform = "native") => {
        setIsSharing(true);
        const url = data.url || (typeof window !== "undefined" ? window.location.href : "");
        // Only append URL if not already in the message (shareMessageBuilder may include it)
        const urlAlreadyInMessage = data.text.includes("stepleague.app") || data.text.includes(url);
        const fullMessage = urlAlreadyInMessage ? data.text : `${data.text}\n${url}`;

        // Track in analytics immediately (capture intent)
        if (options.contentType) {
            analytics.share(options.contentType, options.itemId, platform);
        }

        try {
            switch (platform) {
                case "native":
                    if (navigator.share) {
                        await navigator.share({
                            title: data.title || APP_CONFIG.name,
                            text: data.text,
                            url: url,
                        });
                    } else {
                        // Fallback to copy if native share fails or isn't supported
                        await navigator.clipboard.writeText(fullMessage);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                        options.onShare?.("copy");
                        return; // Exit early since we handled it as a copy
                    }
                    break;

                case "whatsapp":
                    const waUrl = `https://wa.me/?text=${encodeURIComponent(fullMessage)}`;
                    window.open(waUrl, "_blank", "noopener,noreferrer");
                    break;

                case "x":
                    // Note: twitter.com/intent/tweet URL is still used for X sharing (backward compatible)
                    const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(data.text)}&url=${encodeURIComponent(url)}`;
                    window.open(xUrl, "_blank", "noopener,noreferrer");
                    break;

                case "copy":
                    await navigator.clipboard.writeText(fullMessage);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                    break;
            }

            options.onShare?.(platform);
        } catch (error) {
            console.error("Share failed:", error);
            options.onError?.(error);
        } finally {
            setIsSharing(false);
        }
    }, [options]);

    return {
        share,
        isSharing,
        copied,
        supportsNativeShare: typeof navigator !== "undefined" && !!navigator.share,
    };
}

