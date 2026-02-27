"use client";

/**
 * League Breakdown Table
 *
 * Displays per-league analytics in a sortable table.
 *
 * PRD 32 — Admin Analytics Dashboard
 */

interface LeagueRow {
  id: string;
  name: string;
  memberCount: number;
  activeRate: number;
  avgSteps: number;
  submissionRate: number;
}

interface LeagueTableProps {
  data: LeagueRow[];
  loading?: boolean;
}

export function LeagueTable({ data, loading }: LeagueTableProps) {
  if (loading) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <div className="h-4 w-40 bg-muted animate-pulse rounded mb-4" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 bg-muted/50 animate-pulse rounded mb-2" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-6 text-center">
        <p className="text-muted-foreground">No leagues found</p>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="text-sm font-semibold">League Breakdown</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left p-3 font-medium text-muted-foreground">League</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Members</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Active Rate</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Avg Steps</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Sub. Rate</th>
            </tr>
          </thead>
          <tbody>
            {data.map((league) => (
              <tr key={league.id} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                <td className="p-3 font-medium min-w-0">
                  <span className="truncate block max-w-[200px]">{league.name}</span>
                </td>
                <td className="p-3 text-right tabular-nums">{league.memberCount}</td>
                <td className="p-3 text-right tabular-nums">
                  <span className={league.activeRate >= 50 ? "text-[hsl(var(--success))]" : league.activeRate >= 25 ? "text-[hsl(var(--warning))]" : "text-destructive"}>
                    {league.activeRate.toFixed(1)}%
                  </span>
                </td>
                <td className="p-3 text-right tabular-nums">{league.avgSteps.toLocaleString()}</td>
                <td className="p-3 text-right tabular-nums">{league.submissionRate.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
