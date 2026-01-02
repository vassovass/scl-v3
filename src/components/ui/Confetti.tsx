/**
 * Reusable Celebration/Confetti System
 * 
 * A flexible, extensible confetti component that supports:
 * - Named presets (subtle, standard, achievement, win, epic)
 * - Intensity scaling (1-10) for achievement levels
 * - Specific named achievements with custom configs
 * - Respects prefers-reduced-motion
 * - Lazy loaded for zero initial bundle impact
 * 
 * @example
 * // Using presets
 * triggerConfetti('subtle');        // Corner burst (roadmap)
 * triggerConfetti('achievement');   // Medium celebration
 * triggerConfetti('win');           // Full victory
 * 
 * // With intensity (1-10 scale)
 * triggerConfetti('achievement', { intensity: 6 });
 * 
 * // Named achievements (maps to intensity)
 * triggerConfetti('streak_7');      // 7-day streak = intensity 5
 * triggerConfetti('million_club');  // Million steps = epic!
 * 
 * @module components/ui/Confetti
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

// Type definitions for canvas-confetti
type ConfettiOptions = {
    particleCount?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    ticks?: number;
    origin?: { x?: number; y?: number };
    colors?: string[];
    shapes?: ('square' | 'circle')[];
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
};

type ConfettiFunction = (options?: ConfettiOptions) => Promise<null> | null;

// ============================================================================
// Preset Configurations
// ============================================================================

export type CelebrationPreset =
    | 'subtle'      // Corner burst (roadmap done)
    | 'standard'    // Default celebration
    | 'achievement' // Badge/milestone unlocks
    | 'win'         // Leaderboard victories
    | 'epic';       // Major milestones (million club)

/**
 * Named achievement mappings to intensity levels (1-10)
 * Add new achievements here as they're created
 */
const ACHIEVEMENT_INTENSITY: Record<string, number> = {
    // Streaks
    streak_3: 3,
    streak_7: 5,
    streak_30: 8,

    // Step milestones
    '10k_steps': 4,
    '100k_club': 6,
    '500k_club': 8,
    million_club: 10,

    // Leaderboard
    weekly_first: 7,
    weekly_podium: 5,
    monthly_first: 9,

    // Engagement
    first_submission: 3,
    first_league: 4,
    first_week_complete: 5,

    // Roadmap
    roadmap_shipped: 4,
};

/**
 * Base preset configurations
 * Intensity scaling multiplies these values
 */
const PRESET_CONFIGS: Record<CelebrationPreset, ConfettiOptions> = {
    subtle: {
        particleCount: 25,
        spread: 40,
        origin: { x: 0.9, y: 0.1 },
        startVelocity: 20,
        gravity: 0.8,
        colors: ['#38bdf8', '#a855f7', '#22d3ee'],
    },
    standard: {
        particleCount: 80,
        spread: 60,
        origin: { x: 0.5, y: 0.6 },
        startVelocity: 35,
        colors: ['#38bdf8', '#a855f7', '#22d3ee', '#fbbf24'],
    },
    achievement: {
        particleCount: 120,
        spread: 70,
        origin: { x: 0.5, y: 0.5 },
        startVelocity: 40,
        colors: ['#fbbf24', '#f59e0b', '#fcd34d'], // Gold tones
    },
    win: {
        particleCount: 200,
        spread: 100,
        origin: { x: 0.5, y: 0.5 },
        startVelocity: 50,
        gravity: 0.8,
        colors: ['#fbbf24', '#f59e0b', '#22c55e', '#38bdf8', '#a855f7'],
    },
    epic: {
        particleCount: 300,
        spread: 120,
        origin: { x: 0.5, y: 0.4 },
        startVelocity: 60,
        gravity: 0.7,
        ticks: 200,
        colors: ['#fbbf24', '#f59e0b', '#22c55e', '#38bdf8', '#a855f7', '#ec4899'],
    },
};

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Scale a preset configuration based on intensity (1-10)
 * Mobile-first: reduces particle count on smaller screens for performance
 */
function scaleConfig(baseConfig: ConfettiOptions, intensity: number): ConfettiOptions {
    const scale = Math.max(0.3, Math.min(1.5, intensity / 5)); // 0.3x to 1.5x

    // Mobile-first: reduce particle count on smaller screens for performance
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const mobileScale = isMobile ? 0.6 : 1; // 60% particles on mobile

    return {
        ...baseConfig,
        particleCount: Math.round((baseConfig.particleCount || 100) * scale * mobileScale),
        spread: Math.round((baseConfig.spread || 60) * (0.8 + scale * 0.4)),
        startVelocity: Math.round((baseConfig.startVelocity || 35) * (0.7 + scale * 0.3)),
    };
}

/**
 * Get the appropriate preset for a named achievement
 */
