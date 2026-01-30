'use client';

/**
 * ShareMilestoneToast Component
 *
 * Displays a celebration when the user hits a share streak milestone.
 * Includes confetti animation (respects prefers-reduced-motion).
 *
 * PRD-56: Sharing Encouragement System
 *
 * @example
 * // Show milestone celebration
 * showMilestoneCelebration({
 *   milestone: 7,
 *   tier: 'bronze',
 *   message: "One week of sharing!",
 *   emoji: '🔥'
 * });
 */

import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MILESTONE_CELEBRATIONS, getStreakTier } from '@/lib/sharing/streaks';
import type { MilestoneCelebration, StreakTier } from '@/lib/sharing/streaks';

/**
 * Props for the milestone celebration hook
 */
interface UseMilestoneCelebrationOptions {
    /** Callback when "Share This" is clicked */
    onShareClick?: () => void;
}

/**
 * Hook to show milestone celebrations
 */
export function useMilestoneCelebration(options?: UseMilestoneCelebrationOptions) {
    const { toast } = useToast();
    const [isAnimating, setIsAnimating] = useState(false);

    const showCelebration = useCallback(
        (celebration: MilestoneCelebration) => {
            const tier = getStreakTier(celebration.milestone);

            // Trigger confetti animation (if not reduced motion)
            // SSR guard: check window exists before accessing matchMedia
            if (typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                setIsAnimating(true);
                triggerConfetti(tier.tier);
                setTimeout(() => setIsAnimating(false), 3000);
            }

            // Show toast with celebration content
            toast({
                title: (
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{celebration.emoji}</span>
                        <span>{celebration.milestone}-Day Streak!</span>
                    </div>
                ) as unknown as string,
                description: (
                    <div className="space-y-2">
                        <p>{celebration.message}</p>
                        {options?.onShareClick && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={options.onShareClick}
                                className="mt-2"
                            >
                                Share This Milestone
                            </Button>
                        )}
                    </div>
                ) as unknown as string,
                duration: 6000,
            });
        },
        [toast, options]
    );

    return {
        showCelebration,
        isAnimating,
    };
}

/**
 * Trigger confetti animation using canvas
 * Lightweight implementation without external dependencies
 */
function triggerConfetti(tier: StreakTier) {
    // SSR guard: ensure we're in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return;
    }

    // Get tier-specific colors
    const tierColors: Record<StreakTier, string[]> = {
        none: ['#888888'],
        bronze: ['#CD7F32', '#FFA500', '#FF8C00'],
        silver: ['#C0C0C0', '#A9A9A9', '#D3D3D3'],
        gold: ['#FFD700', '#FFC107', '#FFEB3B'],
        diamond: ['#00CED1', '#40E0D0', '#7FFFD4'],
    };

    const colors = tierColors[tier];
    const particleCount = 50;
    const particles: Particle[] = [];

    // Get viewport dimensions with fallback
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 800;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 600;

    // Create canvas with try-catch for DOM manipulation
    let canvas: HTMLCanvasElement;
    try {
        canvas = document.createElement('canvas');
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
        `;
        canvas.width = viewportWidth;
        canvas.height = viewportHeight;
        document.body.appendChild(canvas);
    } catch (err) {
        console.warn('[Confetti] Failed to create canvas:', err);
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        try {
            document.body.removeChild(canvas);
        } catch {
            // Canvas may have been removed already
        }
        return;
    }

    // Create particles
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: viewportWidth / 2,
            y: viewportHeight / 2,
            vx: (Math.random() - 0.5) * 20,
            vy: Math.random() * -15 - 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 8 + 4,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10,
            life: 1,
        });
    }

    // Animation loop
    let animationId: number;
    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let activeParticles = 0;

        particles.forEach((p) => {
            if (p.life <= 0) return;
            activeParticles++;

            // Update physics
            p.vy += 0.3; // gravity
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += p.rotationSpeed;
            p.life -= 0.01;

            // Draw particle
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
        });

        if (activeParticles > 0) {
            animationId = requestAnimationFrame(animate);
        } else {
            // Safe cleanup
            try {
                if (canvas.parentNode) {
                    canvas.parentNode.removeChild(canvas);
                }
            } catch {
                // Canvas may have been removed already
            }
        }
    };

    animate();

    // Cleanup after 3 seconds max
    setTimeout(() => {
        try {
            cancelAnimationFrame(animationId);
            if (canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }
        } catch {
            // Canvas may have been removed already
        }
    }, 3000);
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    rotation: number;
    rotationSpeed: number;
    life: number;
}

/**
 * Standalone celebration component that auto-shows on milestone
 */
export function MilestoneCelebrationOverlay({
    celebration,
    onDismiss,
    onShareClick,
}: {
    celebration: MilestoneCelebration;
    onDismiss?: () => void;
    onShareClick?: () => void;
}) {
    const tier = getStreakTier(celebration.milestone);

    // Trigger confetti on mount
    useEffect(() => {
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            triggerConfetti(tier.tier);
        }
    }, [tier.tier]);

    // Get tier-specific gradient
    const tierGradients: Record<StreakTier, string> = {
        none: 'from-muted to-muted/50',
        bronze: 'from-orange-500/20 to-orange-600/10',
        silver: 'from-slate-400/20 to-slate-500/10',
        gold: 'from-yellow-500/20 to-yellow-600/10',
        diamond: 'from-cyan-400/20 to-cyan-500/10',
    };

    return (
        <div
            className={cn(
                'fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm',
                'animate-in fade-in duration-300'
            )}
            onClick={onDismiss}
        >
            <div
                className={cn(
                    'relative mx-4 max-w-sm rounded-2xl border bg-gradient-to-br p-6 shadow-lg',
                    tierGradients[tier.tier],
                    'animate-in zoom-in-95 duration-300'
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Large emoji */}
                <div className="mb-4 text-center text-6xl">
                    {celebration.emoji}
                </div>

                {/* Title */}
                <h2 className="mb-2 text-center text-2xl font-bold">
                    {celebration.milestone}-Day Streak!
                </h2>

                {/* Message */}
                <p className="mb-4 text-center text-muted-foreground">
                    {celebration.message}
                </p>

                {/* Tier badge */}
                <div className="mb-4 text-center">
                    <span className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium',
                        tier.bgClass,
                        tier.colorClass
                    )}>
                        {tier.emoji} {tier.label}
                    </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={onDismiss}
                    >
                        Awesome!
                    </Button>
                    {onShareClick && (
                        <Button
                            className="flex-1"
                            onClick={onShareClick}
                        >
                            Share Milestone
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MilestoneCelebrationOverlay;
