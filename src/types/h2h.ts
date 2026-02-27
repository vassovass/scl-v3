/**
 * PRD 47: Head-to-Head League Types
 *
 * TypeScript interfaces for H2H seasons, fixtures, and standings.
 */

// ---------------------------------------------------------------------------
// Enums / Union Types
// ---------------------------------------------------------------------------

export type SeasonType = "fixed" | "endless";

export type SeasonStatus = "pending" | "active" | "completed" | "cancelled";

export type FixtureStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export type RoundType = "regular" | "semifinal" | "final";

export type MatchPoints = 0 | 1 | 3;

// ---------------------------------------------------------------------------
// Table Row Types
// ---------------------------------------------------------------------------

export interface H2HSeason {
  id: string;
  league_id: string;
  season_number: number;
  season_type: SeasonType;
  total_weeks: number;
  start_date: string;
  end_date: string | null;
  status: SeasonStatus;
  created_at: string;
}

export interface H2HFixture {
  id: string;
  season_id: string;
  week_number: number;
  round_type: RoundType;
  home_user_id: string | null;
  away_user_id: string | null;
  home_steps: number | null;
  away_steps: number | null;
  home_points: MatchPoints | null;
  away_points: MatchPoints | null;
  status: FixtureStatus;
  completed_at: string | null;
  created_at: string;
}

export interface H2HStanding {
  id: string;
  season_id: string;
  user_id: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  total_steps: number;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Fixture Generation Types
// ---------------------------------------------------------------------------

/** A single matchup in a week */
export interface FixtureMatchup {
  home: string;
  away: string;
}

/** All matchups for a single week */
export interface WeekFixtures {
  week: number;
  matches: FixtureMatchup[];
}

/** A member who receives a bye (odd number of participants) */
export interface ByeWeek {
  week: number;
  user_id: string;
}

/** Full fixture generation result */
export interface GeneratedFixtures {
  weeks: WeekFixtures[];
  byes: ByeWeek[];
  totalWeeks: number;
}

// ---------------------------------------------------------------------------
// UI Display Types
// ---------------------------------------------------------------------------

export interface H2HStandingRow extends H2HStanding {
  display_name: string | null;
  rank: number;
  goal_difference: number; // total_steps_for - total_steps_against
}

export interface CurrentMatchup {
  fixture: H2HFixture;
  opponent: {
    id: string;
    display_name: string | null;
  };
  your_steps: number;
  opponent_steps: number;
  status: "winning" | "losing" | "tied";
}
