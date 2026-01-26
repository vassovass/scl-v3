/**
 * Sharing Module
 *
 * Central exports for all sharing-related utilities.
 * PRD-51: Social Sharing & Stats Hub
 *
 * @module lib/sharing
 */

// Metric configuration
export {
  type MetricType,
  type CardType,
  type MetricConfig,
  type CardTypeConfig,
  METRIC_CONFIGS,
  CARD_TYPE_CONFIGS,
  getMetricConfig,
  getCardTypeConfig,
  formatWithUnit,
  getMetricEmoji,
  getMetricGradient,
  getCardTypeOptions,
  getMetricTypeOptions,
} from './metricConfig';

// Share messages
export {
  type ShareData,
  type ShareMessageResult,
  type MilestoneMessage,
  generateShareMessage,
  dailyMessage,
  weeklyMessage,
  personalBestMessage,
  streakMessage,
  rankMessage,
  challengeMessage,
  rankChangeMessage,
  getStreakMilestoneMessage,
  getPersonalBestMessage,
  getRankChangeMessage,
} from './shareMessages';
