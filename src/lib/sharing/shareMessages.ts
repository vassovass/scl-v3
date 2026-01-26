/**
 * Share Messages Module
 *
 * Pre-filled messages for sharing achievements.
 * Follows WhatsApp best practices: concise (<100 chars), includes emoji and hashtag.
 *
 * @module lib/sharing/shareMessages
 */

import { CardType, MetricType, getMetricConfig, formatWithUnit } from './metricConfig';
import { APP_CONFIG } from '@/lib/config';

// ============================================================================
// Types
// ============================================================================

export interface ShareData {
  metricType: MetricType;
  value: number;
  formattedValue?: string;
  rank?: number;
  oldRank?: number;
  newRank?: number;
  leagueName?: string;
  streakDays?: number;
  improvementPct?: number;
  periodLabel?: string;
  average?: number;
  customMessage?: string;
}

export interface ShareMessageResult {
  text: string;
  hashtag: string;
  fullMessage: string;
}

// ============================================================================
// Message Templates
// ============================================================================

/**
 * Generate share message based on card type and data
 * All messages are designed to be <100 characters (excluding link)
 */
export function generateShareMessage(cardType: CardType, data: ShareData): ShareMessageResult {
  const config = getMetricConfig(data.metricType);
  const formattedValue = data.formattedValue ?? formatWithUnit(data.value, data.metricType);
  const hashtag = APP_CONFIG.hashtag ?? '#StepLeague';

  let text: string;

  switch (cardType) {
    case 'daily':
      text = `Just logged ${formattedValue} today! ${config.emoji}`;
      break;

    case 'weekly':
      if (data.average) {
        const avgFormatted = config.formatValue(data.average);
        text = `My week: ${formattedValue} (avg ${avgFormatted}/day) ${config.emoji}`;
      } else {
        text = `${formattedValue} this week! ${config.emoji}`;
      }
      break;

    case 'personal_best':
      text = `NEW PERSONAL BEST! ${formattedValue} ${config.emoji}`;
      break;

    case 'streak':
      if (data.streakDays) {
        text = `${data.streakDays} days in a row! ${config.emoji}`;
      } else {
        text = `On a streak! ${config.emoji}`;
      }
      break;

    case 'rank':
      if (data.rank && data.leagueName) {
        text = `#${data.rank} in ${data.leagueName}! ${config.emoji}`;
      } else if (data.rank) {
        text = `Ranked #${data.rank}! ${config.emoji}`;
      } else {
        text = `Check out my rank! ${config.emoji}`;
      }
      break;

    case 'challenge':
      text = `Can you beat my ${formattedValue}? ${config.emoji}`;
      break;

    case 'rank_change':
      if (data.oldRank && data.newRank) {
        text = `Moved from #${data.oldRank} to #${data.newRank}! ${config.emoji}`;
      } else if (data.improvementPct && data.improvementPct > 0) {
        text = `Up ${data.improvementPct}% this week! ${config.emoji}`;
      } else {
        text = `Climbing the ranks! ${config.emoji}`;
      }
      break;

    default:
      text = `${formattedValue} ${config.emoji}`;
  }

  // Add custom message if provided (truncate if needed)
  if (data.customMessage) {
    const maxCustomLength = 50;
    const truncatedCustom =
      data.customMessage.length > maxCustomLength
        ? data.customMessage.slice(0, maxCustomLength - 3) + '...'
        : data.customMessage;
    text = `${truncatedCustom} - ${text}`;
  }

  return {
    text,
    hashtag,
    fullMessage: `${text} ${hashtag}`,
  };
}

// ============================================================================
// Quick Message Generators
// ============================================================================

/**
 * Generate a daily achievement message
 */
export function dailyMessage(value: number, metricType: MetricType = 'steps'): string {
  return generateShareMessage('daily', { metricType, value }).fullMessage;
}

/**
 * Generate a weekly achievement message
 */
export function weeklyMessage(
  value: number,
  average?: number,
  metricType: MetricType = 'steps'
): string {
  return generateShareMessage('weekly', { metricType, value, average }).fullMessage;
}

/**
 * Generate a personal best message
 */
export function personalBestMessage(value: number, metricType: MetricType = 'steps'): string {
  return generateShareMessage('personal_best', { metricType, value }).fullMessage;
}

/**
 * Generate a streak message
 */
export function streakMessage(streakDays: number, metricType: MetricType = 'steps'): string {
  return generateShareMessage('streak', { metricType, value: streakDays, streakDays }).fullMessage;
}

/**
 * Generate a rank message
 */
export function rankMessage(
  rank: number,
  value: number,
  leagueName?: string,
  metricType: MetricType = 'steps'
): string {
  return generateShareMessage('rank', { metricType, value, rank, leagueName }).fullMessage;
}

/**
 * Generate a challenge message
 */
export function challengeMessage(value: number, metricType: MetricType = 'steps'): string {
  return generateShareMessage('challenge', { metricType, value }).fullMessage;
}

/**
 * Generate a rank change message
 */
export function rankChangeMessage(
  oldRank: number,
  newRank: number,
  metricType: MetricType = 'steps'
): string {
  return generateShareMessage('rank_change', {
    metricType,
    value: 0,
    oldRank,
    newRank,
  }).fullMessage;
}

// ============================================================================
// Milestone Messages
// ============================================================================

export interface MilestoneMessage {
  type: 'streak' | 'personal_best' | 'rank_change' | 'milestone';
  title: string;
  message: string;
  emoji: string;
}

/**
 * Get the appropriate message for a streak milestone
 */
export function getStreakMilestoneMessage(days: number): MilestoneMessage | null {
  const milestones = [
    { days: 100, title: 'Centurion!', emoji: '💯', badge: 'diamond' },
    { days: 30, title: '30 Day Streak!', emoji: '🔥', badge: 'gold' },
    { days: 14, title: '2 Week Streak!', emoji: '🔥', badge: 'silver' },
    { days: 7, title: 'Week Streak!', emoji: '🔥', badge: 'bronze' },
  ];

  const milestone = milestones.find((m) => days === m.days);
  if (!milestone) return null;

  return {
    type: 'streak',
    title: milestone.title,
    message: `You've been active for ${days} days straight!`,
    emoji: milestone.emoji,
  };
}

/**
 * Get the appropriate message for a personal best
 */
export function getPersonalBestMessage(
  newValue: number,
  oldValue: number,
  metricType: MetricType = 'steps'
): MilestoneMessage {
  const config = getMetricConfig(metricType);
  const improvement = newValue - oldValue;
  const improvementFormatted = config.formatValue(improvement);

  return {
    type: 'personal_best',
    title: 'New Personal Best!',
    message: `You beat your record by ${improvementFormatted} ${config.unitPlural}!`,
    emoji: '🏆',
  };
}

/**
 * Get the appropriate message for a rank improvement
 */
export function getRankChangeMessage(
  oldRank: number,
  newRank: number,
  leagueName?: string
): MilestoneMessage | null {
  const improvement = oldRank - newRank;
  if (improvement < 2) return null; // Only celebrate 2+ position jumps

  const leagueText = leagueName ? ` in ${leagueName}` : '';

  return {
    type: 'rank_change',
    title: 'Rank Up!',
    message: `You jumped ${improvement} positions${leagueText}!`,
    emoji: '🚀',
  };
}

// ============================================================================
// Default Export
// ============================================================================

export default {
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
};