function getPresetForAchievement(achievementName: string): CelebrationPreset {
    const intensity = ACHIEVEMENT_INTENSITY[achievementName] || 5;

    if (intensity >= 9) return 'epic';
    if (intensity >= 7) return 'win';
    if (intensity >= 5) return 'achievement';
    if (intensity >= 3) return 'standard';
    return 'subtle';
}

// Lazy-loaded confetti function
let confettiInstance: ConfettiFunction | null = null;

async function getConfetti(): Promise<ConfettiFunction | null> {
    // Check for reduced motion preference
    if (typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return null;
    }

    if (!confettiInstance) {
        try {
            const module = await import('canvas-confetti');
            confettiInstance = module.default as ConfettiFunction;
        } catch (error) {
            console.warn('Failed to load confetti library:', error);
            return null;
        }
    }

    return confettiInstance;
}

// ============================================================================
// Public API
// ============================================================================

export interface TriggerOptions {
    /** Intensity scale 1-10 (overrides preset defaults) */
    intensity?: number;
    /** Custom colors (overrides preset) */
    colors?: string[];
    /** Custom origin point */
    origin?: { x?: number; y?: number };
    /** Full custom config (merges with preset) */
    custom?: Partial<ConfettiOptions>;
}

/**
 * Trigger a confetti celebration
 * 
 * @param presetOrAchievement - Preset name or specific achievement identifier
 * @param options - Optional customization
 * 
 * @example
 * triggerConfetti('achievement');
 * triggerConfetti('streak_30'); // Named achievement
 * triggerConfetti('win', { intensity: 8 });
 * triggerConfetti('standard', { colors: ['#ff0000'] });
 */
export async function triggerConfetti(
    presetOrAchievement: CelebrationPreset | string,
    options?: TriggerOptions
): Promise<void> {
    const confetti = await getConfetti();
    if (!confetti) return;

    // Determine base preset
    let preset: CelebrationPreset;
    let intensity: number | undefined = options?.intensity;

    if (presetOrAchievement in PRESET_CONFIGS) {
        preset = presetOrAchievement as CelebrationPreset;
    } else if (presetOrAchievement in ACHIEVEMENT_INTENSITY) {
        preset = getPresetForAchievement(presetOrAchievement);
        intensity = intensity ?? ACHIEVEMENT_INTENSITY[presetOrAchievement];
    } else {
        preset = 'standard';
    }

    // Get and scale config
    let config = { ...PRESET_CONFIGS[preset] };

    if (intensity !== undefined) {
        config = scaleConfig(config, intensity);
    }

    // Apply custom overrides
    if (options?.colors) config.colors = options.colors;
    if (options?.origin) config.origin = { ...config.origin, ...options.origin };
    if (options?.custom) config = { ...config, ...options.custom };

    // Fire!
    try {
        await confetti(config);
    } catch (error) {
        console.warn('Confetti error:', error);
    }
}

/**
 * Trigger confetti once per session (use for first-visit celebrations)
 * 
 * @param key - Unique session key for this celebration
 * @param preset - Celebration preset to use
 * @param options - Optional customization
 */
export async function triggerConfettiOnce(
    key: string,
    preset: CelebrationPreset | string = 'subtle',
    options?: TriggerOptions
): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    const storageKey = `confetti_shown_${key}`;

    if (sessionStorage.getItem(storageKey)) {
        return false;
    }

    sessionStorage.setItem(storageKey, 'true');
    await triggerConfetti(preset, options);
    return true;
}

// ============================================================================
// React Hook
// ============================================================================

interface UseConfettiOptions {
    /** Trigger on mount */
    triggerOnMount?: boolean;
    /** Session key for once-per-session trigger */
    onceKey?: string;
    /** Preset to use */
    preset?: CelebrationPreset | string;
    /** Trigger options */
    options?: TriggerOptions;
}

/**
 * React hook for confetti celebrations
 * 
 * @example
 * const { trigger, hasTriggered } = useConfetti({ 
 *   triggerOnMount: true, 
 *   onceKey: 'roadmap_done',
 *   preset: 'subtle' 
 * });
 */
export function useConfetti(opts: UseConfettiOptions = {}) {
    const [hasTriggered, setHasTriggered] = useState(false);

    const trigger = useCallback(async (
        overridePreset?: CelebrationPreset | string,
        overrideOptions?: TriggerOptions
    ) => {
        await triggerConfetti(
            overridePreset ?? opts.preset ?? 'standard',
            overrideOptions ?? opts.options
        );
        setHasTriggered(true);
    }, [opts.preset, opts.options]);

    useEffect(() => {
        if (!opts.triggerOnMount) return;

        if (opts.onceKey) {
            triggerConfettiOnce(opts.onceKey, opts.preset, opts.options)
                .then(triggered => {
                    if (triggered) setHasTriggered(true);
                });
        } else {
            trigger();
        }
    }, [opts.triggerOnMount, opts.onceKey, opts.preset, opts.options, trigger]);

    return { trigger, hasTriggered };
}

export default { triggerConfetti, triggerConfettiOnce, useConfetti };
