import { describe, it, expect, vi } from "vitest";
import { generateCSV } from "../analyticsQueries";
import type { KPI, TrendPoint, LeagueRow } from "../analyticsQueries";

describe("analyticsQueries", () => {
  describe("generateCSV", () => {
    const mockKPIs: KPI[] = [
      {
        key: "total_users",
        label: "Total Users",
        value: 150,
        formatted: "150",
        trend: null,
        trendLabel: "all time",
      },
      {
        key: "active_rate",
        label: "Active Rate",
        value: 45.5,
        formatted: "45.5%",
        trend: 12.3,
        trendLabel: "vs prev period",
      },
      {
        key: "avg_steps",
        label: "Avg Steps",
        value: 8500,
        formatted: "8.5K",
        trend: -5.2,
        trendLabel: "vs prev period",
      },
    ];

    const mockTrends: TrendPoint[] = [
      { date: "2026-02-20", activeUsers: 10, submissions: 15, avgSteps: 8000 },
      { date: "2026-02-21", activeUsers: 12, submissions: 18, avgSteps: 9000 },
    ];

    const mockLeagues: LeagueRow[] = [
      {
        id: "league-1",
        name: "Step Masters",
        memberCount: 10,
        activeRate: 80,
        avgSteps: 10000,
        submissionRate: 75.5,
      },
      {
        id: "league-2",
        name: 'Test "League"',
        memberCount: 5,
        activeRate: 40,
        avgSteps: 6000,
        submissionRate: 30.0,
      },
    ];

    it("generates valid CSV with all sections", () => {
      const csv = generateCSV(mockKPIs, mockTrends, mockLeagues);

      expect(csv).toContain("=== Platform KPIs ===");
      expect(csv).toContain("Metric,Value,Trend");
      expect(csv).toContain('"Total Users","150","N/A"');
      expect(csv).toContain('"Active Rate","45.5%","+12.3%"');
      expect(csv).toContain('"Avg Steps","8.5K","-5.2%"');

      expect(csv).toContain("=== Daily Trends ===");
      expect(csv).toContain("Date,Active Users,Submissions,Avg Steps");
      expect(csv).toContain("2026-02-20,10,15,8000");
      expect(csv).toContain("2026-02-21,12,18,9000");

      expect(csv).toContain("=== League Breakdown ===");
      expect(csv).toContain("League,Members,Active Rate,Avg Steps,Submission Rate");
      expect(csv).toContain('"Step Masters",10,80.0%,10000,75.5%');
    });

    it("handles empty data gracefully", () => {
      const csv = generateCSV([], [], []);
      expect(csv).toContain("=== Platform KPIs ===");
      expect(csv).toContain("=== Daily Trends ===");
      expect(csv).toContain("=== League Breakdown ===");
    });

    it("includes league names with special characters", () => {
      const csv = generateCSV([], [], mockLeagues);
      expect(csv).toContain('Test "League"');
    });
  });
});
