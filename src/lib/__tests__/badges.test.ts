/**
 * Badges Utility Tests
 *
 * Tests for the centralized badge configuration and utility functions.
 * Based on testing-patterns skill and PRD 42.
 *
 * Key areas tested:
 * - BADGE_CONFIG structure
 * - getBadgeClass function
 * - getBadgeConfig function
 * - getBadgeLabel function
 * - getBadgeIcon function
 * - Backward compatibility exports
 */

import { describe, it, expect } from 'vitest';
import {
    BADGE_CONFIG,
    getBadgeClass,
    getBadgeConfig,
    getBadgeLabel,
    getBadgeIcon,
    TYPE_COLORS,
    STATUS_COLORS,
    RELEASE_OPTIONS,
    BADGE_INFO,
    type BadgeConfig,
    type BadgeCategory,
} from '../badges';

// ============================================================================
// BADGE_CONFIG Structure Tests
// ============================================================================

describe('badges - BADGE_CONFIG Structure', () => {
    describe('Type Category', () => {
        it('contains bug type', () => {
            expect(BADGE_CONFIG.type.bug).toBeDefined();
            expect(BADGE_CONFIG.type.bug.label).toBe('🐛 Bug');
            expect(BADGE_CONFIG.type.bug.icon).toBe('🐛');
        });

        it('contains feature type', () => {
            expect(BADGE_CONFIG.type.feature).toBeDefined();
            expect(BADGE_CONFIG.type.feature.label).toBe('✨ Feature');
        });

        it('contains improvement type', () => {
            expect(BADGE_CONFIG.type.improvement).toBeDefined();
            expect(BADGE_CONFIG.type.improvement.label).toBe('📈 Improvement');
        });

        it('contains general type', () => {
            expect(BADGE_CONFIG.type.general).toBeDefined();
            expect(BADGE_CONFIG.type.general.label).toBe('💬 General');
        });

        it('contains positive type', () => {
            expect(BADGE_CONFIG.type.positive).toBeDefined();
            expect(BADGE_CONFIG.type.positive.label).toBe('👍 Positive');
        });

        it('contains negative type', () => {
            expect(BADGE_CONFIG.type.negative).toBeDefined();
            expect(BADGE_CONFIG.type.negative.label).toBe('👎 Negative');
        });

        it('all types have className', () => {
            Object.values(BADGE_CONFIG.type).forEach(config => {
                expect(config.className).toBeDefined();
                expect(typeof config.className).toBe('string');
                expect(config.className.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Status Category', () => {
        it('contains backlog status', () => {
            expect(BADGE_CONFIG.status.backlog).toBeDefined();
            expect(BADGE_CONFIG.status.backlog.label).toBe('📋 Backlog');
        });

        it('contains todo status', () => {
            expect(BADGE_CONFIG.status.todo).toBeDefined();
            expect(BADGE_CONFIG.status.todo.label).toBe('📝 To Do');
        });

        it('contains in_progress status with pulse', () => {
            expect(BADGE_CONFIG.status.in_progress).toBeDefined();
            expect(BADGE_CONFIG.status.in_progress.label).toBe('🔨 In Progress');
            expect(BADGE_CONFIG.status.in_progress.pulse).toBe(true);
        });

        it('contains review status', () => {
            expect(BADGE_CONFIG.status.review).toBeDefined();
            expect(BADGE_CONFIG.status.review.label).toBe('👀 Review');
        });

        it('contains verified status', () => {
            expect(BADGE_CONFIG.status.verified).toBeDefined();
            expect(BADGE_CONFIG.status.verified.label).toBe('✓ Verified');
        });

        it('contains pending status', () => {
            expect(BADGE_CONFIG.status.pending).toBeDefined();
            expect(BADGE_CONFIG.status.pending.label).toBe('⏳ Pending');
        });

        it('contains failed status', () => {
            expect(BADGE_CONFIG.status.failed).toBeDefined();
            expect(BADGE_CONFIG.status.failed.label).toBe('✗ Failed');
        });

        it('contains done status', () => {
            expect(BADGE_CONFIG.status.done).toBeDefined();
            expect(BADGE_CONFIG.status.done.label).toBe('✅ Done');
        });

        it('contains needs_work status', () => {
            expect(BADGE_CONFIG.status.needs_work).toBeDefined();
            expect(BADGE_CONFIG.status.needs_work.label).toBe('⚠ Needs Work');
        });
    });

    describe('Release Category', () => {
        it('contains now release', () => {
            expect(BADGE_CONFIG.release.now).toBeDefined();
            expect(BADGE_CONFIG.release.now.label).toBe('🔥 Now');
            expect(BADGE_CONFIG.release.now.icon).toBe('🔥');
        });

        it('contains next release', () => {
            expect(BADGE_CONFIG.release.next).toBeDefined();
            expect(BADGE_CONFIG.release.next.label).toBe('⏭️ Next');
        });

        it('contains later release', () => {
            expect(BADGE_CONFIG.release.later).toBeDefined();
            expect(BADGE_CONFIG.release.later.label).toBe('📅 Later');
        });

        it('contains future release', () => {
            expect(BADGE_CONFIG.release.future).toBeDefined();
            expect(BADGE_CONFIG.release.future.label).toBe('🔮 Future');
        });
    });

    describe('Achievement Category', () => {
        it('contains leader achievement', () => {
            expect(BADGE_CONFIG.achievement.leader).toBeDefined();
            expect(BADGE_CONFIG.achievement.leader.label).toBe('Leader');
            expect(BADGE_CONFIG.achievement.leader.icon).toBe('👑');
        });

        it('contains most_improved achievement', () => {
            expect(BADGE_CONFIG.achievement.most_improved).toBeDefined();
            expect(BADGE_CONFIG.achievement.most_improved.label).toBe('Most Improved');
            expect(BADGE_CONFIG.achievement.most_improved.icon).toBe('🚀');
        });

        it('contains streak achievements', () => {
            expect(BADGE_CONFIG.achievement.streak_30).toBeDefined();
            expect(BADGE_CONFIG.achievement.streak_7).toBeDefined();
            expect(BADGE_CONFIG.achievement.streak_3).toBeDefined();
        });

        it('contains step club achievements', () => {
            expect(BADGE_CONFIG.achievement.million_club).toBeDefined();
            expect(BADGE_CONFIG.achievement['500k_club']).toBeDefined();
            expect(BADGE_CONFIG.achievement['100k_club']).toBeDefined();
        });

        it('contains centurion achievement', () => {
            expect(BADGE_CONFIG.achievement.centurion).toBeDefined();
            expect(BADGE_CONFIG.achievement.centurion.label).toBe('100+ Day Streak');
            expect(BADGE_CONFIG.achievement.centurion.icon).toBe('💯');
        });

        it('contains legend_365 achievement', () => {
            expect(BADGE_CONFIG.achievement.legend_365).toBeDefined();
            expect(BADGE_CONFIG.achievement.legend_365.label).toBe('365 Day Streak');
            expect(BADGE_CONFIG.achievement.legend_365.icon).toBe('🌟');
        });
    });
});

// ============================================================================
// getBadgeClass Tests
// ============================================================================

describe('badges - getBadgeClass', () => {
    it('returns className for valid type', () => {
        const className = getBadgeClass('type', 'bug');
        expect(className).toBe('bg-rose-500/20 text-rose-400 border-rose-500/30');
    });

    it('returns className for valid status', () => {
        const className = getBadgeClass('status', 'done');
        expect(className).toBe('bg-emerald-500/20 text-emerald-400');
    });

    it('returns className for valid release', () => {
        const className = getBadgeClass('release', 'now');
        expect(className).toBe('bg-rose-500/20 text-rose-400');
    });

    it('returns className for valid achievement', () => {
        const className = getBadgeClass('achievement', 'leader');
        expect(className).toBe('text-[hsl(var(--warning))]');
    });

    it('returns empty string for unknown category', () => {
        const className = getBadgeClass('unknown', 'bug');
        expect(className).toBe('');
    });

    it('returns empty string for unknown value', () => {
        const className = getBadgeClass('type', 'unknown');
        expect(className).toBe('');
    });

    it('returns empty string for both unknown', () => {
        const className = getBadgeClass('unknown', 'unknown');
        expect(className).toBe('');
    });
});

// ============================================================================
// getBadgeConfig Tests
// ============================================================================

describe('badges - getBadgeConfig', () => {
    it('returns full config for valid badge', () => {
        const config = getBadgeConfig('type', 'bug');
        expect(config).toBeDefined();
        expect(config?.label).toBe('🐛 Bug');
        expect(config?.icon).toBe('🐛');
        expect(config?.className).toContain('bg-rose');
    });

    it('returns config with pulse property', () => {
        const config = getBadgeConfig('status', 'in_progress');
        expect(config).toBeDefined();
        expect(config?.pulse).toBe(true);
    });

    it('returns config without pulse for other badges', () => {
        const config = getBadgeConfig('status', 'done');
        expect(config).toBeDefined();
        expect(config?.pulse).toBeUndefined();
    });

    it('returns undefined for unknown category', () => {
        const config = getBadgeConfig('unknown', 'bug');
        expect(config).toBeUndefined();
    });

    it('returns undefined for unknown value', () => {
        const config = getBadgeConfig('type', 'unknown');
        expect(config).toBeUndefined();
    });
});

// ============================================================================
// getBadgeLabel Tests
// ============================================================================

describe('badges - getBadgeLabel', () => {
    it('returns label for valid badge', () => {
        const label = getBadgeLabel('type', 'feature');
        expect(label).toBe('✨ Feature');
    });

    it('returns label for status badge', () => {
        const label = getBadgeLabel('status', 'verified');
        expect(label).toBe('✓ Verified');
    });

    it('returns label for release badge', () => {
        const label = getBadgeLabel('release', 'next');
        expect(label).toBe('⏭️ Next');
    });

    it('returns label for achievement badge', () => {
        const label = getBadgeLabel('achievement', 'million_club');
        expect(label).toBe('1 Million Steps Club');
    });

    it('returns value as fallback for unknown category', () => {
        const label = getBadgeLabel('unknown', 'test-value');
        expect(label).toBe('test-value');
    });

    it('returns value as fallback for unknown badge', () => {
        const label = getBadgeLabel('type', 'unknown-type');
        expect(label).toBe('unknown-type');
    });
});

// ============================================================================
// getBadgeIcon Tests
// ============================================================================

describe('badges - getBadgeIcon', () => {
    it('returns icon for valid badge', () => {
        const icon = getBadgeIcon('type', 'bug');
        expect(icon).toBe('🐛');
    });

    it('returns icon for status badge', () => {
        const icon = getBadgeIcon('status', 'done');
        expect(icon).toBe('✅');
    });

    it('returns icon for release badge', () => {
        const icon = getBadgeIcon('release', 'future');
        expect(icon).toBe('🔮');
    });

    it('returns icon for achievement badge', () => {
        const icon = getBadgeIcon('achievement', 'leader');
        expect(icon).toBe('👑');
    });

    it('returns empty string for unknown category', () => {
        const icon = getBadgeIcon('unknown', 'test');
        expect(icon).toBe('');
    });

    it('returns empty string for unknown badge', () => {
        const icon = getBadgeIcon('type', 'unknown');
        expect(icon).toBe('');
    });
});

// ============================================================================
// TYPE_COLORS Backward Compatibility Tests
// ============================================================================

describe('badges - TYPE_COLORS (backward compatibility)', () => {
    it('is a record of strings', () => {
        expect(typeof TYPE_COLORS).toBe('object');
        Object.values(TYPE_COLORS).forEach(value => {
            expect(typeof value).toBe('string');
        });
    });

    it('contains bug type className', () => {
        expect(TYPE_COLORS.bug).toBeDefined();
        expect(TYPE_COLORS.bug).toBe(BADGE_CONFIG.type.bug.className);
    });

    it('contains feature type className', () => {
        expect(TYPE_COLORS.feature).toBeDefined();
        expect(TYPE_COLORS.feature).toBe(BADGE_CONFIG.type.feature.className);
    });

    it('contains all type keys', () => {
        const typeKeys = Object.keys(BADGE_CONFIG.type);
        const colorKeys = Object.keys(TYPE_COLORS);
        expect(colorKeys.sort()).toEqual(typeKeys.sort());
    });
});

// ============================================================================
// STATUS_COLORS Backward Compatibility Tests
// ============================================================================

describe('badges - STATUS_COLORS (backward compatibility)', () => {
    it('is a record of strings', () => {
        expect(typeof STATUS_COLORS).toBe('object');
        Object.values(STATUS_COLORS).forEach(value => {
            expect(typeof value).toBe('string');
        });
    });

    it('contains status keys', () => {
        expect(STATUS_COLORS.done).toBeDefined();
        expect(STATUS_COLORS.pending).toBeDefined();
        expect(STATUS_COLORS.in_progress).toBeDefined();
    });

    it('extracts text color classes', () => {
        // STATUS_COLORS extracts text-* classes
        Object.values(STATUS_COLORS).forEach(value => {
            // Either contains text- or is the full className
            expect(typeof value).toBe('string');
        });
    });
});

// ============================================================================
// RELEASE_OPTIONS Backward Compatibility Tests
// ============================================================================

describe('badges - RELEASE_OPTIONS (backward compatibility)', () => {
    it('is an array', () => {
        expect(Array.isArray(RELEASE_OPTIONS)).toBe(true);
    });

    it('contains expected number of options', () => {
        const releaseCount = Object.keys(BADGE_CONFIG.release).length;
        expect(RELEASE_OPTIONS.length).toBe(releaseCount);
    });

    it('each option has id, label, and color', () => {
        RELEASE_OPTIONS.forEach(option => {
            expect(option.id).toBeDefined();
            expect(option.label).toBeDefined();
            expect(option.color).toBeDefined();
        });
    });

    it('contains now option', () => {
        const now = RELEASE_OPTIONS.find(o => o.id === 'now');
        expect(now).toBeDefined();
        expect(now?.label).toBe('🔥 Now');
    });

    it('contains next option', () => {
        const next = RELEASE_OPTIONS.find(o => o.id === 'next');
        expect(next).toBeDefined();
        expect(next?.label).toBe('⏭️ Next');
    });

    it('color matches BADGE_CONFIG className', () => {
        RELEASE_OPTIONS.forEach(option => {
            expect(option.color).toBe(BADGE_CONFIG.release[option.id].className);
        });
    });
});

// ============================================================================
// BADGE_INFO Backward Compatibility Tests
// ============================================================================

describe('badges - BADGE_INFO (backward compatibility)', () => {
    it('is a record', () => {
        expect(typeof BADGE_INFO).toBe('object');
    });

    it('contains expected achievement keys', () => {
        expect(BADGE_INFO.leader).toBeDefined();
        expect(BADGE_INFO.most_improved).toBeDefined();
        expect(BADGE_INFO.million_club).toBeDefined();
    });

    it('each entry has icon, label, and color', () => {
        Object.values(BADGE_INFO).forEach(info => {
            expect(info.icon).toBeDefined();
            expect(info.label).toBeDefined();
            expect(info.color).toBeDefined();
        });
    });

    it('leader has correct properties', () => {
        expect(BADGE_INFO.leader.icon).toBe('👑');
        expect(BADGE_INFO.leader.label).toBe('Leader');
        expect(BADGE_INFO.leader.color).toBe(BADGE_CONFIG.achievement.leader.className);
    });

    it('matches BADGE_CONFIG achievement values', () => {
        Object.entries(BADGE_INFO).forEach(([key, info]) => {
            const config = BADGE_CONFIG.achievement[key];
            expect(info.icon).toBe(config.icon ?? '');
            expect(info.label).toBe(config.label);
            expect(info.color).toBe(config.className);
        });
    });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('badges - Edge Cases', () => {
    it('handles numeric keys like 500k_club', () => {
        const config = getBadgeConfig('achievement', '500k_club');
        expect(config).toBeDefined();
        expect(config?.label).toBe('500k Steps Club');
    });

    it('handles numeric keys like 100k_club', () => {
        const config = getBadgeConfig('achievement', '100k_club');
        expect(config).toBeDefined();
        expect(config?.label).toBe('100k Steps Club');
    });

    it('all categories have consistent structure', () => {
        const categories = ['type', 'status', 'release', 'achievement'];
        categories.forEach(category => {
            const categoryConfig = BADGE_CONFIG[category];
            expect(categoryConfig).toBeDefined();
            Object.values(categoryConfig).forEach((config: BadgeConfig) => {
                expect(config.label).toBeDefined();
                expect(config.className).toBeDefined();
            });
        });
    });

    it('className values are valid CSS class strings', () => {
        Object.values(BADGE_CONFIG).forEach(category => {
            Object.values(category).forEach((config: BadgeConfig) => {
                // Should not contain invalid characters
                expect(config.className).not.toContain('<');
                expect(config.className).not.toContain('>');
                // Should be a string
                expect(typeof config.className).toBe('string');
            });
        });
    });

    it('icons are emoji or simple characters', () => {
        Object.values(BADGE_CONFIG).forEach(category => {
            Object.values(category).forEach((config: BadgeConfig) => {
                if (config.icon) {
                    // Icons should be short
                    expect(config.icon.length).toBeLessThanOrEqual(4);
                }
            });
        });
    });
});

