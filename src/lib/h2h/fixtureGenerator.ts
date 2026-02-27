/**
 * PRD 47: Round-Robin Fixture Generator
 *
 * Generates a complete round-robin schedule using the circle method.
 * Pure function — no side effects, fully testable.
 *
 * Algorithm: Fix one participant, rotate the rest. For n participants,
 * produces n-1 rounds where each pair meets exactly once.
 * Odd participant counts get a "BYE" placeholder.
 */

import type { GeneratedFixtures, FixtureMatchup, ByeWeek, WeekFixtures } from "@/types/h2h";

const BYE_SENTINEL = "__BYE__";

/**
 * Generate a complete round-robin fixture schedule.
 *
 * @param memberIds - Array of user IDs to schedule
 * @returns Generated fixtures with weeks, matches, and byes
 * @throws Error if fewer than 2 members provided
 */
export function generateFixtures(memberIds: string[]): GeneratedFixtures {
  if (memberIds.length < 2) {
    throw new Error("At least 2 members are required for fixture generation");
  }

  // Deduplicate
  const unique = [...new Set(memberIds)];
  const isOdd = unique.length % 2 === 1;

  // Add BYE placeholder for odd count
  const participants = isOdd ? [...unique, BYE_SENTINEL] : [...unique];
  const n = participants.length;
  const totalWeeks = n - 1;

  const weeks: WeekFixtures[] = [];
  const byes: ByeWeek[] = [];

  // Working copy — we'll rotate this array each round
  const slots = [...participants];

  for (let round = 0; round < totalWeeks; round++) {
    const matches: FixtureMatchup[] = [];
    const weekNumber = round + 1;

    for (let i = 0; i < n / 2; i++) {
      const home = slots[i];
      const away = slots[n - 1 - i];

      if (home === BYE_SENTINEL) {
        byes.push({ week: weekNumber, user_id: away });
      } else if (away === BYE_SENTINEL) {
        byes.push({ week: weekNumber, user_id: home });
      } else {
        matches.push({ home, away });
      }
    }

    weeks.push({ week: weekNumber, matches });

    // Rotate: keep first element fixed, rotate the rest clockwise
    // [0, 1, 2, 3, 4] → [0, 4, 1, 2, 3]
    const fixed = slots[0];
    const last = slots[n - 1];
    for (let i = n - 1; i > 2; i--) {
      slots[i] = slots[i - 1];
    }
    slots[2] = slots[1];
    slots[1] = last;
    slots[0] = fixed;
  }

  return { weeks, byes, totalWeeks };
}

/**
 * Validate that a fixture set is correct.
 * Checks that every pair appears exactly once.
 */
export function validateFixtures(
  memberIds: string[],
  fixtures: GeneratedFixtures
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const unique = [...new Set(memberIds)];
  const pairCount = new Map<string, number>();

  // Build pair key (sorted for consistency)
  const pairKey = (a: string, b: string) =>
    [a, b].sort().join("::");

  // Expected: each pair exactly once
  for (const week of fixtures.weeks) {
    for (const match of week.matches) {
      const key = pairKey(match.home, match.away);
      pairCount.set(key, (pairCount.get(key) || 0) + 1);
    }
  }

  // Check every pair appears exactly once
  for (let i = 0; i < unique.length; i++) {
    for (let j = i + 1; j < unique.length; j++) {
      const key = pairKey(unique[i], unique[j]);
      const count = pairCount.get(key) || 0;
      if (count === 0) {
        errors.push(`Missing matchup: ${unique[i]} vs ${unique[j]}`);
      } else if (count > 1) {
        errors.push(`Duplicate matchup (${count}x): ${unique[i]} vs ${unique[j]}`);
      }
    }
  }

  // Check no member plays twice in same week
  for (const week of fixtures.weeks) {
    const seen = new Set<string>();
    for (const match of week.matches) {
      if (seen.has(match.home)) {
        errors.push(`Week ${week.week}: ${match.home} appears in multiple matches`);
      }
      if (seen.has(match.away)) {
        errors.push(`Week ${week.week}: ${match.away} appears in multiple matches`);
      }
      seen.add(match.home);
      seen.add(match.away);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Calculate match result points.
 * Win = 3, Draw = 1, Loss = 0.
 */
export function calculateMatchPoints(
  homeSteps: number,
  awaySteps: number
): { homePoints: 0 | 1 | 3; awayPoints: 0 | 1 | 3 } {
  if (homeSteps > awaySteps) {
    return { homePoints: 3, awayPoints: 0 };
  } else if (awaySteps > homeSteps) {
    return { homePoints: 0, awayPoints: 3 };
  } else {
    return { homePoints: 1, awayPoints: 1 };
  }
}
