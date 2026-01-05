/**
 * Reusable Badge Component
 * 
 * Renders badges using the central BADGE_CONFIG.
 * Supports type, status, release, and achievement categories.
 * 
 * @example
 * <Badge category="type" value="bug" />
 * <Badge category="status" value="in_progress" />
 * <Badge category="release" value="now" size="sm" />
 */

import { BADGE_CONFIG, BadgeConfig } from '@/lib/badges';

interface BadgeProps {
    /** Badge category: type, status, release, or achievement */
    category: 'type' | 'status' | 'release' | 'achievement';
    /** Value within the category (e.g., 'bug', 'in_progress', 'now') */
    value: string;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Show full label (true) or just icon (false) */
    showLabel?: boolean;
    /** Additional className */
    className?: string;
}

const SIZE_CLASSES = {
    sm: 'text-[9px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
};

export function Badge({
    category,
    value,
    size = 'md',
    showLabel = true,
    className = '',
}: BadgeProps) {
    const config: BadgeConfig | undefined = BADGE_CONFIG[category]?.[value];

    if (!config) {
        // Fallback for unknown values
        return (
            <span className={`inline-flex items-center rounded font-medium uppercase bg-muted text-muted-foreground ${SIZE_CLASSES[size]} ${className}`}>
                {value}
            </span>
        );
    }

    return (
        <span
            className={`inline-flex items-center gap-1 rounded font-medium uppercase ${config.className} ${SIZE_CLASSES[size]} ${className}`}
        >
            {config.pulse && <span className="animate-pulse">●</span>}
            {showLabel ? config.label : config.icon}
        </span>
    );
}

export default Badge;
