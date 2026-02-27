/**
 * PRD 48: Universal Health Measurement — Conversion Table
 *
 * Converts various activity metrics to StepLeague Points (SLP).
 * 1 step = 1 SLP (baseline). Pure functions, fully testable.
 *
 * Currently uses static config. Designed to be upgradeable to
 * DB-backed config (activity_conversions table) in the future.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActivityType =
  | "steps"
  | "calories"
  | "kilojoules"
  | "swimming"
  | "cycling"
  | "running";

export interface ActivityConfig {
  type: ActivityType;
  displayName: string;
  emoji: string;
  unitLabel: string;
  slpPerUnit: number;
  minValue: number;
  maxDailyValue: number;
  requiresVerificationAbove: number;
}

// ---------------------------------------------------------------------------
// Static Configuration (future: read from activity_conversions table)
// ---------------------------------------------------------------------------

export const ACTIVITY_CONFIG: Record<ActivityType, ActivityConfig> = {
  steps: {
    type: "steps",
    displayName: "Steps",
    emoji: "\uD83D\uDC5F", // 👟
    unitLabel: "steps",
    slpPerUnit: 1,
    minValue: 0,
    maxDailyValue: 100_000,
    requiresVerificationAbove: 50_000,
  },
  calories: {
    type: "calories",
    displayName: "Calories",
    emoji: "\uD83D\uDD25", // 🔥
    unitLabel: "kcal",
    slpPerUnit: 20,
    minValue: 0,
    maxDailyValue: 5_000,
    requiresVerificationAbove: 3_000,
  },
  kilojoules: {
    type: "kilojoules",
    displayName: "Kilojoules",
    emoji: "\u26A1", // ⚡
    unitLabel: "kJ",
    slpPerUnit: 5,
    minValue: 0,
    maxDailyValue: 20_000,
    requiresVerificationAbove: 12_000,
  },
  swimming: {
    type: "swimming",
    displayName: "Swimming",
    emoji: "\uD83C\uDFCA", // 🏊
    unitLabel: "meters",
    slpPerUnit: 1.5, // 150 SLP per 100m = 1.5 per meter
    minValue: 0,
    maxDailyValue: 10_000,
    requiresVerificationAbove: 5_000,
  },
  cycling: {
    type: "cycling",
    displayName: "Cycling",
    emoji: "\uD83D\uDEB4", // 🚴
    unitLabel: "km",
    slpPerUnit: 100,
    minValue: 0,
    maxDailyValue: 300,
    requiresVerificationAbove: 150,
  },
  running: {
    type: "running",
    displayName: "Running",
    emoji: "\uD83C\uDFC3", // 🏃
    unitLabel: "km",
    slpPerUnit: 1_300,
    minValue: 0,
    maxDailyValue: 100,
    requiresVerificationAbove: 42,
  },
};

// ---------------------------------------------------------------------------
// Conversion Functions
// ---------------------------------------------------------------------------

/**
 * Convert an activity value to StepLeague Points (SLP).
 *
 * @param activityType - The type of activity
 * @param rawValue - The raw measurement value
 * @returns SLP equivalent (rounded to nearest integer)
 * @throws Error if value is negative or activity type is unknown
 */
export function convertToSLP(activityType: ActivityType, rawValue: number): number {
  if (rawValue < 0) {
    throw new Error(`Value cannot be negative: ${rawValue}`);
  }

  const config = ACTIVITY_CONFIG[activityType];
  if (!config) {
    throw new Error(`Unknown activity type: ${activityType}`);
  }

  return Math.round(rawValue * config.slpPerUnit);
}

/**
 * Check if a value exceeds the daily maximum for its activity type.
 */
export function exceedsMaxDaily(activityType: ActivityType, rawValue: number): boolean {
  const config = ACTIVITY_CONFIG[activityType];
  if (!config) return false;
  return rawValue > config.maxDailyValue;
}

/**
 * Check if a value requires photo verification.
 */
export function requiresVerification(activityType: ActivityType, rawValue: number): boolean {
  const config = ACTIVITY_CONFIG[activityType];
  if (!config) return false;
  return rawValue > config.requiresVerificationAbove;
}

/**
 * Get the display label for an SLP value with its source activity.
 *
 * @example formatSLPLabel("cycling", 25) → "25 km = 2,500 SLP"
 */
export function formatSLPLabel(activityType: ActivityType, rawValue: number): string {
  const config = ACTIVITY_CONFIG[activityType];
  if (!config) return `${rawValue} = ? SLP`;

  const slp = convertToSLP(activityType, rawValue);
  const formattedSLP = slp.toLocaleString("en-US");
  const formattedRaw = rawValue.toLocaleString("en-US");

  if (activityType === "steps") {
    return `${formattedRaw} steps = ${formattedSLP} SLP`;
  }

  return `${formattedRaw} ${config.unitLabel} = ${formattedSLP} SLP`;
}

/**
 * Get all enabled activity types for display in UI selectors.
 */
export function getActivityOptions(): ActivityConfig[] {
  return Object.values(ACTIVITY_CONFIG);
}

/**
 * Validate a raw value for a given activity type.
 * Returns validation result with optional warning/error.
 */
export function validateActivityValue(
  activityType: ActivityType,
  rawValue: number
): { valid: boolean; warning?: string; error?: string } {
  if (rawValue < 0) {
    return { valid: false, error: "Value cannot be negative" };
  }

  const config = ACTIVITY_CONFIG[activityType];
  if (!config) {
    return { valid: false, error: `Unknown activity type: ${activityType}` };
  }

  if (rawValue === 0) {
    return { valid: false, error: "Value must be greater than zero" };
  }

  if (rawValue > config.maxDailyValue) {
    return {
      valid: false,
      error: `Exceeds maximum daily ${config.displayName.toLowerCase()} (${config.maxDailyValue.toLocaleString()} ${config.unitLabel})`,
    };
  }

  if (rawValue > config.requiresVerificationAbove) {
    return {
      valid: true,
      warning: `High value — photo verification may be required`,
    };
  }

  return { valid: true };
}
