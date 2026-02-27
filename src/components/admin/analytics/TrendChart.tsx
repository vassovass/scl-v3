"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

/**
 * Trend Chart Component
 *
 * Displays daily active users, submissions, and avg steps as area chart.
 * Uses Recharts (already installed in project).
 *
 * PRD 32 — Admin Analytics Dashboard
 */

interface TrendPoint {
  date: string;
  activeUsers: number;
  submissions: number;
  avgSteps: number;
}

interface TrendChartProps {
  data: TrendPoint[];
  loading?: boolean;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TrendChart({ data, loading }: TrendChartProps) {
  if (loading) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <div className="h-4 w-32 bg-muted animate-pulse rounded mb-4" />
        <div className="h-64 bg-muted/50 animate-pulse rounded" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-6 text-center">
        <p className="text-muted-foreground">No trend data available for this period</p>
      </div>
    );
  }

  const chartData = data.map((point) => ({
    ...point,
    label: formatDate(point.date),
  }));

  return (
    <div className="bg-card border rounded-lg p-6">
      <h3 className="text-sm font-semibold mb-4">Daily Trends</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.5}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--foreground))",
                fontSize: "12px",
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px" }}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="activeUsers"
              name="Active Users"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.15}
              strokeWidth={2}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="submissions"
              name="Submissions"
              stroke="hsl(var(--success))"
              fill="hsl(var(--success))"
              fillOpacity={0.1}
              strokeWidth={2}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="avgSteps"
              name="Avg Steps"
              stroke="hsl(var(--warning))"
              fill="hsl(var(--warning))"
              fillOpacity={0.05}
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
