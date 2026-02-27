import { describe, it, expect } from "vitest";
import {
  convertToSLP,
  exceedsMaxDaily,
  requiresVerification,
  formatSLPLabel,
  getActivityOptions,
  validateActivityValue,
  ACTIVITY_CONFIG,
} from "../conversionTable";
import type { ActivityType } from "../conversionTable";

describe("convertToSLP", () => {
  it("converts steps 1:1", () => {
    expect(convertToSLP("steps", 10000)).toBe(10000);
    expect(convertToSLP("steps", 0)).toBe(0);
    expect(convertToSLP("steps", 1)).toBe(1);
  });

  it("converts calories at 20 SLP per kcal", () => {
    expect(convertToSLP("calories", 100)).toBe(2000);
    expect(convertToSLP("calories", 50)).toBe(1000);
    expect(convertToSLP("calories", 0)).toBe(0);
  });

  it("converts kilojoules at 5 SLP per kJ", () => {
    expect(convertToSLP("kilojoules", 100)).toBe(500);
    expect(convertToSLP("kilojoules", 200)).toBe(1000);
  });

  it("converts swimming at 1.5 SLP per meter", () => {
    // 100m = 150 SLP
    expect(convertToSLP("swimming", 100)).toBe(150);
    // 2500m = 3750 SLP
    expect(convertToSLP("swimming", 2500)).toBe(3750);
  });

  it("converts cycling at 100 SLP per km", () => {
    expect(convertToSLP("cycling", 10)).toBe(1000);
    expect(convertToSLP("cycling", 25)).toBe(2500);
  });

  it("converts running at 1300 SLP per km", () => {
    expect(convertToSLP("running", 5)).toBe(6500);
    expect(convertToSLP("running", 10)).toBe(13000);
    // Marathon: ~42.195 km
    expect(convertToSLP("running", 42.195)).toBe(54854);
  });

  it("rounds to nearest integer", () => {
    // 0.7 * 1.5 = 1.05 → 1
    expect(convertToSLP("swimming", 1)).toBe(2); // 1 * 1.5 = 1.5 → 2
    expect(convertToSLP("swimming", 3)).toBe(5); // 3 * 1.5 = 4.5 → 5 (rounds up from .5)
  });

  it("throws for negative values", () => {
    expect(() => convertToSLP("steps", -1)).toThrow("negative");
    expect(() => convertToSLP("calories", -100)).toThrow("negative");
  });

  it("throws for unknown activity type", () => {
    expect(() => convertToSLP("skiing" as ActivityType, 100)).toThrow("Unknown");
  });
});

describe("exceedsMaxDaily", () => {
  it("returns false within limits", () => {
    expect(exceedsMaxDaily("steps", 50000)).toBe(false);
    expect(exceedsMaxDaily("cycling", 100)).toBe(false);
  });

  it("returns true above limits", () => {
    expect(exceedsMaxDaily("steps", 100001)).toBe(true);
    expect(exceedsMaxDaily("cycling", 301)).toBe(true);
    expect(exceedsMaxDaily("running", 101)).toBe(true);
  });

  it("returns false at exact limit", () => {
    expect(exceedsMaxDaily("steps", 100000)).toBe(false);
  });
});

describe("requiresVerification", () => {
  it("returns false below threshold", () => {
    expect(requiresVerification("steps", 30000)).toBe(false);
    expect(requiresVerification("running", 10)).toBe(false);
  });

  it("returns true above threshold", () => {
    expect(requiresVerification("steps", 50001)).toBe(true);
    expect(requiresVerification("running", 43)).toBe(true);
    expect(requiresVerification("cycling", 151)).toBe(true);
  });
});

describe("formatSLPLabel", () => {
  it("formats steps without redundant unit", () => {
    expect(formatSLPLabel("steps", 10000)).toBe("10,000 steps = 10,000 SLP");
  });

  it("formats calories with unit", () => {
    expect(formatSLPLabel("calories", 500)).toBe("500 kcal = 10,000 SLP");
  });

  it("formats cycling with unit", () => {
    expect(formatSLPLabel("cycling", 25)).toBe("25 km = 2,500 SLP");
  });

  it("formats swimming with unit", () => {
    expect(formatSLPLabel("swimming", 2000)).toBe("2,000 meters = 3,000 SLP");
  });
});

describe("getActivityOptions", () => {
  it("returns all 6 activity types", () => {
    const options = getActivityOptions();
    expect(options).toHaveLength(6);

    const types = options.map((o) => o.type);
    expect(types).toContain("steps");
    expect(types).toContain("calories");
    expect(types).toContain("kilojoules");
    expect(types).toContain("swimming");
    expect(types).toContain("cycling");
    expect(types).toContain("running");
  });

  it("each option has required fields", () => {
    for (const option of getActivityOptions()) {
      expect(option.displayName).toBeTruthy();
      expect(option.emoji).toBeTruthy();
      expect(option.unitLabel).toBeTruthy();
      expect(option.slpPerUnit).toBeGreaterThan(0);
    }
  });
});

describe("validateActivityValue", () => {
  it("accepts valid values", () => {
    expect(validateActivityValue("steps", 5000)).toEqual({ valid: true });
    expect(validateActivityValue("cycling", 20)).toEqual({ valid: true });
  });

  it("rejects negative values", () => {
    const result = validateActivityValue("steps", -1);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("negative");
  });

  it("rejects zero values", () => {
    const result = validateActivityValue("steps", 0);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("greater than zero");
  });

  it("rejects values exceeding max daily", () => {
    const result = validateActivityValue("steps", 150000);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("maximum");
  });

  it("warns for high values needing verification", () => {
    const result = validateActivityValue("steps", 60000);
    expect(result.valid).toBe(true);
    expect(result.warning).toContain("verification");
  });

  it("rejects unknown activity type", () => {
    const result = validateActivityValue("yoga" as ActivityType, 60);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Unknown");
  });
});

describe("ACTIVITY_CONFIG consistency", () => {
  it("all configs have positive slpPerUnit", () => {
    for (const [, config] of Object.entries(ACTIVITY_CONFIG)) {
      expect(config.slpPerUnit).toBeGreaterThan(0);
    }
  });

  it("verification threshold is below max daily", () => {
    for (const [, config] of Object.entries(ACTIVITY_CONFIG)) {
      expect(config.requiresVerificationAbove).toBeLessThanOrEqual(config.maxDailyValue);
    }
  });

  it("calories and kilojoules have correct ratio", () => {
    // 1 kcal = 4.184 kJ, so SLP ratios should roughly follow
    const calSLP = ACTIVITY_CONFIG.calories.slpPerUnit; // 20
    const kjSLP = ACTIVITY_CONFIG.kilojoules.slpPerUnit; // 5
    const ratio = calSLP / kjSLP; // should be ~4
    expect(ratio).toBeCloseTo(4, 0);
  });
});
