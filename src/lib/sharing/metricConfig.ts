/**
 * Metric Configuration System
 *
 * Single source of truth for metric types and share card configurations.
 * Designed to be metric-agnostic for future expansion (PRD-48).
 *
 * @module lib/sharing/metricConfig
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Supported metric types
 * Currently only 'steps' is active; others are placeholders for PRD-48
 */
export type MetricType =
  | 'steps'
  | 'calories'
  | 'slp'
  | 'distance'
  | 'swimming'
  | 'cycling'
  | 'running';

/**
 * Card types for sharing
 */
export type CardType =
  | 'daily'
  | 'weekly'
  | 'personal_best'
  | 'streak'
  | 'rank'
  | 'challenge'
  | 'rank_change'
  | 'custom_period';

/**
 * Configuration for each metric type
 */
export interface MetricConfig {
  type: MetricType;
  displayName: string;
  unit: string;
  unitPlural: string;
  emoji: string;
  gradient: string;
  gradientDark: string;
  formatValue: (value: number) => string;
}

/**
 * Configuration for each card type
 */
export interface CardTypeConfig {
  type: CardType;
  label: string;
  description: string;
  emoji: string;
  defaultMetric: MetricType;
}

// ============================================================================
// Metric Configurations
// ============================================================================

export const METRIC_CONFIGS: Record<MetricType, MetricConfig> = {
  steps: {
    type: 'steps',
    displayName: 'Steps',
    unit: 'step',
    unitPlural: 'steps',
    emoji: '🚶',
    gradient: 'from-sky-500 to-emerald-500',
    gradientDark: 'from-sky-600 to-emerald-600',
    formatValue: (v) => v.toLocaleString(),
  },
  calories: {
    type: 'calories',
    displayName: 'Calories',
    unit: 'kcal',
    unitPlural: 'kcal',
    emoji: '🔥',
    gradient: 'from-orange-500 to-red-500',
    gradientDark: 'from-orange-600 to-red-600',
    formatValue: (v) => v.toLocaleString(),
  },
  slp: {
    type: 'slp',
    displayName: 'SLP',
    unit: 'SLP',
    unitPlural: 'SLP',
    emoji: '⚡',
    gradient: 'from-purple-500 to-pink-500',
    gradientDark: 'from-purple-600 to-pink-600',
    formatValue: (v) => v.toLocaleString(),
  },
  distance: {
    type: 'distance',
    displayName: 'Distance',
    unit: 'km',
    unitPlural: 'km',
    emoji: '📍',
    gradient: 'from-teal-500 to-cyan-500',
    gradientDark: 'from-teal-600 to-cyan-600',
    formatValue: (v) => v.toFixed(1),
  },
  swimming: {
    type: 'swimming',
    displayName: 'Swimming',
    unit: 'lap',
    unitPlural: 'laps',
    emoji: '🏊',
    gradient: 'from-blue-500 to-indigo-500',
    gradientDark: 'from-blue-600 to-indigo-600',
    formatValue: (v) => v.toLocaleString(),
  },
  cycling: {
    type: 'cycling',
    displayName: 'Cycling',
    unit: 'km',
    unitPlural: 'km',
    emoji: '🚴',
    gradient: 'from-lime-500 to-green-500',
    gradientDark: 'from-lime-600 to-green-600',
    formatValue: (v) => v.toFixed(1),
  },
  running: {
    type: 'running',
    displayName: 'Running',
    unit: 'km',
    unitPlural: 'km',
    emoji: '🏃',
    gradient: 'from-rose-500 to-orange-500',
    gradientDark: 'from-rose-600 to-orange-600',
    formatValue: (v) => v.toFixed(1),
  },
};

// ============================================================================
// Card Type Configurations
// ============================================================================

export const CARD_TYPE_CONFIGS: Record<CardType, CardTypeConfig> = {
  daily: {
    type: 'daily',
    label: 'Daily',
    description: "Today's achievement",
    emoji: '📅',
    defaultMetric: 'steps',
  },
  weekly: {
    type: 'weekly',
    label: 'Weekly',
    description: "This week's total",
    emoji: '📊',
    defaultMetric: 'steps',
  },
  personal_best: {
    type: 'personal_best',
    label: 'Personal Best',
    description: 'Your all-time record',
    emoji: '🏆',
    defaultMetric: 'steps',
  },
  streak: {
    type: 'streak',
    label: 'Streak',
    description: 'Consecutive days active',
    emoji: '🔥',
    defaultMetric: 'steps',
  },
  rank: {
    type: 'rank',
    label: 'Rank',
    description: 'Your league position',
    emoji: '🥇',
    defaultMetric: 'steps',
  },
  challenge: {
    type: 'challenge',
    label: 'Challenge',
    description: 'Challenge your friends',
    emoji: '💪',
    defaultMetric: 'steps',
  },
  rank_change: {
    type: 'rank_change',
    label: 'Rank Change',
    description: 'Your rank improvement',
    emoji: '🚀',
    defaultMetric: 'steps',
  },
  custom_period: {
    type: 'custom_period',
    label: 'Custom',
    description: 'Any date range you choose',
    emoji: '📆',
    defaultMetric: 'steps',
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the full config for a metric type
 */
export function getMetricConfig(type: MetricType): MetricConfig {
  return METRIC_CONFIGS[type] ?? METRIC_CONFIGS.steps;
}

/**
 * Get the full config for a card type
 */
export function getCardTypeConfig(type: CardType): CardTypeConfig {
  return CARD_TYPE_CONFIGS[type] ?? CARD_TYPE_CONFIGS.daily;
}

/**
 * Format a value with its unit
 * @example formatWithUnit(12345, 'steps') => "12,345 steps"
 */
export function formatWithUnit(value: number, metricType: MetricType): string {
  const config = getMetricConfig(metricType);
  const formattedValue = config.formatValue(value);
  const unit = value === 1 ? config.unit : config.unitPlural;
  return `${formattedValue} ${unit}`;
}

/**
 * Get the display emoji for a metric
 */
export function getMetricEmoji(type: MetricType): string {
  return getMetricConfig(type).emoji;
}

/**
 * Get the gradient class for a metric (for Tailwind)
 */
export function getMetricGradient(type: MetricType, dark = false): string {
  const config = getMetricConfig(type);
  return dark ? config.gradientDark : config.gradient;
}

/**
 * Get all available card types as options (for selectors)
 */
export function getCardTypeOptions(): { value: CardType; label: string; emoji: string }[] {
  return Object.values(CARD_TYPE_CONFIGS).map((config) => ({
    value: config.type,
    label: config.label,
    emoji: config.emoji,
  }));
}

/**
 * Get all available metric types as options (for selectors)
 */
export function getMetricTypeOptions(): { value: MetricType; label: string; emoji: string }[] {
  return Object.values(METRIC_CONFIGS).map((config) => ({
    value: config.type,
    label: config.displayName,
    emoji: config.emoji,
  }));
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  METRIC_CONFIGS,
  CARD_TYPE_CONFIGS,
  getMetricConfig,
  getCardTypeConfig,
  formatWithUnit,
  getMetricEmoji,
  getMetricGradient,
  getCardTypeOptions,
  getMetricTypeOptions,
};
