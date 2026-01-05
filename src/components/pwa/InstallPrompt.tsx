"use client";

import { usePWA } from "@/hooks/usePWA";
import { Button } from "@/components/ui/button";
import { Download, Share, PlusSquare } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";

/**
 * PWA Install Prompt Component
 * 
 * Logic:
 * - Android/Chrome: Shows native install prompt on button click
 * - iOS: Shows instructions dialog (Share -> Add to Home Screen)
 * - Standalone: Hides itself
 */
interface InstallPromptProps {
    className?: string;
}

export function InstallPrompt({ className }: InstallPromptProps = {}) {
    const { isInstallable, isIOS, isStandalone, promptInstall } = usePWA();
    const [open, setOpen] = useState(false);

    // If already installed, don't show anything
    if (isStandalone) return null;

    // Render nothing if not installable and not iOS (e.g. standard desktop browser without PWA support)
    if (!isInstallable && !isIOS) return null;

    if (isIOS) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className={`gap-2 ${className}`}>
                        <Download className="h-4 w-4" />
                        Install App
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Install StepLeague</DialogTitle>
                        <DialogDescription>
                            Install the app on your iPhone for the best experience.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 text-sm mt-2">
                        <div className="flex items-center gap-3">
                            <Share className="h-5 w-5 text-sky-500" />
                            <p>1. Tap the <strong>Share</strong> button in the menu bar.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <PlusSquare className="h-5 w-5 text-sky-500" />
                            <p>2. Scroll down and tap <strong>Add to Home Screen</strong>.</p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Button
            variant="outline"
            size="sm"
            className={`gap-2 border-sky-500/50 text-sky-500 hover:bg-sky-500/10 ${className}`}
            onClick={promptInstall}
        >
            <Download className="h-4 w-4" />
            Install App
        </Button>
    );
}
