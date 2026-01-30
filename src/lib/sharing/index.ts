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

// Share content configuration (PRD-57)
export {
  type ShareContentBlock,
  type ShareContentCategory,
  type ShareContentBlockConfig,
  type ShareMessageData,
  type ShareContext,
  SHARE_CONTENT_BLOCKS,
  SHARE_CONTENT_CATEGORIES,
  CONTEXT_DEFAULTS,
  getContentBlockConfig,
  getBlocksByCategory,
  getDefaultBlocks,
  isBlockAvailable,
  getAvailableBlocks,
  validateBlockSelection,
  getBlocksGroupedByCategory,
} from './shareContentConfig';

// Share message builder (PRD-57)
export {
  type BuildMessageOptions,
  type BuildMessageResult,
  buildShareMessage,
  buildBatchSubmissionMessage,
  buildLeagueShareMessage,
  buildComparisonMessage,
  buildDailyBreakdownMessage,
  getRecommendedMaxLength,
  isOptimalLength,
} from './shareMessageBuilder';
