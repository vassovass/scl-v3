import { describe, it, expect } from "vitest";
import {
  generateFixtures,
  validateFixtures,
  calculateMatchPoints,
} from "../fixtureGenerator";

describe("generateFixtures", () => {
  it("throws for fewer than 2 members", () => {
    expect(() => generateFixtures([])).toThrow("At least 2 members");
    expect(() => generateFixtures(["a"])).toThrow("At least 2 members");
  });

  it("generates correct fixtures for 2 members", () => {
    const result = generateFixtures(["a", "b"]);
    expect(result.totalWeeks).toBe(1);
    expect(result.weeks).toHaveLength(1);
    expect(result.weeks[0].matches).toHaveLength(1);
    expect(result.byes).toHaveLength(0);

    const match = result.weeks[0].matches[0];
    expect(new Set([match.home, match.away])).toEqual(new Set(["a", "b"]));
  });

  it("generates correct fixtures for 4 members (even)", () => {
    const members = ["a", "b", "c", "d"];
    const result = generateFixtures(members);

    expect(result.totalWeeks).toBe(3); // n-1 = 3
    expect(result.byes).toHaveLength(0);

    // Each week should have 2 matches
    for (const week of result.weeks) {
      expect(week.matches).toHaveLength(2);
    }

    // Validate every pair plays exactly once
    const validation = validateFixtures(members, result);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it("generates correct fixtures for 6 members (even)", () => {
    const members = ["a", "b", "c", "d", "e", "f"];
    const result = generateFixtures(members);

    expect(result.totalWeeks).toBe(5);
    expect(result.byes).toHaveLength(0);

    for (const week of result.weeks) {
      expect(week.matches).toHaveLength(3);
    }

    const validation = validateFixtures(members, result);
    expect(validation.valid).toBe(true);
  });

  it("handles odd number of members with byes", () => {
    const members = ["a", "b", "c", "d", "e"];
    const result = generateFixtures(members);

    // 5 members → pad to 6 → 5 weeks
    expect(result.totalWeeks).toBe(5);
    // Each week has 2 matches (one person gets bye)
    for (const week of result.weeks) {
      expect(week.matches).toHaveLength(2);
    }

    // Each member gets exactly 1 bye
    expect(result.byes).toHaveLength(5);
    const byeUsers = result.byes.map((b) => b.user_id);
    expect(new Set(byeUsers).size).toBe(5); // Each member gets one bye

    const validation = validateFixtures(members, result);
    expect(validation.valid).toBe(true);
  });

  it("handles 3 members (odd, minimum odd)", () => {
    const members = ["a", "b", "c"];
    const result = generateFixtures(members);

    expect(result.totalWeeks).toBe(3); // 3+1 BYE = 4, n-1 = 3
    expect(result.byes).toHaveLength(3);

    for (const week of result.weeks) {
      expect(week.matches).toHaveLength(1);
    }

    const validation = validateFixtures(members, result);
    expect(validation.valid).toBe(true);
  });

  it("handles 8 members (larger even)", () => {
    const members = Array.from({ length: 8 }, (_, i) => `user_${i}`);
    const result = generateFixtures(members);

    expect(result.totalWeeks).toBe(7);
    expect(result.byes).toHaveLength(0);

    for (const week of result.weeks) {
      expect(week.matches).toHaveLength(4);
    }

    const validation = validateFixtures(members, result);
    expect(validation.valid).toBe(true);
  });

  it("deduplicates member IDs", () => {
    const result = generateFixtures(["a", "b", "c", "a", "b"]);
    // Should treat as 3 unique members
    expect(result.totalWeeks).toBe(3);
  });

  it("ensures no member plays twice in same week", () => {
    const members = Array.from({ length: 10 }, (_, i) => `u${i}`);
    const result = generateFixtures(members);

    for (const week of result.weeks) {
      const playerIds = new Set<string>();
      for (const match of week.matches) {
        expect(playerIds.has(match.home)).toBe(false);
        expect(playerIds.has(match.away)).toBe(false);
        playerIds.add(match.home);
        playerIds.add(match.away);
      }
    }

    const validation = validateFixtures(members, result);
    expect(validation.valid).toBe(true);
  });

  it("produces correct total match count", () => {
    const members = ["a", "b", "c", "d", "e", "f"];
    const result = generateFixtures(members);

    // n*(n-1)/2 = 6*5/2 = 15 total matches
    const totalMatches = result.weeks.reduce(
      (sum, w) => sum + w.matches.length,
      0
    );
    expect(totalMatches).toBe(15);
  });
});

describe("validateFixtures", () => {
  it("detects missing matchups", () => {
    const members = ["a", "b", "c"];
    const badFixtures = {
      weeks: [{ week: 1, matches: [{ home: "a", away: "b" }] }],
      byes: [],
      totalWeeks: 1,
    };
    const result = validateFixtures(members, badFixtures);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("detects duplicate matchups", () => {
    const members = ["a", "b"];
    const badFixtures = {
      weeks: [
        { week: 1, matches: [{ home: "a", away: "b" }] },
        { week: 2, matches: [{ home: "b", away: "a" }] },
      ],
      byes: [],
      totalWeeks: 2,
    };
    const result = validateFixtures(members, badFixtures);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Duplicate"))).toBe(true);
  });

  it("detects same player in multiple matches in one week", () => {
    const members = ["a", "b", "c", "d"];
    const badFixtures = {
      weeks: [
        {
          week: 1,
          matches: [
            { home: "a", away: "b" },
            { home: "a", away: "c" },
          ],
        },
      ],
      byes: [],
      totalWeeks: 1,
    };
    const result = validateFixtures(members, badFixtures);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("multiple matches"))).toBe(true);
  });
});

describe("calculateMatchPoints", () => {
  it("awards 3 points to winner (home wins)", () => {
    const result = calculateMatchPoints(10000, 5000);
    expect(result.homePoints).toBe(3);
    expect(result.awayPoints).toBe(0);
  });

  it("awards 3 points to winner (away wins)", () => {
    const result = calculateMatchPoints(5000, 10000);
    expect(result.homePoints).toBe(0);
    expect(result.awayPoints).toBe(3);
  });

  it("awards 1 point each for draw", () => {
    const result = calculateMatchPoints(7500, 7500);
    expect(result.homePoints).toBe(1);
    expect(result.awayPoints).toBe(1);
  });

  it("handles zero steps draw", () => {
    const result = calculateMatchPoints(0, 0);
    expect(result.homePoints).toBe(1);
    expect(result.awayPoints).toBe(1);
  });

  it("handles large step counts", () => {
    const result = calculateMatchPoints(150000, 149999);
    expect(result.homePoints).toBe(3);
    expect(result.awayPoints).toBe(0);
  });
});
